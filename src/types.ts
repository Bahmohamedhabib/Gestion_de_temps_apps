export type Priority = 'low' | 'medium' | 'high';

export type CategoryId = 'work' | 'personal' | 'shopping' | 'health' | 'project' | 'study';

export interface CategoryInfo {
  id: CategoryId;
  label: string;
  color: string;
  bgLight: string;
  iconName: string;
}

export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  dueDate: string; // Format: YYYY-MM-DD
  dueTime?: string; // Format: HH:mm
  priority: Priority;
  category: CategoryId;
  subtasks: SubTask[];
  createdAt: string;
  completedAt?: string;
  reminder?: boolean;
}

export type TabType = 'tasks' | 'calendar' | 'stats' | 'settings';

export type FilterStatus = 'all' | 'today' | 'upcoming' | 'completed' | 'overdue';

export type SortOption = 'dueDate' | 'priority' | 'title' | 'createdAt';
