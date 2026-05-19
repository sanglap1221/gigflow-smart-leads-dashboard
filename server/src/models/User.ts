import mongoose, { Schema } from 'mongoose';
import bcrypt from 'bcryptjs';
import { IUser, UserModelType } from '../types/user.js';

const UserSchema = new Schema<IUser, UserModelType>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false,
    },
    role: {
      type: String,
      enum: {
        values: ['ADMIN', 'MANAGER', 'USER'],
        message: '{VALUE} is not a valid role',
      },
      default: 'USER',
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
UserSchema.pre('save', async function () {
  if (!this.isModified('password')) {
    return;
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password || '', salt);
});

// Compare password method
UserSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  // Since password was marked select: false, this.password might not be loaded.
  // We assume the caller loaded the password if they are comparing it.
  return bcrypt.compare(candidatePassword, this.password || '');
};

export const User = mongoose.model<IUser, UserModelType>('User', UserSchema);
export default User;
