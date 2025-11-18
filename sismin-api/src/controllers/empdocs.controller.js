// sismin-api/src/controllers/empdocs.controller.js
import mongoose from 'mongoose';
import EmployeeDoc from '../models/EmployeeDoc.js';

// Crear documento de empleado
export async function addDoc(req, res) {
  try {
    const { employee, type, concession, expiresAt, notes } = req.body;

    const doc = await EmployeeDoc.create({
      employee,
      type,
      concession,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      notes,
      fileUrl: req.file?.path || null,
    });

    res.status(201).json(doc);
  } catch (err) {
    res.status(500).json({
      error: 'Error al crear documento',
      details: err.message,
    });
  }
}

// Listar documentos (con filtros opcionales)
export async function listDocs(req, res) {
  try {
    const { employee, concession } = req.query;
    const query = {};

    if (employee) query.employee = employee;
    if (concession) query.concession = concession;

    const docs = await EmployeeDoc.find(query).sort({ createdAt: -1 });
    res.json(docs);
  } catch (err) {
    res.status(500).json({
      error: 'Error al listar documentos',
      details: err.message,
    });
  }
}

// Documentos que vencen en <= N días
export async function expiringDocs(req, res) {
  try {
    const days = Number(req.query.days || 30);
    const limit = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

    const docs = await EmployeeDoc.find({
      expiresAt: { $ne: null, $lte: limit },
    }).sort({ expiresAt: 1 });

    res.json(docs);
  } catch (err) {
    res.status(500).json({
      error: 'Error al obtener documentos por vencer',
      details: err.message,
    });
  }
}

// Obtener un documento por ID
export async function getDoc(req, res) {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ error: 'ID inválido' });
    }

    const doc = await EmployeeDoc.findById(id);
    if (!doc) {
      return res.status(404).json({ error: 'Documento no encontrado' });
    }

    res.json(doc);
  } catch (err) {
    res.status(500).json({
      error: 'Error al obtener documento',
      details: err.message,
    });
  }
}

// Actualizar documento
export async function updateDoc(req, res) {
  try {
    const { id } = req.params;
    const { employee, type, concession, expiresAt, notes } = req.body;

    const update = {};
    if (employee) update.employee = employee;
    if (type) update.type = type;
    if (concession) update.concession = concession;
    if (expiresAt) update.expiresAt = new Date(expiresAt);
    if (notes) update.notes = notes;
    if (req.file?.path) update.fileUrl = req.file.path;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ error: 'ID inválido' });
    }

    const updated = await EmployeeDoc.findByIdAndUpdate(id, update, {
      new: true,
    });

    if (!updated) {
      return res.status(404).json({ error: 'Documento no encontrado' });
    }

    res.json({
      message: 'Documento actualizado',
      updated,
    });
  } catch (err) {
    res.status(500).json({
      error: 'Error al actualizar documento',
      details: err.message,
    });
  }
}

// Eliminar documento
export async function deleteDoc(req, res) {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ error: 'ID inválido' });
    }

    const deleted = await EmployeeDoc.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ error: 'Documento no encontrado' });
    }

    res.json({
      message: 'Documento eliminado',
      deleted,
    });
  } catch (err) {
    res.status(500).json({
      error: 'Error al eliminar documento',
      details: err.message,
    });
  }
}
