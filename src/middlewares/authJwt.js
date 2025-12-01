// sismim-api/src/middlewares/authJwt.js
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export async function authJwt(req, res, next) {
  try {
    const h = req.headers.authorization || '';
    const token = h.startsWith('Bearer ') ? h.slice(7) : null;
    if (!token) return res.status(401).json({ error: 'No token' });

    const { uid } = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(uid).populate('concessions');
    if (!user) return res.status(401).json({ error: 'Usuario no encontrado' });

    req.user = user;
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Token inválido' });
  }
}
