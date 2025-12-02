// sismin-api/src/controllers/dashboard.controller.js

import Employee from '../models/Employee.js';
import EmployeeDoc from '../models/SimpleDoc.js';
import Expense from '../models/Expense.js';
import Payroll from '../models/Payroll.js';
import Notification from '../models/Notification.js';
import Concession from '../models/Concession.js';
import User from '../models/User.js';
import { resolveConcessionFilter } from '../utils/access.js';

// --------------------------------------------------------------
// FUNCIONES AUXILIARES
// --------------------------------------------------------------

function normalizeConcessionFilter(filter) {
  return filter?.concession ? { concession: filter.concession } : {};
}

function buildNotificationQuery(concessionFilter) {
  if (!concessionFilter.concession) return {};
  return {
    $or: [
      { concession: concessionFilter.concession },
      { concession: null }, // notificaciones generales
    ],
  };
}

// --------------------------------------------------------------
// CONTROLLER PRINCIPAL
// --------------------------------------------------------------

export async function getOverview(req, res) {
  try {
    const { concession } = req.query;

    // 🔹 Traemos al usuario COMPLETO con sus concesiones (pobladas)
    const fullUser = await User.findById(req.user._id).populate({
      path: 'concessions',
      select: 'name alias code municipio estado', // ajusta a tus campos reales
    });

    if (!fullUser) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Filtro de concesión para empleados/gastos/nómina
    const { filter, concessionId } = resolveConcessionFilter(
      req.user,
      concession
    );
    const concessionFilter = normalizeConcessionFilter(filter);

    // -----------------------------------------------------------
    // EMPLEADOS
    // -----------------------------------------------------------
    const employeeFilter = { ...concessionFilter };
    const [employeeCount, employeeIds] = await Promise.all([
      Employee.countDocuments(employeeFilter),
      Employee.find(employeeFilter).distinct('_id'),
    ]);

    // -----------------------------------------------------------
    // DOCUMENTOS DE EMPLEADOS
    // -----------------------------------------------------------
    const docsFilter = employeeIds.length
      ? { employee: { $in: employeeIds } }
      : {};
    const docCount = employeeIds.length
      ? await EmployeeDoc.countDocuments(docsFilter)
      : 0;

    // -----------------------------------------------------------
    // GASTOS
    // -----------------------------------------------------------
    const expenseMatch = { deletedAt: null, ...concessionFilter };

    const [latestExpense, expenseAggregate] = await Promise.all([
      Expense.findOne(expenseMatch).sort({ date: -1 }),
      Expense.aggregate([
        { $match: expenseMatch },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
    ]);

    const totalExpenses = expenseAggregate[0]?.total || 0;

    // -----------------------------------------------------------
    // NÓMINA
    // -----------------------------------------------------------
    const payrollPipeline = [
      { $match: { deletedAt: null } },
      {
        $lookup: {
          from: 'employees',
          localField: 'employee',
          foreignField: '_id',
          as: 'employee',
        },
      },
      { $unwind: '$employee' },
    ];

    if (concessionFilter.concession) {
      payrollPipeline.push({
        $match: { 'employee.concession': concessionFilter.concession },
      });
    }

    payrollPipeline.push({ $sort: { date: -1 } }, { $limit: 8 });

    const payrollRows = await Payroll.aggregate(payrollPipeline);
    const payrollTotal = payrollRows.reduce((sum, row) => sum + row.amount, 0);
    const lastPayroll = payrollRows[0] || null;

    // -----------------------------------------------------------
    // NOTIFICACIONES
    // -----------------------------------------------------------
    const notificationQuery = buildNotificationQuery(concessionFilter);

    const notifications = await Notification.find(notificationQuery)
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    const payrollNotification = notifications.find((n) => n.type === 'payroll');
    const movementNotification = notifications.find((n) => n.type !== 'payroll');

    // -----------------------------------------------------------
    // 🔵 DATOS PARA EL HOMESCREEN
    // -----------------------------------------------------------

    const ownerName = fullUser.name;
    const ownerRole = fullUser.roleGlobal;

    let concessionName = 'Sin concesión asignada';

    if (concession) {
      const conc = await Concession.findById(concession);
      if (conc) concessionName = conc.name;
    } else if (fullUser.concessions && fullUser.concessions.length > 0) {
      if (fullUser.concessions.length === 1) {
        concessionName = fullUser.concessions[0].name;
      } else {
        concessionName = `${fullUser.concessions.length} concesiones asignadas`;
      }
    }

    // -----------------------------------------------------------
    // Texto del último movimiento
    // -----------------------------------------------------------
    let lastMovement = 'Sin movimientos registrados.';

    if (movementNotification) {
      lastMovement = movementNotification.message;
    } else if (latestExpense) {
      lastMovement = `${latestExpense.category} - $${latestExpense.amount}`;
    }

    // -----------------------------------------------------------
    // Texto de nómina
    // -----------------------------------------------------------
    let nextPayroll = 'Sin información de nómina disponible.';

    if (payrollNotification) {
      nextPayroll = payrollNotification.message;
    } else if (lastPayroll) {
      nextPayroll = `Última nómina: $${lastPayroll.amount}`;
    }

    // -----------------------------------------------------------
    // Fecha “bonita” para la tarjeta
    // -----------------------------------------------------------
    const now = new Date().toLocaleDateString('es-MX', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit',
    });

    // -----------------------------------------------------------
    // RESPUESTA FINAL
    // -----------------------------------------------------------
    res.json({
      // Datos del usuario autenticado (AHORA con concesiones)
      user: {
        id: fullUser._id,
        name: fullUser.name,
        email: fullUser.email,
        role: fullUser.roleGlobal,
        phone: fullUser.phone || null,
        avatarUrl: fullUser.avatarUrl || null,
        concessions: (fullUser.concessions || []).map((c) => ({
          id: c._id,
          name: c.name,
          alias: c.alias,
          code: c.code,
          municipio: c.municipio,
          estado: c.estado,
        })),
      },

      concession: concessionId,

      ownerName,
      ownerRole,
      concessionName,
      lastMovement,
      nextPayroll,
      now,

      generatedAt: new Date(),
      stats: {
        employees: employeeCount,
        documents: docCount,
        totalExpenses,
        payrollTotal,
      },

      highlights: {
        latestExpense: latestExpense
          ? {
              id: latestExpense._id,
              category: latestExpense.category,
              amount: latestExpense.amount,
              description: latestExpense.description,
              date: latestExpense.date,
            }
          : null,
        lastPayroll: lastPayroll
          ? {
              id: lastPayroll._id,
              amount: lastPayroll.amount,
              date: lastPayroll.date,
              employee: lastPayroll.employee?.name,
            }
          : null,
      },

      payrollTable: payrollRows.map((row) => ({
        id: row._id,
        employee: row.employee?.name,
        amount: row.amount,
        date: row.date,
        method: row.method,
      })),

      notifications,
    });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
}
