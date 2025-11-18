import Payroll from '../models/Payroll.js';
import Employee from '../models/Employee.js';
import mongoose from 'mongoose';
import { ensureConcessionAccess, resolveConcessionFilter } from '../utils/access.js';

async function getEmployeeIfAllowed(user, employeeId) {
  const employee = await Employee.findById(employeeId);
  if (!employee) return null;
  if (!ensureConcessionAccess(user, employee.concession)) return null;
  return employee;
}

// Crear pago de nómina
export const createPayroll = async (req, res) => {
  try {
    const { employee, amount, date, method, notes } = req.body;

    const employeeDoc = await getEmployeeIfAllowed(req.user, employee);
    if (!employeeDoc) {
      return res.status(403).json({ error: 'Empleado no disponible' });
    }

    const d = new Date(date);
    const week = d.getWeekNumber
      ? `W${d.getWeekNumber()}`
      : `W${Math.ceil(d.getDate() / 7)}`;

    const payroll = await Payroll.create({
      employee: employeeDoc._id,
      amount,
      date,
      method,
      week: `${d.getFullYear()}-${week}`,
      notes,
      createdBy: req.user._id,
    });

    res.status(201).json(payroll);
  } catch (err) {
    res
      .status(500)
      .json({ error: 'Error al crear pago', details: err.message });
  }
};

// Obtener pago por ID
export const getPayroll = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ error: 'ID inválido' });
    }

    const payroll = await Payroll.findById(id).populate('employee');

    if (!payroll || payroll.deletedAt) {
      return res.status(404).json({ error: 'Pago no encontrado' });
    }

    if (!ensureConcessionAccess(req.user, payroll.employee.concession)) {
      return res.status(403).json({ error: 'Sin acceso' });
    }

    res.json(payroll);
  } catch (err) {
    res
      .status(500)
      .json({ error: 'Error al obtener pago', details: err.message });
  }
};

// Listar pagos con filtros + total
export const listPayroll = async (req, res) => {
  try {
    const { employee, concession, from, to } = req.query;

    const query = { deletedAt: null };

    if (employee) {
      const employeeDoc = await getEmployeeIfAllowed(req.user, employee);
      if (!employeeDoc) {
        return res.status(403).json({ error: 'Empleado no disponible' });
      }
      query.employee = employeeDoc._id;
    } else {
      const { filter } = resolveConcessionFilter(req.user, concession);
      const employeeFilter = filter.concession ? { concession: filter.concession } : {};
      const employeeIds = await Employee.find(employeeFilter).distinct('_id');

      if (!employeeIds.length) {
        return res.json({ items: [], totalAmount: 0 });
      }

      query.employee = { $in: employeeIds };
    }

    if (from || to) {
      query.date = {};
      if (from) query.date.$gte = new Date(from);
      if (to) query.date.$lte = new Date(to);
    }

    const results = await Payroll.find(query)
      .sort({ date: -1 })
      .populate('employee', 'name');

    const totalAmount = results.reduce((sum, row) => sum + row.amount, 0);

    res.json({ items: results, totalAmount });
  } catch (err) {
    res
      .status(500)
      .json({ error: 'Error al listar pagos', details: err.message });
  }
};

// Editar pago
export const updatePayroll = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, date, method, notes } = req.body;

    const payroll = await Payroll.findById(id).populate('employee');

    if (!payroll || payroll.deletedAt) {
      return res.status(404).json({ error: 'Pago no encontrado' });
    }

    if (!ensureConcessionAccess(req.user, payroll.employee.concession)) {
      return res.status(403).json({ error: 'Sin acceso' });
    }

    if (amount !== undefined) payroll.amount = amount;
    if (date !== undefined) {
      const d = new Date(date);
      payroll.date = date;
      const week = d.getWeekNumber
        ? `W${d.getWeekNumber()}`
        : `W${Math.ceil(d.getDate() / 7)}`;
      payroll.week = `${d.getFullYear()}-${week}`;
    }
    if (method !== undefined) payroll.method = method;
    if (notes !== undefined) payroll.notes = notes;

    await payroll.save();

    res.json({ message: 'Pago actualizado', updated: payroll });
  } catch (err) {
    res
      .status(500)
      .json({ error: 'Error al actualizar pago', details: err.message });
  }
};

// Eliminar pago (soft delete)
export const deletePayroll = async (req, res) => {
  try {
    const { id } = req.params;

    const payroll = await Payroll.findById(id).populate('employee');

    if (!payroll || payroll.deletedAt) {
      return res.status(404).json({ error: 'Pago no encontrado' });
    }

    if (!ensureConcessionAccess(req.user, payroll.employee.concession)) {
      return res.status(403).json({ error: 'Sin acceso' });
    }

    payroll.deletedAt = new Date();
    await payroll.save();

    res.json({ message: 'Pago eliminado', deleted: payroll });
  } catch (err) {
    res
      .status(500)
      .json({ error: 'Error al eliminar pago', details: err.message });
  }
};
