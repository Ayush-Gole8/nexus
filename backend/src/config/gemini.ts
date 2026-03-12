import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY || '';

let genAI: GoogleGenerativeAI | null = null;

if (apiKey && apiKey !== 'your_gemini_api_key_here') {
  genAI = new GoogleGenerativeAI(apiKey);
}

export const getGeminiModel = () => {
  if (!genAI) {
    throw new Error('Gemini API key not configured. Set GEMINI_API_KEY in .env');
  }
  return genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
};

export const isGeminiAvailable = (): boolean => {
  return genAI !== null;
};

export default genAI;
