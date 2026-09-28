import { Timestamp } from 'firebase/firestore';

export type UserRole = 'admin' | 'supervisor';

export interface AppUser {
  id: string;
  fullName: string;
  email: string;
  password?: string;
  role: UserRole;
  active: boolean;
  createdAt: Timestamp | Date;
}

export interface LocationItem {
  id: string;
  name: string;
  building?: string;
  floor?: string;
  department?: string;
  active: boolean;
  sortOrder?: number;
  createdAt?: Timestamp | Date;
}

export interface CategoryItem {
  id: string;
  name: string;
  active: boolean;
  sortOrder?: number;
  createdAt?: Timestamp | Date;
}

export type RoundType = 'maintenance' | 'cleaning';
export type RoundStatus = 'in_progress' | 'completed';

export interface Round {
  id: string;
  type: RoundType;
  supervisorId: string;
  supervisorName: string;
  status: RoundStatus;
  startedAt: Timestamp | Date;
  completedAt?: Timestamp | Date;
  durationMinutes?: number;
  summary?: string;
  createdAt: Timestamp | Date;
  observationCount?: number;
  openCount?: number;
  resolvedCount?: number;
}

export type ObservationStatus = 'open' | 'resolved';

export interface Observation {
  id: string;
  roundId: string;
  orderNumber?: number;
  locationId: string;
  locationName: string;
  categoryId: string;
  categoryName: string;
  description: string;
  actionTaken?: string;
  status: ObservationStatus;
  createdBy: string;
  createdByName: string;
  createdAt: Timestamp | Date;
  resolvedBy?: string;
  resolvedByName?: string;
  resolvedAt?: Timestamp | Date;
  updatedAt: Timestamp | Date;
}

export type UpdateType = 'comment' | 'resolved' | 'reopened';

export interface ObservationUpdate {
  id: string;
  observationId: string;
  type: UpdateType;
  text?: string;
  createdBy: string;
  createdByName: string;
  createdAt: Timestamp | Date;
}
