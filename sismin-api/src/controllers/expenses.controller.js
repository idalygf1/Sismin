import Expense from '../models/Expense.js';
import mongoose from 'mongoose';

// Crear gasto con comprobante
export const createExpense = async (req, res) => {
  try {
    const { category, amount, description, date, concession } = req.body;

    if (!req.file?.path) return res.status(400).json({ error: 'Comprobante requerido' });

    const newExpense = await Expense.create({
      concession,
      category,
      amount,
      description,
      date,
      fileUrl: req.file.path,
      createdBy: req.user._id
    });

    res.status(201).json(newExpense);
  } catch (err) {
    res.status(500).json({ error: 'Error al crear gasto', details: err.message });
  }
};

// Listar gastos con filtros
export const listExpenses = async (req, res) => {
  try {
    const { concession, from, to, category } = req.query;
    const query = { deletedAt: null };

    if (concession) query.concession = concession;
    if (category) query.category = category;
    if (from || to) {
      query.date = {};
      if (from) query.date.$gte = new Date(from);
      if (to) query.date.$lte = new Date(to);
    }

    const expenses = await Expense.find(query).sort({ date: -1 });
    res.json(expenses);
  } catch (err) {
    res.status(500).json({ error: 'Error al listar gastos', details: err.message });
  }
};

// Ver gasto por ID
export const getExpense = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ error: 'ID inválido' });

    const expense = await Expense.findById(id);
    if (!expense || expense.deletedAt) return res.status(404).json({ error: 'Gasto no encontrado' });

    res.json(expense);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener gasto', details: err.message });
  }
};

// Editar gasto
export const updateExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const { category, amount, description, date } = req.body;

    const update = {};
    if (category) update.category = category;
    if (amount) update.amount = amount;
    if (description) update.description = description;
    if (date) update.date = date;

    const expense = await Expense.findByIdAndUpdate(id, update, { new: true });

    if (!expense) return res.status(404).json({ error: 'Gasto no encontrado' });

    res.json({ message: 'Gasto actualizado', expense });
  } catch (err) {
    res.status(500).json({ error: 'Error al actualizar gasto', details: err.message });
  }
};

// Eliminar gasto (soft delete)
export const deleteExpense = async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await Expense.findByIdAndUpdate(id, { deletedAt: new Date() }, { new: true });

    if (!deleted) return res.status(404).json({ error: 'Gasto no encontrado' });

    res.json({ message: 'Gasto eliminado', expense: deleted });
  } catch (err) {
    res.status(500).json({ error: 'Error al eliminar gasto', details: err.message });
  }
};
