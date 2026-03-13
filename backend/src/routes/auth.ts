import { Router, Request, Response } from 'express';
import User from '../models/User';
import { generateToken, authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// POST /api/auth/register
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { name, email, password, role, zone, phone, wardId } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    // Only admins can create official/admin accounts via separate flow
    const allowedRoles = ['official', 'responder', 'admin'];
    const userRole = allowedRoles.includes(role) ? role : 'citizen';

    const effectiveWardId = userRole === 'citizen' ? (wardId || zone || 'Mumbai') : undefined;
    const user = await User.create({ name, email, password, role: userRole, zone, phone, wardId: effectiveWardId });
    const token = generateToken(user, { wardId: effectiveWardId });

    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        zone: user.zone,
        wardId: user.wardId,
        badgeNumber: user.badgeNumber,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password, wardId } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const effectiveWardId = user.role === 'citizen' ? (wardId || user.wardId || user.zone) : undefined;
    if (user.role === 'citizen' && !effectiveWardId) {
      return res.status(400).json({ error: 'wardId is required for citizen login' });
    }
    const token = generateToken(user, { wardId: effectiveWardId });

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        zone: user.zone,
        wardId: effectiveWardId,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/auth/me — get current user profile
router.get('/me', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    res.json({
      id: req.user!._id,
      name: req.user!.name,
      email: req.user!.email,
      role: req.user!.role,
      zone: req.user!.zone,
      wardId: req.user!.wardId,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
