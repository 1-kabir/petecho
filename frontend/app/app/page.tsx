'use client';
// Force cache refresh 2026-04-25

import { useEffect, useRef, useState, startTransition, type ElementType, useMemo, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import {
  Settings,
  Send,
  X,
  Sparkles,
  Paperclip,
  Image as ImageIcon,
  FileText,
  Mic,
  Video,
  Camera,
  Film,
  X,
  Sparkles,
  Bell,
  BellOff,
  Trash2,
  LogOut,
  PawPrint,
  Smile,
  Plus,
  Menu,
  LoaderCircle,
  Zap,
  CircleDashed,
  Gamepad2,
} from 'lucide-react';
import { PetSprite } from '@/components/pet-sprite';
import {
  API_URL,
  clearAuthCookie,
  getAuthCookie,
  getUserInitial,
  getAuthHeaders,
  type PetRecord,
  type UserRecord,
  type ChatRecord,
} from '@/lib/auth';
import { getPetTypeByKey, getSpriteByKeys, petCatalog } from '@/lib/pet-catalog';
import { getRandomPetActionMessage, type PetActionType } from '@/lib/pet-actions';

const defaultPetType = petCatalog.petTypes[0];

function SettingsModal({
  onClose,
  onLogout,
  onDeleteAccount,
}: {
  onClose: () => void;
  onLogout: () => void;
  onDeleteAccount: () => void;
}) {
  const [notifications, setNotifications] = useState(true);

  const toggle = (setter: (value: boolean) => void, current: boolean) =>
    setter(!current);

  return (
    <AnimatePresence>
      <motion.div
        key="backdrop"
        className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />

      <motion.aside
        key="drawer"
        className="fixed right-0 top-0 bottom-0 z-[70] flex w-full max-w-sm flex-col border-l-2 border-black bg-white"
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
      >
        <div className="flex items-center justify-between border-b-2 border-black px-6 py-5">
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5" strokeWidth={2} />
            <span className="font-heading text-lg font-bold">Settings</span>
          </div>
          <button
            onClick={onClose}
            id="settings-close"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-black/20 transition-colors hover:bg-black hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 space-y-8 overflow-y-auto p-6">
          <section>
            <h3 className="mb-4 font-heading text-xs font-bold uppercase tracking-widest text-black/40">
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
            </div>
          </section>

          <section>
            <h3 className="mb-4 font-heading text-xs font-bold uppercase tracking-widest text-black/40">
              Danger Zone
            </h3>
            <button
              onClick={() => {
                if (confirm('Are you sure you want to delete your account? This will permanently remove all your pets and chat history. This action cannot be undone.')) {
                  onDeleteAccount();
                }
              }}
              className="group flex w-full items-center gap-3 rounded-2xl border border-red-200 p-4 text-left transition-colors hover:border-red-400 hover:bg-red-50"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-50 transition-colors group-hover:bg-red-500 group-hover:text-white">
                <Trash2 className="h-4 w-4 text-red-500 group-hover:text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-red-600">Delete Account</p>
                <p className="text-xs text-red-400 font-body">Permanently remove everything</p>
              </div>
            </button>
          </section>
        </div>

        <div className="border-t border-black/10 px-6 py-4">
          <button
            onClick={onLogout}
            className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-black py-3 text-sm font-semibold transition-colors hover:bg-black hover:text-white"
          >
            <LogOut className="h-4 w-4" />
            Log Out
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
  icon: ElementType;
  label: string;
  description: string;
  active: boolean;
  onToggle: () => void;
  id: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-black/10 p-4">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-black/5">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">{label}</p>
        <p className="text-xs text-black/50 font-body">{description}</p>
      </div>
      <button
        id={id}
        onClick={onToggle}
        className={`relative h-6 w-11 rounded-full transition-colors duration-200 ${
          active ? 'bg-black' : 'bg-black/20'
        }`}
      >
        <span
          className={`absolute top-1 left-1 h-4 w-4 rounded-full bg-white shadow transition-transform duration-200 ${
            active ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
}

function CreatePetModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (pet: PetRecord) => void;
}) {
  const [name, setName] = useState('');
  const [gender, setGender] = useState('unknown');
  const [typeKey, setTypeKey] = useState(defaultPetType.key);
  const [spriteKey, setSpriteKey] = useState(defaultPetType.sprites[0].key);
  const [description, setDescription] = useState('');
  const [birthday, setBirthday] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const selectedPetType = useMemo(
    () => getPetTypeByKey(typeKey) ?? defaultPetType,
    [typeKey]
  );
  const selectedSprite =
    selectedPetType.sprites.find((s) => s.key === spriteKey) ??
    selectedPetType.sprites[0];

  useEffect(() => {
    if (!selectedPetType.sprites.some((s) => s.key === spriteKey)) {
      setSpriteKey(selectedPetType.sprites[0].key);
    }
  }, [selectedPetType, spriteKey]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${API_URL}/pets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ name, gender, typeKey, spriteKey, description, birthday }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create pet.');
      }

      onCreated(data.pet);
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="w-full max-w-2xl overflow-hidden rounded-[2rem] border-2 border-black bg-white shadow-[12px_12px_0px_rgba(0,0,0,1)]"
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between border-b-2 border-black px-6 py-5">
            <div className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              <span className="font-heading text-lg font-bold">New Pet</span>
            </div>
            <button
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-black/10 transition-colors hover:bg-black hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <form className="max-h-[70vh] overflow-y-auto p-6" onSubmit={handleSubmit}>
            <div className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-4">
                  <label className="block">
                    <span className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-black/45">
                      Name
                    </span>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Pet Name"
                      className="w-full rounded-2xl border border-black/10 bg-black/[0.03] px-4 py-3.5 text-sm outline-none transition-colors focus:border-black"
                      required
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-black/45">
                      Gender
                    </span>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      className="w-full rounded-2xl border border-black/10 bg-black/[0.03] px-4 py-3.5 text-sm outline-none transition-colors focus:border-black"
                    >
                      <option value="male">Boy</option>
                      <option value="female">Girl</option>
                      <option value="unknown">Unknown</option>
                    </select>
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-black/45">
                      Species
                    </span>
                    <select
                      value={typeKey}
                      onChange={(e) => setTypeKey(e.target.value)}
                      className="w-full rounded-2xl border border-black/10 bg-black/[0.03] px-4 py-3.5 text-sm outline-none transition-colors focus:border-black"
                    >
                      {petCatalog.petTypes.map((t) => (
                        <option key={t.key} value={t.key}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-black/45">
                      Birthday
                    </span>
                    <input
                      type="date"
                      value={birthday}
                      onChange={(e) => setBirthday(e.target.value)}
                      className="w-full rounded-2xl border border-black/10 bg-black/[0.03] px-4 py-3.5 text-sm outline-none transition-colors focus:border-black"
                    />
                  </label>
                </div>

                <div className="space-y-2">
                  <label className="block">
                    <span className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-black/45">
                      Description
                    </span>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Describe your pet's personality..."
                      rows={2}
                      className="w-full resize-none rounded-2xl border border-black/10 bg-black/[0.03] px-4 py-3.5 text-sm outline-none transition-colors focus:border-black font-body"
                    />
                  </label>
                </div>

                <div className="flex flex-col items-center justify-center rounded-[2rem] border-2 border-dashed border-black/10 bg-[#f5f0e8] p-6">
                  <PetSprite
                    alt={selectedSprite.label}
                    src={selectedSprite.idle}
                    maxWidth={160}
                    maxHeight={160}
                  />
                  <p className="mt-4 text-center font-heading text-lg font-bold">
                    {selectedSprite.label}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {selectedPetType.sprites.map((s) => (
                  <button
                    key={s.key}
                    type="button"
                    onClick={() => setSpriteKey(s.key)}
                    className={`rounded-2xl border p-2 transition-all ${
                      s.key === spriteKey
                        ? 'border-black bg-white shadow-[4px_4px_0px_rgba(0,0,0,1)]'
                        : 'border-black/5 bg-black/[0.02] hover:border-black/20'
                    }`}
                  >
                    <div className="flex aspect-square items-center justify-center overflow-hidden rounded-xl bg-white">
                      <PetSprite src={s.idle} alt={s.label} maxWidth={80} maxHeight={80} />
                    </div>
                  </button>
                ))}
              </div>

              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-black py-4 font-heading font-bold text-white transition-all hover:bg-black/85 disabled:opacity-50"
              >
                {loading ? (
                  <LoaderCircle className="h-5 w-5 animate-spin" />
                ) : (
                  <Plus className="h-5 w-5" />
                )}
                Bring them home
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function ActionButton({ icon: Icon, label, onClick, color, id }: { icon: any, label: string, onClick: () => void, color: string, id: string }) {
  return (
    <button
      id={id}
      onClick={onClick}
      className={`group flex min-w-[90px] flex-col items-center gap-2 rounded-[2rem] border-2 border-black/5 p-4 transition-all hover:-translate-y-1 hover:border-black active:scale-95 sm:min-w-[110px] sm:p-5 ${color}`}
    >
      <div className="rounded-2xl bg-white/50 p-2 transition-colors group-hover:bg-white sm:p-3">
        <Icon className="h-6 w-6 sm:h-7 sm:w-7" />
      </div>
      <span className="font-heading text-[10px] font-bold uppercase tracking-wider sm:text-xs">{label}</span>
    </button>
  );
}

function PetPlayground({ 
  pet, 
  onAction 
}: { 
  pet: PetRecord;
  onAction?: (action: string, message: string) => void;
}) {
  const petType = getPetTypeByKey(pet.typeKey) ?? defaultPetType;
  const sprite = getSpriteByKeys(pet.typeKey, pet.spriteKey) ?? petType.sprites[0];
  const [action, setAction] = useState<'idle' | 'walk' | 'run' | 'swipe' | 'withBall'>('idle');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const getSpriteSrc = () => {
    if (action === 'run') return sprite.run || sprite.idle.replace('_idle_', '_run_');
    if (action === 'swipe') return sprite.swipe || sprite.idle.replace('_idle_', '_swipe_');
    if (action === 'withBall') return sprite.withBall || sprite.idle.replace('_idle_', '_with_ball_');
    return sprite.idle;
  };

  const triggerAnimation = (newAction: typeof action, duration = 5000, actionName: string, message: string) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    
    setAction(newAction);
    if (onAction) onAction(actionName, message);
    
    timerRef.current = setTimeout(() => {
      setAction('idle');
      timerRef.current = null;
    }, duration);
  };

  return (
    <div className="flex h-full flex-col">
      <div className="relative flex min-h-[300px] flex-1 items-center justify-center overflow-hidden rounded-3xl border-2 border-black bg-[#f5f0e8]">
        <div className="relative z-10 mb-8">
          <PetSprite
            alt={sprite.label}
            src={getSpriteSrc()}
            maxWidth={220}
            maxHeight={180}
          />
        </div>
        <div className="absolute bottom-6 rounded-full border-2 border-black bg-white px-4 py-1 shadow-[3px_3px_0px_rgba(0,0,0,1)]">
          <span className="font-heading text-sm font-bold">{pet.name}</span>
        </div>
      </div>

      <div className="mt-8 flex flex-wrap justify-center gap-4">
        <ActionButton
          icon={Zap}
          label="Run"
          onClick={() => triggerAnimation('run', 5000, 'run', getRandomPetActionMessage(pet.typeKey, 'run'))}
          color="bg-amber-100 text-amber-600 hover:bg-amber-200"
          id="btn-run"
        />
        <ActionButton
          icon={CircleDashed}
          label="Give Ball"
          onClick={() => triggerAnimation('withBall', 5000, 'ball', getRandomPetActionMessage(pet.typeKey, 'ball'))}
          color="bg-blue-100 text-blue-600 hover:bg-blue-200"
          id="btn-ball"
        />
        <ActionButton
          icon={Gamepad2}
          label="Play"
          onClick={() => triggerAnimation('swipe', 5000, 'play', getRandomPetActionMessage(pet.typeKey, 'play'))}
          color="bg-rose-100 text-rose-600 hover:bg-rose-200"
          id="btn-play"
        />
      </div>
    </div>
  );
}

const messageTimeFormatter = new Intl.DateTimeFormat('en-US', {
  hour: '2-digit',
  minute: '2-digit',
  hour12: true,
});

  pet, 
  messages,
  onSendMessage,
  isTyping 
}: { 
  pet: PetRecord; 
  messages: ChatRecord[];
  onSendMessage: (text?: string, file?: File) => void;
  isTyping?: boolean;
}) {
  const [input, setInput] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const petType = getPetTypeByKey(pet.typeKey) ?? defaultPetType;

  useEffect(() => {
    if (selectedFile) {
      const url = URL.createObjectURL(selectedFile);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setPreviewUrl(null);
    }
  }, [selectedFile]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed && !selectedFile) {
      // If nothing entered, we still send an empty message to trigger pet thought
      onSendMessage();
    } else {
      onSendMessage(trimmed || undefined, selectedFile || undefined);
    }
    setInput('');
    setSelectedFile(null);
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 border-b-2 border-black pb-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-black text-white">
          <PawPrint className="h-5 w-5" />
        </div>
        <div>
          <h2 className="font-heading text-base font-bold leading-none">{pet.name}</h2>
          <p className="mt-1 text-xs text-black/40 font-body">
            Digital {petType.label}
          </p>
        </div>
      </div>

      <div className="min-h-0 flex-1 space-y-6 overflow-y-auto py-4">
        <AnimatePresence initial={false}>
          {messages.map((message, index) => {
            const isSameSenderAsPrevious = index > 0 && messages[index - 1].role === message.role;
            const isLastOfGroup = index === messages.length - 1 || messages[index + 1].role !== message.role;

            return (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                className={`flex gap-3 ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                } ${isSameSenderAsPrevious ? '-mt-4' : 'mt-2'}`}
              >
                {message.role === 'pet' && (
                  <div className={`mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-black text-white transition-opacity ${isSameSenderAsPrevious ? 'opacity-0' : 'opacity-100'}`}>
                    <PawPrint className="h-3.5 w-3.5" />
                  </div>
                )}

                <div className={`max-w-[85%] space-y-1 sm:max-w-[75%] ${message.role === 'user' ? 'items-end' : 'items-start'} flex flex-col`}>
                  <div
                    className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed font-body ${
                      message.role === 'user'
                        ? 'rounded-tr-sm bg-black text-white'
                        : 'rounded-tl-sm border border-black/10 bg-black/5 text-black font-medium'
                    }`}
                  >
                    {message.fileUrl && (
                      <div className="mb-2 overflow-hidden rounded-lg bg-black/5">
                        {message.mimeType?.startsWith('image/') ? (
                          <img 
                            src={`${API_URL}/files/${message.fileUrl.split(/[/\\]/).pop()}`} 
                            alt="Attachment" 
                            className="max-h-60 w-full object-contain" 
                          />
                        ) : message.mimeType?.startsWith('video/') ? (
                          <video 
                            src={`${API_URL}/files/${message.fileUrl.split(/[/\\]/).pop()}`} 
                            controls 
                            className="max-h-60 w-full" 
                          />
                        ) : (
                          <div className="flex items-center gap-2 p-3 bg-white/10">
                            <FileText className="h-5 w-5" />
                            <span className="truncate text-xs">{message.fileUrl.split(/[/\\]/).pop()}</span>
                          </div>
                        )}
                      </div>
                    )}
                    <div className={`prose prose-sm max-w-none ${
                      message.role === 'user' 
                        ? 'prose-invert prose-p:text-white prose-headings:text-white' 
                        : 'prose-p:text-black prose-headings:text-black'
                    }`}>
                      <ReactMarkdown>
                        {message.text}
                      </ReactMarkdown>
                    </div>
                  </div>
                  
                  {isLastOfGroup && (
                    <p className={`text-[10px] text-black/30 font-body px-1`}>
                      {messageTimeFormatter.format(new Date(message.timestamp))}
                    </p>
                  )}
                </div>

                {message.role === 'user' && (
                  <div className={`mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-xl border border-black/10 bg-black/10 transition-opacity ${isSameSenderAsPrevious ? 'opacity-0' : 'opacity-100'}`}>
                    <Smile className="h-3.5 w-3.5 text-black/60" />
                  </div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
        {isTyping && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-start gap-3 mt-2"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-black text-white">
              <PawPrint className="h-3.5 w-3.5" />
            </div>
            <div className="rounded-2xl rounded-tl-sm border border-black/10 bg-black/5 px-4 py-2.5">
              <div className="flex gap-1">
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-black/20" style={{ animationDelay: '0ms' }} />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-black/20" style={{ animationDelay: '150ms' }} />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-black/20" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </motion.div>
        )}
        <div ref={endRef} />
      </div>

      <div className="border-t-2 border-black pt-4">
        {selectedFile && (
          <div className="mb-2 flex items-center gap-3 rounded-xl border border-black/10 bg-black/5 p-2">
            {previewUrl && selectedFile.type.startsWith('image/') ? (
              <img src={previewUrl} className="h-12 w-12 rounded-lg object-cover border border-black/10" alt="Preview" />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-black/10">
                <FileText className="h-6 w-6 text-black/40" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-bold">{selectedFile.name}</p>
              <p className="text-[10px] text-black/40 font-body">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
            <button 
              onClick={() => setSelectedFile(null)}
              className="h-8 w-8 rounded-full hover:bg-black/5 flex items-center justify-center"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
        <div className="flex flex-col gap-2 rounded-2xl border border-black/10 bg-black/5 p-1.5 transition-colors focus-within:border-black">
          <div className="flex items-center gap-1 border-b border-black/5 pb-1 px-1">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-black/40 transition-colors hover:bg-black/5 hover:text-black"
              title="Attach File"
            >
              <Paperclip className="h-4 w-4" />
            </button>
            <button
              className="flex h-8 w-8 items-center justify-center rounded-lg text-black/40 transition-colors hover:bg-black/5 hover:text-black"
              title="Add Image"
              onClick={() => {
                if (fileInputRef.current) {
                  fileInputRef.current.accept = "image/*";
                  fileInputRef.current.click();
                }
              }}
            >
              <ImageIcon className="h-4 w-4" />
            </button>
            <button
              className="flex h-8 w-8 items-center justify-center rounded-lg text-black/40 transition-colors hover:bg-black/5 hover:text-black"
              title="Add Video"
              onClick={() => {
                if (fileInputRef.current) {
                  fileInputRef.current.accept = "video/*";
                  fileInputRef.current.click();
                }
              }}
            >
              <Film className="h-4 w-4" />
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) setSelectedFile(file);
              }}
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder={`Say something to ${pet.name}...`}
              className="flex-1 bg-transparent px-3 py-1 text-sm outline-none placeholder:text-black/30 font-body"
            />
            <button
              onClick={handleSend}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-black text-white transition-all hover:bg-black/80 active:scale-95 shrink-0"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function PetSidebar({
  pets,
  selectedPetId,
  onSelectPet,
  onAddPet,
  isOpen,
  onClose,
  userEmail,
}: {
  pets: PetRecord[];
  selectedPetId: number | null;
  onSelectPet: (id: number) => void;
  onAddPet: () => void;
  isOpen: boolean;
  onClose: () => void;
  userEmail: string | null;
}) {
  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      <motion.aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r-2 border-black bg-white transition-transform lg:static lg:w-20 lg:translate-x-0 xl:w-24 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between border-b-2 border-black p-4 lg:justify-center lg:px-0">
          <PawPrint className="h-6 w-6" strokeWidth={2.5} />
          <button onClick={onClose} className="lg:hidden">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-4 lg:px-0 lg:py-6">
          {pets.map((pet) => {
            const petType = getPetTypeByKey(pet.typeKey) ?? defaultPetType;
            const sprite = getSpriteByKeys(pet.typeKey, pet.spriteKey) ?? petType.sprites[0];
            const active = pet.id === selectedPetId;

            return (
              <div key={pet.id} className="relative flex items-center justify-center">
                {active && (
                  <motion.div
                    layoutId="active-pill"
                    className="absolute -left-1 hidden h-8 w-2 rounded-r-full bg-black lg:block"
                  />
                )}
                  <button
                    onClick={() => {
                      onSelectPet(pet.id);
                      onClose();
                    }}
                    className={`group relative flex h-12 w-full items-center gap-3 rounded-2xl border-2 transition-all lg:h-12 lg:w-12 lg:justify-center ${
                      active
                        ? 'border-black bg-black text-white shadow-[4px_4px_0px_rgba(0,0,0,1)]'
                        : 'border-black/5 bg-black/[0.03] hover:border-black/20'
                    }`}
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white lg:h-9 lg:w-9">
                      <PetSprite src={sprite.idle} alt={pet.name} maxWidth={28} maxHeight={28} />
                    </div>
                    <span className="font-heading text-sm font-bold lg:hidden">{pet.name}</span>
                  </button>
              </div>
            );
          })}

          <div className="flex items-center justify-center lg:pt-2">
            <button
              onClick={() => {
                onAddPet();
                onClose();
              }}
              className="flex h-12 w-full items-center gap-3 rounded-2xl border-2 border-dashed border-black/20 transition-all hover:border-black hover:bg-black/5 lg:h-12 lg:w-12 lg:justify-center"
            >
              <Plus className="h-5 w-5" />
              <span className="font-heading text-sm font-bold lg:hidden">Add Pet</span>
            </button>
          </div>
        </div>
      </motion.aside>
    </>
  );
}

function DashboardHeader({
  onSettingsOpen,
  onSidebarToggle,
  userInitial,
  petName,
}: {
  onSettingsOpen: () => void;
  onSidebarToggle: () => void;
  onEditOpen: () => void;
  userInitial: string;
  petName: string;
}) {
  return (
    <header className="flex items-center justify-between border-b-2 border-black bg-white px-4 py-4 sm:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onSidebarToggle}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-black/10 lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div>
          <span className="font-heading text-lg font-bold tracking-tight">Petecho</span>
          <p className="text-[10px] uppercase tracking-widest text-black/45 font-body sm:text-xs">
            {petName}&apos;s room
          </p>
        </div>
        <button
          onClick={onEditOpen}
          className="ml-4 hidden items-center gap-2 rounded-lg border border-black/10 bg-black/5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-all hover:border-black/20 hover:bg-black/10 sm:flex"
        >
          <Sparkles className="h-3 w-3" />
          Edit Profile
        </button>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onSettingsOpen}
          className="group flex h-9 w-9 items-center justify-center rounded-full border border-black/10 transition-colors hover:border-black hover:bg-black hover:text-white"
        >
          <Settings className="h-4 w-4" />
        </button>

        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-black text-sm font-bold text-white font-heading">
          {userInitial}
        </div>
      </div>
    </header>
  );
}

