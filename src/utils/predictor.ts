import { PredictionInput } from '../types';

// Let's model crop profile centroids and ranges based on the Kaggle Crop Recommendation Dataset
interface CropProfile {
  name: string;
  n: number;
  p: number;
  k: number;
  temp: number;
  humidity: number;
  ph: number;
  rainfall: number;
  description: string;
}

export const CROP_PROFILES: CropProfile[] = [
  { name: "Rice", n: 80, p: 48, k: 40, temp: 24, humidity: 82, ph: 6.4, rainfall: 236, description: "Requires high water logging and warm humid climates." },
  { name: "Maize", n: 78, p: 48, k: 20, temp: 22, humidity: 65, ph: 6.2, rainfall: 85, description: "A versatile grain crop preferring moderate rainfall and well-drained loamy soils." },
  { name: "Chickpea", n: 40, p: 68, k: 80, temp: 19, humidity: 17, ph: 7.3, rainfall: 80, description: "Highly drought-tolerant legume, thrives in dry climates with cool temperatures." },
  { name: "Kidneybeans", n: 21, p: 68, k: 56, temp: 20, humidity: 57, ph: 5.7, rainfall: 106, description: "Prefers mild, warm temperatures and balanced, moist soil." },
  { name: "Pigeonpeas", n: 21, p: 68, k: 20, temp: 28, humidity: 68, ph: 5.8, rainfall: 149, description: "Thrives in tropical climates, has deep taproots suitable for dry areas." },
  { name: "Mothbeans", n: 21, p: 48, k: 20, temp: 28, humidity: 53, ph: 6.8, rainfall: 51, description: "Extremely drought-resistant pasture legume suited for sandy arid soils." },
  { name: "Mungbean", n: 21, p: 48, k: 20, temp: 28, humidity: 85, ph: 6.7, rainfall: 48, description: "Requires warm weather, dry harvesting conditions, and short growing seasons." },
  { name: "Blackgram", n: 40, p: 48, k: 20, temp: 27, humidity: 65, ph: 7.2, rainfall: 68, description: "Thrives in warm, humid regions and holds well in heavier clay soils." },
  { name: "Lentil", n: 19, p: 68, k: 20, temp: 25, humidity: 65, ph: 6.9, rainfall: 46, description: "Prefers cool conditions and adapts well to various soil types except waterlogged ones." },
  { name: "Pomegranate", n: 22, p: 18, k: 40, temp: 22, humidity: 90, ph: 6.4, rainfall: 108, description: "Thrives in warm, dry climates, tolerant of diverse soil compositions." },
  { name: "Banana", n: 100, p: 82, k: 50, temp: 27, humidity: 80, ph: 6.0, rainfall: 105, description: "Requires rich organic soil, heavy nitrogen fertilization, and humid tropical air." },
  { name: "Mango", n: 30, p: 27, k: 30, temp: 32, humidity: 50, ph: 5.7, rainfall: 95, description: "Prefers warm weather with clear dry seasons during flowering and fruiting." },
  { name: "Grapes", n: 23, p: 132, k: 200, temp: 24, humidity: 82, ph: 6.0, rainfall: 70, description: "High potassium and phosphorus demand. Prefers well-drained, sunny hillsides." },
  { name: "Watermelon", n: 99, p: 18, k: 50, temp: 26, humidity: 85, ph: 6.4, rainfall: 51, description: "Requires sandy soil, high temperatures, and low relative humidity during growth." },
  { name: "Muskmelon", n: 100, p: 18, k: 50, temp: 28, humidity: 92, ph: 6.3, rainfall: 25, description: "Prefers very dry harvesting conditions and warm sandy soils." },
  { name: "Apple", n: 21, p: 135, k: 200, temp: 22, humidity: 92, ph: 5.9, rainfall: 112, description: "Requires chilling hours, deep loamy soils, and uniform moisture." },
  { name: "Orange", n: 20, p: 16, k: 10, temp: 23, humidity: 92, ph: 7.0, rainfall: 111, description: "Thrives in subtropical climates with ample sunlight and well-aerated sandy soil." },
  { name: "Papaya", n: 50, p: 60, k: 50, temp: 27, humidity: 93, ph: 6.7, rainfall: 143, description: "Fast-growing tropical fruit tree that requires warm soil and perfect drainage." },
  { name: "Coconut", n: 22, p: 17, k: 30, temp: 27, humidity: 94, ph: 5.9, rainfall: 170, description: "Salt-tolerant coastal palm, prefers high humidity and year-round high rain." },
  { name: "Cotton", n: 117, p: 46, k: 19, temp: 24, humidity: 80, ph: 6.8, rainfall: 81, description: "Fibers require high sun, warm weather, and uniform moisture followed by dry harvest." },
  { name: "Jute", n: 78, p: 46, k: 40, temp: 25, humidity: 80, ph: 6.7, rainfall: 175, description: "Prefers alluvial soil, hot humid weather, and standing pool conditions." },
  { name: "Coffee", n: 102, p: 29, k: 30, temp: 26, humidity: 58, ph: 6.8, rainfall: 158, description: "Prefers high altitudes, cool mountain air, shade, and rich volcanic soil." }
];

