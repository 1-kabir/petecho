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
  BarChart3,
  Share2,
  Reply,
  Download,
  Volume2,
} from 'lucide-react';
import { PetSprite } from '@/components/pet-sprite';
import { PetCustomizer } from '@/components/pet-customizer';
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
import { useToast } from '@/lib/toast-context';
import { cn } from '@/lib/utils';

const defaultPetType = petCatalog.petTypes[0];

function SettingsModal({
  user,
  onUserUpdate,
  onClose,
  onLogout,
  onDeleteAccount,
  mics,
  selectedMicId,
  onMicChange,
}: {
  user: UserRecord | null;
  onUserUpdate: (user: UserRecord) => void;
  onClose: () => void;
  onLogout: () => void;
  onDeleteAccount: () => void;
  mics: MediaDeviceInfo[];
  selectedMicId: string | null;
  onMicChange: (id: string) => void;
}) {
  const [notifications, setNotifications] = useState(true);
  const [userName, setUserName] = useState(user?.name || '');
  const [userAge, setUserAge] = useState(user?.age?.toString() || '');
  const [userDesc, setUserDesc] = useState(user?.description || '');
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleSaveProfile() {
    if (!user) return;
    setIsSaving(true);
    try {
      const formData = new FormData();
      formData.append('name', userName);
      formData.append('age', userAge);
      formData.append('description', userDesc);
      
      const file = fileInputRef.current?.files?.[0];
      if (file) {
        formData.append('profilePicture', file);
      }

      const res = await fetch(`${API_URL}/auth/me`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: formData,
      });

      if (!res.ok) throw new Error('Failed to update profile');
      const data = await res.json();
      onUserUpdate(data.user);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  }

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
              My Profile
            </h3>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div 
                  className="relative h-16 w-16 shrink-0 cursor-pointer overflow-hidden rounded-2xl border-2 border-black bg-[#f5f0e8] transition-transform hover:scale-105 active:scale-95"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {user?.profilePictureUrl ? (
                    <img 
                      src={`${API_URL}/files/${user.profilePictureUrl.split(/[/\\]/).pop()}`} 
                      className="h-full w-full object-cover" 
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center font-heading text-xl font-bold">
                      {getUserInitial(user?.email || '')}
                    </div>
                  )}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 transition-opacity hover:opacity-100">
                    <Camera className="h-5 w-5 text-white" />
                  </div>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*" 
                    onChange={handleSaveProfile}
                  />
                </div>
                <div className="flex-1 space-y-1">
                  <input
                    type="text"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    placeholder="Your Name"
                    className="w-full bg-transparent font-heading font-bold outline-none border-b-2 border-transparent focus:border-black/10"
                  />
                  <input
                    type="number"
                    value={userAge}
                    onChange={(e) => setUserAge(e.target.value)}
                    placeholder="Age"
                    className="w-full bg-transparent text-xs text-black/40 outline-none"
                  />
                </div>
              </div>
              <textarea
                value={userDesc}
                onChange={(e) => setUserDesc(e.target.value)}
                placeholder="Tell your pets about yourself..."
                className="w-full h-24 resize-none rounded-xl border border-black/10 bg-black/5 p-3 text-xs outline-none transition-colors focus:border-black/20 font-body"
              />
              <button
                onClick={handleSaveProfile}
                disabled={isSaving}
                className="w-full rounded-xl bg-black py-2.5 text-[10px] font-bold uppercase tracking-widest text-white transition-all hover:bg-black/80 active:scale-95 disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : 'Update Profile'}
              </button>
            </div>
          </section>

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
              Audio Input
            </h3>
            <div className="space-y-4">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <Mic className="h-4 w-4 text-black/40" />
                  <label className="text-xs font-bold text-black/60 uppercase tracking-wider">Microphone</label>
                </div>
                <select 
                  value={selectedMicId || ''} 
                  onChange={(e) => onMicChange(e.target.value)}
                  className="w-full rounded-xl border border-black/10 bg-black/5 px-4 py-3 text-sm outline-none transition-colors focus:border-black/20 font-body"
                >
                  {mics.length === 0 && <option value="">No microphones found</option>}
                  {mics.map((mic) => (
                    <option key={mic.deviceId} value={mic.deviceId}>
                      {mic.label || `Microphone ${mic.deviceId.slice(0, 5)}...`}
                    </option>
                  ))}
                </select>
              </div>
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
  const [gender, setGender] = useState('male');
  const [description, setDescription] = useState('');
  const [birthday, setBirthday] = useState('');
  const [isReal, setIsReal] = useState(false);
  const [isAlive, setIsAlive] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [customizerData, setCustomizerData] = useState<{
    typeKey: string;
    spriteKey: string;
    customFiles: { idle?: File | null; run?: File | null; ball?: File | null; play?: File | null; };
    useCustom: boolean;
  }>({
    typeKey: petCatalog.petTypes[0].key,
    spriteKey: petCatalog.petTypes[0].sprites[0].key,
    customFiles: {},
    useCustom: false,
  });

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('gender', gender);
      formData.append('typeKey', customizerData.typeKey);
      formData.append('spriteKey', customizerData.spriteKey);
      formData.append('description', description);
      formData.append('birthday', birthday);
      formData.append('isReal', isReal ? 'true' : 'false');
      formData.append('isAlive', isAlive ? 'true' : 'false');

      if (customizerData.customFiles.idle) formData.append('sprite', customizerData.customFiles.idle);
      if (customizerData.customFiles.run) formData.append('run', customizerData.customFiles.run);
      if (customizerData.customFiles.ball) formData.append('ball', customizerData.customFiles.ball);
      if (customizerData.customFiles.play) formData.append('play', customizerData.customFiles.play);

      const res = await fetch(`${API_URL}/pets`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: formData,
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
          className="relative w-full max-w-4xl overflow-hidden rounded-[2.5rem] border-2 border-black bg-white shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]"
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between border-b-2 border-black px-6 py-5 bg-[#f5f0e8]">
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

          <form className="max-h-[85vh] overflow-y-auto p-8" onSubmit={handleSubmit}>
            <div className="grid gap-8 md:grid-cols-2">
              <div className="space-y-6">
                <div className="space-y-4 rounded-3xl border-2 border-black/5 bg-black/[0.02] p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold">Real-life Pet?</p>
                      <p className="text-[10px] text-black/40 font-body uppercase tracking-wider">Is this pet based on a real companion?</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsReal(!isReal)}
                      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${isReal ? 'bg-black' : 'bg-black/10'}`}
                    >
                      <div className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-all ${isReal ? 'left-6' : 'left-1'}`} />
                    </button>
                  </div>
                  
                  {isReal && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      className="border-t-2 border-black/5 pt-4 flex items-center justify-between"
                    >
                      <div>
                        <p className="text-sm font-bold">Memorial Pet?</p>
                        <p className="text-[10px] text-black/40 font-body uppercase tracking-wider">Is this pet a tribute to a companion who has passed?</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsAlive(!isAlive)}
                        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${!isAlive ? 'bg-rose-500' : 'bg-black/10'}`}
                      >
                        <div className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-all ${!isAlive ? 'left-6' : 'left-1'}`} />
                      </button>
                    </motion.div>
                  )}
                </div>

                <div className="space-y-4">
                  <label className="block">
                    <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-black/45">Name</span>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Pet Name"
                      className="w-full rounded-2xl border border-black/10 bg-black/[0.03] px-4 py-3.5 text-sm outline-none transition-colors focus:border-black"
                      required
                    />
                  </label>

                  <div className="grid grid-cols-2 gap-4">
                    <label className="block">
                      <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-black/45">Gender</span>
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
                      <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-black/45">Birthday</span>
                      <input
                        type="date"
                        value={birthday}
                        onChange={(e) => setBirthday(e.target.value)}
                        className="w-full rounded-2xl border border-black/10 bg-black/[0.03] px-4 py-3.5 text-sm outline-none transition-colors focus:border-black"
                      />
                    </label>
                  </div>

                  <label className="block">
                    <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-black/45">Description</span>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Describe your pet's personality..."
                      rows={3}
                      className="w-full resize-none rounded-2xl border border-black/10 bg-black/[0.03] px-4 py-3.5 text-sm outline-none transition-colors focus:border-black font-body"
                    />
                  </label>
                </div>
              </div>

              <div className="flex flex-col">
                <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-black/45">Visual Representation</span>
                <div className="flex-1">
                  <PetCustomizer onChange={setCustomizerData} />
                </div>

                <div className="mt-8 space-y-4">
                  {error && (
                    <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600 font-bold">
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-black py-4 font-heading font-bold text-white shadow-[6px_6px_0px_0px_rgba(0,0,0,0.3)] transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                  >
                    {loading ? <LoaderCircle className="h-5 w-5 animate-spin" /> : <Plus className="h-5 w-5" />}
                    Bring them home
                  </button>
                </div>
              </div>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function StatsModal({
  pet,
  onClose,
}: {
  pet: PetRecord;
  onClose: () => void;
}) {
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
          className="w-full max-w-md overflow-hidden rounded-[2.5rem] border-2 border-black bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between border-b-2 border-black bg-[#f5f0e8] px-8 py-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-black text-white">
                <BarChart3 className="h-5 w-5" />
              </div>
              <h2 className="font-heading text-xl font-bold">{pet.name}'s Stats</h2>
            </div>
            <button onClick={onClose} className="flex h-10 w-10 items-center justify-center rounded-full border border-black/10 transition-colors hover:bg-black hover:text-white">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="p-8 space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <StatCard icon={Zap} label="Times Run" value={pet.stats.run} guestValue={pet.guestStats?.run} color="bg-amber-100 text-amber-600" />
              <StatCard icon={CircleDashed} label="Balls Given" value={pet.stats.ball} guestValue={pet.guestStats?.ball} color="bg-blue-100 text-blue-600" />
              <StatCard icon={Gamepad2} label="Times Played" value={pet.stats.play} guestValue={pet.guestStats?.play} color="bg-rose-100 text-rose-600" />
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function StatCard({ icon: Icon, label, value, guestValue, color }: { icon: any, label: string, value: number, guestValue?: number, color: string }) {
  return (
    <div className={`flex items-center justify-between rounded-2xl border-2 border-black/5 p-5 ${color.split(' ')[0]}`}>
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white shadow-sm">
          <Icon className={`h-6 w-6 ${color.split(' ')[1]}`} />
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">{label}</p>
          <div className="flex items-baseline gap-2">
            <p className="font-heading text-2xl font-bold">{value}</p>
            {guestValue !== undefined && (
              <p className="text-[10px] font-bold opacity-40">+{guestValue} by guests</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function EditPetModal({
  pet,
  onClose,
  onUpdated,
  onDeleted,
}: {
  pet: PetRecord;
  onClose: () => void;
  onUpdated: (pet: PetRecord) => void;
  onDeleted: (petId: number) => void;
}) {
  const [name, setName] = useState(pet.name);
  const [gender, setGender] = useState(pet.gender);
  const [description, setDescription] = useState(pet.description || '');
  const [birthday, setBirthday] = useState(pet.birthday || '');
  const [isReal, setIsReal] = useState(pet.isReal);
  const [isAlive, setIsAlive] = useState(pet.isAlive);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [customizerData, setCustomizerData] = useState<{
    typeKey: string;
    spriteKey: string;
    customFiles: { idle?: File | null; run?: File | null; ball?: File | null; play?: File | null; };
    useCustom: boolean;
  }>({
    typeKey: pet.typeKey,
    spriteKey: pet.spriteKey,
    customFiles: {},
    useCustom: !!pet.customSpriteUrl,
  });

  async function handleDelete() {
    if (!confirm(`Are you sure you want to delete ${pet.name}? This action cannot be undone.`)) return;
    
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/pets/${pet.id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      
      if (!res.ok) throw new Error('Failed to delete pet.');
      
      onDeleted(pet.id);
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('gender', gender);
      formData.append('description', description);
      formData.append('birthday', birthday);
      formData.append('isReal', isReal ? 'true' : 'false');
      formData.append('isAlive', isAlive ? 'true' : 'false');
      formData.append('typeKey', customizerData.typeKey);
      formData.append('spriteKey', customizerData.spriteKey);

      if (customizerData.customFiles.idle) formData.append('sprite', customizerData.customFiles.idle);
      if (customizerData.customFiles.run) formData.append('run', customizerData.customFiles.run);
      if (customizerData.customFiles.ball) formData.append('ball', customizerData.customFiles.ball);
      if (customizerData.customFiles.play) formData.append('play', customizerData.customFiles.play);

      const res = await fetch(`${API_URL}/pets/${pet.id}`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to update pet.');
      }

      onUpdated(data.pet);
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
          className="relative w-full max-w-md md:max-w-3xl overflow-hidden rounded-[2.5rem] border-2 border-black bg-white shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]"
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between border-b-2 border-black bg-[#f5f0e8] px-8 py-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-black text-white">
                <Sparkles className="h-5 w-5" />
              </div>
              <h2 className="font-heading text-xl font-bold">Edit Pet</h2>
            </div>
            <button
              onClick={onClose}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-black/10 transition-colors hover:bg-black hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="max-h-[85vh] overflow-y-auto p-8">
            <div className="grid gap-8 md:grid-cols-2">
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-black/40">Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-xl border border-black/10 bg-black/5 px-4 py-3 outline-none transition-colors focus:border-black/20"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-black/40">Birthday</label>
                    <input
                      type="date"
                      value={birthday}
                      onChange={(e) => setBirthday(e.target.value)}
                      className="w-full rounded-xl border border-black/10 bg-black/5 px-4 py-3 outline-none transition-colors focus:border-black/20"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-black/40">Gender</label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      className="w-full rounded-xl border border-black/10 bg-black/5 px-4 py-3 outline-none transition-colors focus:border-black/20"
                    >
                      <option value="male">Boy</option>
                      <option value="female">Girl</option>
                      <option value="unknown">Unknown</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-black/40">Description</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe your pet's personality..."
                    rows={4}
                    className="w-full resize-none rounded-xl border border-black/10 bg-black/5 px-4 py-3 outline-none transition-colors focus:border-black/20 font-body text-sm"
                  />
                </div>

                <div className="space-y-4 rounded-3xl border-2 border-black/5 bg-black/[0.02] p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold">Real-life Pet?</p>
                      <p className="text-[10px] text-black/40 font-body uppercase tracking-wider">Based on a real companion?</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsReal(!isReal)}
                      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${isReal ? 'bg-black' : 'bg-black/10'}`}
                    >
                      <div className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-all ${isReal ? 'left-6' : 'left-1'}`} />
                    </button>
                  </div>
                  
                  {isReal && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      className="border-t-2 border-black/5 pt-4 flex items-center justify-between"
                    >
                      <div>
                        <p className="text-sm font-bold">Memorial Pet?</p>
                        <p className="text-[10px] text-black/40 font-body uppercase tracking-wider">A tribute to one who passed?</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsAlive(!isAlive)}
                        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${!isAlive ? 'bg-rose-500' : 'bg-black/10'}`}
                      >
                        <div className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-all ${!isAlive ? 'left-6' : 'left-1'}`} />
                      </button>
                    </motion.div>
                  )}
                </div>
              </div>

              <div className="flex flex-col space-y-6">
                <div className="flex-1 space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-black/40">Visual Representation</label>
                  <PetCustomizer 
                    initialTypeKey={pet.typeKey}
                    initialSpriteKey={pet.spriteKey}
                    initialCustomSprites={{
                      idle: pet.customSpriteUrl,
                      run: pet.customRunUrl,
                      ball: pet.customBallUrl,
                      play: pet.customPlayUrl,
                    }}
                    onChange={setCustomizerData}
                  />
                </div>

                {error && (
                  <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-600">
                    {error}
                  </div>
                )}

                <div className="space-y-3 pt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-black py-4 font-heading text-sm font-bold uppercase tracking-widest text-white shadow-[6px_6px_0px_0px_rgba(0,0,0,0.3)] transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                  >
                    {loading ? <LoaderCircle className="h-5 w-5 animate-spin" /> : 'Save Changes'}
                  </button>

                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={loading}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-red-500/20 py-4 font-heading text-sm font-bold uppercase tracking-widest text-red-500 transition-all hover:bg-red-50 disabled:opacity-50"
                  >
                    {loading ? <LoaderCircle className="h-5 w-5 animate-spin" /> : 'Delete Pet'}
                  </button>
                </div>
              </div>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function ActionButton({ icon: Icon, label, onClick, color, id, disabled }: { icon: any, label: string, onClick: () => void, color: string, id: string, disabled?: boolean }) {
  return (
    <button
      id={id}
      onClick={onClick}
      disabled={disabled}
      className={`group flex min-w-[90px] flex-col items-center gap-2 rounded-[2rem] border-2 border-black/5 p-4 transition-all active:scale-95 sm:min-w-[110px] sm:p-5 ${
        disabled ? 'opacity-40 cursor-not-allowed' : 'hover:-translate-y-1 hover:border-black'
      } ${color}`}
    >
      <div className={`rounded-2xl p-2 transition-colors sm:p-3 ${disabled ? 'bg-white/20' : 'bg-white/50 group-hover:bg-white'}`}>
        <Icon className="h-6 w-6 sm:h-7 sm:w-7" />
      </div>
      <span className="font-heading text-[10px] font-bold uppercase tracking-wider sm:text-xs">{label}</span>
    </button>
  );
}

function MemoryCardsModal({
  pet,
  onClose,
}: {
  pet: PetRecord;
  onClose: () => void;
}) {
  const { toast } = useToast();
  const [cards, setCards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/pets/${pet.id}/memory-cards`, { headers: getAuthHeaders() })
      .then(res => res.json())
      .then(data => {
        setCards(data.cards || []);
        setLoading(false);
        (window as any).lastMemoryCount = data.cards?.length || 0;
      })
      .catch(() => setLoading(false));
  }, [pet.id]);

  const handleDownload = async (imageUrl: string) => {
    const response = await fetch(`${API_URL}/files/${imageUrl.split(/[/\\]/).pop()}`);
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `memory_${pet.name}_${Date.now()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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
          className="w-full max-w-4xl overflow-hidden rounded-[2rem] border-2 border-black bg-white shadow-[12px_12px_0px_rgba(0,0,0,1)]"
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between border-b-2 border-black px-6 py-5">
            <div className="flex items-center gap-2">
              <Film className="h-5 w-5" />
              <span className="font-heading text-lg font-bold">Memory Cards</span>
            </div>
            <button onClick={onClose} className="rounded-full border border-black/10 p-2 hover:bg-black hover:text-white">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="max-h-[70vh] overflow-y-auto p-6">
            {loading ? (
              <div className="flex h-40 items-center justify-center">
                <LoaderCircle className="h-8 w-8 animate-spin text-black/20" />
              </div>
            ) : cards.length === 0 ? (
              <div className="py-20 text-center">
                <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-3xl bg-black/5">
                  <Film className="h-8 w-8 text-black/20" />
                </div>
                <h3 className="font-heading text-xl font-bold">No memories yet</h3>
                <p className="mt-2 text-black/40">Exchange 3 or more images in a week to create a memory card!</p>
              </div>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2">
                {cards.map((card) => (
                  <motion.div
                    key={card.id}
                    className="group relative overflow-hidden rounded-2xl border-2 border-black bg-[#f5f0e8] p-2 transition-transform hover:-translate-y-1"
                    whileHover={{ scale: 1.02 }}
                  >
                    <img
                      src={`${API_URL}/files/${card.image_url.split(/[/\\]/).pop()}`}
                      alt={card.title}
                      className="aspect-[3/2] w-full rounded-xl object-cover"
                    />
                    <div className="mt-3 flex items-center justify-between px-2 pb-1">
                      <div>
                        <p className="font-heading text-sm font-bold">{card.title}</p>
                        <p className="text-[10px] text-black/40 uppercase tracking-widest font-body">Weekly Highlights</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleDownload(card.image_url)}
                          className="rounded-lg border border-black/10 bg-white p-2 hover:bg-black hover:text-white transition-colors"
                          title="Download"
                        >
                          <Download className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => {
                            const url = `${window.location.origin}/share-memory/${card.id}`;
                            navigator.clipboard.writeText(url);
                            toast('Memory card link copied!', 'success');
                          }}
                          className="rounded-lg border border-black/10 bg-white p-2 hover:bg-black hover:text-white transition-colors"
                          title="Share"
                        >
                          <Share2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function PetPlayground({ 
  pet, 
  onAction,
  isTyping,
}: { 
  pet: PetRecord;
  onAction?: (action: string, message: string) => void;
  isTyping?: boolean;
}) {
  const petType = getPetTypeByKey(pet.typeKey) ?? defaultPetType;
  const sprite = getSpriteByKeys(pet.typeKey, pet.spriteKey) ?? petType.sprites[0];
  const [action, setAction] = useState<'idle' | 'walk' | 'run' | 'swipe' | 'withBall'>('idle');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const getSpriteSrc = () => {
    if (action === 'run' && pet.customRunUrl) return `${API_URL}/files/${pet.customRunUrl.split(/[/\\]/).pop()}`;
    if (action === 'withBall' && pet.customBallUrl) return `${API_URL}/files/${pet.customBallUrl.split(/[/\\]/).pop()}`;
    if (action === 'swipe' && pet.customPlayUrl) return `${API_URL}/files/${pet.customPlayUrl.split(/[/\\]/).pop()}`;
    
    if (pet.customSpriteUrl) {
      return `${API_URL}/files/${pet.customSpriteUrl.split(/[/\\]/).pop()}`;
    }
    
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
          disabled={isTyping}
        />
        <ActionButton
          icon={CircleDashed}
          label="Give Ball"
          onClick={() => triggerAnimation('withBall', 5000, 'ball', getRandomPetActionMessage(pet.typeKey, 'ball'))}
          color="bg-blue-100 text-blue-600 hover:bg-blue-200"
          id="btn-ball"
          disabled={isTyping}
        />
        <ActionButton
          icon={Gamepad2}
          label="Play"
          onClick={() => triggerAnimation('swipe', 5000, 'play', getRandomPetActionMessage(pet.typeKey, 'play'))}
          color="bg-rose-100 text-rose-600 hover:bg-rose-200"
          id="btn-play"
          disabled={isTyping}
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

function ChatPanel({
  pet, 
  messages,
  onSendMessage,
  isTyping,
  selectedMicId,
  user,
}: { 
  pet: PetRecord; 
  messages: ChatRecord[];
  onSendMessage: (text?: string, file?: File, replyToId?: string) => void;
  isTyping?: boolean;
  selectedMicId: string | null;
  user: UserRecord | null;
}) {
  const [input, setInput] = useState('');
  const [replyTo, setReplyTo] = useState<ChatRecord | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [ttsLoading, setTtsLoading] = useState<Record<string, boolean>>({});
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [hasNewMessages, setHasNewMessages] = useState(false);
  const isAtBottomRef = useRef(true);
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
    if (isAtBottomRef.current) {
      endRef.current?.scrollIntoView({ behavior: 'smooth' });
      setHasNewMessages(false);
    } else {
      setHasNewMessages(true);
    }
  }, [messages, isTyping]);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    const isAtBottom = scrollHeight - scrollTop <= clientHeight + 100;
    isAtBottomRef.current = isAtBottom;
    setShowScrollButton(!isAtBottom);
    if (isAtBottom) {
      setHasNewMessages(false);
    }
  };

  const scrollToBottom = () => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
    setHasNewMessages(false);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: selectedMicId ? { deviceId: { exact: selectedMicId } } : true 
      });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const file = new File([blob], 'recording.webm', { type: 'audio/webm' });
        onSendMessage(undefined, file, replyTo?.id || undefined);
        setReplyTo(null);
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error('Error starting recording:', err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed && !selectedFile) {
      onSendMessage(undefined, undefined, replyTo?.id || undefined);
    } else {
      onSendMessage(trimmed || undefined, selectedFile || undefined, replyTo?.id || undefined);
    }
    setInput('');
    setSelectedFile(null);
    setReplyTo(null);
  };

  const handleTTS = async (message: ChatRecord) => {
    if (ttsLoading[message.id]) return;
    setTtsLoading(prev => ({ ...prev, [message.id]: true }));
    try {
      const res = await fetch(`${API_URL}/pets/${pet.id}/tts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ text: message.text }),
      });
      if (!res.ok) throw new Error('TTS failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audio.play();
      audio.onended = () => URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
    } finally {
      setTtsLoading(prev => ({ ...prev, [message.id]: false }));
    }
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

      <div 
        ref={scrollRef}
        onScroll={handleScroll}
        className="relative min-h-0 flex-1 space-y-6 overflow-y-auto py-4 scroll-smooth"
      >
        <AnimatePresence>
          {showScrollButton && (
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              onClick={scrollToBottom}
              className="sticky top-2 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 rounded-full bg-black px-4 py-2 text-xs font-bold text-white shadow-lg hover:bg-black/90 active:scale-95 transition-all"
            >
              <Zap className={cn("h-3 w-3", hasNewMessages && "text-amber-400 fill-amber-400 animate-pulse")} />
              {hasNewMessages ? 'New Messages' : 'Scroll to Bottom'}
            </motion.button>
          )}
        </AnimatePresence>
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
                    className={`relative group rounded-2xl px-4 py-2.5 text-sm leading-relaxed font-body transition-all hover:shadow-sm ${
                      message.role === 'user'
                        ? 'rounded-tr-sm bg-black text-white'
                        : 'rounded-tl-sm border border-black/10 bg-black/5 text-black font-medium'
                    }`}
                  >
                    <button
                      onClick={() => setReplyTo(message)}
                      className={`absolute top-0 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg bg-white border border-black/10 shadow-sm hover:bg-black/5 z-20 ${
                        message.role === 'user' ? '-left-10' : '-right-10'
                      }`}
                      title="Reply"
                    >
                      <Reply className="h-3.5 w-3.5 text-black" />
                    </button>

                    {message.role === 'pet' && (
                      <button
                        onClick={() => handleTTS(message)}
                        disabled={ttsLoading[message.id]}
                        className="absolute -right-10 top-10 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg bg-white border border-black/10 shadow-sm hover:bg-black/5 z-20 disabled:opacity-50"
                        title="Speak"
                      >
                        {ttsLoading[message.id] ? (
                          <LoaderCircle className="h-3.5 w-3.5 animate-spin text-black" />
                        ) : (
                          <Volume2 className="h-3.5 w-3.5 text-black" />
                        )}
                      </button>
                    )}

                    {message.replyToId && (
                      <div className={`mb-2 rounded-lg border-l-4 p-2 text-[10px] ${
                        message.role === 'user' ? 'bg-white/10 border-white/40' : 'bg-black/5 border-black/20'
                      }`}>
                        <p className="font-bold opacity-60">Replying to:</p>
                        <p className="truncate italic">
                          {messages.find(m => m.id === message.replyToId)?.text || 'Original message'}
                        </p>
                      </div>
                    )}

                    {message.fileUrl && (
                      <div className={`mb-2 overflow-hidden rounded-xl border border-black/5 bg-white/50 backdrop-blur-sm p-1 shadow-sm`}>
                        {message.mimeType?.startsWith('image/') ? (
                          <img 
                            src={message.fileUrl.startsWith('blob:') ? message.fileUrl : `${API_URL}/files/${message.fileUrl.split(/[/\\]/).pop()}`} 
                            alt="Attachment" 
                            className="max-h-80 w-full rounded-lg object-contain bg-black/5" 
                            onError={(e) => {
                              e.currentTarget.src = 'https://placehold.co/400x300?text=Image+Load+Error';
                            }}
                          />
                        ) : message.mimeType?.startsWith('video/') ? (
                          <video 
                            src={message.fileUrl.startsWith('blob:') ? message.fileUrl : `${API_URL}/files/${message.fileUrl.split(/[/\\]/).pop()}`} 
                            controls 
                            className="max-h-80 w-full rounded-lg bg-black/5" 
                          />
                        ) : message.mimeType?.startsWith('audio/') ? (
                          <div className="flex flex-col gap-2 p-3 min-w-[240px]">
                            <div className="flex items-center gap-2 text-black/60">
                              <Mic className="h-4 w-4" />
                              <span className="text-[10px] font-bold uppercase tracking-wider">Voice Message</span>
                            </div>
                            <audio 
                              src={message.fileUrl.startsWith('blob:') ? message.fileUrl : `${API_URL}/files/${message.fileUrl.split(/[/\\]/).pop()}`} 
                              controls 
                              className="w-full h-8" 
                            />
                          </div>
                        ) : (
                          <div className="flex items-center gap-3 p-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-black text-white">
                              <FileText className="h-5 w-5" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-xs font-bold">{message.fileUrl.split(/[/\\]/).pop()}</p>
                              <p className="text-[10px] text-black/40 uppercase tracking-widest font-body">File Attachment</p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    {message.text && message.text !== '[File Attachment]' && (
                      <div className={`prose prose-sm max-w-none ${
                        message.role === 'user' 
                          ? 'prose-invert prose-p:text-white prose-headings:text-white' 
                          : 'prose-p:text-black prose-headings:text-black'
                      }`}>
                        <ReactMarkdown>
                          {message.text}
                        </ReactMarkdown>
                      </div>
                    )}
                  </div>
                  
                  {isLastOfGroup && (
                    <p className={`text-[10px] text-black/30 font-body px-1`}>
                      {messageTimeFormatter.format(new Date(message.timestamp))}
                    </p>
                  )}
                </div>

                {message.role === 'user' && (
                  <div className={`mt-1 flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-black/10 bg-black/10 transition-opacity ${isSameSenderAsPrevious ? 'opacity-0' : 'opacity-100'}`}>
                    {user?.profilePictureUrl ? (
                      <img 
                        src={`${API_URL}/files/${user.profilePictureUrl.split(/[/\\]/).pop()}`} 
                        alt="You" 
                        className="h-full w-full object-cover" 
                      />
                    ) : (
                      <Smile className="h-3.5 w-3.5 text-black/60" />
                    )}
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
        <AnimatePresence>
          {replyTo && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mb-2 flex items-center justify-between rounded-xl border-2 border-black/5 bg-black/[0.02] px-4 py-2"
            >
              <div className="flex items-center gap-2 overflow-hidden">
                <Reply className="h-3 w-3 text-black/40" />
                <p className="truncate text-[10px] font-bold text-black/60">
                  Replying to: <span className="font-normal italic">{replyTo.text || '[Attachment]'}</span>
                </p>
              </div>
              <button 
                onClick={() => setReplyTo(null)}
                className="rounded-full p-1 hover:bg-black/5"
              >
                <X className="h-3 w-3" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

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
            <button
              onClick={isRecording ? stopRecording : startRecording}
              className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
                isRecording 
                  ? 'bg-red-500 text-white animate-pulse' 
                  : 'text-black/40 hover:bg-black/5 hover:text-black'
              }`}
              title={isRecording ? "Stop Recording" : "Record Audio"}
            >
              <Mic className="h-4 w-4" />
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
          {isRecording && (
            <div className="flex items-center gap-3 px-3 py-2 bg-red-50 text-red-600 rounded-xl mx-1 mb-1">
              <div className="flex gap-1">
                <span className="h-2 w-2 bg-red-500 rounded-full animate-pulse" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider">Recording Audio...</span>
              <button 
                onClick={stopRecording}
                className="ml-auto text-red-400 hover:text-red-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
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
  onEditOpen,
  onStatsOpen,
  userInitial,
  pet,
}: {
  onSettingsOpen: () => void;
  onSidebarToggle: () => void;
  onEditOpen: () => void;
  onStatsOpen: () => void;
  userInitial: string;
  pet: PetRecord | null;
}) {
  const { toast } = useToast();
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
            {pet ? `${pet.name}'s room` : 'No pet selected'}
          </p>
        </div>
        {pet && (
          <div className="ml-4 hidden items-center gap-2 sm:flex">
            <button
              onClick={() => {
                const url = `${window.location.origin}/share/${pet.shareToken}`;
                navigator.clipboard.writeText(url);
                toast('Share link copied to clipboard!', 'success');
              }}
              className="flex items-center gap-2 rounded-lg border border-black/10 bg-black/5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-all hover:border-black/20 hover:bg-black/10"
            >
              <Share2 className="h-3 w-3" />
              Share
            </button>
            <button
              onClick={onStatsOpen}
              className="flex items-center gap-2 rounded-lg border border-black/10 bg-black/5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-all hover:border-black/20 hover:bg-black/10"
            >
              <BarChart3 className="h-3 w-3" />
              Stats
            </button>
            <button
              onClick={onEditOpen}
              className="flex items-center gap-2 rounded-lg border border-black/10 bg-black/5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-all hover:border-black/20 hover:bg-black/10"
            >
              <Sparkles className="h-3 w-3" />
              Edit
            </button>
            <button
              onClick={() => (window as any).openMemoryCards?.()}
              className="flex items-center gap-2 rounded-lg border border-black/10 bg-black/5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-all hover:border-black/20 hover:bg-black/10"
            >
              <Film className="h-3 w-3" />
              Memories
            </button>
          </div>
        )}
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
  const [statsOpen, setStatsOpen] = useState(false);
  const [memoryCardsOpen, setMemoryCardsOpen] = useState(false);
  const [mics, setMics] = useState<MediaDeviceInfo[]>([]);
  const [selectedMicId, setSelectedMicId] = useState<string | null>(null);

  useEffect(() => {
    async function getDevices() {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const audioMics = devices.filter(d => d.kind === 'audioinput');
        setMics(audioMics);
        if (audioMics.length > 0 && !selectedMicId) {
          setSelectedMicId(audioMics[0].deviceId);
        }
      } catch (err) {
        console.warn('Microphone enumeration failed:', err);
      }
    }
    getDevices();
    (window as any).openMemoryCards = () => setMemoryCardsOpen(true);
  }, []);

  useEffect(() => {
    (window as any).triggerCheckin = async () => {
      if (!selectedPetId) return;
      await fetch(`${API_URL}/dev/trigger-checkin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ petId: selectedPetId })
      });
      setTimeout(() => (window as any).forcePoll?.(), 1000);
    };

    (window as any).triggerMemoryCard = async (force = false) => {
      if (!selectedPetId) return;
      await fetch(`${API_URL}/dev/trigger-memory-card`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ petId: selectedPetId, force })
      });
      setTimeout(() => (window as any).forcePoll?.(), 1000);
    };
  }, [selectedPetId]);

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
  }, [router]);

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

  const lastMessagesCount = useRef(messages.length);
  useEffect(() => {
    lastMessagesCount.current = messages.length;
  }, [messages]);

  useEffect(() => {
    if (!selectedPet) return;
    
    const interval = setInterval(async () => {
      await poll();
    }, 5000);

    const poll = async () => {
      try {
        const res = await fetch(`${API_URL}/pets/${selectedPet.id}/chats`, { headers: getAuthHeaders() });
        const data = await res.json();
        
        if (data.chats && data.chats.length > lastMessagesCount.current) {
          const newMessages: ChatRecord[] = data.chats.slice(lastMessagesCount.current);
          setMessages(data.chats);
          lastMessagesCount.current = data.chats.length;
          
          newMessages.forEach(msg => {
            if (msg.role === 'pet' && Notification.permission === 'granted') {
              new (window as any).Notification(`${selectedPet.name}`, {
                body: msg.text,
                icon: '/favicon.ico'
              });
            }
          });
        }

        const cardsRes = await fetch(`${API_URL}/pets/${selectedPet.id}/memory-cards`, { headers: getAuthHeaders() });
        const cardsData = await cardsRes.json();
        if (cardsData.cards && cardsData.cards.length > (window as any).lastMemoryCount) {
          if (Notification.permission === 'granted') {
            new (window as any).Notification(`${selectedPet.name}`, {
              body: "A new weekly memory card is ready for you!",
              icon: '/favicon.ico'
            });
          }
          (window as any).lastMemoryCount = cardsData.cards.length;
        }
      } catch (e) {
        console.error('Polling failed:', e);
      }
    };

    (window as any).forcePoll = poll;
    return () => {
      clearInterval(interval);
      delete (window as any).forcePoll;
    };
  }, [selectedPet?.id]);

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

  function handlePetDeleted(petId: number) {
    setUser((prev) => prev ? {
      ...prev,
      pets: prev.pets.filter(p => p.id !== petId)
    } : null);
    if (selectedPetId === petId) {
      setSelectedPetId(null);
    }
  }

  async function handlePetAction(actionName: string, text: string) {
    if (!selectedPet) return;
    
    fetch(`${API_URL}/pets/${selectedPet.id}/stats`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify({ action: actionName }),
    }).then(res => res.json()).then(data => {
      if (data.pet) handlePetUpdated(data.pet);
    });
    
    try {
      const res = await fetch(`${API_URL}/pets/${selectedPet.id}/chats`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ text, role: 'pet' }),
      });

      const data = await res.json();
      if (res.ok && data.messages) {
        setMessages(prev => [...prev, ...data.messages]);
      }
    } catch (err) {
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

  async function handleSendMessage(text?: string, file?: File, replyToId?: string) {
    if (!selectedPet) return;
    setIsTyping(true);
    
    if (text || file) {
      const userMessage: ChatRecord = {
        id: `temp-${Date.now()}`,
        petId: selectedPet.id,
        role: 'user',
        text: text || (file ? '[File Attachment]' : ''),
        mimeType: file?.type,
        fileUrl: file ? URL.createObjectURL(file) : null,
        replyToId,
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, userMessage]);
    }

    try {
      const formData = new FormData();
      if (text) formData.append('text', text);
      if (file) formData.append('file', file);
      if (replyToId) formData.append('replyToId', replyToId);

      const response = await fetch(`${API_URL}/pets/${selectedPet.id}/chats/stream`, {
        method: 'POST',
        headers: { ...getAuthHeaders() },
        body: formData,
      });

      if (!response.ok) throw new Error('Failed to send message');
      const reader = response.body?.getReader();
      if (!reader) throw new Error('No reader');

      const decoder = new TextDecoder();
      let petReplyText = '';
      const replyId = `reply-${Date.now()}`;
      
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
            } catch (e) {}
          }
        }
      }
      setIsTyping(false);
    } catch (err) {
      console.error(err);
      setIsTyping(false);
    }
  }

  return (
    <div className="flex h-[100dvh] w-full flex-col overflow-hidden bg-white text-black lg:flex-row">
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
          onStatsOpen={() => setStatsOpen(true)}
          userInitial={getUserInitial(user?.email || '')}
          pet={selectedPet}
        />

        <main className="flex min-h-0 flex-1 flex-col overflow-y-auto lg:flex-row lg:overflow-hidden">
          {selectedPet ? (
            <>
              <section className="shrink-0 border-b-2 border-black p-6 lg:w-[380px] lg:border-b-0 lg:border-r-2 lg:overflow-y-auto xl:w-[440px]">
                <PetPlayground 
                  pet={selectedPet} 
                  onAction={handlePetAction}
                  isTyping={isTyping}
                />
              </section>

              <section className="flex min-h-0 flex-1 flex-col overflow-hidden p-6">
                <ChatPanel 
                  pet={selectedPet} 
                  messages={messages} 
                  onSendMessage={handleSendMessage}
                  isTyping={isTyping}
                  selectedMicId={selectedMicId}
                  user={user}
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
          user={user}
          onUserUpdate={setUser}
          onClose={() => setSettingsOpen(false)}
          onLogout={handleLogout}
          onDeleteAccount={handleDeleteAccount}
          mics={mics}
          selectedMicId={selectedMicId}
          onMicChange={setSelectedMicId}
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
          onDeleted={handlePetDeleted}
        />
      )}

      {statsOpen && selectedPet && (
        <StatsModal
          pet={selectedPet}
          onClose={() => setStatsOpen(false)}
        />
      )}

      {memoryCardsOpen && selectedPet && (
        <MemoryCardsModal
          pet={selectedPet}
          onClose={() => setMemoryCardsOpen(false)}
        />
      )}
    </div>
  );
}
