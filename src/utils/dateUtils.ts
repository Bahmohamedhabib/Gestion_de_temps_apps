export function formatFrenchDate(dateStr: string): string {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  
  return date.toLocaleDateString('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

export function formatFullFrenchDate(date: Date): string {
  return date.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function formatMonthYear(date: Date): string {
  return date.toLocaleDateString('fr-FR', {
    month: 'long',
    year: 'numeric',
  });
}

export function getRelativeDateBadge(dueDateStr: string, isCompleted: boolean): { text: string; status: 'overdue' | 'today' | 'tomorrow' | 'upcoming' } {
  if (!dueDateStr) return { text: 'Sans date', status: 'upcoming' };
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [y, m, d] = dueDateStr.split('-').map(Number);
  const target = new Date(y, m - 1, d);
  target.setHours(0, 0, 0, 0);

  const diffTime = target.getTime() - today.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0 && !isCompleted) {
    return { text: `En retard (${Math.abs(diffDays)} j)`, status: 'overdue' };
  } else if (diffDays === 0) {
    return { text: "Aujourd'hui", status: 'today' };
  } else if (diffDays === 1) {
    return { text: 'Demain', status: 'tomorrow' };
  } else if (diffDays > 1 && diffDays <= 7) {
    return { text: `Dans ${diffDays} jours`, status: 'upcoming' };
  } else {
    return { text: formatFrenchDate(dueDateStr), status: 'upcoming' };
  }
}

// 7 days of the specified week (Monday to Sunday)
export function getDaysOfWeek(centerDate: Date = new Date()): Array<{ date: Date; dateStr: string; dayName: string; dayNumber: number; isToday: boolean }> {
  const result = [];
  const curr = new Date(centerDate);
  // get start of current week (Monday)
  const day = curr.getDay();
  const diff = curr.getDate() - day + (day === 0 ? -6 : 1);
  const startOfWeek = new Date(curr.setDate(diff));

  const todayStr = new Date().toISOString().split('T')[0];

  for (let i = 0; i < 7; i++) {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];
    const dayName = d.toLocaleDateString('fr-FR', { weekday: 'short' });
    const dayNumber = d.getDate();
    result.push({
      date: d,
      dateStr,
      dayName: dayName.charAt(0).toUpperCase() + dayName.slice(1, 3),
      dayNumber,
      isToday: dateStr === todayStr,
    });
  }
  return result;
}

export interface MonthDayInfo {
  date: Date;
  dateStr: string;
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, etc.
}

// Full 42-day matrix for a month calendar grid starting on Monday
export function getMonthMatrix(year: number, monthIndex: number): MonthDayInfo[] {
  const todayStr = new Date().toISOString().split('T')[0];
  const firstDayOfMonth = new Date(year, monthIndex, 1);
  
  // Day of week for 1st of month: 0 (Sun) to 6 (Sat)
  const firstDayWeekday = firstDayOfMonth.getDay();
  // Monday is 1, Sunday is 7 in EU
  const offset = firstDayWeekday === 0 ? 6 : firstDayWeekday - 1;

  const startDate = new Date(year, monthIndex, 1 - offset);
  const days: MonthDayInfo[] = [];

  for (let i = 0; i < 42; i++) {
    const current = new Date(startDate);
    current.setDate(startDate.getDate() + i);
    
    // Format YYYY-MM-DD
    const y = current.getFullYear();
    const m = String(current.getMonth() + 1).padStart(2, '0');
    const d = String(current.getDate()).padStart(2, '0');
    const dateStr = `${y}-${m}-${d}`;

    days.push({
      date: current,
      dateStr,
      dayNumber: current.getDate(),
      isCurrentMonth: current.getMonth() === monthIndex,
      isToday: dateStr === todayStr,
      dayOfWeek: current.getDay(),
    });
  }

  return days;
}