export default function AppDashboard() {
  const router = useRouter();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [createPetOpen, setCreatePetOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState<UserRecord | null>(null);
  const [selectedPetId, setSelectedPetId] = useState<number | null>(null);
  const [messages, setMessages] = useState<ChatRecord[]>([]);
  const [isTyping, setIsTyping] = useState(false);

  const pets = user?.pets || [];
  const selectedPet = useMemo(() => 
    pets.find((p) => p.id === selectedPetId) || pets[0] || null
  , [pets, selectedPetId]);

  useEffect(() => {
    const token = getAuthCookie();
    if (!token) {
      router.replace('/');
      return;
    }
    
    fetch(`${API_URL}/auth/me`, { headers: getAuthHeaders() })
      .then((res) => res.json())
      .then((payload) => {
        setUser(payload.user);
        if (payload.user.pets.length > 0 && !selectedPetId) {
          setSelectedPetId(payload.user.pets[0].id);
        }
      });
  }, [router, selectedPetId]);

  useEffect(() => {
    if (!selectedPet) return;
    let cancelled = false;
    
    setMessages([]);
    fetch(`${API_URL}/pets/${selectedPet.id}/chats`, { headers: getAuthHeaders() })
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled && data.chats) {
          setMessages(data.chats);
        }
      });

    return () => { cancelled = true; };
  }, [selectedPet]);

  function handleLogout() {
    clearAuthCookie();
    router.replace('/');
    router.refresh();
  }

  async function handleDeleteAccount() {
    try {
      const res = await fetch(`${API_URL}/auth/me`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      if (res.ok) handleLogout();
    } catch (err) {
      console.error(err);
    }
  }

  function handlePetCreated(pet: PetRecord) {
    setUser((prev) => (prev ? { ...prev, pets: [...prev.pets, pet] } : null));
    setSelectedPetId(pet.id);
  }

  function handlePetUpdated(pet: PetRecord) {
    setUser((prev) => (prev ? {
      ...prev,
      pets: prev.pets.map(p => p.id === pet.id ? pet : p)
    } : null));
  }

  async function handlePetAction(actionName: string, text: string) {
    if (!selectedPet) return;
    
    // Save the pet's action message to the database
    try {
      const res = await fetch(`${API_URL}/pets/${selectedPet.id}/chats`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        // We send it as a special "pet" role from the frontend for actions
        // But the server usually determines the reply. 
        // Wait, the server's POST /pets/:id/chats adds a USER message and then a PET reply.
        // I should add a specific endpoint for actions or modify the existing one.
        // Actually, I'll just use the existing one but I'll add a way to specify it's a pet message.
        body: JSON.stringify({ text, role: 'pet' }),
      });

      const data = await res.json();
      if (res.ok && data.messages) {
        setMessages(prev => [...prev, ...data.messages]);
      }
    } catch (err) {
      console.error(err);
      
      // Fallback to local state if backend fails
      const petMessage: ChatRecord = {
        id: `action-${Date.now()}`,
        petId: selectedPet.id,
        role: 'pet',
        text: text,
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, petMessage]);
    }
  }

  async function handleSendMessage(text?: string, file?: File) {
    if (!selectedPet) return;
    
    setIsTyping(true);
    
    const userMessage: ChatRecord = {
      id: `temp-${Date.now()}`,
      petId: selectedPet.id,
      role: 'user',
      text: text || (file ? '[File Attachment]' : ''),
      mimeType: file?.type,
      timestamp: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, userMessage]);

    try {
      const formData = new FormData();
      if (text) formData.append('text', text);
      if (file) formData.append('file', file);

      const response = await fetch(`${API_URL}/pets/${selectedPet.id}/chats/stream`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
        },
        body: formData,
      });

      if (!response.ok) throw new Error('Failed to send message');

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No reader available');

      const decoder = new TextDecoder();
      let petReplyText = '';
      const replyId = `reply-${Date.now()}`;
      
      // Add a placeholder message for the streaming reply
      setMessages(prev => [
        ...prev,
        {
          id: replyId,
          petId: selectedPet.id,
          role: 'pet',
          text: '',
          timestamp: new Date().toISOString()
        }
      ]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim();
            if (data === '[DONE]') {
              setIsTyping(false);
              continue;
            }
            try {
              const parsed = JSON.parse(data);
              if (parsed.text) {
                petReplyText += parsed.text;
                setMessages(prev => prev.map(m => 
                  m.id === replyId ? { ...m, text: petReplyText } : m
                ));
              }
            } catch (e) {
              // Ignore partial JSON
            }
          }
        }
      }
    } catch (err) {
      console.error(err);
      setIsTyping(false);
    }
  }

  return (
    <div className="flex h-screen flex-col overflow-y-auto bg-white text-black lg:flex-row lg:overflow-hidden">
      <PetSidebar
        pets={pets}
        selectedPetId={selectedPetId}
        onSelectPet={setSelectedPetId}
        onAddPet={() => setCreatePetOpen(true)}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        userEmail={user?.email || null}
      />

      <div className="flex flex-1 flex-col overflow-y-auto lg:overflow-hidden">
        <DashboardHeader
          onSettingsOpen={() => setSettingsOpen(true)}
          onSidebarToggle={() => setSidebarOpen(true)}
          onEditOpen={() => setEditModalOpen(true)}
          userInitial={getUserInitial(user?.email || '')}
          petName={selectedPet?.name || 'Your Pet'}
        />

        <main className="flex min-h-0 flex-1 flex-col overflow-y-auto lg:flex-row lg:overflow-hidden">
          {selectedPet ? (
            <>
              <section className="shrink-0 border-b-2 border-black p-6 lg:w-[380px] lg:border-b-0 lg:border-r-2 lg:overflow-y-auto xl:w-[440px]">
                <PetPlayground 
                  pet={selectedPet} 
                  onAction={handlePetAction}
                />
              </section>

              <section className="flex min-h-0 flex-1 flex-col overflow-hidden p-6">
                <ChatPanel 
                  pet={selectedPet} 
                  messages={messages} 
                  onSendMessage={handleSendMessage}
                  isTyping={isTyping}
                />
              </section>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center p-8">
              <div className="max-w-md text-center">
                <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-3xl bg-[#f5f0e8] text-black">
                  <PawPrint className="h-8 w-8" />
                </div>
                <h2 className="font-heading text-2xl font-bold">No pets yet!</h2>
                <p className="mt-2 text-black/50 font-body">
                  Bring your first digital companion home to start chatting.
                </p>
                <button
                  onClick={() => setCreatePetOpen(true)}
                  className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-black px-8 py-4 font-heading font-bold text-white transition-all hover:bg-black/85"
                >
                  <Plus className="h-5 w-5" />
                  Bring them home
                </button>
              </div>
            </div>
          )}
        </main>
      </div>

      {settingsOpen && (
        <SettingsModal
          onClose={() => setSettingsOpen(false)}
          onLogout={handleLogout}
          onDeleteAccount={handleDeleteAccount}
        />
      )}

      {createPetOpen && (
        <CreatePetModal
          onClose={() => setCreatePetOpen(false)}
          onCreated={handlePetCreated}
        />
      )}

      {editModalOpen && selectedPet && (
        <EditPetModal
          pet={selectedPet}
          onClose={() => setEditModalOpen(false)}
          onUpdated={handlePetUpdated}
        />
      )}
    </div>
  );
}
