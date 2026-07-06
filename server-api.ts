import express from 'express';
import { GoogleGenAI } from '@google/genai';
import { ServerDb } from './server-db';
import { predictCrop, predictTopCrops, mapProfileToSoil } from './src/utils/predictor';
import { PredictionInput } from './src/types';

export const apiRouter = express.Router();

// Simple in-memory session store: token -> username
const SESSIONS = new Map<string, string>();

// Lazy-initialized Gemini client
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      console.warn('Warning: GEMINI_API_KEY environment variable is not set. Chatbot will run in fallback simulation mode.');
      return null;
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });
  }
  return aiClient;
}

// Robust fallback and retry handler for high-demand errors (503)
async function generateContentWithFallback(
  ai: GoogleGenAI,
  params: {
    contents: any[];
    config: any;
  }
) {
  const modelsToTry = [
    'gemini-3.5-flash',
    'gemini-flash-latest',
    'gemini-3.1-flash-lite'
  ];

  let lastError: any = null;

  for (const model of modelsToTry) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        console.log(`[OptiCrop AI] Attempting generateContent using model ${model}, attempt ${attempt}`);
        const response = await ai.models.generateContent({
          model: model,
          contents: params.contents,
          config: params.config
        });
        if (response && response.text) {
          return response;
        }
      } catch (err: any) {
        lastError = err;
        console.warn(`[OptiCrop AI] Model ${model} attempt ${attempt} failed:`, err?.message || err);
        // Wait a short duration (exponential backoff) before retrying
        await new Promise(resolve => setTimeout(resolve, attempt * 600));
      }
    }
  }

  throw lastError || new Error('All fallback models and retries failed.');
}

// Authentication Middleware
function authenticate(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized: Missing session token' });
    return;
  }
  const token = authHeader.split(' ')[1];
  const username = SESSIONS.get(token);
  if (!username) {
    res.status(401).json({ error: 'Unauthorized: Invalid or expired session' });
    return;
  }
  (req as any).username = username;
  next();
}

// --- Auth Endpoints ---

// Register
apiRouter.post('/auth/register', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    res.status(400).json({ error: 'Username and password are required' });
    return;
  }
  if (password.length < 6) {
    res.status(400).json({ error: 'High security password must be at least 6 characters long' });
    return;
  }

  const existing = ServerDb.getUser(username);
  if (existing) {
    res.status(400).json({ error: 'Username is already taken' });
    return;
  }

  const defaultProfile = {
    name: '',
    email: '',
    state: '',
    district: '',
    village: '',
    phone: '',
    pincode: ''
  };

  const user = ServerDb.createUser(username, password, defaultProfile);
  const token = Math.random().toString(36).substring(2) + Date.now().toString(36);
  SESSIONS.set(token, username);

  res.json({ token, username, profile: user.profile });
});

// Login
apiRouter.post('/auth/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    res.status(400).json({ error: 'Username and password are required' });
    return;
  }

  const user = ServerDb.getUser(username);
  if (!user || user.passwordHash !== password) {
    res.status(400).json({ error: 'Invalid username or password' });
    return;
  }

  const token = Math.random().toString(36).substring(2) + Date.now().toString(36);
  SESSIONS.set(token, username);

  res.json({ token, username, profile: user.profile });
});

// Get Current User Profile
apiRouter.get('/auth/me', authenticate, (req, res) => {
  const username = (req as any).username;
  const user = ServerDb.getUser(username);
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }
  res.json({ username, profile: user.profile });
});

// Logout
apiRouter.post('/auth/logout', authenticate, (req, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const token = authHeader.split(' ')[1];
    SESSIONS.delete(token);
  }
  res.json({ success: true });
});

// --- Profile & Soil Analysis ---
apiRouter.post('/profile', authenticate, (req, res) => {
  const username = (req as any).username;
  const profileData = req.body;

  // Validate inputs
  const required = ['name', 'email', 'state', 'district', 'village', 'phone', 'pincode'];
  for (const field of required) {
    if (!profileData[field]) {
      res.status(400).json({ error: `${field} is required to set up your farmer profile` });
      return;
    }
  }

  // Calculate soil type present in the village
  const soilInfo = mapProfileToSoil(profileData.state, profileData.district, profileData.village);

  const updatedProfile = {
    ...profileData,
    soilType: soilInfo.soilType,
    soilDescription: soilInfo.description,
    soilProperties: soilInfo.properties
  };

  ServerDb.updateProfile(username, updatedProfile);
  res.json({ success: true, profile: updatedProfile });
});

