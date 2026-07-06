import fs from 'fs';
import path from 'path';
import { User, UserProfile, PredictionResult, ChatMessage } from './src/types';

const DB_FILE = path.join(process.cwd(), 'data-store.json');

interface Schema {
  users: Record<string, { passwordHash: string; profile: UserProfile }>;
  predictions: PredictionResult[];
  chats: Record<string, ChatMessage[]>;
}

const initialDb: Schema = {
  users: {},
  predictions: [],
  chats: {}
};

function readDb(): Schema {
  try {
    if (!fs.existsSync(DB_FILE)) {
      fs.writeFileSync(DB_FILE, JSON.stringify(initialDb, null, 2));
      return initialDb;
    }
    const content = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(content);
  } catch (err) {
    console.error('Error reading local JSON database:', err);
    return initialDb;
  }
}

function writeDb(data: Schema) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Error writing to local JSON database:', err);
  }
}

export const ServerDb = {
  // Authentication
  getUser(username: string) {
    const db = readDb();
    const user = db.users[username];
    if (!user) return null;
    return {
      username,
      passwordHash: user.passwordHash,
      profile: user.profile
    };
  },

  createUser(username: string, passwordHash: string, profile: UserProfile) {
    const db = readDb();
    db.users[username] = { passwordHash, profile };
    writeDb(db);
    return { username, profile };
  },

  updateProfile(username: string, profile: UserProfile) {
    const db = readDb();
    if (db.users[username]) {
      db.users[username].profile = profile;
      writeDb(db);
      return profile;
    }
    return null;
  },

  // Predictions
  addPrediction(
    username: string,
    inputs: any,
    recommendedCrop: string,
    geminiVerdict?: string,
    geminiCrop?: string,
    groundingSources?: Array<{ title: string; url: string }>
  ): PredictionResult {
    const db = readDb();
    const newPrediction: PredictionResult = {
      id: Math.random().toString(36).substring(2, 11),
      username,
      inputs,
      recommendedCrop,
      geminiVerdict,
      geminiCrop,
      groundingSources,
      createdAt: new Date().toISOString()
    };
    db.predictions.push(newPrediction);
    writeDb(db);
    return newPrediction;
  },

  getPredictions(username: string): PredictionResult[] {
    const db = readDb();
    return db.predictions
      .filter(p => p.username === username)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  // Chats
  getChatHistory(username: string): ChatMessage[] {
    const db = readDb();
    return db.chats[username] || [];
  },

  addChatMessage(username: string, sender: 'user' | 'ai', text: string): ChatMessage {
    const db = readDb();
    if (!db.chats[username]) {
      db.chats[username] = [];
    }
    const newMessage: ChatMessage = {
      sender,
      text,
      createdAt: new Date().toISOString()
    };
    db.chats[username].push(newMessage);
    writeDb(db);
    return newMessage;
  },

  clearChatHistory(username: string) {
    const db = readDb();
    db.chats[username] = [];
    writeDb(db);
  }
};
