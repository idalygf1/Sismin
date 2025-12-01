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

// Obtener perfil del usuario autenticado
export const getProfile = async (req, res) => {
  try {
    // req.user lo pone el middleware de auth, pero para estar seguros
    // leemos desde la BD (así siempre trae phone, concessions, etc.)
    const userId = req.user?._id || req.user?.id;

    if (!userId) {
      return res.status(400).json({ message: 'No se encontró el ID de usuario en el token' });
    }

    const user = await User.findById(userId).select('-passwordHash');

    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // Mantenemos el formato original { user: ... }
    res.json({ user });
  } catch (err) {
    res
      .status(500)
      .json({ message: 'Error al obtener perfil', error: err.message });
  }
};

// Editar usuario
export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    // 👇 Desestructuramos incluyendo phone y avatarUrl
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
