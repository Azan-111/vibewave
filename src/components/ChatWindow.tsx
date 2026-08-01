import React, { useState, useRef, useEffect } from 'react';
import { Send, Image as ImageIcon, X, Sparkles, Copy, Check, Volume2, Mic, MicOff, AlertCircle, RefreshCw, Zap, Brain, Code2, Briefcase, Flame, Download } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { ChatMessage, VibeModeConfig } from '../types';
import { VIBE_MODES } from '../lib/vibeModes';

interface ChatWindowProps {
  messages: ChatMessage[];
  onSendMessage: (text: string, imageBase64?: string) => Promise<void>;
  loading: boolean;
  currentVibe: string;
  onSelectVibe: (vibeId: string) => void;
  error: string | null;
}

const STARTER_PROMPTS = [
  { label: '🖼️ Generate AI Image', text: 'Generate an image of a futuristic cyberpunk city with neon reflections in golden hour lighting, photorealistic' },
  { label: '⚡ Quick Code Solution', text: 'Write a clean, responsive React component for a multi-step user onboarding flow with Tailwind styling.' },
  { label: '🧠 Step-by-Step Analysis', text: 'Explain how vector embeddings and semantic search work in modern AI architectures.' },
  { label: '🎨 Creative Copywriting', text: 'Draft 3 magnetic headline ideas and a product launch email for a smart AI productivity app.' }
];

