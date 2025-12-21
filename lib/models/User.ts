import mongoose, { Document } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import config from '../config/config';
import { USER_ROLES, UserRole } from '../constants';

export interface IUser extends Document {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  roles: UserRole[]; // e.g., ['attendee', 'organizer', 'admin']
  isVerified: boolean;
  phone?: string;
  address?: string;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
  hasRole(role: string): boolean;
}

const userSchema = new mongoose.Schema<IUser>({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
  },
  firstName: {
    type: String,
    required: true,
    trim: true,
  },
  lastName: {
    type: String,
    required: true,
    trim: true,
  },
  roles: {
    type: [{
      type: String,
      enum: Object.values(USER_ROLES),
      default: USER_ROLES.ATTENDEE
    }],
    required: true,
    default: () => [USER_ROLES.ATTENDEE]
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  phone: {
    type: String,
    trim: true,
  },
  address: {
    type: String,
    trim: true,
  },
}, {
  timestamps: true,
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, config.bcrypt.saltRounds);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Check if user has a specific role
userSchema.methods.hasRole = function(role: string): boolean {
  return this.roles.includes(role as UserRole);
};

export const User = mongoose.model<IUser>('User', userSchema);