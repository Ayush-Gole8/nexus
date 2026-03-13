import { Router, Request, Response } from 'express';
import { getAIInsights, streamChatResponse } from '../services/aiService';
import { isGeminiAvailable } from '../config/gemini';
import { authenticate, type AuthRequest } from '../middleware/auth';

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

// POST /api/ai/chat — conversational chat (SSE)
router.post('/chat', authenticate, async (req: Request, res: Response) => {
  try {
    const { message, history } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'message is required' });
    }
    const role = (req as AuthRequest).user?.role || 'citizen';
    const messages = [...(history ?? []), { role: 'user', content: message }];
    await streamChatResponse(messages, role, res);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
