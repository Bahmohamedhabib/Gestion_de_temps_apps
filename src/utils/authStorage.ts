import { User, Task, AppNotification, UserSettings } from '../types';
import { getTodayDateString } from '../data/defaultTasks';

const USERS_STORAGE_KEY = 'mobile_tasks_accounts_v3';
const CURRENT_USER_KEY = 'mobile_tasks_active_session_v3';

export const authStorage = {
  // Get all registered users from localStorage (stored strictly locally on device)
  getUsers(): User[] {
    try {
      const data = localStorage.getItem(USERS_STORAGE_KEY);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.error('Failed to parse users', e);
    }
    return [];
  },

  saveUsers(users: User[]) {
    try {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    } catch (e) {
      console.error('Failed to save users', e);
    }
  },

  // Get current active user (or null if not logged in)
  getCurrentUser(): User | null {
    const users = this.getUsers();
    if (users.length === 0) return null;

    try {
      const activeId = localStorage.getItem(CURRENT_USER_KEY);
      if (activeId) {
        const found = users.find((u) => u.id === activeId);
        if (found) return found;
      }
    } catch (e) {
      console.error('Failed to get active user', e);
    }
    
    // If no active session set but users exist, use the first saved user
    const firstUser = users[0];
    if (firstUser) {
      this.setCurrentUser(firstUser.id);
      return firstUser;
    }
    return null;
  },

  setCurrentUser(userId: string) {
    try {
      localStorage.setItem(CURRENT_USER_KEY, userId);
    } catch (e) {
      console.error('Failed to set active user', e);
    }
  },

  logout() {
    try {
      localStorage.removeItem(CURRENT_USER_KEY);
    } catch (e) {
      console.error('Failed to logout', e);
    }
  },

  // Register new user (Strict private account)
  registerUser(
    name: string,
    email: string,
    password?: string,
    avatarColor: string = '#4F46E5',
    role?: string
  ): { user?: User; error?: string } {
    const users = this.getUsers();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      return { error: "L'adresse email est obligatoire." };
    }
    if (!name.trim()) {
      return { error: 'Le nom complet est obligatoire.' };
    }

    const existing = users.find((u) => u.email.toLowerCase() === cleanEmail);
    if (existing) {
      return { error: 'Un compte existe déjà avec cette adresse email. Veuillez vous connecter.' };
    }

    const newUser: User = {
      id: 'user-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
      name: name.trim(),
      email: cleanEmail,
      password: password || '',
      avatarColor,
      role: role?.trim() || 'Personnel',
      createdAt: new Date().toISOString(),
      settings: {
        enableAudioAlerts: true,
        enableBrowserNotifications: true,
        defaultReminderMinutes: 15,
        soundTheme: 'chime',
      },
    };

    const updatedUsers = [...users, newUser];
    this.saveUsers(updatedUsers);
    this.setCurrentUser(newUser.id);

    // Initialize personal starting tasks for the new user
    const today = getTodayDateString();
    const initialTasks: Task[] = [
      {
        id: 'task-welcome-1',
        userId: newUser.id,
        title: 'Bienvenue dans votre espace de tâches privé ! 🎉',
        description: 'Explorez la vue par jour, semaine et mois du calendrier. Activez les notifications pour recevoir vos rappels sonores.',
        completed: false,
        dueDate: today,
        dueTime: '14:00',
        priority: 'high',
        category: 'work',
        reminder: true,
        reminderMinutesBefore: 15,
        subtasks: [
          { id: 'sub-w1', title: 'Découvrir la vue calendrier semaine et mois', completed: true },
          { id: 'sub-w2', title: 'Créer ma première tâche personnelle avec rappel', completed: false },
          { id: 'sub-w3', title: 'Tester le filtre par catégorie', completed: false },
        ],
        createdAt: new Date().toISOString(),
      },
      {
        id: 'task-welcome-2',
        userId: newUser.id,
        title: 'Planifier mes priorités de la semaine',
        description: 'Définir les échéances importantes et organiser par catégorie (Travail, Projets, Santé, etc.).',
        completed: false,
        dueDate: today,
        dueTime: '18:00',
        priority: 'medium',
        category: 'project',
        reminder: true,
        reminderMinutesBefore: 30,
        subtasks: [
          { id: 'sub-w4', title: 'Lister les tâches prioritaires', completed: false },
        ],
        createdAt: new Date().toISOString(),
      },
    ];

    this.saveUserTasks(newUser.id, initialTasks);

    // Initial welcome notification
    this.addNotification(newUser.id, {
      title: `Bienvenue ${newUser.name} ! 🎉`,
      message: 'Votre compte privé a été créé. Vos tâches et rappels sont isolés en toute sécurité.',
      type: 'info',
    });

    return { user: newUser };
  },

  // Login existing user
  loginUser(email: string, password?: string): { user?: User; error?: string } {
    const users = this.getUsers();
    const cleanEmail = email.trim().toLowerCase();
    const user = users.find((u) => u.email.toLowerCase() === cleanEmail);

    if (!user) {
      return { error: 'Aucun compte trouvé avec cet email. Veuillez créer votre compte.' };
    }

    if (password && user.password && user.password !== password) {
      return { error: 'Mot de passe incorrect.' };
    }

    this.setCurrentUser(user.id);
    return { user };
  },

  // Update user profile or settings
  updateUserProfile(userId: string, updates: Partial<User>): User | null {
    const users = this.getUsers();
    let updatedUser: User | null = null;

    const newUsers = users.map((u) => {
      if (u.id === userId) {
        updatedUser = {
          ...u,
          ...updates,
          settings: {
            ...u.settings,
            ...(updates.settings || {}),
          },
        };
        return updatedUser;
      }
      return u;
    });

    if (updatedUser) {
      this.saveUsers(newUsers);
    }
    return updatedUser;
  },

  // User Tasks Storage (Strictly Isolated by userId)
  getUserTasks(userId: string): Task[] {
    if (!userId) return [];
    const key = `mobile_tasks_private_v3_${userId}`;
    try {
      const data = localStorage.getItem(key);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.error('Failed to get tasks for user', e);
    }
    return [];
  },

  saveUserTasks(userId: string, tasks: Task[]) {
    if (!userId) return;
    const key = `mobile_tasks_private_v3_${userId}`;
    try {
      localStorage.setItem(key, JSON.stringify(tasks));
    } catch (e) {
      console.error('Failed to save tasks for user', e);
    }
  },

  // User Notifications Storage (Strictly Isolated by userId)
  getUserNotifications(userId: string): AppNotification[] {
    if (!userId) return [];
    const key = `mobile_notifs_private_v3_${userId}`;
    try {
      const data = localStorage.getItem(key);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.error('Failed to get notifs for user', e);
    }
    return [];
  },

  saveUserNotifications(userId: string, notifs: AppNotification[]) {
    if (!userId) return;
    const key = `mobile_notifs_private_v3_${userId}`;
    try {
      localStorage.setItem(key, JSON.stringify(notifs));
    } catch (e) {
      console.error('Failed to save notifs for user', e);
    }
  },

  addNotification(
    userId: string,
    notif: Omit<AppNotification, 'id' | 'userId' | 'timestamp' | 'read'>
  ): AppNotification {
    const list = this.getUserNotifications(userId);
    const newNotif: AppNotification = {
      ...notif,
      id: 'notif-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
      userId,
      timestamp: new Date().toISOString(),
      read: false,
    };
    const updated = [newNotif, ...list].slice(0, 50); // Keep latest 50
    this.saveUserNotifications(userId, updated);
    return newNotif;
  },

  markAllNotificationsAsRead(userId: string) {
    const list = this.getUserNotifications(userId);
    const updated = list.map((n) => ({ ...n, read: true }));
    this.saveUserNotifications(userId, updated);
  },

  clearNotifications(userId: string) {
    this.saveUserNotifications(userId, []);
  },
};
