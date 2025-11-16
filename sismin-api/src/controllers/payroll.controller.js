import Payroll from '../models/Payroll.js';
import mongoose from 'mongoose';

// Crear pago
export const createPayroll = async (req, res) => {
  try {
    const { employee, amount, date, method, notes } = req.body;
    const week = `W${new Date(date).getWeekNumber()}`;

    const payroll = await Payroll.create({
      employee,
      amount,
      date,
      method,
      week: `${new Date(date).getFullYear()}-${week}`,
      notes,
      createdBy: req.user._id
    });

    res.status(201).json(payroll);
  } catch (err) {
    res.status(500).json({ error: 'Error al crear pago', details: err.message });
  }
};

// Obtener por ID
export const getPayroll = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ error: 'ID inválido' });

    const payroll = await Payroll.findById(id);
    if (!payroll || payroll.deletedAt) return res.status(404).json({ error: 'Pago no encontrado' });

    res.json(payroll);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener pago', details: err.message });
  }
};

// Listar con filtros
export const listPayroll = async (req, res) => {
  try {
    const { employee, from, to } = req.query;
    const query = { deletedAt: null };

    if (employee) query.employee = employee;
    if (from || to) {
      query.date = {};
      if (from) query.date.$gte = new Date(from);
      if (to) query.date.$lte = new Date(to);
    }

    const results = await Payroll.find(query).sort({ date: -1 });
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: 'Error al listar pagos', details: err.message });
  }
};

// Editar
export const updatePayroll = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, date, method, notes } = req.body;

    const update = {};
    if (amount) update.amount = amount;
    if (date) {
      update.date = date;
      update.week = `${new Date(date).getFullYear()}-W${new Date(date).getWeekNumber()}`;
    }
    if (method) update.method = method;
    if (notes) update.notes = notes;

    const updated = await Payroll.findByIdAndUpdate(id, update, { new: true });
    if (!updated) return res.status(404).json({ error: 'Pago no encontrado' });

    res.json({ message: 'Pago actualizado', updated });
  } catch (err) {
    res.status(500).json({ error: 'Error al actualizar pago', details: err.message });
  }
};

// Eliminar (soft)
export const deletePayroll = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Payroll.findByIdAndUpdate(id, { deletedAt: new Date() }, { new: true });

    if (!deleted) return res.status(404).json({ error: 'Pago no encontrado' });

    res.json({ message: 'Pago eliminado', deleted });
  } catch (err) {
    res.status(500).json({ error: 'Error al eliminar pago', details: err.message });
  }
};
