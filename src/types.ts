export interface UserProfile {
  name: string;
  email: string;
  state: string;
  district: string;
  village: string;
  phone: string;
  pincode: string;
  profilePic?: string; // base64 or placeholder color
  soilType?: string;
  soilDescription?: string;
  soilProperties?: {
    nitrogen: string;
    phosphorus: string;
    potassium: string;
    pH: string;
    moisture: string;
  };
}

export interface User {
  username: string;
  profile: UserProfile;
}

export interface PredictionInput {
  nitrogen: number;
  phosphorus: number;
  potassium: number;
  temperature: number;
  humidity: number;
  pH: number;
  rainfall: number;
  soilType?: string;
  district?: string;
  state?: string;
}

export interface PredictionResult {
  id: string;
  username: string;
  inputs: PredictionInput;
  recommendedCrop: string;
  geminiVerdict?: string;
  geminiCrop?: string;
  groundingSources?: Array<{ title: string; url: string }>;
  createdAt: string;
}

export interface ChatMessage {
  sender: 'user' | 'ai';
  text: string;
  createdAt: string;
}

export interface ChatSession {
  username: string;
  messages: ChatMessage[];
}
