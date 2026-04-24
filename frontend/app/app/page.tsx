'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Settings,
  Send,
  Mic,
  ImageIcon,
  X,
  ChevronDown,
  Sparkles,
  Bell,
  BellOff,
  Volume2,
  VolumeX,
  Trash2,
  LogOut,
  PawPrint,
  Smile,
} from 'lucide-react';
import Link from 'next/link';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Message {
  id: string;
  role: 'user' | 'pet';
  text: string;
  timestamp: string;
}

// ─── Pixel-art pet placeholder frames (CSS animated sprite) ──────────────────
// We use a simple CSS pixel art dog drawn with box-shadows so there's
// something visible before real sprite assets are wired up.

// ─── Settings Modal ──────────────────────────────────────────────────────────

function SettingsModal({ onClose }: { onClose: () => void }) {
  const [notifications, setNotifications] = useState(true);
  const [sound, setSound] = useState(true);

  const toggle = (setter: (v: boolean) => void, current: boolean) =>
    setter(!current);

  return (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        key="backdrop"
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />

      {/* Drawer / Modal */}
      <motion.aside
        key="drawer"
        className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-sm bg-white border-l-2 border-black flex flex-col"
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b-2 border-black">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5" strokeWidth={2} />
            <span className="font-heading font-bold text-lg">Settings</span>
          </div>
          <button
            onClick={onClose}
            id="settings-close"
            className="w-9 h-9 rounded-full border border-black/20 flex items-center justify-center hover:bg-black hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {/* Pet Profile */}
          <section>
            <h3 className="font-heading font-bold text-xs uppercase tracking-widest text-black/40 mb-4">
              Pet Profile
            </h3>
            <div className="flex items-center gap-4 p-4 border border-black/10 rounded-2xl bg-black/[0.02]">
              <div className="w-14 h-14 rounded-2xl bg-black flex items-center justify-center">
                <PawPrint className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-heading font-bold text-base">Max</p>
                <p className="text-sm text-black/50 font-body">Digital Husky · Level 4</p>
              </div>
              <button className="text-xs font-semibold border border-black/20 px-3 py-1.5 rounded-full hover:border-black transition-colors">
                Edit
              </button>
            </div>
          </section>

          {/* Preferences */}
          <section>
            <h3 className="font-heading font-bold text-xs uppercase tracking-widest text-black/40 mb-4">
              Preferences
            </h3>
            <div className="space-y-3">
              <ToggleRow
                icon={notifications ? Bell : BellOff}
                label="Push Notifications"
                description="Get nudges from your pet"
                active={notifications}
                onToggle={() => toggle(setNotifications, notifications)}
                id="toggle-notifications"
              />
              <ToggleRow
                icon={sound ? Volume2 : VolumeX}
                label="Sound Effects"
                description="Pet sounds & UI audio"
                active={sound}
                onToggle={() => toggle(setSound, sound)}
                id="toggle-sound"
              />
            </div>
          </section>

          {/* Personality */}
          <section>
            <h3 className="font-heading font-bold text-xs uppercase tracking-widest text-black/40 mb-4">
              Pet Personality
            </h3>
            <div className="grid grid-cols-3 gap-2">
              {['Playful', 'Calm', 'Energetic', 'Gentle', 'Mischievous', 'Loyal'].map(
                (trait) => (
                  <button
                    key={trait}
                    className="text-xs font-semibold py-2 px-3 rounded-xl border border-black/10 hover:border-black hover:bg-black hover:text-white transition-all"
                  >
                    {trait}
                  </button>
                )
              )}
            </div>
            <p className="text-xs text-black/40 mt-3 font-body">Select traits that best describe your pet</p>
          </section>

          {/* Memory & Data */}
          <section>
            <h3 className="font-heading font-bold text-xs uppercase tracking-widest text-black/40 mb-4">
              Memory & Data
            </h3>
            <div className="space-y-2">
              <button className="w-full flex items-center gap-3 p-4 border border-black/10 rounded-2xl hover:border-black/30 transition-colors text-left group">
                <div className="w-9 h-9 rounded-xl bg-black/5 flex items-center justify-center group-hover:bg-black group-hover:text-white transition-colors">
                  <ImageIcon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm">Upload Media</p>
                  <p className="text-xs text-black/50 font-body">Photos, videos & audio</p>
                </div>
                <ChevronDown className="-rotate-90 w-4 h-4 text-black/30" />
              </button>
              <button className="w-full flex items-center gap-3 p-4 border border-red-200 rounded-2xl hover:border-red-400 hover:bg-red-50 transition-colors text-left group">
                <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center group-hover:bg-red-500 group-hover:text-white transition-colors">
                  <Trash2 className="w-4 h-4 text-red-500 group-hover:text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-red-600">Clear Chat History</p>
                  <p className="text-xs text-red-400 font-body">This cannot be undone</p>
                </div>
              </button>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="border-t border-black/10 px-6 py-4">
          <button className="w-full flex items-center justify-center gap-2 py-3 border-2 border-black rounded-xl font-semibold text-sm hover:bg-black hover:text-white transition-colors">
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </motion.aside>
    </AnimatePresence>
  );
}

