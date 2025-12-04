// src/controllers/notifications.controller.js
import Notification from '../models/Notification.js';
import { ensureConcessionAccess } from '../utils/access.js';

// ---------------------------------------------------------------------
// LISTAR NOTIFICACIONES
// ---------------------------------------------------------------------
export async function listNotifications(req, res) {
  try {
    const { limit = 20 } = req.query;

    let query = {};

    // Si es propietario ve todas
    if (req.user.roleGlobal === 'propietario') {
      query = {}; // todas las notificaciones (concesión o generales)
    } else {
      // Socio / admin: solo sus concesiones + notificaciones generales
      const concessions = (req.user.concessions || []).map(c =>
        String(c._id ?? c)
      );

      if (concessions.length === 0) {
        // No tiene concesiones: solo generales
        query = { concession: null };
      } else {
        query = {
          $or: [
            { concession: { $in: concessions } }, // de sus minas
            { concession: null },                 // generales
          ],
        };
      }
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(Number(limit));

    res.json(notifications);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
}

// ---------------------------------------------------------------------
// CREAR NOTIFICACIÓN
// ---------------------------------------------------------------------
export async function createNotification(req, res) {
  try {
    if (!['propietario', 'admin'].includes(req.user.roleGlobal)) {
      return res.status(403).json({ error: 'Sin permisos para crear notificaciones' });
    }

    const { title, message, type = 'info', concession } = req.body;
    if (!title || !message) {
      return res.status(400).json({ error: 'title y message son requeridos' });
    }

    if (concession && !ensureConcessionAccess(req.user, concession)) {
      return res.status(403).json({ error: 'Sin acceso a la concesión indicada' });
    }

    const notification = await Notification.create({
      title,
      message,
      type,
      concession: concession || null, // null = general
    });

    res.status(201).json(notification);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// ---------------------------------------------------------------------
// MARCAR NOTIFICACIÓN COMO LEÍDA
// ---------------------------------------------------------------------
export async function markNotificationRead(req, res) {
  try {
    const { id } = req.params;
    const notification = await Notification.findById(id);
    if (!notification) {
      return res.status(404).json({ error: 'Notificación no encontrada' });
    }

    if (notification.concession && !ensureConcessionAccess(req.user, notification.concession)) {
      return res.status(403).json({ error: 'Sin acceso' });
    }

    notification.read = true;
    await notification.save();

    res.json({ message: 'Notificación leída', notification });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// ---------------------------------------------------------------------
// ELIMINAR NOTIFICACIÓN
// ---------------------------------------------------------------------
export async function deleteNotification(req, res) {
  try {
    // Solo propietario/admin pueden borrar
    if (!['propietario', 'admin'].includes(req.user.roleGlobal)) {
      return res.status(403).json({ error: 'Sin permisos para eliminar notificaciones' });
    }

    const { id } = req.params;
    const notification = await Notification.findById(id);
    if (!notification) {
      return res.status(404).json({ error: 'Notificación no encontrada' });
    }

    if (notification.concession && !ensureConcessionAccess(req.user, notification.concession)) {
      return res.status(403).json({ error: 'Sin acceso' });
    }

    await notification.deleteOne();
    res.json({ message: 'Notificación eliminada' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
