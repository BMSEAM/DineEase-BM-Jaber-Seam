import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { ROLE_VALUES, ROLES } from '../config/constants.js';

const { Schema, model } = mongoose;

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please provide a valid email address'],
    },
    phone: { type: String, trim: true, default: '' },
    // password is never selected by default — must be explicitly requested.
    password: { type: String, required: true, minlength: 6, select: false },
    role: { type: String, enum: ROLE_VALUES, default: ROLES.CUSTOMER, index: true },
    isActive: { type: Boolean, default: true },
    loyaltyPoints: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

// Hash password on create/update whenever it changes.
userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  return next();
});

userSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

// Ensure password never leaks through JSON serialisation.
userSchema.methods.toJSON = function toJSON() {
  const obj = this.toObject();
  delete obj.password;
  delete obj.__v;
  return obj;
};

export const User = model('User', userSchema);
