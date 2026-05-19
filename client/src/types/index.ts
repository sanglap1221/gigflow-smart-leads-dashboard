export type UserRole = 'ADMIN' | 'MANAGER' | 'USER';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export type LeadStatus = 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'LOST' | 'WON';
export type LeadSource =
  | 'Web'
  | 'Referral'
  | 'Cold Call'
  | 'Social Media'
  | 'Other';

export interface Lead {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  status: LeadStatus;
  source: LeadSource;
  assignedTo?: {
    _id: string;
    name: string;
    email: string;
    role: UserRole;
  };
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Pagination {
  total: number;
  page: number;
  limit: number;
  pages: number;
}
