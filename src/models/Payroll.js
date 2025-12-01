// src/models/Payroll.js
// models/Payroll.js
import { Schema, model, Types } from 'mongoose';

const PayrollSchema = new Schema(
  {
    employee: {
      type: Types.ObjectId,
      ref: 'Employee',
      required: true,
    },

    // 🔑 Concesión del empleado
    concession: {
      type: Types.ObjectId,
      ref: 'Concession',
      required: true,
    },

    amount: {
      type: Number,
      required: true,
    },

    // Fecha de pago
    date: {
      type: Date,
      required: true,
    },

    // Ej: "2025-W39"
    week: {
      type: String,
      required: true,
    },

    method: {
      type: String,
      enum: ['Efectivo', 'Transferencia'],
      required: true,
    },

    notes: {
      type: String,
    },

    createdBy: {
      type: Types.ObjectId,
      ref: 'User', // 👈 nombre del modelo, no de la colección
      required: true,
    },

    deletedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// Para consultas rápidas por concesión + fecha
PayrollSchema.index({ concession: 1, date: -1 });

export default model('Payroll', PayrollSchema);
