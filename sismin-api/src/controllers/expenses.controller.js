import Expense from '../models/Expense.js';
import mongoose from 'mongoose';
import { ensureConcessionAccess, resolveConcessionFilter } from '../utils/access.js';

// Crear gasto con comprobante
export const createExpense = async (req, res) => {
  try {
    const { category, amount, description, date, concession } = req.body;

    if (!concession) {
      return res.status(400).json({ error: 'concession requerido' });
    }

    if (!ensureConcessionAccess(req.user, concession)) {
      return res.status(403).json({ error: 'Sin acceso a la concesión' });
    }

    if (!req.file?.path) {
      return res.status(400).json({ error: 'Comprobante requerido' });
    }

    const newExpense = await Expense.create({
      concession,
      category,
      amount,
      description,
      date,
      fileUrl: req.file.path,
      createdBy: req.user._id,
    });

    res.status(201).json(newExpense);
  } catch (err) {
    res
      .status(500)
      .json({ error: 'Error al crear gasto', details: err.message });
  }
};

// Listar gastos con filtros + total
export const listExpenses = async (req, res) => {
  try {
    const { concession, from, to, category } = req.query;

    // base: no eliminados
    let query = { deletedAt: null };

    // filtro por concesión según el usuario
    const { filter } = resolveConcessionFilter(req.user, concession);
    query = { ...query, ...filter };

    if (concession) query.concession = concession;
    if (category) query.category = category;

    if (from || to) {
      query.date = {};
      if (from) query.date.$gte = new Date(from);
      if (to) query.date.$lte = new Date(to);
    }

    const expenses = await Expense.find(query).sort({ date: -1 });
    const totalAmount = expenses.reduce((sum, exp) => sum + exp.amount, 0);

    res.json({ items: expenses, totalAmount });
  } catch (err) {
    res
      .status(500)
      .json({ error: 'Error al listar gastos', details: err.message });
  }
};

// Ver gasto por ID
export const getExpense = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ error: 'ID inválido' });
    }

    const expense = await Expense.findById(id);

    if (!expense || expense.deletedAt) {
      return res.status(404).json({ error: 'Gasto no encontrado' });
    }

    if (!ensureConcessionAccess(req.user, expense.concession)) {
      return res.status(403).json({ error: 'Sin acceso' });
    }

    res.json(expense);
  } catch (err) {
    res
      .status(500)
      .json({ error: 'Error al obtener gasto', details: err.message });
  }
};

// Editar gasto
export const updateExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const { category, amount, description, date } = req.body;

    const expense = await Expense.findById(id);

    if (!expense || expense.deletedAt) {
      return res.status(404).json({ error: 'Gasto no encontrado' });
    }

    if (!ensureConcessionAccess(req.user, expense.concession)) {
      return res.status(403).json({ error: 'Sin acceso' });
    }

    if (category !== undefined) expense.category = category;
    if (amount !== undefined) expense.amount = amount;
    if (description !== undefined) expense.description = description;
    if (date !== undefined) expense.date = date;

    await expense.save();

    res.json({ message: 'Gasto actualizado', expense });
  } catch (err) {
    res
      .status(500)
      .json({ error: 'Error al actualizar gasto', details: err.message });
  }
};

// Eliminar gasto (soft delete)
export const deleteExpense = async (req, res) => {
  try {
    const { id } = req.params;

    const expense = await Expense.findById(id);

    if (!expense || expense.deletedAt) {
      return res.status(404).json({ error: 'Gasto no encontrado' });
    }

    if (!ensureConcessionAccess(req.user, expense.concession)) {
      return res.status(403).json({ error: 'Sin acceso' });
    }

    expense.deletedAt = new Date();
    await expense.save();

    res.json({ message: 'Gasto eliminado', expense });
  } catch (err) {
    res
      .status(500)
      .json({ error: 'Error al eliminar gasto', details: err.message });
  }
};
