import { Schema, model } from 'mongoose';

const ConcessionSchema = new Schema({
  name: { type: String, enum: ['San Vicente','Rosario','Santa Ana'], required: true, unique: true },
  active: { type: Boolean, default: true }
}, { timestamps: true });

export default model('Concession', ConcessionSchema);