// --- Crop Prediction Endpoint ---
apiRouter.post('/predict', authenticate, async (req, res) => {
  const username = (req as any).username;
  const { nitrogen, phosphorus, potassium, temperature, humidity, pH, rainfall } = req.body;

  // Basic validation
  if (
    nitrogen === undefined || phosphorus === undefined || potassium === undefined ||
    temperature === undefined || humidity === undefined || pH === undefined || rainfall === undefined
  ) {
    res.status(400).json({ error: 'All parameters (N, P, K, Temperature, Humidity, pH, Rainfall) are required.' });
    return;
  }

  // Fetch farmer profile context first for more precise local predictions
  const user = ServerDb.getUser(username);
  const profile = user?.profile;
  const locationStr = profile?.district && profile?.state
    ? `${profile.village ? profile.village + ', ' : ''}${profile.district}, ${profile.state}`
    : 'India';

  const inputs: PredictionInput = {
    nitrogen: Number(nitrogen),
    phosphorus: Number(phosphorus),
    potassium: Number(potassium),
    temperature: Number(temperature),
    humidity: Number(humidity),
    pH: Number(pH),
    rainfall: Number(rainfall),
    soilType: profile?.soilType,
    district: profile?.district,
    state: profile?.state
  };

  // Run Crop Recommendation Ensemble Model
  const prediction = predictCrop(inputs);
  const topCrops = predictTopCrops(inputs);

  const prompt = `You are an expert digital agricultural consultant and agronomist. Predict and analyze the absolute best crop to cultivate in ${locationStr} based on these exact soil and weather parameters:
- Nitrogen (N): ${inputs.nitrogen} kg/ha
- Phosphorus (P): ${inputs.phosphorus} kg/ha
- Potassium (K): ${inputs.potassium} kg/ha
- Temperature: ${inputs.temperature}°C
- Humidity: ${inputs.humidity}%
- Soil pH: ${inputs.pH}
- Rainfall: ${inputs.rainfall} mm
${profile?.soilType ? `- Detected Soil Type: ${profile.soilType}` : ''}

Use Google Search to find current weather patterns, local regional crop prices, government/extension department advisories, or dynamic seasonal forecasts for ${profile?.district || 'this region'} in ${new Date().getFullYear()}. 

Format your response perfectly in clear markdown:
1. **Best Recommended Crop**: State the single most suitable crop clearly first (e.g. Rice, Cotton, Groundnut, Maize, etc.).
2. **Meteorological & Market Justification (via Google Search)**: Detail current weather patterns or market trends in ${profile?.district || 'the area'} that make this recommendation optimal.
3. **Optimized Sowing & Soil Action Steps**: Provide 3-4 tailored soil fertilization and watering tips for this crop under these conditions.

Be realistic, encouraging, and highly specific to regional parameters.`;

  let geminiVerdict = '';
  let geminiCrop = '';
  let groundingSources: Array<{ title: string; url: string }> = [];

  try {
    const ai = getGeminiClient();
    if (ai) {
      console.log(`[OptiCrop AI] Fetching Search Grounded crop prediction for ${locationStr}...`);
      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
          temperature: 0.5
        }
      });

      if (response && response.text) {
        geminiVerdict = response.text;
        
        // Try to parse the crop name from the response
        const firstLineMatch = response.text.match(/\*\*Best Recommended Crop\*\*:\s*([^\n\r]+)/i) ||
                               response.text.match(/Best Recommended Crop:\s*([^\n\r]+)/i) ||
                               response.text.match(/\*\*([^*]+)\*\*/);
        geminiCrop = firstLineMatch ? firstLineMatch[1].replace(/[#*]/g, '').trim() : prediction.recommended_crop;

        // Extract Google Search grounding URLs
        const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
        if (chunks) {
          groundingSources = chunks
            .map((chunk: any) => ({
              title: chunk.web?.title || 'Google Search Source',
              url: chunk.web?.uri || ''
            }))
            .filter((source: any) => source.url);
        }
      }
    }
  } catch (err: any) {
    console.warn('[OptiCrop AI] Gemini prediction call failed, using high-quality local template:', err?.message || err);
  }

  // Robust backup virtual advisor agronomist block if Gemini/Search was offline
  if (!geminiVerdict) {
    geminiCrop = prediction.recommended_crop;
    geminiVerdict = `🌱 **[AI Backup Intelligence]** We have analyzed your soil chemical and location profile for **${locationStr}**:

1. **Best Recommended Crop**: **${prediction.recommended_crop}** is the most optimal fit for your N-P-K concentrations (${inputs.nitrogen}-${inputs.phosphorus}-${inputs.potassium}) and moisture signature (${inputs.rainfall} mm).
2. **Meteorological & Market Justification**: Historical agricultural models for ${profile?.district || 'the region'} indicate robust yields and consistent market prices. Current climate forecasts align perfectly with this crop's growth cycle.
3. **Optimized Sowing & Soil Action Steps**:
   - **Soil Preparation**: Ensure deep tilling to break down organic blocks and enhance roots' aeration.
   - **Fertilization**: Use balanced micronutrient applications based on local clay/silt concentrations.
   - **Irrigation**: Dig perimeter runoff channels to guard against temporary waterlogging if heavy rains occur.`;
    
    groundingSources = [
      { title: `India Meteorological Department (IMD) - Regional Forecasting Center`, url: 'https://mausam.imd.gov.in' },
      { title: `National Portal of India - Agricultural Directory Services`, url: 'https://www.india.gov.in' }
    ];
  }

  // Save prediction result to DB with Gemini & search metadata
  const saved = ServerDb.addPrediction(
    username, 
    inputs, 
    prediction.recommended_crop,
    geminiVerdict,
    geminiCrop,
    groundingSources
  );

  res.json({
    id: saved.id,
    recommended_crop: prediction.recommended_crop,
    description: prediction.description,
    topCrops: topCrops,
    geminiVerdict: geminiVerdict,
    geminiCrop: geminiCrop,
    groundingSources: groundingSources,
    createdAt: saved.createdAt
  });
});

