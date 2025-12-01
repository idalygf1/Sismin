// src/config/payrollRotation.js

// 🔁 Rotación SOLO para concesiones donde sí se turnan
export const PAYROLL_ROTATION = [
  '6900de23f8f4671890f94b41', // Oscar
  '6900e33f8f4671890f9b93c', // Alberto
  '68d4c7cf2db2cbd537e3de83', // Pascacio
];

// 📅 Fecha base donde empieza el ciclo de semanas
// OJO: meses en JS son 0-based -> noviembre = 10
export const PAYROLL_START_DATE = new Date(2025, 10, 1);

// 🚫 Concesiones donde NO hay rotación (paga siempre Manuel)
export const NO_ROTATION_CONCESSIONS = [
  '68d4bdf915302ad362152900', // 👈 pon aquí el _id de la concesión Rosario
];

// 👤 Usuario que SIEMPRE paga en esas concesiones
export const MANUEL_USER_ID = '6900edbf3f8f4671890f9b45'; // 👈 pon aquí el _id de Manuel en "users"
