// sismin-api/src/models/User.js
import { Schema, model, Types } from 'mongoose';

const UserSchema = new Schema(
  {
    name:      { type: String, required: true },
    email:     { type: String, unique: true, required: true },
    passwordHash: { type: String, required: true },

    roleGlobal: {
      type: String,
      enum: ['propietario', 'socio', 'admin'],
      required: true,
      set: (v) => v?.toLowerCase(),   // 👈 siempre minúsculas al asignar
    },

    concessions: [{ type: Types.ObjectId, ref: 'Concession' }],

    phone:     { type: String },
    avatarUrl: { type: String },

    status: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default model('users', UserSchema);
