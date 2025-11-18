import Employee from '../models/Employee.js';
import EmployeeDoc from '../models/EmployeeDoc.js';
import Expense from '../models/Expense.js';
import Payroll from '../models/Payroll.js';
import Notification from '../models/Notification.js';
import { resolveConcessionFilter } from '../utils/access.js';

function normalizeConcessionFilter(filter) {
  return filter?.concession ? { concession: filter.concession } : {};
}

function buildNotificationQuery(concessionFilter) {
  if (!concessionFilter.concession) return {};
  return { $or: [{ concession: concessionFilter.concession }, { concession: null }] };
}

export async function getOverview(req, res) {
  try {
    const { concession } = req.query;
    const { filter, concessionId } = resolveConcessionFilter(req.user, concession);
    const concessionFilter = normalizeConcessionFilter(filter);

    const employeeFilter = { ...concessionFilter };
    const [employeeCount, employeeIds] = await Promise.all([
      Employee.countDocuments(employeeFilter),
      Employee.find(employeeFilter).distinct('_id')
    ]);

    const docsFilter = employeeIds.length ? { employee: { $in: employeeIds } } : {};
    const docCount = employeeIds.length ? await EmployeeDoc.countDocuments(docsFilter) : 0;

    const expenseMatch = { deletedAt: null, ...concessionFilter };
    const [latestExpense, expenseAggregate] = await Promise.all([
      Expense.findOne(expenseMatch).sort({ date: -1 }),
      Expense.aggregate([
        { $match: expenseMatch },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ])
    ]);
    const totalExpenses = expenseAggregate[0]?.total || 0;

    const payrollPipeline = [
      { $match: { deletedAt: null } },
      { $lookup: { from: 'employees', localField: 'employee', foreignField: '_id', as: 'employee' } },
      { $unwind: '$employee' }
    ];
    if (concessionFilter.concession) {
      payrollPipeline.push({ $match: { 'employee.concession': concessionFilter.concession } });
    }
    payrollPipeline.push({ $sort: { date: -1 } }, { $limit: 8 });
    const payrollRows = await Payroll.aggregate(payrollPipeline);
    const payrollTotal = payrollRows.reduce((sum, row) => sum + row.amount, 0);
    const lastPayroll = payrollRows[0] || null;

    const notificationQuery = buildNotificationQuery(concessionFilter);
    const notifications = await Notification.find(notificationQuery).sort({ createdAt: -1 }).limit(3);

    res.json({
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.roleGlobal,
        phone: req.user.phone || null,
        avatarUrl: req.user.avatarUrl || null
      },
      concession: concessionId,
      generatedAt: new Date(),
      stats: {
        employees: employeeCount,
        documents: docCount,
        totalExpenses,
        payrollTotal
      },
      highlights: {
        latestExpense: latestExpense
          ? {
              id: latestExpense._id,
              category: latestExpense.category,
              amount: latestExpense.amount,
              description: latestExpense.description,
              date: latestExpense.date
            }
          : null,
        lastPayroll: lastPayroll
          ? {
              id: lastPayroll._id,
              amount: lastPayroll.amount,
              date: lastPayroll.date,
              employee: lastPayroll.employee?.name
            }
          : null
      },
      payrollTable: payrollRows.map(row => ({
        id: row._id,
        employee: row.employee?.name,
        amount: row.amount,
        date: row.date,
        method: row.method
      })),
      notifications
    });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
}