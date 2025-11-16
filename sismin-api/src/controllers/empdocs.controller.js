import Employee from '../models/Employee.js';
import EmployeeDoc from '../models/EmployeeDoc.js';

function canAccess(user, concessionId) {
  if (user.roleGlobal === 'propietario') return true;
  return (user.concessions || []).some(c => String(c._id ?? c) === String(concessionId));
}

export async function addDoc(req, res) {
  const { id } = req.params;                    // employee id
  const emp = await Employee.findById(id);
  if (!emp) return res.status(404).json({ error: 'Empleado no encontrado' });
  if (!canAccess(req.user, emp.concession)) return res.status(403).json({ error: 'Sin acceso' });

  const { type, expiresAt, notes } = req.body;
  if (!req.file?.path) return res.status(400).json({ error: 'Archivo requerido' });

  const doc = await EmployeeDoc.create({
    employee: id,
    type,
    url: req.file.path,
    expiresAt: expiresAt ? new Date(expiresAt) : undefined,
    notes
  });
  res.status(201).json(doc);
}

export async function listDocs(req, res) {
  const { id } = req.params; // employee id
  const emp = await Employee.findById(id);
  if (!emp) return res.status(404).json({ error: 'Empleado no encontrado' });
  if (!canAccess(req.user, emp.concession)) return res.status(403).json({ error: 'Sin acceso' });

  const docs = await EmployeeDoc.find({ employee: id }).sort({ createdAt: -1 });
  res.json(docs);
}

export async function expiringDocs(req, res) {
  // documentos que vencen en <= N días
  const days = Number(req.query.days || 30);
  const limit = new Date(Date.now() + days*24*60*60*1000);

  const pipeline = [
    { $match: { expiresAt: { $ne: null, $lte: limit } } },
    { $lookup: { from: 'employees', localField: 'employee', foreignField: '_id', as: 'emp' } },
    { $unwind: '$emp' },
  ];

  // Filtrar por concesión a la que tengo acceso (si no soy propietario)
  if (req.user.roleGlobal !== 'propietario') {
    const ids = (req.user.concessions || []).map(c => c._id);
    pipeline.push({ $match: { 'emp.concession': { $in: ids } } });
  }

  pipeline.push({ $project: { type:1, url:1, expiresAt:1, 'emp.name':1, 'emp.concession':1 } });

  const docs = await EmployeeDoc.aggregate(pipeline);
  res.json(docs);
}

export async function deleteDoc(req, res) {
  try {
    const { docId } = req.params;

    const deleted = await EmployeeDoc.findByIdAndDelete(docId);
    if (!deleted) return res.status(404).json({ error: 'Documento no encontrado' });

    res.json({ message: 'Documento eliminado correctamente' });
  } catch (err) {
    res.status(500).json({ error: 'Error al eliminar documento', details: err.message });
  }
}

export async function updateDoc(req, res) {
  try {
    const { docId } = req.params;
    const { expiresAt, notes } = req.body;

    const update = {};
    if (expiresAt) update.expiresAt = new Date(expiresAt);
    if (notes) update.notes = notes;

    const updated = await EmployeeDoc.findByIdAndUpdate(docId, update, { new: true });

    if (!updated) return res.status(404).json({ error: 'Documento no encontrado' });

    res.json({ message: 'Documento actualizado', updated });
  } catch (err) {
    res.status(500).json({ error: 'Error al actualizar documento', details: err.message });
  }
}
