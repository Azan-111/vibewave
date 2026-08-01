import React from 'react';
import { Plus, MessageSquare, Trash2, LogOut, User, Sparkles, X, ShieldCheck, Zap, HardDrive } from 'lucide-react';
import { ChatSession, UserProfile } from '../types';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  chats: ChatSession[];
  activeChatId: string | null;
  onSelectChat: (chatId: string) => void;
  onNewChat: () => void;
  onDeleteChat: (chatId: string) => void;
  user: UserProfile | null;
  onLogout: () => void;
  onOpenProfile: () => void;
  isGuest?: boolean;
  onOpenAuth: () => void;
  onOpenDriveExport?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  chats,
  activeChatId,
  onSelectChat,
  onNewChat,
  onDeleteChat,
  user,
  onLogout,
  onOpenProfile,
  isGuest,
  onOpenAuth,
  onOpenDriveExport
}) => {
  return (
    <>
      {/* Mobile backdrop overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar container */}
      <aside
        id="app-sidebar"
        className={`fixed md:static top-0 left-0 bottom-0 w-72 bg-slate-900 text-slate-200 z-50 flex flex-col border-r border-slate-800 transition-transform duration-200 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
              <Sparkles className="w-4 h-4" />
            </div>
            <span className="font-bold text-white tracking-tight text-base">Viber AI Workspace</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 md:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action: New Chat & Drive Backup */}
        <div className="p-3 space-y-2">
          <button
            id="new-chat-btn"
            onClick={() => {
              onNewChat();
              onClose();
            }}
            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>New Conversation</span>
          </button>

          {onOpenDriveExport && (
            <button
              id="sidebar-drive-export-btn"
              onClick={() => {
                onOpenDriveExport();
                onClose();
              }}
              className="w-full py-2 px-3 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-800 text-indigo-300 text-xs font-medium flex items-center justify-center gap-2 transition-all"
            >
              <HardDrive className="w-3.5 h-3.5 text-indigo-400" />
              <span>Push Code to Google Drive</span>
            </button>
          )}
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
          <div className="px-2 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Your Conversations
          </div>

          {chats.length === 0 ? (
            <div className="px-3 py-6 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-xl my-2">
              <MessageSquare className="w-6 h-6 mx-auto mb-2 text-slate-600" />
              <span>No active chats. Click &quot;New Conversation&quot; to start.</span>
            </div>
          ) : (
            chats.map((chat) => (
              <div
                key={chat.id}
                className={`group relative flex items-center justify-between px-3 py-2.5 rounded-xl text-xs transition-colors cursor-pointer ${
                  activeChatId === chat.id
                    ? 'bg-indigo-600/20 text-indigo-300 font-medium border border-indigo-500/30'
                    : 'text-slate-300 hover:bg-slate-800/60'
                }`}
                onClick={() => {
                  onSelectChat(chat.id);
                  onClose();
                }}
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-2">
                  <MessageSquare className={`w-4 h-4 shrink-0 ${activeChatId === chat.id ? 'text-indigo-400' : 'text-slate-500'}`} />
                  <span className="truncate">{chat.title || 'Untitled Conversation'}</span>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm('Delete this chat session?')) {
                      onDeleteChat(chat.id);
                    }
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-all"
                  title="Delete chat"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* User Footer & Sign Out Section */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/50">
          {isGuest ? (
            <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-slate-300">Guest Mode</span>
                <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded font-mono">Temporary</span>
              </div>
              <p className="text-[11px] text-slate-400 mb-2.5">
                Sign in with Google to sync your chat history & retain your account.
              </p>
              <button
                id="sidebar-signin-btn"
                onClick={onOpenAuth}
                className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
              >
                <User className="w-3.5 h-3.5" />
                <span>Sign In with Google</span>
              </button>
            </div>
          ) : user ? (
            <div className="space-y-2">
              <div
                onClick={onOpenProfile}
                className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-800 cursor-pointer transition-colors"
              >
                <img
                  src={user.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.uid}`}
                  alt={user.displayName || 'User'}
                  referrerPolicy="no-referrer"
                  className="w-9 h-9 rounded-full ring-2 ring-indigo-500/40 object-cover"
                />
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-semibold text-slate-200 truncate">
                    {user.displayName}
                  </div>
                  <div className="text-[10px] text-slate-400 truncate flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-400" />
                    <span>Google Account</span>
                  </div>
                </div>
              </div>

              {/* Explicit Prominent Sign Out Button */}
              <button
                id="sign-out-btn-sidebar"
                onClick={onLogout}
                className="w-full py-2 px-3 rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-medium flex items-center justify-center gap-2 transition-colors"
              >
                <LogOut className="w-4 h-4 text-rose-400" />
                <span>Sign Out</span>
              </button>
            </div>
          ) : null}
        </div>
      </aside>
    </>
  );
};
