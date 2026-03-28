export interface Project {
  id: string;
  clientName: string;
  targetClientId?: string;
  description: string;
  amount?: string;
  startDate: string;
  deadline: string;
  status: 'pending' | 'in_progress' | 'completed';
}

export interface BookingSlot {
  date: string;
  status: 'available' | 'booked' | 'blocked';
  bookedBy?: string;
  clientId?: string;
  note?: string;
  actualHours?: string[];
}

export interface Achievement {
  id: string;
  text: string;
  date: string;
}

export interface PlannerStage {
  id: string;
  title: string;
  isDeletable?: boolean;
}

export interface PlanningSession {
  id: string;
  projectId?: string;
  clientName: string;
  stages: PlannerStage[];
  estimates: Record<string, string>;
  blockedDates: string[];
  createdAt: string;
  lastUpdated: string;
  completedDays: number[];
  dailySlots?: Record<number, string[]>;
}

export type ViewMode = 'artist' | 'client';