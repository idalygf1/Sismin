// sismim-api/src/controllers/expenses.controller.js
import Expense from '../models/Expense.js';
import mongoose from 'mongoose';
import { ensureConcessionAccess } from '../utils/access.js';

// ==============================
// Crear gasto (con o sin comprobante)
// ==============================
export const createExpense = async (req, res) => {
  try {
    // Asegurar usuario autenticado
    if (!req.user) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    const { category, amount, description, date, concession } = req.body;

    if (!concession) {
      return res.status(400).json({ error: 'concession requerido' });
    }

    // Verificar que el usuario tenga acceso a la concesión
    if (!ensureConcessionAccess(req.user, concession)) {
      return res.status(403).json({ error: 'Sin acceso a la concesión' });
    }

    // Comprobante OPCIONAL (Multer)
    const fileUrl = req.file?.path || null;

    const newExpense = await Expense.create({
      concession,
      category,
      amount,
      description,
      date,
      fileUrl,
      createdBy: req.user._id,
    });

    return res.status(201).json(newExpense);
  } catch (err) {
    console.error('Error al crear gasto:', err);
    return res
      .status(500)
      .json({ error: 'Error al crear gasto', details: err.message });
  }
};

// =====================================
// Listar gastos (filtrando por concesiones del usuario)
// =====================================
export const listExpenses = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    const { concession, from, to, category } = req.query;

    // Filtro base (soft delete)
    const filter = { deletedAt: null };

    // 🔹 Filtro por categoría
    if (category) {
      filter.category = category;
    }

    // 🔹 Filtros de fecha [from, to]
    if (from || to) {
      filter.date = {};
      if (from) filter.date.$gte = new Date(from);
      if (to) filter.date.$lte = new Date(to);
    }

    // 🔹 Filtrar por concesiones que el usuario puede ver
    if (concession) {
      // Si el front pide una concesión específica, validar acceso
      if (!ensureConcessionAccess(req.user, concession)) {
        return res.status(403).json({ error: 'Sin acceso a la concesión' });
      }
      filter.concession = concession;
    } else {
      // Si NO se manda ?concession=, limitamos por las concesiones del usuario
      if (req.user.roleGlobal !== 'propietario') {
        const allowed = (req.user.concessions || []).map((c) =>
          String(c._id ?? c)
        );

        // Si no tiene concesiones asignadas, no debe ver nada
        if (!allowed.length) {
          return res.json({ items: [], totalAmount: 0 });
        }

        filter.concession = { $in: allowed };
      }
      // Si es propietario, ve todas las concesiones (no agregamos filtro extra)
    }

    console.log('listExpenses filter:', JSON.stringify(filter, null, 2));
    console.log('req.user._id:', req.user._id);

    const expenses = await Expense.find(filter).sort({ date: -1 });

    console.log('listExpenses found:', expenses.length);

    const totalAmount = expenses.reduce(
      (sum, exp) => sum + Number(exp.amount || 0),
      0
    );

    return res.json({ items: expenses, totalAmount });
  } catch (err) {
    console.error('Error al listar gastos:', err);
    return res
      .status(500)
      .json({ error: 'Error al listar gastos', details: err.message });
  }
};

// ==============================
// Ver gasto por ID
// ==============================
export const getExpense = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

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

    return res.json(expense);
  } catch (err) {
    console.error('Error al obtener gasto:', err);
    return res
      .status(500)
      .json({ error: 'Error al obtener gasto', details: err.message });
  }
};

// ==============================
// Editar gasto
// ==============================
export const updateExpense = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    const { id } = req.params;
    const { category, amount, description, date } = req.body;

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

    if (category !== undefined) expense.category = category;
    if (amount !== undefined) expense.amount = amount;
    if (description !== undefined) expense.description = description;
    if (date !== undefined) expense.date = date;

    await expense.save();

    return res.json({ message: 'Gasto actualizado', expense });
  } catch (err) {
    console.error('Error al actualizar gasto:', err);
    return res
      .status(500)
      .json({ error: 'Error al actualizar gasto', details: err.message });
  }
};

// ==============================
// Eliminar gasto (soft delete)
// ==============================
export const deleteExpense = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

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

    expense.deletedAt = new Date();
    await expense.save();

    return res.json({ message: 'Gasto eliminado', expense });
  } catch (err) {
    console.error('Error al eliminar gasto:', err);
    return res
      .status(500)
      .json({ error: 'Error al eliminar gasto', details: err.message });
  }
};
