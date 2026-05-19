import mongoose, { Schema } from 'mongoose';
import { ILead } from '../types/lead.js';

const LeadSchema = new Schema<ILead>(
  {
    name: {
      type: String,
      required: [true, 'Lead name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Lead email is required'],
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    phone: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: {
        values: ['NEW', 'CONTACTED', 'QUALIFIED', 'LOST', 'WON'],
        message: '{VALUE} is not a valid status',
      },
      default: 'NEW',
    },
    source: {
      type: String,
      enum: {
        values: ['Web', 'Referral', 'Cold Call', 'Social Media', 'Other'],
        message: '{VALUE} is not a valid source',
      },
      default: 'Other',
    },
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexing for search performance
LeadSchema.index({ name: 'text', email: 'text', status: 1 });

export const Lead = mongoose.model<ILead>('Lead', LeadSchema);
export default Lead;
