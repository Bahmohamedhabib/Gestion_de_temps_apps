import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  sendEmailVerification,
  sendPasswordResetEmail,
  reload,
  signOut,
  onAuthStateChanged,
  updateProfile,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  collection,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore';
import firebaseConfigData from '../../firebase-applet-config.json';
import { Task, User, AppNotification, UserSettings } from '../types';

const firebaseConfig = {
  apiKey: firebaseConfigData.apiKey,
  authDomain: firebaseConfigData.authDomain,
  projectId: firebaseConfigData.projectId,
  storageBucket: firebaseConfigData.storageBucket,
  messagingSenderId: firebaseConfigData.messagingSenderId,
  appId: firebaseConfigData.appId,
};

// Initialize Firebase App
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Firebase Authentication
export const auth = getAuth(app);

// Initialize Firestore with specific database ID if specified
export const db = firebaseConfigData.firestoreDatabaseId && firebaseConfigData.firestoreDatabaseId !== '(default)'
  ? getFirestore(app, firebaseConfigData.firestoreDatabaseId)
  : getFirestore(app);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map((provider) => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  return errInfo;
}

/**
 * Cloud Authentication & Firestore Service
 */
export const cloudDb = {
  // Get User Profile from Firestore
  async getUserProfile(userId: string): Promise<User | null> {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        const userData = userDoc.data() as User;
        return {
          ...userData,
          emailVerified: auth.currentUser?.emailVerified ?? userData.emailVerified,
        };
      }
      return null;
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, `users/${userId}`);
      return null;
    }
  },
  // Sign Up with Email and Password + Automatic Verification Email
  async signUp(
    name: string,
    email: string,
    password: string,
    avatarColor = '#4F46E5',
    role = 'Personnel',
    sendVerification = true
  ): Promise<User> {
    const cleanEmail = email.trim().toLowerCase();
    const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, password);
    const fbUser = userCredential.user;

    await updateProfile(fbUser, { displayName: name.trim() });

    // Send Firebase Verification Email automatically if requested
    if (sendVerification) {
      try {
        await sendEmailVerification(fbUser);
      } catch (err) {
        console.warn('Could not auto-send verification email:', err);
      }
    }

    const defaultSettings: UserSettings = {
      enableAudioAlerts: true,
      enableBrowserNotifications: true,
      enableVibration: true,
      defaultReminderMinutes: 15,
      defaultAlarmSound: 'digital',
      soundTheme: 'chime',
    };

    const newUser: User = {
      id: fbUser.uid,
      name: name.trim() || 'Utilisateur',
      email: cleanEmail,
      avatarColor,
      role: role.trim() || 'Personnel',
      createdAt: new Date().toISOString(),
      emailVerified: fbUser.emailVerified,
      settings: defaultSettings,
    };

    // Save profile to Firestore
    await setDoc(doc(db, 'users', fbUser.uid), newUser);

    // Create starter tasks
    const todayStr = new Date().toISOString().split('T')[0];
    const initialTasks: Omit<Task, 'id'>[] = [
      {
        userId: fbUser.uid,
        title: 'Synchronisation Cloud activée ! ☁️',
        description: 'Vos tâches sont maintenant synchronisées en temps réel entre votre PC, téléphone et tablette grâce à Firebase Firestore.',
        completed: false,
        dueDate: todayStr,
        dueTime: '14:00',
        priority: 'high',
        category: 'work',
        reminder: true,
        reminderMinutesBefore: 15,
        alarmSound: 'digital',
        sharedWith: [],
        sharedWithEmails: [],
        creatorEmail: cleanEmail,
        creatorName: name.trim(),
        subtasks: [
          { id: 'sub-c1', title: 'Ouvrir l\'application sur mobile pour voir la synchronisation', completed: false },
          { id: 'sub-c2', title: 'Partager une tâche avec un ami par son e-mail', completed: false },
          { id: 'sub-c3', title: 'Personnaliser ma sonnerie d\'alarme dans les paramètres', completed: true },
        ],
        createdAt: new Date().toISOString(),
      },
      {
        userId: fbUser.uid,
        title: 'Planifier mes priorités de la semaine',
        description: 'Tâche synchronisée sur tous vos appareils en direct.',
        completed: false,
        dueDate: todayStr,
        dueTime: '18:30',
        priority: 'medium',
        category: 'project',
        reminder: true,
        reminderMinutesBefore: 30,
        alarmSound: 'melodic',
        sharedWith: [],
        sharedWithEmails: [],
        creatorEmail: cleanEmail,
        creatorName: name.trim(),
        subtasks: [
          { id: 'sub-c4', title: 'Lister les tâches prioritaires', completed: false },
        ],
        createdAt: new Date().toISOString(),
      },
    ];

    for (const t of initialTasks) {
      const taskDocRef = doc(collection(db, 'tasks'));
      await setDoc(taskDocRef, { ...t, id: taskDocRef.id });
    }

    // Welcome Notification
    const notifDocRef = doc(collection(db, 'notifications'));
    await setDoc(notifDocRef, {
      id: notifDocRef.id,
      userId: fbUser.uid,
      title: `Bienvenue sur le Cloud ${name} ! 🚀`,
      message: 'Vos données sont synchronisées en temps réel et sécurisées sur votre compte.',
      type: 'info',
      timestamp: new Date().toISOString(),
      read: false,
    });

    return newUser;
  },

  // Sign In with Email and Password
  async signIn(email: string, password: string): Promise<User> {
    const cleanEmail = email.trim().toLowerCase();
    const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, password);
    const fbUser = userCredential.user;

    // Fetch user profile from Firestore
    const userDoc = await getDoc(doc(db, 'users', fbUser.uid));
    if (userDoc.exists()) {
      const userData = userDoc.data() as User;
      return {
        ...userData,
        emailVerified: fbUser.emailVerified,
      };
    }

    // If profile document does not exist yet, build one
    const newUser: User = {
      id: fbUser.uid,
      name: fbUser.displayName || 'Utilisateur',
      email: cleanEmail,
      avatarColor: '#4F46E5',
      role: 'Personnel',
      createdAt: new Date().toISOString(),
      emailVerified: fbUser.emailVerified,
      settings: {
        enableAudioAlerts: true,
        enableBrowserNotifications: true,
        enableVibration: true,
        defaultReminderMinutes: 15,
        defaultAlarmSound: 'digital',
        soundTheme: 'chime',
      },
    };
    await setDoc(doc(db, 'users', fbUser.uid), newUser);
    return newUser;
  },

  // Sign In with Google (Active provider in Firebase Console)
  async signInWithGoogle(): Promise<User> {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    const userCredential = await signInWithPopup(auth, provider);
    const fbUser = userCredential.user;

    const userDoc = await getDoc(doc(db, 'users', fbUser.uid));
    if (userDoc.exists()) {
      const userData = userDoc.data() as User;
      return {
        ...userData,
        emailVerified: fbUser.emailVerified,
      };
    }

    const newUser: User = {
      id: fbUser.uid,
      name: fbUser.displayName || 'Utilisateur Google',
      email: fbUser.email || '',
      avatarColor: '#4F46E5',
      role: 'Personnel',
      createdAt: new Date().toISOString(),
      emailVerified: fbUser.emailVerified,
      settings: {
        enableAudioAlerts: true,
        enableBrowserNotifications: true,
        enableVibration: true,
        defaultReminderMinutes: 15,
        defaultAlarmSound: 'digital',
        soundTheme: 'chime',
      },
    };
    await setDoc(doc(db, 'users', fbUser.uid), newUser);
    return newUser;
  },

  // Send Email Verification Link via Firebase
  async sendVerificationEmail(): Promise<{ success: boolean; message: string }> {
    if (!auth.currentUser) {
      return { success: false, message: 'Aucun utilisateur connecté.' };
    }
    try {
      await sendEmailVerification(auth.currentUser);
      return {
        success: true,
        message: `Email de vérification envoyé à ${auth.currentUser.email}. Vérifiez votre boîte de réception et vos spams.`,
      };
    } catch (err: any) {
      console.error('Error sending email verification:', err);
      if (err.code === 'auth/too-many-requests') {
        return {
          success: false,
          message: 'Trop de demandes consécutives. Veuillez patienter quelques instants avant de réessayer.',
        };
      }
      return {
        success: false,
        message: err.message || 'Impossible d\'envoyer l\'email de vérification.',
      };
    }
  },

  // Send Password Reset Email via Firebase
  async resetPassword(email: string): Promise<{ success: boolean; message: string }> {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      return { success: false, message: 'Veuillez renseigner une adresse email valide.' };
    }

    try {
      await sendPasswordResetEmail(auth, cleanEmail);
      return {
        success: true,
        message: `Un lien de réinitialisation sécurisé a été envoyé à l'adresse ${cleanEmail}.`,
      };
    } catch (err: any) {
      console.error('Error sending password reset email:', err);
      if (err.code === 'auth/user-not-found') {
        return {
          success: false,
          message: 'Aucun compte associé à cette adresse e-mail.',
        };
      } else if (err.code === 'auth/invalid-email') {
        return {
          success: false,
          message: 'Format d\'adresse email invalide.',
        };
      } else if (err.code === 'auth/too-many-requests') {
        return {
          success: false,
          message: 'Trop de tentatives. Veuillez patienter avant de réessayer.',
        };
      }
      return {
        success: false,
        message: err.message || 'Échec de l\'envoi du lien de réinitialisation.',
      };
    }
  },

  // Reload Current User to refresh emailVerified status
  async reloadCurrentUser(): Promise<{ emailVerified: boolean; user: FirebaseUser | null }> {
    if (!auth.currentUser) {
      return { emailVerified: false, user: null };
    }
    try {
      await reload(auth.currentUser);
      return {
        emailVerified: auth.currentUser.emailVerified,
        user: auth.currentUser,
      };
    } catch (err) {
      console.error('Error reloading user:', err);
      return {
        emailVerified: auth.currentUser.emailVerified,
        user: auth.currentUser,
      };
    }
  },

  // Sign Out
  async signOut(): Promise<void> {
    await signOut(auth);
  },

  // Update user profile and settings
  async updateUserProfile(userId: string, updates: Partial<User>): Promise<void> {
    await updateDoc(doc(db, 'users', userId), updates);
  },

  // Save or Update Task in Cloud Firestore
  async saveTask(task: Task): Promise<void> {
    const taskDocRef = doc(db, 'tasks', task.id);
    await setDoc(taskDocRef, {
      ...task,
      sharedWith: task.sharedWith || [],
      sharedWithEmails: (task.sharedWithEmails || []).map((e) => e.trim().toLowerCase()),
    }, { merge: true });
  },

  // Delete Task in Cloud Firestore
  async deleteTask(taskId: string): Promise<void> {
    await deleteDoc(doc(db, 'tasks', taskId));
  },

  // Share Task with an Email Address
  async shareTask(taskId: string, targetEmail: string): Promise<{ success: boolean; message: string }> {
    const cleanEmail = targetEmail.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      return { success: false, message: 'Veuillez saisir une adresse e-mail valide.' };
    }

    const taskDoc = await getDoc(doc(db, 'tasks', taskId));
    if (!taskDoc.exists()) {
      return { success: false, message: 'Tâche introuvable.' };
    }

    const currentTask = taskDoc.data() as Task;
    const currentEmails = currentTask.sharedWithEmails || [];

    if (currentEmails.includes(cleanEmail)) {
      return { success: false, message: `Cette tâche est déjà partagée avec ${cleanEmail}.` };
    }

    const updatedEmails = [...currentEmails, cleanEmail];
    await updateDoc(doc(db, 'tasks', taskId), {
      sharedWithEmails: updatedEmails,
    });

    return { success: true, message: `Tâche partagée avec succès avec ${cleanEmail} !` };
  },

  // Remove Collaborator from Task
  async unshareTask(taskId: string, targetEmail: string): Promise<void> {
    const cleanEmail = targetEmail.trim().toLowerCase();
    const taskDoc = await getDoc(doc(db, 'tasks', taskId));
    if (taskDoc.exists()) {
      const currentTask = taskDoc.data() as Task;
      const updatedEmails = (currentTask.sharedWithEmails || []).filter((e) => e.toLowerCase() !== cleanEmail);
      await updateDoc(doc(db, 'tasks', taskId), {
        sharedWithEmails: updatedEmails,
      });
    }
  },

  // Save Notification in Cloud Firestore
  async addNotification(notif: Omit<AppNotification, 'id'>): Promise<string> {
    const notifRef = doc(collection(db, 'notifications'));
    const notifData = {
      ...notif,
      id: notifRef.id,
    };
    await setDoc(notifRef, notifData);
    return notifRef.id;
  },

  // Mark all notifications as read
  async markAllNotificationsAsRead(notifications: AppNotification[]): Promise<void> {
    const unread = notifications.filter((n) => !n.read);
    for (const n of unread) {
      try {
        await updateDoc(doc(db, 'notifications', n.id), { read: true });
      } catch (e) {
        console.error('Error marking notif read:', e);
      }
    }
  },

  // Clear all notifications
  async clearNotifications(notifications: AppNotification[]): Promise<void> {
    for (const n of notifications) {
      try {
        await deleteDoc(doc(db, 'notifications', n.id));
      } catch (e) {
        console.error('Error deleting notif:', e);
      }
    }
  },

  // Real-time listener for user tasks (both owned tasks AND tasks shared with the user)
  subscribeUserTasks(
    userId: string,
    userEmail: string,
    onTasksUpdated: (tasks: Task[]) => void,
    onError?: (error: Error) => void
  ): () => void {
    const cleanEmail = userEmail.trim().toLowerCase();
    let isCleanedUp = false;
    let unsubOwned: (() => void) | null = null;
    let unsubShared: (() => void) | null = null;
    let authUnsub: (() => void) | null = null;

    let ownedTasks: Task[] = [];
    let sharedTasks: Task[] = [];

    const emitMergedTasks = () => {
      if (isCleanedUp) return;
      const taskMap = new Map<string, Task>();
      for (const t of ownedTasks) {
        taskMap.set(t.id, t);
      }
      for (const t of sharedTasks) {
        taskMap.set(t.id, t);
      }
      const combined = Array.from(taskMap.values());
      // Sort by dueDate then dueTime
      combined.sort((a, b) => {
        const dateComp = a.dueDate.localeCompare(b.dueDate);
        if (dateComp !== 0) return dateComp;
        return (a.dueTime || '23:59').localeCompare(b.dueTime || '23:59');
      });
      onTasksUpdated(combined);
    };

    const startQueries = () => {
      if (isCleanedUp) return;

      // 1. Query owned tasks
      try {
        const ownedQuery = query(collection(db, 'tasks'), where('userId', '==', userId));
        unsubOwned = onSnapshot(
          ownedQuery,
          (snapshot) => {
            ownedTasks = [];
            snapshot.forEach((docSnap) => {
              const data = docSnap.data() as Task;
              ownedTasks.push({
                ...data,
                id: docSnap.id,
                sharedWith: data.sharedWith || [],
                sharedWithEmails: data.sharedWithEmails || [],
              });
            });
            emitMergedTasks();
          },
          (err) => {
            handleFirestoreError(err, OperationType.LIST, 'tasks');
            if (onError) onError(err);
          }
        );
      } catch (err: any) {
        handleFirestoreError(err, OperationType.LIST, 'tasks');
      }

      // 2. Query shared tasks if email is present
      if (cleanEmail) {
        try {
          const sharedQuery = query(
            collection(db, 'tasks'),
            where('sharedWithEmails', 'array-contains', cleanEmail)
          );
          unsubShared = onSnapshot(
            sharedQuery,
            (snapshot) => {
              sharedTasks = [];
              snapshot.forEach((docSnap) => {
                const data = docSnap.data() as Task;
                sharedTasks.push({
                  ...data,
                  id: docSnap.id,
                  sharedWith: data.sharedWith || [],
                  sharedWithEmails: data.sharedWithEmails || [],
                });
              });
              emitMergedTasks();
            },
            (err) => {
              // Ignore if user has no shared queries permitted
              console.warn('Shared tasks listener:', err.message);
            }
          );
        } catch (err: any) {
          console.warn('Shared tasks query error:', err);
        }
      }
    };

    if (auth.currentUser && auth.currentUser.uid === userId) {
      startQueries();
    } else {
      authUnsub = onAuthStateChanged(auth, (user) => {
        if (user && user.uid === userId) {
          if (!unsubOwned) {
            startQueries();
          }
        }
      });
    }

    return () => {
      isCleanedUp = true;
      if (unsubOwned) unsubOwned();
      if (unsubShared) unsubShared();
      if (authUnsub) authUnsub();
    };
  },

  // Real-time listener for user notifications
  subscribeUserNotifications(
    userId: string,
    onNotifsUpdated: (notifs: AppNotification[]) => void,
    onError?: (error: Error) => void
  ): () => void {
    let isCleanedUp = false;
    let unsub: (() => void) | null = null;
    let authUnsub: (() => void) | null = null;

    const startQuery = () => {
      if (isCleanedUp) return;
      try {
        const notifsQuery = query(
          collection(db, 'notifications'),
          where('userId', '==', userId)
        );
        unsub = onSnapshot(
          notifsQuery,
          (snapshot) => {
            const notifs: AppNotification[] = [];
            snapshot.forEach((docSnap) => {
              const data = docSnap.data() as AppNotification;
              notifs.push({ ...data, id: docSnap.id });
            });
            notifs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
            onNotifsUpdated(notifs.slice(0, 50));
          },
          (err) => {
            handleFirestoreError(err, OperationType.LIST, 'notifications');
            if (onError) onError(err);
          }
        );
      } catch (err: any) {
        handleFirestoreError(err, OperationType.LIST, 'notifications');
      }
    };

    if (auth.currentUser && auth.currentUser.uid === userId) {
      startQuery();
    } else {
      authUnsub = onAuthStateChanged(auth, (user) => {
        if (user && user.uid === userId) {
          if (!unsub) {
            startQuery();
          }
        }
      });
    }

    return () => {
      isCleanedUp = true;
      if (unsub) unsub();
      if (authUnsub) authUnsub();
    };
  },
};
