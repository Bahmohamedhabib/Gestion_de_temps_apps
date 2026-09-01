import { User, Task, AppNotification, UserSettings } from '../types';
import { DEFAULT_USERS, getUserInitialTasks } from '../data/defaultUsers';

const USERS_STORAGE_KEY = 'mobile_tasks_users_list_v2';
const CURRENT_USER_KEY = 'mobile_tasks_active_user_v2';

export const authStorage = {
  // Get all registered users
  getUsers(): User[] {
    try {
      const data = localStorage.getItem(USERS_STORAGE_KEY);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.error('Failed to parse users', e);
    }
    // Seed default users if first time
    this.saveUsers(DEFAULT_USERS);
    return DEFAULT_USERS;
  },

  saveUsers(users: User[]) {
    try {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    } catch (e) {
      console.error('Failed to save users', e);
    }
  },

  // Get current active user
  getCurrentUser(): User {
    const users = this.getUsers();
    try {
      const activeId = localStorage.getItem(CURRENT_USER_KEY);
      if (activeId) {
        const found = users.find((u) => u.id === activeId);
        if (found) return found;
      }
    } catch (e) {
      console.error('Failed to get active user', e);
    }
    // Default to first user (Habib Bah)
    const defaultUser = users[0] || DEFAULT_USERS[0];
    this.setCurrentUser(defaultUser.id);
    return defaultUser;
  },

  setCurrentUser(userId: string) {
    try {
      localStorage.setItem(CURRENT_USER_KEY, userId);
    } catch (e) {
      console.error('Failed to set active user', e);
    }
  },

  // Register new user
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
      return { error: 'L\'adresse email est obligatoire.' };
    }
    if (!name.trim()) {
      return { error: 'Le nom complet est obligatoire.' };
    }

    const existing = users.find((u) => u.email.toLowerCase() === cleanEmail);
    if (existing) {
      return { error: 'Un compte existe déjà avec cette adresse email.' };
    }

    const newUser: User = {
      id: 'user-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
      name: name.trim(),
      email: cleanEmail,
      password: password || '123456',
      avatarColor,
      role: role?.trim() || 'Utilisateur',
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

    // Initialize welcoming tasks
    const initialTasks = getUserInitialTasks(newUser.id);
    this.saveUserTasks(newUser.id, initialTasks);

    // Initial welcome notification
    this.addNotification(newUser.id, {
      title: `Bienvenue ${newUser.name} ! 🎉`,
      message: 'Votre compte a été créé avec succès. Vos tâches sont synchronisées et privées.',
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
      return { error: 'Aucun compte trouvé avec cet email.' };
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

  // User Tasks Storage (Isolated by userId)
  getUserTasks(userId: string): Task[] {
    const key = `mobile_tasks_user_v2_${userId}`;
    try {
      const data = localStorage.getItem(key);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.error(`Failed to load tasks for user ${userId}`, e);
    }
    // Return initial tasks for user
    const initial = getUserInitialTasks(userId);
    this.saveUserTasks(userId, initial);
    return initial;
  },

  saveUserTasks(userId: string, tasks: Task[]) {
    const key = `mobile_tasks_user_v2_${userId}`;
    try {
      localStorage.setItem(key, JSON.stringify(tasks));
    } catch (e) {
      console.error(`Failed to save tasks for user ${userId}`, e);
    }
  },

  // Notifications Storage (Isolated by userId)
  getUserNotifications(userId: string): AppNotification[] {
    const key = `mobile_notifs_user_v2_${userId}`;
    try {
      const data = localStorage.getItem(key);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.error('Failed to load notifications', e);
    }
    return [];
  },

  saveUserNotifications(userId: string, notifs: AppNotification[]) {
    const key = `mobile_notifs_user_v2_${userId}`;
    try {
      localStorage.setItem(key, JSON.stringify(notifs.slice(0, 50))); // Keep max 50 recent
    } catch (e) {
      console.error('Failed to save notifications', e);
    }
  },

  addNotification(
    userId: string,
    notif: Omit<AppNotification, 'id' | 'userId' | 'timestamp' | 'read'>
  ): AppNotification {
    const current = this.getUserNotifications(userId);
    const newNotif: AppNotification = {
      id: 'notif-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
      userId,
      timestamp: new Date().toISOString(),
      read: false,
      ...notif,
    };
    const updated = [newNotif, ...current];
    this.saveUserNotifications(userId, updated);
    return newNotif;
  },

  markNotificationAsRead(userId: string, notifId: string) {
    const current = this.getUserNotifications(userId);
    const updated = current.map((n) => (n.id === notifId ? { ...n, read: true } : n));
    this.saveUserNotifications(userId, updated);
  },

  markAllNotificationsAsRead(userId: string) {
    const current = this.getUserNotifications(userId);
    const updated = current.map((n) => ({ ...n, read: true }));
    this.saveUserNotifications(userId, updated);
  },

  clearNotifications(userId: string) {
    this.saveUserNotifications(userId, []);
  },
};
