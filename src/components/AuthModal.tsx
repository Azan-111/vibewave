import React, { useState } from 'react';
import { Sparkles, ShieldCheck, CheckCircle2, AlertCircle, ArrowRight, UserCheck } from 'lucide-react';
import { loginWithGoogle } from '../lib/firebase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onEnableGuest: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  onEnableGuest
}) => {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const user = await loginWithGoogle();
      if (user) {
        onSuccess();
        onClose();
      }
    } catch (err: any) {
      console.error('Google Auth Failed:', err);
      let message = err.message || 'Google Sign-In encountered an issue.';
      if (err.code === 'auth/popup-blocked') {
        message = 'The Google sign-in popup was blocked by your browser. Please allow popups or try guest access.';
      } else if (err.code === 'auth/popup-closed-by-user') {
        message = 'Sign-in window was closed before completion.';
      }
      setErrorMsg(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden relative">
        {/* Header Visual */}
        <div className="bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-900 p-6 text-white text-center relative overflow-hidden">
          <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-indigo-500/20 rounded-full blur-2xl pointer-events-none"></div>
          <div className="absolute -left-8 -top-8 w-32 h-32 bg-purple-500/20 rounded-full blur-2xl pointer-events-none"></div>

          <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-gradient-to-tr from-indigo-500 to-amber-400 p-0.5 shadow-lg flex items-center justify-center">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <Sparkles className="w-7 h-7 text-amber-400" />
            </div>
          </div>

          <h2 className="text-xl font-bold tracking-tight text-white mb-1">
            Welcome to Viber AI
          </h2>
          <p className="text-xs text-indigo-200/90 max-w-xs mx-auto">
            Your high-octane AI companion powered by Gemini 2.5 & custom Vibe Modes
          </p>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-5">
          {/* Automatic Account Creation Banner */}
          <div className="bg-indigo-50/80 border border-indigo-100 p-3 rounded-xl flex items-start gap-2.5 text-xs text-indigo-900">
            <UserCheck className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold block text-indigo-950">First Time Sign-Up?</span>
              A new account profile will automatically be initialized in Firestore upon your first Google sign-in!
            </div>
          </div>

          {/* Feature highlights */}
          <div className="space-y-2 text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Sync chat history & custom vibe presets across devices</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Multi-modal AI with code execution & image analysis</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Secure authentication powered by Firebase & Google</span>
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Primary Action: Google Sign In */}
          <button
            id="google-signin-action-btn"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm flex items-center justify-center gap-3 shadow-xs hover:shadow-md transition-all disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
            )}
            <span>{loading ? 'Authenticating...' : 'Continue with Google'}</span>
          </button>

          {/* Secondary Action: Guest Mode */}
          <div className="pt-2 border-t border-slate-100 text-center">
            <button
              onClick={() => {
                onEnableGuest();
                onClose();
              }}
              className="text-xs font-medium text-slate-500 hover:text-indigo-600 flex items-center justify-center gap-1 mx-auto transition-colors"
            >
              <span>Explore as Guest without login</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