export const ChatWindow: React.FC<ChatWindowProps> = ({
  messages,
  onSendMessage,
  loading,
  currentVibe,
  onSelectVibe,
  error
}) => {
  const [inputText, setInputText] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);

  // Fullscreen image preview state
  const [viewingImage, setViewingImage] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const selectedVibeObj = VIBE_MODES.find(v => v.id === currentVibe) || VIBE_MODES[0];

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Handle Form Submit
  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if ((!inputText.trim() && !selectedImage) || loading) return;

    const textToSend = inputText;
    const imgToSend = selectedImage || undefined;

    setInputText('');
    setSelectedImage(null);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    await onSendMessage(textToSend, imgToSend);
  };

  // Textarea keydown (Enter to send, Shift+Enter for newline)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Auto-resize textarea
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
    }
  };

  // File Uploader
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Image must be under 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Copy text helper
  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Speech Output Helper
  const handleSpeak = (id: string, text: string) => {
    if (!('speechSynthesis' in window)) {
      alert('Text-to-speech is not supported in your browser.');
      return;
    }
    if (isSpeaking === id) {
      window.speechSynthesis.cancel();
      setIsSpeaking(null);
    } else {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.onend = () => setIsSpeaking(null);
      utterance.onerror = () => setIsSpeaking(null);
      window.speechSynthesis.speak(utterance);
      setIsSpeaking(id);
    }
  };

  // Speech Recognition Helper
  const toggleSpeechRecognition = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in your browser.');
      return;
    }

    if (isListening) {
      setIsListening(false);
    } else {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => setIsListening(true);
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputText(prev => prev ? `${prev} ${transcript}` : transcript);
        setIsListening(false);
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);

      recognition.start();
    }
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-4rem)] bg-slate-50 relative overflow-hidden">
      {/* Scrollable Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-6 md:px-8 space-y-6">
        {messages.length === 0 ? (
          /* Empty State Hero */
          <div className="max-w-3xl mx-auto pt-8 pb-12 text-center space-y-8 animate-fade-in">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                <span>Viber AI Multi-Modal Engine</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
                What would you like to build or explore today?
              </h1>
              <p className="text-sm text-slate-500 max-w-lg mx-auto">
                Select your vibe mode, ask complex technical questions, analyze code, or attach images for instant insight.
              </p>
            </div>

            {/* Vibe Mode Cards Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-left">
              {VIBE_MODES.map((vibe) => (
                <button
                  key={vibe.id}
                  onClick={() => onSelectVibe(vibe.id)}
                  className={`p-3.5 rounded-2xl border transition-all text-left group ${
                    currentVibe === vibe.id
                      ? 'bg-white border-indigo-500 shadow-md ring-2 ring-indigo-500/20'
                      : 'bg-white/80 border-slate-200 hover:border-slate-300 hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-slate-800">{vibe.name}</span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      currentVibe === vibe.id ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {vibe.badge}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                    {vibe.description}
                  </p>
                </button>
              ))}
            </div>

            {/* Starter Prompt Chips */}
            <div className="space-y-2">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Try a prompt to get started
              </div>
              <div className="flex flex-wrap gap-2 justify-center">
                {STARTER_PROMPTS.map((prompt, idx) => (
                  <button
                    key={idx}
                    onClick={() => onSendMessage(prompt.text)}
                    className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/50 text-slate-700 text-xs font-medium shadow-2xs transition-all text-left flex items-center gap-2"
                  >
                    <span className="text-indigo-600 font-semibold">{prompt.label}:</span>
                    <span className="text-slate-500 line-clamp-1 max-w-xs">{prompt.text}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Messages List */
          <div className="max-w-3xl mx-auto space-y-6">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {/* Assistant Avatar */}
                {msg.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                    <Sparkles className="w-4 h-4" />
                  </div>
                )}

                {/* Message Bubble */}
                <div
                  className={`max-w-[85%] md:max-w-[80%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-sm rounded-tr-xs'
                      : 'bg-white border border-slate-200/90 text-slate-800 shadow-xs rounded-tl-xs'
                  }`}
                >
                  {/* User image attachment if present */}
                  {msg.imageBase64 && (
                    <div className="mb-3 overflow-hidden rounded-xl border border-white/20">
                      <img
                        src={msg.imageBase64}
                        alt="Attached Upload"
                        referrerPolicy="no-referrer"
                        onClick={() => setViewingImage(msg.imageBase64 || null)}
                        className="max-h-60 w-auto object-cover rounded-xl cursor-pointer hover:opacity-95"
                      />
                    </div>
                  )}

                  {/* Message Content */}
                  {msg.role === 'user' ? (
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                  ) : (
                    <div className="prose prose-sm prose-slate max-w-none dark:prose-invert">
                      <ReactMarkdown
                        components={{
                          img: ({ ...props }) => (
                            <div className="my-3 group relative inline-block">
                              <img
                                referrerPolicy="no-referrer"
                                onClick={() => props.src && setViewingImage(props.src)}
                                className="rounded-2xl max-h-96 w-auto border border-slate-200 cursor-pointer hover:shadow-xl transition-all object-cover"
                                alt={props.alt || 'AI Generated Image'}
                                {...props}
                              />
                              <div className="absolute top-2 right-2 bg-slate-900/70 text-white text-[10px] px-2 py-1 rounded-lg backdrop-blur-xs opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                Click to Expand
                              </div>
                            </div>
                          )
                        }}
                      >
                        {msg.content}
                      </ReactMarkdown>
                    </div>
                  )}

                  {/* Assistant Footer Controls */}
                  {msg.role === 'assistant' && (
                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                      <div className="flex items-center gap-2">
                        {msg.vibeMode && (
                          <span className="capitalize font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                            {msg.vibeMode} vibe
                          </span>
                        )}
                        <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {/* Audio Speak Button */}
                        <button
                          onClick={() => handleSpeak(msg.id, msg.content)}
                          className={`p-1 rounded hover:bg-slate-100 transition-colors ${
                            isSpeaking === msg.id ? 'text-indigo-600' : 'text-slate-400'
                          }`}
                          title="Read aloud"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                        </button>

                        {/* Copy Code / Message Button */}
                        <button
                          onClick={() => handleCopy(msg.id, msg.content)}
                          className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors flex items-center gap-1"
                          title="Copy response"
                        >
                          {copiedId === msg.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Loading Indicator */}
            {loading && (
              <div className="flex gap-3.5 justify-start">
                <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm animate-pulse">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs rounded-tl-xs flex items-center gap-2 text-xs text-slate-500">
                  <div className="flex space-x-1.5">
                    <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                    <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                  </div>
                  <span className="font-medium text-slate-600">Viber AI is crafting your response...</span>
                </div>
              </div>
            )}

            {/* Error Message Alert */}
            {error && (
              <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-2xl flex items-center justify-between shadow-xs">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{error}</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Box Footer */}
      <div className="p-3 md:p-4 bg-white/95 border-t border-slate-200 sticky bottom-0">
        <div className="max-w-3xl mx-auto space-y-2">
          {/* Image Preview Thumbnail if selected */}
          {selectedImage && (
            <div className="relative inline-block">
              <img
                src={selectedImage}
                alt="Upload preview"
                className="w-16 h-16 object-cover rounded-xl border-2 border-indigo-500 shadow-sm"
              />
              <button
                onClick={() => setSelectedImage(null)}
                className="absolute -top-2 -right-2 p-1 rounded-full bg-rose-600 text-white hover:bg-rose-700 shadow-xs"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* Form Controls */}
          <form onSubmit={handleSubmit} className="relative flex items-end gap-2 bg-slate-100 rounded-2xl p-2 border border-slate-200 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all">
            {/* File Uploader Button */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2.5 rounded-xl text-slate-500 hover:text-indigo-600 hover:bg-slate-200/60 transition-colors shrink-0"
              title="Attach Image"
            >
              <ImageIcon className="w-5 h-5" />
            </button>

            {/* Voice Input Button */}
            <button
              type="button"
              onClick={toggleSpeechRecognition}
              className={`p-2.5 rounded-xl transition-colors shrink-0 ${
                isListening
                  ? 'bg-rose-500 text-white animate-pulse'
                  : 'text-slate-500 hover:text-indigo-600 hover:bg-slate-200/60'
              }`}
              title={isListening ? 'Stop Listening' : 'Voice Input'}
            >
              {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>

            {/* Text Input Area */}
            <textarea
              ref={textareaRef}
              value={inputText}
              onChange={handleTextareaChange}
              onKeyDown={handleKeyDown}
              placeholder={`Message Viber AI (${selectedVibeObj.name})...`}
              rows={1}
              className="flex-1 bg-transparent border-0 focus:outline-none focus:ring-0 text-xs sm:text-sm text-slate-800 placeholder-slate-400 resize-none py-2 max-h-40 min-h-[2.5rem]"
            />

            {/* Submit Send Button */}
            <button
              type="submit"
              disabled={(!inputText.trim() && !selectedImage) || loading}
              className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-40 disabled:hover:bg-indigo-600 transition-colors shrink-0 shadow-xs cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

          <div className="flex items-center justify-between text-[10px] text-slate-400 px-1">
            <span>Press <kbd className="font-mono bg-slate-100 px-1 py-0.5 rounded border border-slate-200">Enter</kbd> to send, <kbd className="font-mono bg-slate-100 px-1 py-0.5 rounded border border-slate-200">Shift+Enter</kbd> for line break</span>
            <span>Viber AI powered by Gemini</span>
          </div>
        </div>
      </div>

      {/* Fullscreen Image Preview Modal */}
      {viewingImage && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-4 animate-fade-in">
          <div className="absolute top-4 right-4 flex items-center gap-3">
            <a
              href={viewingImage}
              download="viber_ai_generated_image.png"
              target="_blank"
              rel="noreferrer"
              className="p-2.5 rounded-full bg-slate-800 text-white hover:bg-slate-700 transition-colors shadow-lg flex items-center gap-2 text-xs font-semibold"
            >
              <Download className="w-4 h-4" />
              <span>Download</span>
            </a>
            <button
              onClick={() => setViewingImage(null)}
              className="p-2.5 rounded-full bg-slate-800 text-white hover:bg-slate-700 transition-colors shadow-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="max-w-4xl max-h-[85vh] p-2">
            <img
              src={viewingImage}
              alt="Fullscreen AI preview"
              referrerPolicy="no-referrer"
              className="max-h-[80vh] w-auto max-w-full rounded-2xl shadow-2xl border border-slate-800 object-contain mx-auto"
            />
          </div>
        </div>
      )}
    </div>
  );
};