// Let's build a simulated Random Forest (Ensemble of 5 simplified Decision Trees)
// Each decision tree uses a slightly different subset of features (feature bagging) to vote.

function getRegionalCropAdjustments(
  cropName: string,
  input: PredictionInput
): { penalty: number; bonus: number; ruleOut: boolean } {
  let penalty = 0;
  let bonus = 0;
  let ruleOut = false;

  const state = (input.state || '').toLowerCase();
  const district = (input.district || '').toLowerCase();
  const soilType = (input.soilType || '').toLowerCase();

  // If the location matches Gudlavalleru / Krishna delta or alluvial soils
  const isGudlavalleruOrKrishnaDelta = 
    district.includes('krishna') || 
    district.includes('gudlavalleru') || 
    state.includes('gudlavalleru') || 
    soilType.includes('alluvial') || 
    soilType.includes('delta');

  if (isGudlavalleruOrKrishnaDelta) {
    // Rice is high-yield king in Gudlavalleru delta. We give it a major priority bonus!
    if (cropName === 'Rice') {
      bonus = 0.65; // huge distance bonus (attraction) to ensure Rice is chosen
    }
    if (cropName === 'Jute') {
      bonus = 0.25;
    }

    // Grapes, Apple are dry highland/sunny slope crops, completely unsuited for wet low-lying delta clay soils.
    if (cropName === 'Grapes' || cropName === 'Apple') {
      ruleOut = true; // Rule out entirely
    }
    if (cropName === 'Chickpea' || cropName === 'Mothbeans' || cropName === 'Lentil') {
      penalty = 0.5; // heavy penalty due to susceptibility to root rot in clay/waterlogged soil
    }
  }

  return { penalty, bonus, ruleOut };
}

function getNearestCrop(
  input: PredictionInput,
  features: Array<{ key: keyof PredictionInput; cropKey: keyof CropProfile; weight: number }>
): string {
  // Normalize input values to [0, 1] based on known extreme ranges
  const normInput = {
    nitrogen: (input.nitrogen - 0) / 400,
    phosphorus: (input.phosphorus - 5) / 395,
    potassium: (input.potassium - 5) / 395,
    temperature: (input.temperature - 10) / 40,
    humidity: (input.humidity - 10) / 90,
    pH: (input.pH - 3.5) / 6.4,
    rainfall: (input.rainfall - 20) / 280
  };

  let bestCrop = "Maize";
  let minDistance = Infinity;

  for (const crop of CROP_PROFILES) {
    const regional = getRegionalCropAdjustments(crop.name, input);
    if (regional.ruleOut) continue;

    // Apply key survival rules to rule out highly unsuitable options under extreme conditions
    if (crop.name === "Rice" && input.rainfall < 110) continue;
    if (crop.name === "Chickpea" && input.humidity > 50) continue;
    if (crop.name === "Grapes" && input.potassium < 75) continue;
    if (crop.name === "Apple" && input.potassium < 75) continue;
    if (crop.name === "Coconut" && input.humidity < 65) continue;
    if (crop.name === "Watermelon" && input.rainfall > 160) continue;

    let distance = 0;
    for (const f of features) {
      const inputVal = normInput[f.key];
      
      // Map crop centroid value to [0, 1] using matching feature min-max ranges
      let cropVal = 0;
      if (f.cropKey === 'n') cropVal = (crop.n - 0) / 400;
      else if (f.cropKey === 'p') cropVal = (crop.p - 5) / 395;
      else if (f.cropKey === 'k') cropVal = (crop.k - 5) / 395;
      else if (f.cropKey === 'temp') cropVal = (crop.temp - 10) / 40;
      else if (f.cropKey === 'humidity') cropVal = (crop.humidity - 10) / 90;
      else if (f.cropKey === 'ph') cropVal = (crop.ph - 3.5) / 6.4;
      else if (f.cropKey === 'rainfall') cropVal = (crop.rainfall - 20) / 280;

      // Calculate squared distance
      distance += f.weight * Math.pow(inputVal - cropVal, 2);
    }

    // Adjust distance with regional bonuses & penalties
    distance = distance * (1 + regional.penalty) - regional.bonus;

    if (distance < minDistance) {
      minDistance = distance;
      bestCrop = crop.name;
    }
  }

  return bestCrop;
}

