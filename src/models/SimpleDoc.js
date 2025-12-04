// src/models/SimpleDoc.js
import { Schema, model, Types } from 'mongoose';

const SimpleDocSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    fileName: {
      type: String,
      required: true,
      trim: true,
    },
    fileUrl: {
      type: String,
      required: true,
      trim: true,
    },
    dueDate: {
      type: Date,
      default: null,
    },
    concession: { 
      type: Types.ObjectId,
      ref: 'Concession',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export default model('SimpleDoc', SimpleDocSchema);
