// src/controllers/employees.controller.js
import Employee from '../models/Employee.js';

// ------------------------------------------------------
// Crear empleado
// ------------------------------------------------------
export async function createEmployee(req, res) {
  try {
    const { concession, name, curp, rfc, nss, puesto, salario, telefono } = req.body;

    if (!concession) {
      return res.status(400).json({ error: 'concession requerido' });
    }

    const emp = await Employee.create({
      concession,
      name,
      curp,
      rfc,
      nss,
      puesto,
      salario,
      telefono,
    });

    res.status(201).json(emp);
  } catch (e) {
    console.error('Error en createEmployee:', e);
    res.status(400).json({ error: e.message });
  }
}

// ------------------------------------------------------
// LISTA PRINCIPAL (para pantalla de Empleados)
// GET /employees?concession=...&search=...
// ------------------------------------------------------
export async function listEmployees(req, res) {
  try {
    const { concession, search } = req.query;

    if (!concession) {
      return res.status(400).json({ error: 'concession requerido' });
    }

    const q = { concession };

    if (search) {
      const regex = new RegExp(search, 'i');
      q.$or = [{ name: regex }, { telefono: regex }, { puesto: regex }];
    }

    const list = await Employee.find(q).sort({ name: 1 });
    res.json(list);
  } catch (e) {
    console.error('Error en listEmployees:', e);
    res.status(500).json({ error: e.message });
  }
}

// ------------------------------------------------------
// LISTA SIMPLE PARA DOCUMENTOS
// GET /employees/list
// No exige concession, solo regresa todos ordenados por nombre
// ------------------------------------------------------
export async function listEmployeesForDocs(req, res) {
  try {
    const employees = await Employee.find().sort({ name: 1 });
    // 👇 El frontend acepta array directo o {employees}
    res.json(employees);
  } catch (e) {
    console.error('Error en listEmployeesForDocs:', e);
    res.status(500).json({ error: e.message });
  }
}

// ------------------------------------------------------
// Obtener un empleado por id
// ------------------------------------------------------
export async function getEmployee(req, res) {
  try {
    const emp = await Employee.findById(req.params.id);
    if (!emp) {
      return res.status(404).json({ error: 'No encontrado' });
    }
    res.json(emp);
  } catch (e) {
    console.error('Error en getEmployee:', e);
    res.status(500).json({ error: e.message });
  }
}

// ------------------------------------------------------
// Actualizar empleado
// ------------------------------------------------------
export async function updateEmployee(req, res) {
  try {
    const emp = await Employee.findById(req.params.id);
    if (!emp) {
      return res.status(404).json({ error: 'No encontrado' });
    }

    const fields = [
      'name',
      'curp',
      'rfc',
      'nss',
      'puesto',
      'salario',
      'telefono',
      'estatus',
    ];

    fields.forEach((f) => {
      if (req.body[f] !== undefined) {
        emp[f] = req.body[f];
      }
    });

    await emp.save();
    res.json(emp);
  } catch (e) {
    console.error('Error en updateEmployee:', e);
    res.status(500).json({ error: e.message });
  }
}

// ------------------------------------------------------
// Eliminar empleado
// ------------------------------------------------------
export async function removeEmployee(req, res) {
  try {
    const emp = await Employee.findById(req.params.id);
    if (!emp) {
      return res.status(404).json({ error: 'No encontrado' });
    }

    await emp.deleteOne();
    res.json({ message: 'Empleado eliminado' });
  } catch (e) {
    console.error('Error en removeEmployee:', e);
    res.status(500).json({ error: e.message });
  }
}
