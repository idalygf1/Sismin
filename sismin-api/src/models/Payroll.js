// models/Payroll.js
import { Schema, model, Types } from 'mongoose';

const PayrollSchema = new Schema({
  employee: { type: Types.ObjectId, ref: 'Employee', required: true },
  amount: { type: Number, required: true },
  date: { type: Date, required: true }, // Fecha de pago
  week: { type: String, required: true }, // Ej: "2025-W39"
  method: { type: String, enum: ['Efectivo', 'Transferencia'], required: true },
  notes: { type: String },
  createdBy: { type: Types.ObjectId, ref: 'users', required: true },
  deletedAt: { type: Date, default: null }
}, { timestamps: true });

export default model('Payroll', PayrollSchema);