function ToggleRow({
  icon: Icon,
  label,
  description,
  active,
  onToggle,
  id,
}: {
  icon: React.ElementType;
  label: string;
  description: string;
  active: boolean;
  onToggle: () => void;
  id: string;
}) {
  return (
    <div className="flex items-center gap-3 p-4 border border-black/10 rounded-2xl">
      <div className="w-9 h-9 rounded-xl bg-black/5 flex items-center justify-center">
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm">{label}</p>
        <p className="text-xs text-black/50 font-body">{description}</p>
      </div>
      <button
        id={id}
        onClick={onToggle}
        className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${
          active ? 'bg-black' : 'bg-black/20'
        }`}
      >
        <span
          className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${
            active ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
}

// ─── Pixel Art Pet Display ────────────────────────────────────────────────────

function PetPlayground() {
  return (
    <div className="flex flex-col h-full">
      {/* Stats bar */}
      <div className="flex items-center gap-3 mb-6">
        <StatPill label="Mood" value="Happy" color="bg-yellow-400" />
        <StatPill label="Energy" value="72%" color="bg-green-400" />
        <StatPill label="Bond" value="84%" color="bg-pink-400" />
      </div>

      {/* Pet viewport */}
      <div className="flex-1 relative border-2 border-black rounded-3xl overflow-hidden bg-[#f5f0e8] flex items-center justify-center min-h-[260px]">
        {/* Checkerboard grass floor */}
        <div
          className="absolute bottom-0 left-0 right-0 h-16"
          style={{
            backgroundImage:
              'repeating-linear-gradient(90deg, #d4c9a8 0px, #d4c9a8 16px, #c9be9e 16px, #c9be9e 32px)',
          }}
        />

        {/* Sky dots (decorative) */}
        {[
          { top: '12%', left: '10%' },
          { top: '20%', left: '75%' },
          { top: '8%', left: '55%' },
          { top: '30%', left: '30%' },
        ].map((pos, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 rounded-full bg-black/10"
            style={pos}
          />
        ))}

        {/* Pixel Art Dog — pure CSS pixel art */}
        <motion.div
          className="relative z-10 mb-8"
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          <PixelDog />
        </motion.div>

        {/* Name tag */}
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 bg-white border-2 border-black rounded-full px-4 py-1 shadow-[3px_3px_0px_rgba(0,0,0,1)]">
          <span className="font-heading font-bold text-sm">Max 🐾</span>
        </div>

        {/* Level badge */}
        <div className="absolute top-4 right-4 bg-black text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
          <Sparkles className="w-3 h-3" />
          Lv. 4
        </div>
      </div>

      {/* Action buttons */}
      <div className="grid grid-cols-3 gap-2 mt-4">
        {[
          { label: 'Feed', emoji: '🦴' },
          { label: 'Play', emoji: '🎾' },
          { label: 'Pet', emoji: '🤚' },
        ].map(({ label, emoji }) => (
          <button
            key={label}
            id={`action-${label.toLowerCase()}`}
            className="flex flex-col items-center gap-1 py-3 rounded-2xl border-2 border-black font-heading font-bold text-xs hover:bg-black hover:text-white active:scale-95 transition-all"
          >
            <span className="text-lg">{emoji}</span>
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

function StatPill({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="flex items-center gap-1.5 px-3 py-1.5 border border-black/10 rounded-full bg-white text-xs font-semibold">
      <span className={`w-2 h-2 rounded-full ${color}`} />
      <span className="text-black/50 font-body">{label}</span>
      <span>{value}</span>
    </div>
  );
}

// Minimal CSS pixel art dog using inline SVG (scalable, no images needed)
function PixelDog() {
  return (
    <svg
      width="96"
      height="96"
      viewBox="0 0 16 16"
      style={{ imageRendering: 'pixelated' }}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Ears */}
      <rect x="2" y="1" width="2" height="3" fill="#5c4033" />
      <rect x="12" y="1" width="2" height="3" fill="#5c4033" />
      {/* Head */}
      <rect x="3" y="2" width="10" height="7" fill="#8b6045" />
      {/* Eyes */}
      <rect x="5" y="4" width="2" height="2" fill="#1a1a1a" />
      <rect x="9" y="4" width="2" height="2" fill="#1a1a1a" />
      {/* Eye shine */}
      <rect x="6" y="4" width="1" height="1" fill="#fff" />
      <rect x="10" y="4" width="1" height="1" fill="#fff" />
      {/* Nose */}
      <rect x="7" y="7" width="2" height="1" fill="#1a1a1a" />
      {/* Mouth */}
      <rect x="6" y="8" width="1" height="1" fill="#1a1a1a" />
      <rect x="9" y="8" width="1" height="1" fill="#1a1a1a" />
      {/* Body */}
      <rect x="4" y="9" width="8" height="5" fill="#8b6045" />
      {/* Belly */}
      <rect x="5" y="10" width="6" height="3" fill="#c49a72" />
      {/* Legs */}
      <rect x="4" y="14" width="2" height="2" fill="#5c4033" />
      <rect x="7" y="14" width="2" height="2" fill="#5c4033" />
      <rect x="10" y="14" width="2" height="2" fill="#5c4033" />
      {/* Tail */}
      <rect x="12" y="8" width="2" height="1" fill="#5c4033" />
      <rect x="13" y="7" width="1" height="2" fill="#5c4033" />
    </svg>
  );
}

// ─── Chat Panel ───────────────────────────────────────────────────────────────

const INITIAL_MESSAGES: Message[] = [
  {
    id: '1',
    role: 'pet',
    text: '*wags tail excitedly* You\'re back! I\'ve been waiting by the digital door all morning! 🐾',
    timestamp: '2026-04-24T09:00:00.000Z',
  },
];

const messageTimeFormatter = new Intl.DateTimeFormat('en-US', {
  hour: '2-digit',
  minute: '2-digit',
  hour12: true,
  timeZone: 'UTC',
});

function ChatPanel() {
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState('');
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: trimmed,
      timestamp: new Date().toISOString(),
    };

    // Placeholder pet reply (no AI yet)
    const petMsg: Message = {
      id: (Date.now() + 1).toString(),
      role: 'pet',
      text: '*tilts head curiously* Woof! That sounds exciting! Tell me more! 🐾',
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg, petMsg]);
    setInput('');
  };

  const handleKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (timestamp: string) =>
    messageTimeFormatter.format(new Date(timestamp));

  return (
    <div className="flex flex-col h-full">
      {/* Chat header */}
      <div className="flex items-center gap-3 pb-5 border-b-2 border-black">
        <div className="w-10 h-10 rounded-2xl bg-black flex items-center justify-center">
          <PawPrint className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="font-heading font-bold text-base leading-none">Max</h2>
          <p className="text-xs text-black/50 font-body mt-0.5">Digital Husky · Online</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-xs text-black/50 font-body">Active now</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-4 space-y-4 min-h-0">
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'pet' && (
                <div className="w-7 h-7 rounded-xl bg-black flex items-center justify-center shrink-0 mt-1">
                  <PawPrint className="w-3.5 h-3.5 text-white" />
                </div>
              )}
              <div className="max-w-[75%] space-y-1">
                <div
                  className={`px-4 py-2.5 rounded-2xl text-sm font-body leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-black text-white rounded-tr-sm'
                      : 'bg-black/5 text-black rounded-tl-sm border border-black/10'
                  }`}
                >
                  {msg.text}
                </div>
                <p
                  className={`text-[10px] text-black/35 font-body ${
                    msg.role === 'user' ? 'text-right' : 'text-left'
                  }`}
                >
                  {formatTime(msg.timestamp)}
                </p>
              </div>
              {msg.role === 'user' && (
                <div className="w-7 h-7 rounded-xl bg-black/10 border border-black/10 flex items-center justify-center shrink-0 mt-1">
                  <Smile className="w-3.5 h-3.5 text-black/60" />
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={endRef} />
      </div>

      {/* Input */}
      <div className="pt-4 border-t-2 border-black">
        <div className="flex items-center gap-2 bg-black/5 border border-black/10 rounded-2xl p-1.5 focus-within:border-black transition-colors">
          <button
            id="chat-media-btn"
            className="w-9 h-9 rounded-xl flex items-center justify-center text-black/40 hover:bg-black hover:text-white transition-colors"
          >
            <ImageIcon className="w-4 h-4" />
          </button>
          <input
            id="chat-input"
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Say something to Max..."
            className="flex-1 bg-transparent outline-none text-sm font-body placeholder:text-black/30 px-1"
          />
          <button
            id="chat-voice-btn"
            className="w-9 h-9 rounded-xl flex items-center justify-center text-black/40 hover:bg-black hover:text-white transition-colors"
          >
            <Mic className="w-4 h-4" />
          </button>
          <button
            id="chat-send-btn"
            onClick={handleSend}
            className="w-9 h-9 rounded-xl bg-black text-white flex items-center justify-center hover:bg-black/80 active:scale-95 transition-all"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Dashboard Header ─────────────────────────────────────────────────────────

function DashboardHeader({ onSettingsOpen }: { onSettingsOpen: () => void }) {
  return (
    <header className="flex items-center justify-between px-6 py-4 border-b-2 border-black bg-white">
      <Link href="/" className="flex items-center gap-2 group">
        <PawPrint
          className="w-5 h-5 transform group-hover:-rotate-12 transition-transform duration-300"
          strokeWidth={2.5}
        />
        <span className="font-heading font-bold text-lg tracking-tight">Petecho</span>
      </Link>

      <div className="flex items-center gap-2">
        {/* Notification dot */}
        <button
          id="notifications-btn"
          className="relative w-9 h-9 rounded-full border border-black/10 flex items-center justify-center hover:border-black transition-colors"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-black rounded-full" />
        </button>

        {/* Settings cog */}
        <button
          id="settings-open-btn"
          onClick={onSettingsOpen}
          className="w-9 h-9 rounded-full border border-black/10 flex items-center justify-center hover:border-black hover:bg-black hover:text-white transition-colors group"
        >
          <motion.span
            className="inline-flex"
            whileHover={{ rotate: 45 }}
            transition={{ type: 'spring', stiffness: 300 }}
          >
            <Settings className="w-4 h-4" />
          </motion.span>
        </button>

        {/* Avatar */}
        <div className="w-9 h-9 rounded-full bg-black text-white flex items-center justify-center text-sm font-bold font-heading">
          K
        </div>
      </div>
    </header>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AppDashboard() {
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white text-black flex flex-col">
      <DashboardHeader onSettingsOpen={() => setSettingsOpen(true)} />

      {/* Main content */}
      <main className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* LEFT — Pet Playground */}
        <section className="lg:w-[420px] xl:w-[480px] shrink-0 border-b-2 lg:border-b-0 lg:border-r-2 border-black p-6 overflow-y-auto">
          <PetPlayground />
        </section>

        {/* RIGHT — Chat */}
        <section className="flex-1 flex flex-col p-6 min-h-[500px] lg:min-h-0 overflow-hidden">
          <ChatPanel />
        </section>
      </main>

      {/* Settings overlay */}
      {settingsOpen && (
        <SettingsModal onClose={() => setSettingsOpen(false)} />
      )}
    </div>
  );
}