function decisionTree1(input: PredictionInput): string {
  // Tree 1: Focuses heavily on soil chemical nutrients (N, P, K)
  return getNearestCrop(input, [
    { key: 'nitrogen', cropKey: 'n', weight: 1.5 },
    { key: 'phosphorus', cropKey: 'p', weight: 1.5 },
    { key: 'potassium', cropKey: 'k', weight: 1.5 }
  ]);
}

function decisionTree2(input: PredictionInput): string {
  // Tree 2: Focuses heavily on climate conditions (Rainfall, Humidity, Temp)
  return getNearestCrop(input, [
    { key: 'rainfall', cropKey: 'rainfall', weight: 2.0 },
    { key: 'humidity', cropKey: 'humidity', weight: 1.5 },
    { key: 'temperature', cropKey: 'temp', weight: 0.8 }
  ]);
}

function decisionTree3(input: PredictionInput): string {
  // Tree 3: Focuses on soil reaction and root environment (pH, Potassium, Moisture/Rainfall)
  return getNearestCrop(input, [
    { key: 'pH', cropKey: 'ph', weight: 2.0 },
    { key: 'potassium', cropKey: 'k', weight: 1.2 },
    { key: 'rainfall', cropKey: 'rainfall', weight: 1.0 }
  ]);
}

function decisionTree4(input: PredictionInput): string {
  // Tree 4: Full Multi-Dimensional Euclidean Nearest Neighbor
  return getNearestCrop(input, [
    { key: 'nitrogen', cropKey: 'n', weight: 1.0 },
    { key: 'phosphorus', cropKey: 'p', weight: 1.0 },
    { key: 'potassium', cropKey: 'k', weight: 1.0 },
    { key: 'temperature', cropKey: 'temp', weight: 1.0 },
    { key: 'humidity', cropKey: 'humidity', weight: 1.0 },
    { key: 'pH', cropKey: 'ph', weight: 1.0 },
    { key: 'rainfall', cropKey: 'rainfall', weight: 1.0 }
  ]);
}

function decisionTree5(input: PredictionInput): string {
  // Tree 5: High-value cash/fruit crop focus (PK and high humidity/respiration)
  return getNearestCrop(input, [
    { key: 'potassium', cropKey: 'k', weight: 2.0 },
    { key: 'phosphorus', cropKey: 'p', weight: 1.5 },
    { key: 'humidity', cropKey: 'humidity', weight: 1.2 },
    { key: 'temperature', cropKey: 'temp', weight: 0.8 }
  ]);
}

export function predictCrop(input: PredictionInput): { recommended_crop: string; description: string } {
  // Ensembled Random Forest Voting
  const votes: Record<string, number> = {};
  
  const predictions = [
    decisionTree1(input),
    decisionTree2(input),
    decisionTree3(input),
    decisionTree4(input),
    decisionTree5(input)
  ];

  for (const pred of predictions) {
    votes[pred] = (votes[pred] || 0) + 1;
  }

  // Find the winner with highest votes
  let winner = "Maize";
  let maxVotes = 0;
  for (const [crop, count] of Object.entries(votes)) {
    if (count > maxVotes) {
      maxVotes = count;
      winner = crop;
    } else if (count === maxVotes) {
      // In case of a tie, prefer the one with closer global distance (decisionTree4)
      const globalBest = predictions[3]; // decisionTree4 is index 3
      if (crop === globalBest) {
        winner = crop;
      }
    }
  }

  const profile = CROP_PROFILES.find(p => p.name.toLowerCase() === winner.toLowerCase()) || CROP_PROFILES[1];

  return {
    recommended_crop: winner,
    description: profile.description
  };
}

export interface TopCropPrediction {
  crop: string;
  matchScore: number;
  currentYield: number;
  historicalYields: number[];
  averageYield: number;
  yieldGain: number;
  description: string;
}

