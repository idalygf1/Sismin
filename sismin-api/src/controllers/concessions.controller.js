import Concession from '../models/Concession.js';
import User from '../models/User.js';

export async function listConcessions(req, res) {
  const list = await Concession.find().sort({ name: 1 });
  res.json(list);
}

export async function createConcession(req, res) {
  if (req.user.roleGlobal !== 'propietario')
    return res.status(403).json({ error: 'Solo propietario puede crear concesiones' });

  const { name, active = true } = req.body;
  const c = await Concession.create({ name, active });
  res.status(201).json(c);
}

export async function grantUser(req, res) {
  if (req.user.roleGlobal !== 'propietario')
    return res.status(403).json({ error: 'Solo propietario puede asignar accesos' });

  const { userId, concessionId } = req.body;
  const user = await User.findById(userId);
  if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

  if (!user.concessions.some(c => String(c) === String(concessionId))) {
    user.concessions.push(concessionId);
    await user.save();
  }
  const populated = await User.findById(userId).populate('Concession');
  res.json({ ok: true, user });
}

// PATCH /api/concessions/:id
export async function updateConcession(req, res) {
  try {
    const { id } = req.params;
    const { name, active } = req.body;

    const concession = await Concession.findByIdAndUpdate(
      id,
      { name, active },
      { new: true }
    );

    if (!concession) return res.status(404).json({ error: 'Concesión no encontrada' });

    res.json({ ok: true, message: 'Concesión actualizada', concession });
  } catch (err) {
    res.status(500).json({ error: 'Error al actualizar concesión', details: err.message });
  }
}

// DELETE /api/concessions/:id
export async function deleteConcession(req, res) {
  try {
    const { id } = req.params;

    const concession = await Concession.findByIdAndUpdate(
      id,
      { active: false },
      { new: true }
    );

    if (!concession) return res.status(404).json({ error: 'Concesión no encontrada' });

    res.json({ ok: true, message: 'Concesión desactivada', concession });
  } catch (err) {
    res.status(500).json({ error: 'Error al eliminar concesión', details: err.message });
  }
}

