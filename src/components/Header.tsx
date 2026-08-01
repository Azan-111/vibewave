import React, { useState } from 'react';
import { Sparkles, Zap, Brain, Code2, Briefcase, Flame, LogOut, User, Menu, ChevronDown, Check, HardDrive } from 'lucide-react';
import { UserProfile } from '../types';
import { VIBE_MODES, AI_MODELS } from '../lib/vibeModes';

interface HeaderProps {
  user: UserProfile | null;
  onLogout: () => void;
  onOpenProfile: () => void;
  currentVibe: string;
  onSelectVibe: (vibeId: string) => void;
  currentModel: string;
  onSelectModel: (modelId: string) => void;
  onToggleSidebar: () => void;
  isGuest?: boolean;
  onOpenAuth: () => void;
  onOpenDriveExport?: () => void;
}

const ICON_MAP: Record<string, React.ReactNode> = {
  Zap: <Zap className="w-4 h-4 text-amber-500" />,
  Brain: <Brain className="w-4 h-4 text-blue-500" />,
  Code2: <Code2 className="w-4 h-4 text-emerald-500" />,
  Sparkles: <Sparkles className="w-4 h-4 text-purple-500" />,
  Briefcase: <Briefcase className="w-4 h-4 text-slate-700" />,
  Flame: <Flame className="w-4 h-4 text-rose-500" />,
};

export const Header: React.FC<HeaderProps> = ({
  user,
  onLogout,
  onOpenProfile,
  currentVibe,
  onSelectVibe,
  currentModel,
  onSelectModel,
  onToggleSidebar,
  isGuest,
  onOpenAuth,
  onOpenDriveExport
}) => {
  const [vibeDropdownOpen, setVibeDropdownOpen] = useState(false);
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false);

  const selectedVibeObj = VIBE_MODES.find(v => v.id === currentVibe) || VIBE_MODES[0];
  const selectedModelObj = AI_MODELS.find(m => m.id === currentModel) || AI_MODELS[0];

  return (
    <header id="app-header" className="h-16 border-b border-slate-200 bg-white/90 backdrop-blur-md px-4 flex items-center justify-between sticky top-0 z-30 shadow-xs">
      {/* Left side: Mobile Sidebar button + Logo */}
      <div className="flex items-center gap-3">
        <button
          id="sidebar-toggle-btn"
          onClick={onToggleSidebar}
          className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors md:hidden"
          title="Toggle Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-amber-500 flex items-center justify-center shadow-md shadow-indigo-100">
            <Sparkles className="w-5 h-5 text-white animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-lg bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-800 bg-clip-text text-transparent">
                Viber AI
              </span>
              <span className="text-[10px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                v2.5
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Center: Vibe Selector & Model Selector */}
      <div className="hidden md:flex items-center gap-2">
        {/* Vibe Mode Selector */}
        <div className="relative">
          <button
            id="vibe-selector-btn"
            onClick={() => setVibeDropdownOpen(!vibeDropdownOpen)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-medium transition-colors"
          >
            {ICON_MAP[selectedVibeObj.icon]}
            <span>{selectedVibeObj.name}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {vibeDropdownOpen && (
            <div className="absolute top-full mt-1.5 left-0 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50">
              <div className="px-3 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Select Vibe Mode
              </div>
              {VIBE_MODES.map((vibe) => (
                <button
                  key={vibe.id}
                  onClick={() => {
                    onSelectVibe(vibe.id);
                    setVibeDropdownOpen(false);
                  }}
                  className={`w-full px-3 py-2 flex items-center justify-between text-left text-xs hover:bg-slate-50 transition-colors ${
                    currentVibe === vibe.id ? 'bg-indigo-50/70 text-indigo-900 font-medium' : 'text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {ICON_MAP[vibe.icon]}
                    <div>
                      <div className="font-medium text-slate-800">{vibe.name}</div>
                      <div className="text-[10px] text-slate-500">{vibe.tagline}</div>
                    </div>
                  </div>
                  {currentVibe === vibe.id && <Check className="w-4 h-4 text-indigo-600" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Model Selector */}
        <div className="relative">
          <button
            id="model-selector-btn"
            onClick={() => setModelDropdownOpen(!modelDropdownOpen)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-xs font-medium transition-colors"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>{selectedModelObj.name}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {modelDropdownOpen && (
            <div className="absolute top-full mt-1.5 left-0 w-60 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50">
              <div className="px-3 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                AI Engine Model
              </div>
              {AI_MODELS.map((model) => (
                <button
                  key={model.id}
                  onClick={() => {
                    onSelectModel(model.id);
                    setModelDropdownOpen(false);
                  }}
                  className={`w-full px-3 py-2 flex items-center justify-between text-left text-xs hover:bg-slate-50 transition-colors ${
                    currentModel === model.id ? 'bg-indigo-50 text-indigo-900 font-medium' : 'text-slate-700'
                  }`}
                >
                  <div>
                    <div className="font-medium text-slate-800">{model.name}</div>
                    <div className="text-[10px] text-slate-500">{model.description}</div>
                  </div>
                  {currentModel === model.id && <Check className="w-4 h-4 text-indigo-600" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right side: Google Drive Export + User Profile / Login / Sign Out */}
      <div className="flex items-center gap-2">
        {onOpenDriveExport && (
          <button
            id="drive-export-btn-header"
            onClick={onOpenDriveExport}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-indigo-200 bg-indigo-50/70 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold shadow-2xs transition-all"
            title="Push necessary codebase files to Google Drive"
          >
            <HardDrive className="w-3.5 h-3.5 text-indigo-600" />
            <span className="hidden sm:inline">Push to Drive</span>
          </button>
        )}
        {isGuest ? (
          <button
            id="sign-in-btn-header"
            onClick={onOpenAuth}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-xs font-semibold shadow-sm transition-all"
          >
            <User className="w-3.5 h-3.5" />
            <span>Sign In with Google</span>
          </button>
        ) : user ? (
          <div className="flex items-center gap-2">
            <button
              id="user-profile-btn"
              onClick={onOpenProfile}
              className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 transition-colors text-left"
              title="View Account Profile"
            >
              <img
                src={user.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.uid}`}
                alt={user.displayName || 'User'}
                referrerPolicy="no-referrer"
                className="w-8 h-8 rounded-full ring-2 ring-indigo-200 object-cover"
              />
              <div className="hidden sm:block">
                <div className="text-xs font-semibold text-slate-800 line-clamp-1 leading-tight">
                  {user.displayName}
                </div>
                <div className="text-[10px] text-slate-500 line-clamp-1">
                  {user.email}
                </div>
              </div>
            </button>

            {/* Sign Out Button */}
            <button
              id="sign-out-btn-header"
              onClick={onLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 hover:border-rose-300 text-xs font-medium transition-colors"
              title="Sign Out of Account"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        ) : (
          <button
            id="login-trigger-btn"
            onClick={onOpenAuth}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition-colors"
          >
            <span>Sign In</span>
          </button>
        )}
      </div>
    </header>
  );
};
