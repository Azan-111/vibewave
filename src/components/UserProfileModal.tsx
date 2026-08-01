import React from 'react';
import { X, LogOut, Shield, Calendar, MessageSquare, Clock, Sparkles } from 'lucide-react';
import { UserProfile } from '../types';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile | null;
  onLogout: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  user,
  onLogout
}) => {
  if (!isOpen || !user) return null;

  const createdDateStr = new Date(user.createdAt).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const lastActiveStr = new Date(user.lastLoginAt).toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fade-in">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-indigo-400" />
            <h3 className="font-bold text-base text-white">Viber User Account</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 text-slate-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Card */}
        <div className="p-6 space-y-6">
          <div className="flex items-center gap-4">
            <img
              src={user.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.uid}`}
              alt={user.displayName || 'User Profile'}
              referrerPolicy="no-referrer"
              className="w-16 h-16 rounded-2xl ring-4 ring-indigo-100 object-cover shadow-sm"
            />
            <div className="min-w-0 flex-1">
              <h4 className="text-lg font-bold text-slate-900 truncate">
                {user.displayName || 'Viber User'}
              </h4>
              <p className="text-xs text-slate-500 truncate">{user.email}</p>
              <div className="mt-1.5 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-semibold border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Active Account
              </div>
            </div>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl">
              <div className="flex items-center gap-2 text-slate-500 text-xs mb-1">
                <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                <span>First Signed Up</span>
              </div>
              <div className="text-xs font-semibold text-slate-800">{createdDateStr}</div>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl">
              <div className="flex items-center gap-2 text-slate-500 text-xs mb-1">
                <Clock className="w-3.5 h-3.5 text-amber-500" />
                <span>Last Session</span>
              </div>
              <div className="text-xs font-semibold text-slate-800">{lastActiveStr}</div>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl">
              <div className="flex items-center gap-2 text-slate-500 text-xs mb-1">
                <MessageSquare className="w-3.5 h-3.5 text-blue-500" />
                <span>Total Chats</span>
              </div>
              <div className="text-base font-bold text-slate-900">{user.totalChats || 0}</div>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl">
              <div className="flex items-center gap-2 text-slate-500 text-xs mb-1">
                <Sparkles className="w-3.5 h-3.5 text-purple-500" />
                <span>Messages Sent</span>
              </div>
              <div className="text-base font-bold text-slate-900">{user.totalMessages || 0}</div>
            </div>
          </div>

          {/* Account Actions / Sign Out Button */}
          <div className="pt-2 space-y-2">
            <button
              id="sign-out-btn-modal"
              onClick={() => {
                onLogout();
                onClose();
              }}
              className="w-full py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out of Google Account</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
