import { Schema, model, Types } from 'mongoose';

const UserSchema = new Schema({
  name:         { type: String, required: true },
  email:        { type: String, unique: true, required: true },
  passwordHash: { type: String, required: true },
  roleGlobal:   { type: String, enum: ['propietario', 'socio', 'admin'], required: true },
  concessions:  [{ type: Types.ObjectId, ref: 'Concession' }],
  status:       { type: Boolean, default: true } // 👈 ACTIVO/INACTIVO
}, { timestamps: true });

export default model('users', UserSchema);
