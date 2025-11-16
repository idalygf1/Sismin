import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const sign = (uid) => jwt.sign({ uid }, process.env.JWT_SECRET, { expiresIn: '7d' });

export async function register(req, res) {
  try {
    const { name, email, password, role = 'socio' } = req.body;
    const exists = await User.findOne({ email });
    if (exists) return res.status(409).json({ error: 'Email ya registrado' });
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, passwordHash, roleGlobal: role, concessions: [] });
    res.status(201).json({ ok: true, user: { id: user._id, name, email, roleGlobal: user.roleGlobal } });
  } catch (e) { res.status(500).json({ error: e.message }); }
}

export async function login(req, res) {
  try {
    const { email, password } = req.body;
    const u = await User.findOne({ email });
    if (!u) return res.status(401).json({ error: 'Credenciales inválidas' });
    const ok = await bcrypt.compare(password, u.passwordHash);
    if (!ok) return res.status(401).json({ error: 'Credenciales inválidas' });
    const token = sign(u._id);
    res.json({ token, user: { id: u._id, name: u.name, email: u.email, roleGlobal: u.roleGlobal, concessions: u.concessions } });
  } catch (e) { res.status(500).json({ error: e.message }); }
}
