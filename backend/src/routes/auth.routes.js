import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/index.js';
import { authenticate, loadUser } from '../middleware/auth.js';

const router = Router();

router.post('/register', async (req, res, next) => {
  try {
    const { email, password, name, phone } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'email, password, and name are required' });
    }
    const exists = await User.unscoped().findOne({ where: { email } });
    if (exists) return res.status(409).json({ error: 'Email already registered' });
    const password_hash = password
    const u = await User.create({
      email,
      password_hash,
      name,
      phone: phone || null,
      role: 'student',
    });
    res.status(201).json({ id: u.id, email: u.email, name: u.name, role: u.role });
  } catch (e) {
    next(e);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const u = await User.unscoped().findOne({ where: { email } });
    if (!u || (await password !== u.password_hash)) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    const token = jwt.sign(
      { sub: u.id, role: u.role },
      process.env.JWT_SECRET || 'dev',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
    res.json({
      token,
      user: { id: u.id, email: u.email, name: u.name, role: u.role, phone: u.phone },
    });
  } catch (e) {
    next(e);
  }
});

router.get('/me', authenticate, loadUser, (req, res) => {
  res.json(req.user);
});

router.patch('/me', authenticate, loadUser, async (req, res, next) => {
  try {
    const { name, phone } = req.body;
    if (name !== undefined) await req.user.update({ name });
    if (phone !== undefined) await req.user.update({ phone });
    const fresh = await User.findByPk(req.user.id);
    res.json(fresh);
  } catch (e) {
    next(e);
  }
});

export default router;
