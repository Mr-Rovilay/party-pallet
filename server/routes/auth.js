import express from 'express';
import { login } from '../controllers/auth.js';

const router = express.Router();

router.post('/login', login);
router.post('/logout', async (req, res) => {
  res.clearCookie('jwt', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    path: '/',
  });
  res.status(200).json({ message: 'Logged out successfully' });
});

export default router;