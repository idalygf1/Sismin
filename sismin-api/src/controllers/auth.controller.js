import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const sign = (uid) =>
  jwt.sign({ uid }, process.env.JWT_SECRET, { expiresIn: '7d' });

// REGISTRO
export async function register(req, res) {
  try {
    // 👇 Solo una desestructuración
    const { name, email, password, role = 'socio', phone, avatarUrl } = req.body;

    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(409).json({ error: 'Email ya registrado' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    // 👇 Solo un create
    const user = await User.create({
      name,
      email,
      passwordHash,
      roleGlobal: role,
      concessions: [],
      phone,
      avatarUrl,
    });

    return res.status(201).json({
      ok: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        roleGlobal: user.roleGlobal,
        concessions: user.concessions,
        phone: user.phone,
        avatarUrl: user.avatarUrl,
      },
    });
  } catch (e) {
    return res
      .status(500)
      .json({ error: 'Error en registro', message: e.message });
  }
}

// LOGIN
export async function login(req, res) {
  try {
    const { email, password } = req.body;

    const u = await User.findOne({ email });
    if (!u) {
      return res
        .status(401)
        .json({ error: 'Credenciales inválidas' });
    }

    const ok = await bcrypt.compare(password, u.passwordHash);
    if (!ok) {
      return res
        .status(401)
        .json({ error: 'Credenciales inválidas' });
    }

    const token = sign(u._id);

    return res.json({
      token,
      user: {
        id: u._id,
        name: u.name,
        email: u.email,
        roleGlobal: u.roleGlobal,
        concessions: u.concessions,
        phone: u.phone,
        avatarUrl: u.avatarUrl,
      },
    });
  } catch (e) {
    return res
      .status(500)
      .json({ error: 'Error en login', message: e.message });
  }
}
