// src/controllers/simpledocs.controller.js
import SimpleDoc from '../models/SimpleDoc.js';
import Notification from '../models/Notification.js';
import { ensureConcessionAccess } from '../utils/access.js';

/**
 * GET /api/simpledocs
 * Lista documentos filtrados por concesión del usuario
 */
export async function listSimpleDocs(req, res) {
  try {
    const { concession } = req.query;

    let query = {};

    // 🔹 Propietario: puede ver todas las concesiones
    if (req.user.roleGlobal === 'propietario') {
      if (concession) {
        query = { concession };             // solo una concesión específica
      } else {
        query = {};                         // todas
      }
    } else {
      // 🔹 Socios / admin: solo sus concesiones
      const userConcessions = (req.user.concessions || []).map((c) =>
        String(c._id ?? c)
      );

      if (userConcessions.length === 0) {
        // no tiene concesiones → no ve nada
        return res.json([]);
      }

      if (concession) {
        // si viene una concesión por query, validamos que sea suya
        if (!userConcessions.includes(String(concession))) {
          return res.json([]); // o 403 si prefieres
        }
        query = { concession };
      } else {
        // si no viene concesión, traemos las de TODAS sus concesiones
        query = { concession: { $in: userConcessions } };
      }
    }

    const docs = await SimpleDoc.find(query).sort({ createdAt: -1 });
    res.json(docs);
  } catch (err) {
    console.error('Error en listSimpleDocs:', err);
    res.status(500).json({ error: err.message });
  }
}

/**
 * POST /api/simpledocs
 * Crea documento simple + notificación ligada a la concesión
 */
export async function createSimpleDoc(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Archivo requerido' });
    }

    const { title, dueDate, concession } = req.body;

    if (!concession) {
      return res.status(400).json({ error: 'concession es requerida' });
    }

    // validar que el usuario tenga acceso a esa concesión
    if (!ensureConcessionAccess(req.user, concession)) {
      return res.status(403).json({ error: 'Sin acceso a la concesión indicada' });
    }

    const newDoc = await SimpleDoc.create({
      title,
      dueDate: dueDate || null,
      fileUrl: `/uploads/${req.file.filename}`,
      fileName: req.file.originalname,
      concession, // 👈 ahora el documento pertenece a una concesión
    });

    // ------------------------------------------------------------------
    // 🔔 Crear notificación SI hay fecha de vencimiento
    // ------------------------------------------------------------------
    if (dueDate) {
      try {
        const msg = `El documento "${title || 'sin título'}" vence el ${dueDate}.`;

        await Notification.create({
          title: 'Vencimiento de documento',
          message: msg,
          type: 'document',
          concession, // 👈 AHORA SOLO LA VEN LOS DE ESA CONCESIÓN
        });
      } catch (notifErr) {
        console.error('Error creando notificación de documento:', notifErr);
        // no rompemos la creación del doc si falla la noti
      }
    }

    res.status(201).json(newDoc);
  } catch (err) {
    console.error('Error en createSimpleDoc:', err);
    res.status(500).json({ error: err.message });
  }
}

/**
 * DELETE /api/simpledocs/:id
 * Elimina documento (sin cambiar nada más)
 */
export async function deleteSimpleDoc(req, res) {
  try {
    const { id } = req.params;
    await SimpleDoc.findByIdAndDelete(id);
    res.json({ message: 'Documento eliminado' });
  } catch (err) {
    console.error('Error en deleteSimpleDoc:', err);
    res.status(500).json({ error: err.message });
  }
}
