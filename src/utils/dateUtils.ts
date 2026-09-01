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
