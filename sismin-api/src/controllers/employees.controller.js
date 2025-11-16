import Employee from '../models/Employee.js';

/** Verifica acceso del usuario a la concesión (propietario = full) */
function canAccess(user, concessionId) {
  if (user.roleGlobal === 'propietario') return true;
  return (user.concessions || []).some(c => String(c._id ?? c) === String(concessionId));
}

export async function createEmployee(req, res) {
  try {
    const { concession, name, curp, rfc, nss, puesto, salario, telefono } = req.body;
    if (!canAccess(req.user, concession)) return res.status(403).json({ error: 'Sin acceso a la concesión' });
    const emp = await Employee.create({ concession, name, curp, rfc, nss, puesto, salario, telefono });
    res.status(201).json(emp);
  } catch (e) { res.status(400).json({ error: e.message }); }
}

export async function listEmployees(req, res) {
  try {
    const { concession } = req.query;
    if (!concession) return res.status(400).json({ error: 'concession requerido' });
    if (!canAccess(req.user, concession)) return res.status(403).json({ error: 'Sin acceso' });

    const q = { concession };
    const list = await Employee.find(q).sort({ name: 1 });
    res.json(list);
  } catch (e) { res.status(500).json({ error: e.message }); }
}

export async function getEmployee(req, res) {
  const emp = await Employee.findById(req.params.id);
  if (!emp) return res.status(404).json({ error: 'No encontrado' });
  if (!canAccess(req.user, emp.concession)) return res.status(403).json({ error: 'Sin acceso' });
  res.json(emp);
}

export async function updateEmployee(req, res) {
  const emp = await Employee.findById(req.params.id);
  if (!emp) return res.status(404).json({ error: 'No encontrado' });
  if (!canAccess(req.user, emp.concession)) return res.status(403).json({ error: 'Sin acceso' });

  const fields = ['name','curp','rfc','nss','puesto','salario','telefono','estatus'];
  fields.forEach(f => { if (req.body[f] !== undefined) emp[f] = req.body[f]; });
  await emp.save();
  res.json(emp);
}

export async function removeEmployee(req, res) {
  const emp = await Employee.findById(req.params.id);
  if (!emp) return res.status(404).json({ error: 'No encontrado' });
  if (!canAccess(req.user, emp.concession)) return res.status(403).json({ error: 'Sin acceso' });
  await emp.deleteOne();
  res.json({ ok: true });
}
