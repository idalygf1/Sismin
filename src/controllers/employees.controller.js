// src/controllers/employees.controller.js
import Employee from '../models/Employee.js';

/**
 * NOTA:
 * Por ahora NO se valida el acceso por concesión
 * para que puedas conectar el backend con el front sin errores 403.
 * Cuando ya tengas todo, podemos reactivar la validación.
 */

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
      telefono
    });

    res.status(201).json(emp);
  } catch (e) {
    console.error('Error en createEmployee:', e);
    res.status(400).json({ error: e.message });
  }
}

export async function listEmployees(req, res) {
  try {
    const { concession, search } = req.query;

    if (!concession) {
      return res.status(400).json({ error: 'concession requerido' });
    }

    const q = { concession };

    if (search) {
      const regex = new RegExp(search, 'i');
      q.$or = [
        { name: regex },
        { telefono: regex },
        { puesto: regex },
      ];
    }

    const list = await Employee.find(q).sort({ name: 1 });
    res.json(list);
  } catch (e) {
    console.error('Error en listEmployees:', e);
    res.status(500).json({ error: e.message });
  }
}

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

    fields.forEach(f => {
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
