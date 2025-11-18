import { Schema, model, Types } from 'mongoose';

const NotificationSchema = new Schema({
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: { type: String, enum: ['alert', 'info', 'payroll', 'document', 'expense'], default: 'info' },
  concession: { type: Types.ObjectId, ref: 'Concession', default: null },
  read: { type: Boolean, default: false }
}, { timestamps: true });

export default model('Notification', NotificationSchema);