import { Project } from './types';

export const generateArtistId = (): string => {
  return 'ART-' + Math.floor(1000 + Math.random() * 9000);
};

export const generateClientId = (): string => {
  return 'CLI-' + Math.floor(1000 + Math.random() * 9000);
};

export const calculateUrgencyColor = (startDate: string, deadline: string): string => {
  const end = new Date(deadline).getTime();
  const now = new Date().getTime();

  if (now > end) return 'bg-slate-100 border border-slate-200 text-slate-500'; // Overdue / Completed style

  const timeLeft = end - now;
  const daysLeft = timeLeft / (1000 * 60 * 60 * 24);

  // 1-2 days (Strictly <= 48 hours) -> Red
  // Increased intensity to 200/300 to ensure it looks clearly Red, not just "off-white"
  if (daysLeft <= 2) {
    return 'bg-rose-200 border border-rose-300 text-rose-900';
  }

  // 3-5 days (Strictly <= 120 hours) -> Orange
  if (daysLeft <= 5) {
    return 'bg-orange-200 border border-orange-300 text-orange-900';
  }

  // Rest -> Green
  return 'bg-emerald-200 border border-emerald-300 text-emerald-900';
};

// Helper for the thin lines in the calendar (Strong colors)
export const getProjectLineColor = (startDate: string, deadline: string): string => {
  const end = new Date(deadline).getTime();
  const now = new Date().getTime();

  if (now > end) return 'bg-slate-300'; 

  const timeLeft = end - now;
  const daysLeft = timeLeft / (1000 * 60 * 60 * 24);

  // Consistent logic: <= 2 days is Red, <= 5 days is Orange
  if (daysLeft <= 2) {
    return 'bg-rose-500';
  }

  if (daysLeft <= 5) {
    return 'bg-orange-500';
  }

  return 'bg-emerald-500';
};

export const getStatusLabel = (startDate: string, deadline: string): string => {
  const end = new Date(deadline).getTime();
  const now = new Date().getTime();
  const timeLeft = end - now;
  const daysLeft = timeLeft / (1000 * 60 * 60 * 24);

  if (now > end) return '已截稿';
  if (daysLeft <= 2) return '即将截止';
  if (daysLeft <= 5) return '需赶工';
  return '进行中';
};

export const formatDate = (isoString: string): string => {
  return new Date(isoString).toLocaleDateString('zh-CN', {
    month: 'short',
    day: 'numeric'
  });
};