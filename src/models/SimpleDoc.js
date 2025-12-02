// src/models/SimpleDoc.js
import { Schema, model } from "mongoose";

const SimpleDocSchema = new Schema(
  {
    // Título del documento
    title: {
      type: String,
      required: true,
      trim: true,
    },

    // Nombre visible del archivo
    fileName: {
      type: String,
      required: true,
      trim: true,
    },

    // URL (relativa o absoluta) del archivo
    fileUrl: {
      type: String,
      required: true,
      trim: true,
    },

    // Fecha límite / vencimiento (opcional)
    dueDate: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

export default model("SimpleDoc", SimpleDocSchema);
