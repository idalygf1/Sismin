// src/utils/payrollRotation.js
import User from '../models/User.js';
import {
  PAYROLL_ROTATION,
  PAYROLL_START_DATE,
  NO_ROTATION_CONCESSIONS,
  MANUEL_USER_ID,
} from '../config/payrollRotation.js';

// Normaliza cualquier fecha al SÁBADO de esa semana
function normalizeToSaturday(dateInput) {
  const d = new Date(dateInput || new Date());
  const sat = new Date(d);
  sat.setHours(0, 0, 0, 0);

  const day = d.getDay(); // 0=Domingo ... 6=Sábado
  const diffToSat = (6 - day + 7) % 7; // cuántos días faltan para sábado

  sat.setDate(sat.getDate() + diffToSat);
  return sat;
}

export async function getPayerForDate(dateInput, concessionId) {
  // 1) Concesiones sin rotación → siempre Manuel
  if (
    concessionId &&
    NO_ROTATION_CONCESSIONS.map(String).includes(String(concessionId))
  ) {
    return await User.findById(MANUEL_USER_ID);
  }

  // 2) Si hay rotación normal
  if (!PAYROLL_ROTATION.length) return null;

  const targetSat = normalizeToSaturday(dateInput || new Date());
  const baseSat = normalizeToSaturday(PAYROLL_START_DATE);

  const MS_PER_WEEK = 7 * 24 * 60 * 60 * 1000;
  const diffWeeks = Math.floor((targetSat - baseSat) / MS_PER_WEEK);

  const n = PAYROLL_ROTATION.length;
  // Maneja fechas antes de la base también
  const index = ((diffWeeks % n) + n) % n;

  const payerId = PAYROLL_ROTATION[index];
  if (!payerId) return null;

  const payer = await User.findById(payerId);
  return payer || null;
}
