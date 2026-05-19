import { Document, Model } from 'mongoose';

export type UserRole = 'ADMIN' | 'MANAGER' | 'USER';

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

export interface IUserMethods {
  comparePassword(candidatePassword: string): Promise<boolean>;
}

export type UserModelType = Model<IUser, {}, IUserMethods>;
