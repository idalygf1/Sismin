// src/models/Expense.js
import { Schema, model, Types } from 'mongoose';

const ExpenseSchema = new Schema(
  {
    // 🔑 Concesión a la que pertenece el gasto
    concession: {
      type: Types.ObjectId,
      ref: 'Concession',
      required: true,
    },

    category: {
      type: String,
      enum: ['Muestras', 'Herramientas', 'Nómina', 'Materiales', 'Viajes de escombro','Mantenimiento', 'Otros'],
      required: true,
      trim: true,
    },

    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    description: {
      type: String,
      default: '',
      trim: true,
    },

    date: {
      type: Date,
      required: true,
    },

    // Comprobante
    fileUrl: {
      type: String,
      default: null,
      trim: true,
    },

    // Usuario que registró el gasto
    createdBy: {
      type: Types.ObjectId,
      ref: 'User',          // 👈 aquí lo normal es 'User', no 'users'
      required: true,
    },

    // Soft delete
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// Útil para filtrar rápido por concesión + fecha
ExpenseSchema.index({ concession: 1, date: -1 });

export default model('Expense', ExpenseSchema);