export function predictTopCrops(input: PredictionInput): TopCropPrediction[] {
  // Normalize input values to [0, 1] based on known extreme ranges
  const normInput = {
    nitrogen: (input.nitrogen - 0) / 400,
    phosphorus: (input.phosphorus - 5) / 395,
    potassium: (input.potassium - 5) / 395,
    temperature: (input.temperature - 10) / 40,
    humidity: (input.humidity - 10) / 90,
    pH: (input.pH - 3.5) / 6.4,
    rainfall: (input.rainfall - 20) / 280
  };

  const cropBaseYields: Record<string, number> = {
    Rice: 5.5, Maize: 6.2, Chickpea: 2.2, Kidneybeans: 1.8, Pigeonpeas: 1.5,
    Mothbeans: 1.2, Mungbean: 1.3, Blackgram: 1.4, Lentil: 1.6, Pomegranate: 8.5,
    Banana: 24.0, Mango: 9.0, Grapes: 12.0, Watermelon: 15.0, Muskmelon: 13.0,
    Apple: 18.0, Orange: 14.5, Papaya: 22.0, Coconut: 10.0, Cotton: 2.5,
    Jute: 3.2, Coffee: 2.0
  };

  const results: TopCropPrediction[] = [];

  for (const crop of CROP_PROFILES) {
    const regional = getRegionalCropAdjustments(crop.name, input);
    if (regional.ruleOut) continue;

    // Calculate custom distance
    let dist = 0;
    
    const cropValN = (crop.n - 0) / 400;
    const cropValP = (crop.p - 5) / 395;
    const cropValK = (crop.k - 5) / 395;
    const cropValTemp = (crop.temp - 10) / 40;
    const cropValHum = (crop.humidity - 10) / 90;
    const cropValPh = (crop.ph - 3.5) / 6.4;
    const cropValRain = (crop.rainfall - 20) / 280;

    dist += 1.0 * Math.pow(normInput.nitrogen - cropValN, 2);
    dist += 1.0 * Math.pow(normInput.phosphorus - cropValP, 2);
    dist += 1.0 * Math.pow(normInput.potassium - cropValK, 2);
    dist += 1.5 * Math.pow(normInput.temperature - cropValTemp, 2);
    dist += 1.5 * Math.pow(normInput.humidity - cropValHum, 2);
    dist += 2.0 * Math.pow(normInput.pH - cropValPh, 2);
    dist += 2.0 * Math.pow(normInput.rainfall - cropValRain, 2);

    // Hard exclusion penalty for extreme conditions
    let penalty = 1.0;
    if (crop.name === "Rice" && input.rainfall < 110) penalty -= 0.4;
    if (crop.name === "Chickpea" && input.humidity > 50) penalty -= 0.5;
    if (crop.name === "Grapes" && input.potassium < 75) penalty -= 0.4;
    if (crop.name === "Apple" && input.potassium < 75) penalty -= 0.4;
    if (crop.name === "Coconut" && input.humidity < 65) penalty -= 0.5;
    if (crop.name === "Watermelon" && input.rainfall > 160) penalty -= 0.4;

    // Apply regional penalty and bonus to penalty score
    penalty -= regional.penalty;
    penalty += regional.bonus;
    penalty = Math.max(0.1, Math.min(2.0, penalty));

    const rawMatchScore = Math.max(10, Math.round((1.0 - Math.min(1.0, Math.sqrt(dist) / 1.8)) * 100 * penalty));
    
    const maxYield = cropBaseYields[crop.name] || 4.0;
    const matchRatio = rawMatchScore / 100;
    const currentYield = Number((maxYield * (0.5 + 0.5 * matchRatio)).toFixed(2));

    const nameSeed = crop.name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    
    const historicalYields: number[] = [];
    let sumYield = 0;
    
    for (let i = 0; i < 5; i++) {
      const year = 2021 + i;
      let factor = 1.0;
      
      if (year === 2021) {
        factor = crop.rainfall > 150 ? 0.88 : 1.08;
      } else if (year === 2022) {
        factor = 1.06;
      } else if (year === 2023) {
        factor = crop.rainfall > 150 ? 1.15 : 0.82;
      } else if (year === 2024) {
        factor = 0.98;
      } else if (year === 2025) {
        factor = crop.temp > 25 ? 1.05 : 0.92;
      }
      
      const inputFluct = Math.sin(nameSeed + year + input.nitrogen) * 0.04;
      const yrYield = Number((maxYield * (0.45 + 0.5 * matchRatio) * factor + inputFluct).toFixed(2));
      const finalYrYield = Math.max(0.1, yrYield);
      historicalYields.push(finalYrYield);
      sumYield += finalYrYield;
    }

    const averageYield = Number((sumYield / 5).toFixed(2));
    const yieldGain = averageYield > 0 ? Number((((currentYield - averageYield) / averageYield) * 100).toFixed(1)) : 0.0;

    results.push({
      crop: crop.name,
      matchScore: rawMatchScore,
      currentYield,
      historicalYields,
      averageYield,
      yieldGain,
      description: crop.description
    });
  }

  // Combine matchScore and crop value suitability to sort
  return results
    .sort((a, b) => {
      const compA = a.matchScore * 0.7 + (a.currentYield / (cropBaseYields[a.crop] || 4.0)) * 30;
      const compB = b.matchScore * 0.7 + (b.currentYield / (cropBaseYields[b.crop] || 4.0)) * 30;
      return compB - compA;
    })
    .slice(0, 3);
}