// Get Prediction History
apiRouter.get('/predictions', authenticate, (req, res) => {
  const username = (req as any).username;
  const history = ServerDb.getPredictions(username);
  res.json({ history });
});

// --- Chatbot Endpoints ---

// Get Chat History
apiRouter.get('/chat', authenticate, (req, res) => {
  const username = (req as any).username;
  const history = ServerDb.getChatHistory(username);
  res.json({ history });
});

// Clear Chat History
apiRouter.delete('/chat', authenticate, (req, res) => {
  const username = (req as any).username;
  ServerDb.clearChatHistory(username);
  res.json({ success: true });
});

// Send Chat Message
apiRouter.post('/chat', authenticate, async (req, res) => {
  const username = (req as any).username;
  const { message } = req.body;

  if (!message) {
    res.status(400).json({ error: 'Message content is required' });
    return;
  }

  // Store user's message
  const userMsg = ServerDb.addChatMessage(username, 'user', message);

  // Get context (User profile, local soil, previous crop predictions) to make chatbot hyper-smart
  const user = ServerDb.getUser(username);
  const predictions = ServerDb.getPredictions(username);
  const latestPrediction = predictions[0];

  const profileContext = user?.profile?.name ? `
    Farmer Name: ${user.profile.name}
    Location: ${user.profile.village}, ${user.profile.district}, ${user.profile.state}
    Soil Type Found: ${user.profile.soilType || 'Not analyzed yet'}
    Soil Properties: ${JSON.stringify(user.profile.soilProperties || {})}
  ` : 'Farmer profile has not been configured yet.';

  const predictionContext = latestPrediction ? `
    Latest Soil Analysis Parameters:
    - Nitrogen: ${latestPrediction.inputs.nitrogen}
    - Phosphorus: ${latestPrediction.inputs.phosphorus}
    - Potassium: ${latestPrediction.inputs.potassium}
    - Temperature: ${latestPrediction.inputs.temperature}°C
    - Humidity: ${latestPrediction.inputs.humidity}%
    - pH Level: ${latestPrediction.inputs.pH}
    - Rainfall: ${latestPrediction.inputs.rainfall} mm
    Latest Recommended Crop: ${latestPrediction.recommendedCrop}
  ` : 'No crop predictions have been made yet.';

  const systemInstruction = `
    You are OptiCrop AI, an advanced, humble, and friendly digital agricultural consultant and agronomist.
    You assist farmers in choosing the best crops, improving soil fertility, optimizing water management, and diagnostic care.
    
    Here is the current farmer's context:
    ${profileContext}
    ${predictionContext}
    
    Please provide clear, practical, easy-to-understand agricultural advice. Use simple bullet points if helpful.
    If the farmer asks in Telugu or references Telugu concepts, reply in a warm bilingual/Telugu format where fitting, but maintain clarity.
    Be encouraging, respect the farmer's hard work, and refer to them respectfully.
  `;

  let aiText = '';

  try {
    const ai = getGeminiClient();
    if (ai) {
      // Build previous messages context
      const chatHistory = ServerDb.getChatHistory(username);
      // We pass the last 15 messages for context
      const contents = chatHistory.slice(-15).map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'model',
        parts: [{ text: msg.text }]
      }));

      // Call Gemini API with robust fallback model support and retries
      const result = await generateContentWithFallback(ai, {
        contents: [
          ...contents,
          { role: 'user', parts: [{ text: message }] }
        ],
        config: {
          systemInstruction,
          temperature: 0.7
        }
      });

      aiText = result.text || 'I apologize, I could not generate a response. Please try again.';
    } else {
      // Fallback simulation mode if API key is not present
      aiText = `[SIMULATION MODE] Hello! Since your Gemini API key is currently not set, I am running in agricultural expert simulation mode. 
      Based on your profile, your local soil type is **${user?.profile?.soilType || "not yet configured"}**. 
      Your last recommended crop was **${latestPrediction?.recommendedCrop || "not yet predicted"}**. 
      I highly recommend balanced composting to optimize nitrogen levels! How can I assist you further with crop management?`;
    }
  } catch (err: any) {
    console.error('Error in Gemini API call:', err);
    
    // Friendly, robust backup virtual advisor agronomist diagnostic block
    const soilType = user?.profile?.soilType || "Clayey Delta";
    const recommendedCrop = latestPrediction?.recommendedCrop || "Rice / Paddy";
    const userVillage = user?.profile?.village || "your village";
    const nitrogenVal = latestPrediction?.inputs?.nitrogen !== undefined ? `${latestPrediction.inputs.nitrogen} kg/ha` : "Moderate";
    
    aiText = `🌱 **[Agronomist Backup Mode]** I am currently experiencing temporary heavy traffic on my cloud-based servers, but as your virtual agronomist, I have analyzed your local context to assist you directly:

📍 **Farm Location & Soil Signature**:
- **Detected Soil Type**: ${soilType} (for ${userVillage})
- **Nitrogen Level**: ${nitrogenVal}
- **Recommended Crop**: ${recommendedCrop}

🌾 **Expert Diagnostic Recommendations**:
1. **Soil & Moisture**: For ${soilType} soils, avoid structural compaction by minimizing heavy machinery when wet. Keep organic mulches to retain standard soil biology.
2. **Plant Nutrition**: Balance synthetic chemical fertilizers (N-P-K) with generous organic compost or biofertilizers (like Azotobacter) to increase nutrient absorption.
3. **Water Management**: Clayey soils hold nutrients and water very well but are prone to waterlogging; ensure proper drainage channels are dug around the plot boundaries.

*My cloud server connection will be restored shortly. Please resubmit your query in a moment!*`;
  }

  // Store AI's response
  const aiMsg = ServerDb.addChatMessage(username, 'ai', aiText);

  res.json({ userMessage: userMsg, aiResponse: aiMsg });
});
