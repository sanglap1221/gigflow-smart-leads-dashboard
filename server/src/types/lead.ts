import { Document, Schema } from 'mongoose';

export type LeadStatus = 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'LOST' | 'WON';
export type LeadSource =
  | 'Web'
  | 'Referral'
  | 'Cold Call'
  | 'Social Media'
  | 'Other';

export interface ILead extends Document {
  name: string;
  email: string;
  phone?: string;
  status: LeadStatus;
  source: LeadSource;
  assignedTo?: Schema.Types.ObjectId;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}
