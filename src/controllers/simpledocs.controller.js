// src/controllers/simpledocs.controller.js
import SimpleDoc from '../models/SimpleDoc.js';
import Notification from '../models/Notification.js';

/**
 * GET /api/simpledocs
 * Lista simple de documentos
 */
export async function listSimpleDocs(req, res) {
  try {
    const docs = await SimpleDoc.find().sort({ createdAt: -1 });
    res.json(docs);
  } catch (err) {
    console.error('Error en listSimpleDocs:', err);
    res.status(500).json({ error: err.message });
  }
}

/**
 * POST /api/simpledocs
 * Crea documento simple + (OPCIONAL) notificación si hay fecha de vencimiento
 */
export async function createSimpleDoc(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Archivo requerido' });
    }

    const { title, dueDate } = req.body;

    const newDoc = await SimpleDoc.create({
      title,
      dueDate: dueDate || null,
      fileUrl: `/uploads/${req.file.filename}`,
      fileName: req.file.originalname,
    });

    // ------------------------------------------------------------------
    // 🔔 Crear notificación si se mandó fecha de vencimiento
    // ------------------------------------------------------------------
    if (dueDate) {
      try {
        // Mensaje sencillo, tú luego lo maquillas en el front
        const msg = `El documento "${title || 'sin título'}" vence el ${dueDate}.`;

        await Notification.create({
          title: `Vencimiento de documento`,
          message: msg,
          type: 'document',   // ya está en tu enum
          concession: null,   // notificación general (la ven todas tus concesiones)
        });
      } catch (notifErr) {
        // NO rompemos la creación del doc si falla la noti
        console.error('Error creando notificación de documento:', notifErr);
      }
    }
    // ------------------------------------------------------------------

    res.status(201).json(newDoc);
  } catch (err) {
    console.error('Error en createSimpleDoc:', err);
    res.status(500).json({ error: err.message });
  }
}

/**
 * DELETE /api/simpledocs/:id
 * Elimina documento
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