export function mapProfileToSoil(state: string, district: string, village: string): { soilType: string; description: string; properties: any } {
  const s = state.toLowerCase();
  const d = district.toLowerCase();
  const v = village.toLowerCase();

  if (s.includes("andhra") || s.includes("telangana") || s.includes("ap") || s.includes("tg")) {
    if (d.includes("guntur") || d.includes("krishna") || d.includes("godavari") || v.includes("goli") || v.includes("lanka")) {
      return {
        soilType: "Alluvial Soil (Coastal/River Delta)",
        description: "Extremely fertile delta soil, rich in potash and organic matter. Highly suitable for intensive cropping.",
        properties: { nitrogen: "Medium", phosphorus: "Medium", potassium: "High", pH: "6.5 - 7.5", moisture: "High" }
      };
    }
    if (d.includes("anantapur") || d.includes("kurnool") || d.includes("kadapa") || d.includes("chittoor")) {
      return {
        soilType: "Red Sandy Soil (Chalka/Dubba)",
        description: "Light-textured red sandy-loam. Good drainage, but low water-holding capacity and moderate nutrients.",
        properties: { nitrogen: "Low", phosphorus: "Low", potassium: "Medium", pH: "6.0 - 7.0", moisture: "Low" }
      };
    }
    return {
      soilType: "Black Cotton Soil (Regur)",
      description: "Deep clay soil that swells when wet and cracks when dry. Highly fertile with excellent water retention.",
      properties: { nitrogen: "Medium", phosphorus: "Low", potassium: "High", pH: "7.5 - 8.5", moisture: "Very High" }
    };
  }

  if (s.includes("punjab") || s.includes("haryana") || s.includes("uttar") || s.includes("up") || s.includes("bihar")) {
    return {
      soilType: "Alluvial Soil (Bhangar/Khadar)",
      description: "Deep, rich loam formed by river depositions. Best for wheat, sugarcane, and rice.",
      properties: { nitrogen: "Medium", phosphorus: "Medium", potassium: "High", pH: "6.8 - 7.5", moisture: "High" }
    };
  }

  if (s.includes("rajasthan") || s.includes("gujarat")) {
    return {
      soilType: "Arid Sandy Soil",
      description: "Windblown sands, highly porous with low organic matter. Highly alkaline and dry.",
      properties: { nitrogen: "Very Low", phosphorus: "Low", potassium: "Medium", pH: "8.0 - 9.0", moisture: "Very Low" }
    };
  }

  if (s.includes("kerala") || s.includes("karnataka") || s.includes("assam")) {
    return {
      soilType: "Laterite Soil",
      description: "Highly leached, acidic clay soil formed under heavy rainfall. Rich in iron oxide, good for plantation crops.",
      properties: { nitrogen: "Low", phosphorus: "Very Low", potassium: "Low", pH: "5.0 - 6.0", moisture: "Medium" }
    };
  }

  // Default Fallback based on name hashes
  const hash = (v.length + d.length + s.length) % 3;
  if (hash === 0) {
    return {
      soilType: "Black Loamy Soil",
      description: "Balanced mixture of sand, clay, and rich organic compost. Easy to cultivate and highly fertile.",
      properties: { nitrogen: "Medium", phosphorus: "Medium", potassium: "Medium", pH: "6.5 - 7.2", moisture: "Medium" }
    };
  } else if (hash === 1) {
    return {
      soilType: "Clayey Red Soil",
      description: "Reddish clay soil with high iron contents. Good structure and holds nutrients relatively well.",
      properties: { nitrogen: "Medium", phosphorus: "Low", potassium: "Medium", pH: "6.0 - 6.8", moisture: "High" }
    };
  } else {
    return {
      soilType: "Sandy Loam Soil",
      description: "Coarse and grainy texture, offering high drainage. Perfect for root crops and fruits.",
      properties: { nitrogen: "Low", phosphorus: "Medium", potassium: "Medium", pH: "6.2 - 6.9", moisture: "Low" }
    };
  }
}
