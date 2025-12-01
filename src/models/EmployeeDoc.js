// src/models/EmployeeDoc.js
import { Schema, model, Types } from 'mongoose';

const EmployeeDocSchema = new Schema(
  {
    // Notas / título visible en la app
    notes: {
      type: String,
      trim: true,
      default: '',
    },

    // Ámbito del documento (empresa, empleado, concesion, gasto, etc.)
    scope: {
      type: String,
      trim: true,
      default: 'empresa',
    },

    // Si es null -> documento general de empresa (cuando isGlobal = true)
    employee: {
      type: Types.ObjectId,
      ref: 'Employee',
      default: null,
    },

    // true = documento de empresa / general (IMSS, Hacienda, Seguro, etc.)
    isGlobal: {
      type: Boolean,
      default: false,
    },

    // Categoría principal (Factura, Comprobante pago, Ticket, Seguro, etc.)
    category: {
      type: String,
      required: true,
      trim: true,
    },

    // Subcategoría más específica (IMSS, SAT, Seguro camioneta, etc.)
    subcategory: {
      type: String,
      trim: true,
      default: '',
    },

    fileUrl: {
      type: String,
      required: true,
      trim: true,
    },

    fileName: {
      type: String,
      required: true,
      trim: true,
    },

    // Fecha límite para generar notificaciones
    dueDate: {
      type: Date,
      default: null,
    },

    // 🔑 Llave foránea a la concesión
    concession: {
      type: Types.ObjectId,
      ref: 'Concession',
      required: true,
    },

    // Usuario que subió el documento
    createdBy: {
      type: Types.ObjectId,
      ref: 'User',
      required: true,
    },

    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Índices útiles para filtrar por concesión + empleado y por vencimiento
EmployeeDocSchema.index({ concession: 1, employee: 1 });
EmployeeDocSchema.index({ dueDate: 1 });

export default model('EmployeeDoc', EmployeeDocSchema);
