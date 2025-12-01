// src/controllers/payroll.controller.js
import Payroll from '../models/Payroll.js';
import Employee from '../models/Employee.js';
import mongoose from 'mongoose';
import { ensureConcessionAccess } from '../utils/access.js';
import { getPayerForDate } from '../utils/payrollRotation.js';

// -----------------------------------------------------
// Helper: obtiene empleado solo si el usuario tiene acceso
// -----------------------------------------------------
async function getEmployeeIfAllowed(user, employeeId) {
  const employee = await Employee.findById(employeeId);
  if (!employee) return null;
  if (!ensureConcessionAccess(user, employee.concession)) return null;
  return employee;
}

// -----------------------------------------------------
// Crear pago de nómina
// -----------------------------------------------------
export const createPayroll = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    const { employee, amount, date, method, notes } = req.body;

    const employeeDoc = await getEmployeeIfAllowed(req.user, employee);
    if (!employeeDoc) {
      return res.status(403).json({ error: 'Empleado no disponible' });
    }

    const d = new Date(date);
    if (isNaN(d.getTime())) {
      return res.status(400).json({ error: 'Fecha inválida' });
    }

    const weekNumber = d.getWeekNumber
      ? `W${d.getWeekNumber()}`
      : `W${Math.ceil(d.getDate() / 7)}`;

    const payroll = await Payroll.create({
      employee: employeeDoc._id,
      // este campo existe en el modelo, pero NO lo usamos para filtrar la lista
      concession: employeeDoc.concession,
      amount,
      date: d,
      method,
      week: `${d.getFullYear()}-${weekNumber}`,
      notes,
      createdBy: req.user._id,
    });

    res.status(201).json(payroll);
  } catch (err) {
    console.error('Error al crear pago:', err);
    res
      .status(500)
      .json({ error: 'Error al crear pago', details: err.message });
  }
};

// -----------------------------------------------------
// Obtener pago por ID
// -----------------------------------------------------
export const getPayroll = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ error: 'ID inválido' });
    }

    const payroll = await Payroll.findById(id).populate('employee');

    if (!payroll || payroll.deletedAt) {
      return res.status(404).json({ error: 'Pago no encontrado' });
    }

    // verificamos acceso a la concesión del empleado
    if (!ensureConcessionAccess(req.user, payroll.employee.concession)) {
      return res.status(403).json({ error: 'Sin acceso' });
    }

    res.json(payroll);
  } catch (err) {
    console.error('Error al obtener pago:', err);
    res
      .status(500)
      .json({ error: 'Error al obtener pago', details: err.message });
  }
};

