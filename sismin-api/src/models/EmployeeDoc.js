import { Schema, model, Types } from 'mongoose';

const EmployeeDocSchema = new Schema({
  employee: { type: Types.ObjectId, ref: 'Employee', required: true },
  type: { type: String, enum: ['INE','NSS','OTRO'], required: true },
  url: { type: String, required: true },
  expiresAt: { type: Date },
  notes: { type: String }
}, { timestamps: true });

export default model('EmployeeDoc', EmployeeDocSchema);
