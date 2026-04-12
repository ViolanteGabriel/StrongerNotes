import mongoose, { Schema } from 'mongoose';

export interface IUser {
  name: string;
  email: string;
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
  __v: number;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
  },
  {
    timestamps: true,
    collection: 'users',
    versionKey: '__v',
  }
);

userSchema.index({ email: 1 }, { unique: true, name: 'unique_email' });

export const User = mongoose.model<IUser>('User', userSchema);