// -----------------------------------------------------
// Listar pagos con filtros + total
// 🔴 AQUÍ ESTABA EL PROBLEMA
// Ahora filtramos por Employee.concession, NO por Payroll.concession
// -----------------------------------------------------
export const listPayroll = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    const { employee, concession, from, to } = req.query;

    const query = { deletedAt: null };

    // -----------------------------
    // 1) Determinar qué empleados entran
    // -----------------------------
    let employeeIds = [];

    if (employee) {
      // Filtro directo por empleado (si viene en query)
      const emp = await Employee.findById(employee);
      if (!emp) {
        return res.json({ items: [], totalAmount: 0 });
      }
      if (!ensureConcessionAccess(req.user, emp.concession)) {
        return res.status(403).json({ error: 'Empleado no disponible' });
      }
      employeeIds = [emp._id];
    } else {
      // Filtro por concesiones permitidas
      let allowedConcessions = null;

      // Si es propietario:
      if (req.user.roleGlobal === 'propietario') {
        // Si viene ?concession, filtramos solo esa
        if (concession) {
          allowedConcessions = [String(concession)];
        } else {
          // null => todas
          allowedConcessions = null;
        }
      } else {
        // No propietario: solo las concesiones que tenga asignadas
        const userCons = (req.user.concessions || []).map((c) =>
          String(c._id ?? c)
        );

        if (!userCons.length) {
          return res.json({ items: [], totalAmount: 0 });
        }

        if (concession) {
          if (!userCons.includes(String(concession))) {
            return res
              .status(403)
              .json({ error: 'Sin acceso a la concesión indicada' });
          }
          allowedConcessions = [String(concession)];
        } else {
          allowedConcessions = userCons;
        }
      }

      const employeeFilter = {};
      if (allowedConcessions && allowedConcessions.length) {
        employeeFilter.concession = { $in: allowedConcessions };
      }
      // Si allowedConcessions es null (propietario sin filtro),
      // employeeFilter queda {} => todos los empleados.

      employeeIds = await Employee.find(employeeFilter).distinct('_id');

      if (!employeeIds.length) {
        return res.json({ items: [], totalAmount: 0 });
      }
    }

    // Aplicamos los empleados al query de nómina
    if (employeeIds.length === 1) {
      query.employee = employeeIds[0];
    } else {
      query.employee = { $in: employeeIds };
    }

    // -----------------------------
    // 2) Filtros de fecha
    // -----------------------------
    if (from || to) {
      query.date = {};
      if (from) query.date.$gte = new Date(from);
      if (to) query.date.$lte = new Date(to);
    }

    // -----------------------------
    // 3) Ejecutar búsqueda
    // -----------------------------
    const results = await Payroll.find(query)
      .sort({ date: -1 })
      .populate('employee', 'name concession');

    const totalAmount = results.reduce(
      (sum, row) => sum + Number(row.amount || 0),
      0
    );

    res.json({ items: results, totalAmount });
  } catch (err) {
    console.error('Error al listar pagos:', err);
    res
      .status(500)
      .json({ error: 'Error al listar pagos', details: err.message });
  }
};

// -----------------------------------------------------
// Editar pago
// -----------------------------------------------------
export const updatePayroll = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    const { id } = req.params;
    const { amount, date, method, notes } = req.body;

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

    if (amount !== undefined) payroll.amount = amount;
    if (date !== undefined) {
      const d = new Date(date);
      if (isNaN(d.getTime())) {
        return res.status(400).json({ error: 'Fecha inválida' });
      }
      payroll.date = d;
      const weekNumber = d.getWeekNumber
        ? `W${d.getWeekNumber()}`
        : `W${Math.ceil(d.getDate() / 7)}`;
      payroll.week = `${d.getFullYear()}-${weekNumber}`;
    }
    if (method !== undefined) payroll.method = method;
    if (notes !== undefined) payroll.notes = notes;

    await payroll.save();

    res.json({ message: 'Pago actualizado', updated: payroll });
  } catch (err) {
    console.error('Error al actualizar pago:', err);
    res
      .status(500)
      .json({ error: 'Error al actualizar pago', details: err.message });
  }
};

// -----------------------------------------------------
// Eliminar pago (soft delete)
// -----------------------------------------------------
export const deletePayroll = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

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

    payroll.deletedAt = new Date();
    await payroll.save();

    res.json({ message: 'Pago eliminado', deleted: payroll });
  } catch (err) {
    console.error('Error al eliminar pago:', err);
    res
      .status(500)
      .json({ error: 'Error al eliminar pago', details: err.message });
  }
};

// -----------------------------------------------------
// Socio al que le toca pagar la semana (rotación)
// -----------------------------------------------------
export const getCurrentPayer = async (req, res) => {
  try {
    const { date, concession } = req.query; // opcionales
    const targetDate = date ? new Date(date) : new Date();

    const payer = await getPayerForDate(targetDate, concession);
    if (!payer) {
      return res
        .status(404)
        .json({ error: 'No se encontró socio para esta semana' });
    }

    res.json({
      date: targetDate,
      payer: {
        _id: payer._id,
        name: payer.name,
        roleGlobal: payer.roleGlobal,
      },
    });
  } catch (err) {
    console.error('Error en getCurrentPayer:', err);
    res.status(500).json({
      error: 'Error al obtener socio de la semana',
      details: err.message,
    });
  }
};
