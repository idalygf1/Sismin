import User from '../models/User.js';

// Listar todos los usuarios (sin mostrar passwordHash)
export const getUsers = async (req, res) => {
  try {
    const users = await User.find().select('-passwordHash');
    res.json(users);
  } catch (err) {
    res
      .status(500)
      .json({ message: 'Error al obtener usuarios', error: err.message });
  }
};

export const getProfile = (req, res) => {
  const user = req.user.toObject();
  delete user.passwordHash;
  res.json({ user });
};

// Editar usuario
export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    // 👇 Solo una desestructuración, incluyendo phone y avatarUrl
    const { name, email, roleGlobal, phone, avatarUrl } = req.body;

    const updated = await User.findByIdAndUpdate(
      id,
      { name, email, roleGlobal, phone, avatarUrl },
      { new: true }
    ).select('-passwordHash');

    if (!updated) {
      return res
        .status(404)
        .json({ message: 'Usuario no encontrado' });
    }

    res.json(updated);
  } catch (err) {
    res
      .status(500)
      .json({ message: 'Error al actualizar usuario', error: err.message });
  }
};

// Activar o desactivar usuario
export const updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const updated = await User.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    ).select('-passwordHash');

    if (!updated) {
      return res
        .status(404)
        .json({ message: 'Usuario no encontrado' });
    }

    res.json({
      message: `Usuario ${status ? 'activado' : 'desactivado'}`,
      user: updated,
    });
  } catch (err) {
    res
      .status(500)
      .json({ message: 'Error al cambiar estado', error: err.message });
  }
};
