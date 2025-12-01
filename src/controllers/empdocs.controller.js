// src/controllers/empdocs.controller.js
import EmployeeDoc from '../models/EmployeeDoc.js';
import Notification from '../models/Notification.js';
import Employee from '../models/Employee.js';
import { ensureConcessionAccess } from '../utils/access.js';

// ===================================================
// SUBIR DOCUMENTO (Empleado o General)  [POST /empdocs]
// ===================================================
export async function uploadDoc(req, res) {
  try {
    // console.log('BODY uploadDoc:', req.body);
    // console.log('FILE uploadDoc:', req.file);

    const notes = (req.body.notes || '').trim();
    const scope = (req.body.scope || 'empresa').trim().toLowerCase();

    const rawCategory = (req.body.category || req.body.type || 'Otro').trim();
    const subcategory = (req.body.subcategory || '').trim();

    const dueDateRaw = (req.body.dueDate || '').trim();
    const employeeIdBody = req.body.employee || null;
    const concessionBody = req.body.concession || null;

    if (!rawCategory) {
      return res.status(400).json({ error: 'La categoría es requerida' });
    }

    // -----------------------------
    // Resolver empleado (opcional)
    // -----------------------------
    let employeeId = null;
    let employeeDoc = null;
    let isGlobal = true;

    if (
      employeeIdBody &&
      employeeIdBody !== 'null' &&
      employeeIdBody !== 'undefined'
    ) {
      employeeDoc = await Employee.findById(employeeIdBody);
      if (!employeeDoc) {
        return res.status(404).json({ error: 'Empleado no encontrado' });
      }
      employeeId = employeeDoc._id;
      isGlobal = false;

      if (!ensureConcessionAccess(req.user, employeeDoc.concession)) {
        return res.status(403).json({ error: 'Sin acceso a la concesión' });
      }
    }

    // -----------------------------
    // Resolver concesión a usar
    // -----------------------------
    let concessionId =
      concessionBody ||
      req.user?.mainConcession ||
      (req.user?.concessions?.[0]?._id || req.user?.concessions?.[0]) ||
      (employeeDoc ? employeeDoc.concession : null);

    if (!concessionId) {
      return res.status(400).json({
        error: 'No se pudo determinar la concesión del documento',
      });
    }

    // -----------------------------
    // Validar archivo
    // -----------------------------
    if (!req.file) {
      return res.status(400).json({ error: 'El archivo es requerido' });
    }

    const fileUrl = req.file.location || req.file.path || '';
    const fileName =
      req.file.originalname || req.file.filename || 'documento';

    // -----------------------------
    // Crear documento
    // -----------------------------
    const doc = await EmployeeDoc.create({
      notes,
      scope,
      employee: employeeId, // null si es global
      isGlobal,
      category: rawCategory,
      subcategory,
      dueDate: dueDateRaw ? new Date(dueDateRaw) : null,
      fileUrl,
      fileName,
      concession: concessionId,
      createdBy: req.user._id,
    });

    // 📌 Crear notificación si hay fecha límite (sin definir type para evitar enum)
    if (dueDateRaw) {
      await Notification.create({
        title: 'Documento próximo a vencer',
        message: `El documento "${notes || rawCategory}" vence el ${new Date(
          dueDateRaw
        ).toLocaleDateString('es-MX')}`,
        concession: concessionId,
      });
    }

    return res.status(201).json(doc);
  } catch (err) {
    console.error('Error en uploadDoc:', err);
    return res.status(500).json({ error: err.message });
  }
}

// ===================================================
// ACTUALIZAR DOCUMENTO  [PUT /empdocs/:id]
// (solo actualiza metadatos y archivo si se envía uno nuevo)
// ===================================================
export async function updateDoc(req, res) {
  try {
    const { id } = req.params;

    const doc = await EmployeeDoc.findById(id);
    if (!doc || doc.deletedAt) {
      return res.status(404).json({ error: 'Documento no encontrado' });
    }

    // Verificar acceso por concesión
    if (!ensureConcessionAccess(req.user, doc.concession)) {
      return res.status(403).json({ error: 'Sin acceso a la concesión' });
    }

    const notes = (req.body.notes || '').trim();
    const scope = (req.body.scope || doc.scope || 'empresa')
      .trim()
      .toLowerCase();
    const rawCategory = (
      req.body.category ||
      req.body.type ||
      doc.category
    ).trim();
    const subcategory = (req.body.subcategory || '').trim();
    const dueDateRaw = (req.body.dueDate || '').trim();

    const updateData = {
      notes,
      scope,
      category: rawCategory,
      subcategory,
      dueDate: dueDateRaw ? new Date(dueDateRaw) : null,
      // NO tocamos createdBy, concession, employee ni isGlobal
    };

    // Si viene un archivo nuevo, lo sustituimos
    if (req.file) {
      const fileUrl = req.file.location || req.file.path || '';
      const fileName =
        req.file.originalname || req.file.filename || 'documento';

      updateData.fileUrl = fileUrl;
      updateData.fileName = fileName;
    }

    const updated = await EmployeeDoc.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!updated) {
      return res.status(404).json({ error: 'Documento no encontrado' });
    }

    return res.json(updated);
  } catch (err) {
    console.error('Error en updateDoc:', err);
    return res.status(500).json({ error: err.message });
  }
}

// ===================================================
// LISTAR DOCUMENTOS  [GET /empdocs]
// ===================================================
export async function listDocs(req, res) {
  try {
    const { includeGlobal = 'false' } = req.query;

    const includeGlobalBool =
      includeGlobal === true ||
      includeGlobal === 'true' ||
      includeGlobal === 1 ||
      includeGlobal === '1';

    const docs = await EmployeeDoc.find({
      deletedAt: null,
    }).populate('employee', 'name concession');

    // Filtrado según permisos
    const visibleDocs = docs.filter((doc) => {
      // Documentos globales (sin empleado)
      if (!doc.employee) {
        return includeGlobalBool;
      }

      const concessionId = doc.employee.concession || doc.concession;
      if (!concessionId) return false;

      return ensureConcessionAccess(req.user, concessionId);
    });

    return res.json(visibleDocs);
  } catch (err) {
    console.error('Error en listDocs:', err);
    return res.status(500).json({ error: err.message });
  }
}

// ===================================================
// ELIMINAR DOCUMENTO (soft delete)  [DELETE /empdocs/:id]
// ===================================================
export async function deleteDoc(req, res) {
  try {
    const { id } = req.params;

    const doc = await EmployeeDoc.findById(id);
    if (!doc || doc.deletedAt) {
      return res.status(404).json({ error: 'Documento no encontrado' });
    }

    if (!ensureConcessionAccess(req.user, doc.concession)) {
      return res.status(403).json({ error: 'Sin acceso a la concesión' });
    }

    doc.deletedAt = new Date();
    await doc.save();

    return res.json({ message: 'Documento eliminado' });
  } catch (err) {
    console.error('Error en deleteDoc:', err);
    return res.status(500).json({ error: err.message });
  }
}
