import { Router, Request, Response } from 'express';
import { getAIInsights, chatWithAI } from '../services/aiService';
import { isGeminiAvailable } from '../config/gemini';

const router = Router();

// GET /api/ai/status — check if AI is available
router.get('/status', (_req: Request, res: Response) => {
  res.json({ available: isGeminiAvailable() });
});

// POST /api/ai/insights — get structured AI analysis
router.post('/insights', async (req: Request, res: Response) => {
  try {
    const { context, query } = req.body;
    const insights = await getAIInsights(context, query);
    res.json(insights);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/ai/chat — conversational chat
router.post('/chat', async (req: Request, res: Response) => {
  try {
    const { message, history } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'message is required' });
    }
    const response = await chatWithAI(message, history || []);
    res.json({ response });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
