import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  deleteDoc,
  serverTimestamp,
  increment
} from 'firebase/firestore';
import firebaseConfigData from '../../firebase-applet-config.json';
import { UserProfile, ChatSession, ChatMessage } from '../types';

// Initialize Firebase app once
const app = getApps().length === 0 ? initializeApp(firebaseConfigData) : getApp();

// Auth instance
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Firestore instance with database ID from config
const rawDbId = (firebaseConfigData as any).firestoreDatabaseId;
const databaseId = rawDbId && rawDbId !== '' ? rawDbId : '(default)';

export const db = getFirestore(app, databaseId);

/**
 * Handle user Google Sign In
 */
export async function loginWithGoogle(): Promise<FirebaseUser | null> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error: any) {
    console.warn('Google Popup Sign-in encountered an issue, trying redirect:', error);
    if (
      error?.code === 'auth/popup-blocked' ||
      error?.code === 'auth/popup-closed-by-user' ||
      error?.code === 'auth/cancelled-popup-request'
    ) {
      try {
        await signInWithRedirect(auth, googleProvider);
        return null;
      } catch (redirectErr) {
        console.error('Redirect sign-in error:', redirectErr);
        throw redirectErr;
      }
    }
    throw error;
  }
}

/**
 * Check redirect result after returning from sign-in redirect
 */
export async function checkRedirectResult(): Promise<FirebaseUser | null> {
  try {
    const result = await getRedirectResult(auth);
    if (result && result.user) {
      return result.user;
    }
  } catch (err) {
    console.error('Error checking redirect result:', err);
  }
  return null;
}

/**
 * Sign out user
 */
export async function logoutUser(): Promise<void> {
  await signOut(auth);
}

/**
 * Sync or create user account record in Firestore when user signs in
 */
export async function syncUserProfile(user: FirebaseUser): Promise<UserProfile> {
  const userRef = doc(db, 'users', user.uid);
  const snap = await getDoc(userRef);

  const now = Date.now();

  if (!snap.exists()) {
    // Brand new user sign up - initialize user account
    const newProfile: UserProfile = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || (user.email ? user.email.split('@')[0] : 'Viber AI User'),
      photoURL: user.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.uid}`,
      createdAt: now,
      lastLoginAt: now,
      totalChats: 0,
      totalMessages: 0,
      preferredVibe: 'turbo',
      isNewUser: true
    };

    await setDoc(userRef, newProfile);
    return newProfile;
  } else {
    // Existing user - update last login timestamp
    const existing = snap.data() as UserProfile;
    const updatedProfile: UserProfile = {
      ...existing,
      lastLoginAt: now,
      displayName: user.displayName || existing.displayName,
      photoURL: user.photoURL || existing.photoURL,
      isNewUser: false
    };

    await updateDoc(userRef, {
      lastLoginAt: now,
      displayName: updatedProfile.displayName,
      photoURL: updatedProfile.photoURL
    });

    return updatedProfile;
  }
}

/**
 * Create a new Chat Session in Firestore
 */
export async function createChatSession(
  userId: string,
  title: string = 'New Conversation',
  vibeMode: string = 'turbo',
  model: string = 'gemini-2.5-flash'
): Promise<string> {
  const chatsRef = collection(db, 'users', userId, 'chats');
  const now = Date.now();
  const docRef = await addDoc(chatsRef, {
    userId,
    title,
    createdAt: now,
    updatedAt: now,
    vibeMode,
    model,
    messageCount: 0,
    lastMessageSnippet: ''
  });

  // Increment user chat count
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, {
    totalChats: increment(1)
  }).catch(() => {});

  return docRef.id;
}

/**
 * Update chat session info (e.g. title, snippet, time)
 */
export async function updateChatSession(
  userId: string,
  chatId: string,
  updates: Partial<ChatSession>
): Promise<void> {
  const chatRef = doc(db, 'users', userId, 'chats', chatId);
  await updateDoc(chatRef, {
    ...updates,
    updatedAt: Date.now()
  });
}

/**
 * Delete a chat session and its history
 */
export async function deleteChatSession(userId: string, chatId: string): Promise<void> {
  const chatRef = doc(db, 'users', userId, 'chats', chatId);
  await deleteDoc(chatRef);
}

/**
 * Save a message into Firestore chat history
 */
export async function saveChatMessage(
  userId: string,
  chatId: string,
  message: ChatMessage
): Promise<void> {
  const messagesRef = collection(db, 'users', userId, 'chats', chatId, 'messages');
  const messageDoc = doc(messagesRef, message.id);
  
  await setDoc(messageDoc, {
    ...message,
    timestamp: message.timestamp || Date.now()
  });

  // Update chat metadata
  const snippet = message.content.slice(0, 80) + (message.content.length > 80 ? '...' : '');
  await updateChatSession(userId, chatId, {
    lastMessageSnippet: snippet,
    updatedAt: Date.now()
  });

  // Increment message count on user profile
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, {
    totalMessages: increment(1)
  }).catch(() => {});
}

/**
 * Subscribe to User's Chat Sessions in Firestore
 */
export function subscribeToUserChats(
  userId: string,
  callback: (chats: ChatSession[]) => void
) {
  const chatsRef = collection(db, 'users', userId, 'chats');
  const q = query(chatsRef, orderBy('updatedAt', 'desc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const chats: ChatSession[] = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...(docSnap.data() as Omit<ChatSession, 'id'>)
      }));
      callback(chats);
    },
    (err) => {
      console.error('Error listening to chat sessions:', err);
      callback([]);
    }
  );
}

/**
 * Subscribe to Messages of a specific chat session
 */
export function subscribeToChatMessages(
  userId: string,
  chatId: string,
  callback: (messages: ChatMessage[]) => void
) {
  const messagesRef = collection(db, 'users', userId, 'chats', chatId, 'messages');
  const q = query(messagesRef, orderBy('timestamp', 'asc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const messages: ChatMessage[] = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...(docSnap.data() as Omit<ChatMessage, 'id'>)
      }));
      callback(messages);
    },
    (err) => {
      console.error('Error listening to messages:', err);
      callback([]);
    }
  );
}
