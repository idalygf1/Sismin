// models/Expense.js
import { Schema, model, Types } from 'mongoose';

const ExpenseSchema = new Schema({
  concession: { type: Types.ObjectId, ref: 'Concession', required: true },
  category: {
    type: String,
    enum: ['Viáticos', 'Herramientas', 'Nómina', 'Mantenimiento', 'Otros'],
    required: true
  },
  amount: { type: Number, required: true },
  description: { type: String },
  date: { type: Date, required: true },
  fileUrl: { type: String }, // comprobante
  createdBy: { type: Types.ObjectId, ref: 'users', required: true },
  deletedAt: { type: Date, default: null } // Soft delete
}, { timestamps: true });

export default model('Expense', ExpenseSchema);
