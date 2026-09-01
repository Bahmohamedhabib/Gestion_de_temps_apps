import { User, Task } from '../types';
import { getTodayDateString, getRelativeDateString } from './defaultTasks';

export const DEFAULT_USERS: User[] = [
  {
    id: 'user-habib',
    name: 'Habib Bah',
    email: 'bahmohamedhabib64@gmail.com',
    password: 'password123',
    avatarColor: '#4F46E5', // Indigo
    role: 'Chef de Projet & Dev',
    createdAt: '2026-01-15T08:00:00.000Z',
    settings: {
      enableAudioAlerts: true,
      enableBrowserNotifications: true,
      defaultReminderMinutes: 15,
      soundTheme: 'chime',
    },
  },
  {
    id: 'user-marie',
    name: 'Marie Dupont',
    email: 'marie.dupont@example.com',
    password: 'password123',
    avatarColor: '#EC4899', // Pink
    role: 'Designer UI/UX',
    createdAt: '2026-02-01T10:00:00.000Z',
    settings: {
      enableAudioAlerts: true,
      enableBrowserNotifications: true,
      defaultReminderMinutes: 30,
      soundTheme: 'gentle',
    },
  },
  {
    id: 'user-alex',
    name: 'Alexandre Martin',
    email: 'alex.martin@example.com',
    password: 'password123',
    avatarColor: '#10B981', // Emerald
    role: 'Consultant & Sportif',
    createdAt: '2026-02-10T14:30:00.000Z',
    settings: {
      enableAudioAlerts: true,
      enableBrowserNotifications: false,
      defaultReminderMinutes: 0,
      soundTheme: 'digital',
    },
  },
];

export const getUserInitialTasks = (userId: string): Task[] => {
  const today = getTodayDateString();
  
  if (userId === 'user-habib') {
    return [
      {
        id: 'habib-task-1',
        userId: 'user-habib',
        title: 'Revue de sprint & Déploiement mobile',
        description: 'Vérifier la version PWA, les notifications temps réel et la gestion des comptes.',
        completed: false,
        dueDate: today,
        dueTime: '14:30',
        priority: 'high',
        category: 'work',
        reminder: true,
        reminderMinutesBefore: 15,
        subtasks: [
          { id: 'sub-h1', title: 'Valider les règles de sécurité', completed: true },
          { id: 'sub-h2', title: 'Tester les rappels sonores', completed: true },
          { id: 'sub-h3', title: 'Préparer la release note', completed: false },
        ],
        createdAt: new Date(Date.now() - 3600 * 1000 * 24).toISOString(),
      },
      {
        id: 'habib-task-2',
        userId: 'user-habib',
        title: 'Séance de Crossfit / Cardio',
        description: 'Session intensive de 45 minutes pour garder la forme.',
        completed: false,
        dueDate: today,
        dueTime: '18:15',
        priority: 'medium',
        category: 'health',
        reminder: true,
        reminderMinutesBefore: 30,
        subtasks: [
          { id: 'sub-h4', title: 'Échauffement 10 min', completed: false },
          { id: 'sub-h5', title: 'WOD haute intensité', completed: false },
        ],
        createdAt: new Date().toISOString(),
      },
      {
        id: 'habib-task-3',
        userId: 'user-habib',
        title: 'Appel avec l\'équipe architecture Cloud',
        description: 'Synchronisation sur les futures évolutions et scalabilité.',
        completed: true,
        dueDate: today,
        dueTime: '10:00',
        priority: 'high',
        category: 'project',
        reminder: true,
        reminderMinutesBefore: 15,
        subtasks: [],
        createdAt: new Date(Date.now() - 3600 * 1000 * 48).toISOString(),
        completedAt: new Date().toISOString(),
      },
      {
        id: 'habib-task-4',
        userId: 'user-habib',
        title: 'Lire les articles sur Next Gen Web APIs',
        description: 'Veille technologique sur les APIs de notifications et Service Workers.',
        completed: false,
        dueDate: getRelativeDateString(1),
        dueTime: '11:00',
        priority: 'low',
        category: 'study',
        subtasks: [],
        createdAt: new Date().toISOString(),
      },
    ];
  }

  if (userId === 'user-marie') {
    return [
      {
        id: 'marie-task-1',
        userId: 'user-marie',
        title: 'Maquettes Figma du Design System',
        description: 'Créer les composants boutons, inputs et cartes avec variantes sombres/claires.',
        completed: false,
        dueDate: today,
        dueTime: '15:00',
        priority: 'high',
        category: 'work',
        reminder: true,
        reminderMinutesBefore: 30,
        subtasks: [
          { id: 'sub-m1', title: 'Composants mobiles', completed: true },
          { id: 'sub-m2', title: 'Palette de couleurs', completed: false },
        ],
        createdAt: new Date().toISOString(),
      },
      {
        id: 'marie-task-2',
        userId: 'user-marie',
        title: 'Acheter du matériel de dessin et papeterie',
        description: 'Carnets Moleskine et feutres de prototypage rapide.',
        completed: false,
        dueDate: today,
        dueTime: '17:30',
        priority: 'medium',
        category: 'shopping',
        subtasks: [],
        createdAt: new Date().toISOString(),
      },
    ];
  }

  // Default tasks for Alex or other new users
  return [
    {
      id: 'alex-task-1',
      userId: userId,
      title: 'Planifier la semaine et objectifs',
      description: 'Définir les 3 priorités majeures de la semaine.',
      completed: false,
      dueDate: today,
      dueTime: '09:00',
      priority: 'high',
      category: 'personal',
      reminder: true,
      reminderMinutesBefore: 15,
      subtasks: [
        { id: 'sub-a1', title: 'Priorité 1 : Projets clients', completed: false },
        { id: 'sub-a2', title: 'Priorité 2 : Santé & Sport', completed: false },
      ],
      createdAt: new Date().toISOString(),
    },
  ];
};
