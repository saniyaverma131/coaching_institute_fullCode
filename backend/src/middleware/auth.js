import jwt from 'jsonwebtoken';
import { User } from '../models/index.js';

export function authenticate(req, res, next) {
  const h = req.headers.authorization;
  const token = h?.startsWith('Bearer ') ? h.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Missing token' });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev');
    req.userId = payload.sub;
    req.userRole = payload.role;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

export async function loadUser(req, res, next) {
  try {
    const user = await User.findByPk(req.userId);
    if (!user) return res.status(401).json({ error: 'User not found' });
    req.user = user;
    next();
  } catch (e) {
    next(e);
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.userRole)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    next();
  };
}
