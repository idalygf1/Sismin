import { Schema, model, Types } from 'mongoose';

const EmployeeSchema = new Schema({
  concession: { type: Types.ObjectId, ref: 'Concession', required: true },
  name: { type: String, required: true },
  curp: { type: String, required: true },
  rfc:  { type: String, required: true },
  nss:  { type: String, required: true },
  puesto: { type: String, required: true },
  salario: { type: Number, required: true, min: 0 },
  telefono: { type: String, required: true, unique: true },
  estatus: { type: String, enum: ['activo','inactivo'], default: 'activo' }
}, { timestamps: true });

export default model('Employee', EmployeeSchema);
