import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { ChatWindow } from './components/ChatWindow';
import { AuthModal } from './components/AuthModal';
import { UserProfileModal } from './components/UserProfileModal';
import { GoogleDriveExportModal } from './components/GoogleDriveExportModal';
import {
  auth,
  logoutUser,
  syncUserProfile,
  createChatSession,
  deleteChatSession,
  saveChatMessage,
  subscribeToUserChats,
  subscribeToChatMessages,
  checkRedirectResult
} from './lib/firebase';
import { UserProfile, ChatSession, ChatMessage } from './types';
import { onAuthStateChanged } from 'firebase/auth';
import { Sparkles, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isGuest, setIsGuest] = useState(true);
  const [loadingAuth, setLoadingAuth] = useState(false);

  // Modals & Drawers State
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [driveExportModalOpen, setDriveExportModalOpen] = useState(false);
  const [newUserToast, setNewUserToast] = useState(false);

  // Chat state
  const [chats, setChats] = useState<ChatSession[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingAI, setLoadingAI] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // AI settings
  const [currentVibe, setCurrentVibe] = useState('turbo');
  const [currentModel, setCurrentModel] = useState('gemini-2.5-flash');

  // Check Auth State on App Load with automatic fallback
  useEffect(() => {
    // Fallback timer to prevent getting stuck on loading screen
    const timer = setTimeout(() => {
      setLoadingAuth(false);
    }, 1200);

    // Check if returning from OAuth redirect
    checkRedirectResult().catch((err) => {
      console.warn('OAuth redirect check notice:', err);
    });

    const unsubscribe = onAuthStateChanged(
      auth,
      async (firebaseUser) => {
        if (firebaseUser) {
          try {
            const profile = await syncUserProfile(firebaseUser);
            setUser(profile);
            setIsGuest(false);

            if (profile.isNewUser) {
              setNewUserToast(true);
              setTimeout(() => setNewUserToast(false), 6000);
            }
          } catch (err) {
            console.error('Error syncing user profile:', err);
          }
        } else {
          setUser(null);
          // Auto-enable guest view if not logged in so UI renders immediately
          setIsGuest(true);
        }
        setLoadingAuth(false);
        clearTimeout(timer);
      },
      (error) => {
        console.warn('Auth state listener error:', error);
        setIsGuest(true);
        setLoadingAuth(false);
        clearTimeout(timer);
      }
    );

    return () => {
      clearTimeout(timer);
      unsubscribe();
    };
  }, []);

  // Subscribe to User's Firestore Chats when User changes
  useEffect(() => {
    if (!user) {
      setChats([]);
      return;
    }

    const unsubscribe = subscribeToUserChats(user.uid, (firestoreChats) => {
      setChats(firestoreChats);
      // Auto-select first chat if no active chat selected
      if (firestoreChats.length > 0 && !activeChatId) {
        setActiveChatId(firestoreChats[0].id);
      }
    });

    return () => unsubscribe();
  }, [user]);

  // Subscribe to Current Chat Messages in Firestore
  useEffect(() => {
    if (!user || !activeChatId) {
      if (isGuest && !activeChatId) {
        setMessages([]);
      }
      return;
    }

    const unsubscribe = subscribeToChatMessages(user.uid, activeChatId, (chatMsgs) => {
      setMessages(chatMsgs);
    });

    return () => unsubscribe();
  }, [user, activeChatId, isGuest]);

  // Handle Log Out
  const handleLogout = async () => {
    try {
      await logoutUser();
      setUser(null);
      setIsGuest(false);
      setChats([]);
      setActiveChatId(null);
      setMessages([]);
      setAuthModalOpen(true);
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  // Create New Chat
  const handleNewChat = async () => {
    setAiError(null);
    if (user) {
      try {
        const newId = await createChatSession(user.uid, 'New Conversation', currentVibe, currentModel);
        setActiveChatId(newId);
        setMessages([]);
      } catch (err) {
        console.error('Error creating chat session:', err);
      }
    } else {
      // Guest mode chat creation
      const guestChatId = `guest_${Date.now()}`;
      const newGuestChat: ChatSession = {
        id: guestChatId,
        userId: 'guest',
        title: 'Guest Conversation',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        vibeMode: currentVibe,
        model: currentModel,
        messageCount: 0
      };
      setChats(prev => [newGuestChat, ...prev]);
      setActiveChatId(guestChatId);
      setMessages([]);
    }
  };

  // Delete Chat
  const handleDeleteChat = async (chatId: string) => {
    if (user) {
      await deleteChatSession(user.uid, chatId);
    } else {
      setChats(prev => prev.filter(c => c.id !== chatId));
    }
    if (activeChatId === chatId) {
      setActiveChatId(null);
      setMessages([]);
    }
  };

  // Send Message to Viber AI Server
  const handleSendMessage = async (text: string, imageBase64?: string) => {
    setAiError(null);

    // Ensure we have an active chat ID
    let currentId = activeChatId;
    if (!currentId) {
      if (user) {
        const titleSnippet = text.slice(0, 30) || 'New Conversation';
        currentId = await createChatSession(user.uid, titleSnippet, currentVibe, currentModel);
        setActiveChatId(currentId);
      } else {
        currentId = `guest_${Date.now()}`;
        const newGuestChat: ChatSession = {
          id: currentId,
          userId: 'guest',
          title: text.slice(0, 30) || 'Guest Conversation',
          createdAt: Date.now(),
          updatedAt: Date.now(),
          vibeMode: currentVibe,
          model: currentModel,
          messageCount: 0
        };
        setChats(prev => [newGuestChat, ...prev]);
        setActiveChatId(currentId);
      }
    }

    // User Message Object
    const userMessage: ChatMessage = {
      id: `msg_user_${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: Date.now(),
      imageBase64
    };

    // Optimistically update local messages array
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);

    // Save user message to Firestore if authenticated
    if (user && currentId) {
      await saveChatMessage(user.uid, currentId, userMessage);
    }

    setLoadingAI(true);

    try {
      // API call to full-stack Express Viber AI server
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: updatedMessages.map(m => ({
            role: m.role,
            content: m.content,
            imageBase64: m.imageBase64
          })),
          vibeMode: currentVibe,
          model: currentModel
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get response from Viber AI');
      }

      // Assistant Message Object
      const assistantMessage: ChatMessage = {
        id: `msg_ai_${Date.now()}`,
        role: 'assistant',
        content: data.reply,
        timestamp: Date.now(),
        modelUsed: data.modelUsed,
        vibeMode: data.vibeMode
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Save assistant message to Firestore if authenticated
      if (user && currentId) {
        await saveChatMessage(user.uid, currentId, assistantMessage);
      }
    } catch (err: any) {
      console.error('Chat Error:', err);
      setAiError(err.message || 'Error connecting to Viber AI server');
    } finally {
      setLoadingAI(false);
    }
  };

  if (loadingAuth) {
    return (
      <div className="h-screen w-screen bg-slate-900 flex flex-col items-center justify-center text-white space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center animate-bounce">
          <Sparkles className="w-6 h-6 text-white" />
        </div>
        <div className="text-sm font-medium text-slate-300 animate-pulse">
          Loading Viber AI Workspace...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans antialiased text-slate-900 selection:bg-indigo-500 selection:text-white">
      {/* Toast Notification for New Users */}
      {newUserToast && (
        <div className="fixed top-4 right-4 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-3 animate-slide-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <div className="text-xs">
            <span className="font-bold block text-white">Account Created!</span>
            Welcome to Viber AI. Your Google account has been synced.
          </div>
        </div>
      )}

      {/* Top Header */}
      <Header
        user={user}
        onLogout={handleLogout}
        onOpenProfile={() => setProfileModalOpen(true)}
        currentVibe={currentVibe}
        onSelectVibe={setCurrentVibe}
        currentModel={currentModel}
        onSelectModel={setCurrentModel}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        isGuest={isGuest}
        onOpenAuth={() => setAuthModalOpen(true)}
        onOpenDriveExport={() => setDriveExportModalOpen(true)}
      />

      {/* Main Workspace Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          chats={chats}
          activeChatId={activeChatId}
          onSelectChat={setActiveChatId}
          onNewChat={handleNewChat}
          onDeleteChat={handleDeleteChat}
          user={user}
          onLogout={handleLogout}
          onOpenProfile={() => setProfileModalOpen(true)}
          isGuest={isGuest}
          onOpenAuth={() => setAuthModalOpen(true)}
          onOpenDriveExport={() => setDriveExportModalOpen(true)}
        />

        {/* Central Chat Interface */}
        <main className="flex-1 flex flex-col min-w-0">
          <ChatWindow
            messages={messages}
            onSendMessage={handleSendMessage}
            loading={loadingAI}
            currentVibe={currentVibe}
            onSelectVibe={setCurrentVibe}
            error={aiError}
          />
        </main>
      </div>

      {/* Auth Modal (Google Sign-In) */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={() => {
          setIsGuest(false);
          setAuthModalOpen(false);
        }}
        onEnableGuest={() => {
          setIsGuest(true);
          setAuthModalOpen(false);
        }}
      />

      {/* User Profile Details Modal */}
      <UserProfileModal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        user={user}
        onLogout={handleLogout}
      />

      {/* Google Drive Export Modal */}
      <GoogleDriveExportModal
        isOpen={driveExportModalOpen}
        onClose={() => setDriveExportModalOpen(false)}
      />
    </div>
  );
}
