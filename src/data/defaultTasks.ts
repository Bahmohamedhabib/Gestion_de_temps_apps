import { CategoryId, CategoryInfo, Task } from '../types';

export const CATEGORIES: Record<CategoryId, CategoryInfo> = {
  work: {
    id: 'work',
    label: 'Travail',
    color: '#3B82F6',
    bgLight: '#EFF6FF',
    iconName: 'Briefcase',
  },
  personal: {
    id: 'personal',
    label: 'Personnel',
    color: '#8B5CF6',
    bgLight: '#F5F3FF',
    iconName: 'User',
  },
  shopping: {
    id: 'shopping',
    label: 'Courses',
    color: '#10B981',
    bgLight: '#ECFDF5',
    iconName: 'ShoppingCart',
  },
  health: {
    id: 'health',
    label: 'Santé & Sport',
    color: '#EC4899',
    bgLight: '#FDF2F8',
    iconName: 'Heart',
  },
  project: {
    id: 'project',
    label: 'Projets',
    color: '#F59E0B',
    bgLight: '#FEF3C7',
    iconName: 'FolderKanban',
  },
  study: {
    id: 'study',
    label: 'Formation',
    color: '#06B6D4',
    bgLight: '#ECFEFF',
    iconName: 'GraduationCap',
  },
};

export const getTodayDateString = (): string => {
  const d = new Date();
  return d.toISOString().split('T')[0];
};

export const getRelativeDateString = (offsetDays: number): string => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().split('T')[0];
};

export const INITIAL_TASKS: Task[] = [
  {
    id: 'task-1',
    title: 'Préparer la présentation pour la réunion d\'équipe',
    description: 'Finaliser les diapositives sur les objectifs du trimestre et revoir les chiffres clés.',
    completed: false,
    dueDate: getTodayDateString(),
    dueTime: '14:30',
    priority: 'high',
    category: 'work',
    subtasks: [
      { id: 'sub-1', title: 'Structurer les slides clés', completed: true },
      { id: 'sub-2', title: 'Intégrer les graphiques de performance', completed: true },
      { id: 'sub-3', title: 'Faire une répétition de 10 minutes', completed: false },
    ],
    createdAt: new Date(Date.now() - 3600 * 1000 * 24).toISOString(),
    reminder: true,
  },
  {
    id: 'task-2',
    title: 'Séance de course à pied - 5 km',
    description: 'Parcours au parc avec étirements complets avant et après.',
    completed: false,
    dueDate: getTodayDateString(),
    dueTime: '18:00',
    priority: 'medium',
    category: 'health',
    subtasks: [
      { id: 'sub-4', title: 'Échauffement articulaire', completed: false },
      { id: 'sub-5', title: 'Course 5km à allure modérée', completed: false },
      { id: 'sub-6', title: 'Étirements et hydratation', completed: false },
    ],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'task-3',
    title: 'Faire les courses de la semaine',
    description: 'Acheter les produits frais pour les repas prévus du lundi au vendredi.',
    completed: true,
    dueDate: getTodayDateString(),
    dueTime: '11:00',
    priority: 'low',
    category: 'shopping',
    subtasks: [
      { id: 'sub-7', title: 'Légumes de saison et fruits', completed: true },
      { id: 'sub-8', title: 'Pain complet et céréales', completed: true },
      { id: 'sub-9', title: 'Huile d\'olive et épices', completed: true },
    ],
    createdAt: new Date(Date.now() - 3600 * 1000 * 48).toISOString(),
    completedAt: new Date().toISOString(),
  },
  {
    id: 'task-4',
    title: 'Avancer sur le module TypeScript avancé',
    description: 'Regarder les leçons 4 et 5 sur les génériques et les types conditionnels.',
    completed: false,
    dueDate: getRelativeDateString(1),
    dueTime: '10:00',
    priority: 'medium',
    category: 'study',
    subtasks: [
      { id: 'sub-10', title: 'Exercices pratiques sur les types utilitaires', completed: false },
    ],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'task-5',
    title: 'Appeler le service de maintenance',
    description: 'Prendre rendez-vous pour la révision annuelle.',
    completed: false,
    dueDate: getRelativeDateString(2),
    priority: 'low',
    category: 'personal',
    subtasks: [],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'task-6',
    title: 'Refonte de la page d\'accueil du projet',
    description: 'Valider les maquettes UI/UX et rédiger les spécifications techniques.',
    completed: false,
    dueDate: getRelativeDateString(3),
    dueTime: '16:00',
    priority: 'high',
    category: 'project',
    subtasks: [
      { id: 'sub-11', title: 'Revue ergonomique des flux', completed: false },
      { id: 'sub-12', title: 'Export des assets SVG', completed: false },
    ],
    createdAt: new Date().toISOString(),
  },
];
