'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { Zap, CircleDashed, Gamepad2, PawPrint, Heart } from 'lucide-react';
import { PetSprite } from '@/components/pet-sprite';
import { type PetRecord } from '@/lib/auth';
import petCatalog from '@/public/art/catalog.json';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const getPetTypeByKey = (key: string) => petCatalog.petTypes.find((t) => t.key === key);
const getSpriteByKeys = (typeKey: string, spriteKey: string) => {
  const type = getPetTypeByKey(typeKey);
  return type?.sprites.find((s) => s.key === spriteKey);
};

export default function SharePage() {
  const { token } = useParams();
  const [pet, setPet] = useState<PetRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [action, setAction] = useState<'idle' | 'run' | 'swipe' | 'withBall'>('idle');
  const [dialogue, setDialogue] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const sprite = useMemo(() => {
    if (!pet) return null;
    return getSpriteByKeys(pet.typeKey, pet.spriteKey) || getPetTypeByKey(pet.typeKey)?.sprites[0];
  }, [pet]);

  useEffect(() => {
    fetch(`${API_URL}/public/pets/${token}`)
      .then(res => res.json())
      .then(data => {
        if (data.error) setError(data.error);
        else setPet(data.pet);
      })
      .catch(() => setError('Failed to load pet.'))
      .finally(() => setLoading(false));
  }, [token]);

  const getSpriteSrc = () => {
    if (!pet || !sprite) return '';
    if (pet.customSpriteUrl) {
      return `${API_URL}/files/${pet.customSpriteUrl.split(/[/\\]/).pop()}`;
    }
    if (action === 'run') return sprite.run || sprite.idle.replace('_idle_', '_run_');
    if (action === 'swipe') return sprite.swipe || sprite.idle.replace('_idle_', '_swipe_');
    if (action === 'withBall') return sprite.withBall || sprite.idle.replace('_idle_', '_with_ball_');
    return sprite.idle;
  };

  const handleGuestAction = async (actionType: 'run' | 'ball' | 'play') => {
    if (!pet) return;

    const cooldownKey = `cooldown-${token}-${actionType}`;
    const lastClick = localStorage.getItem(cooldownKey);
    const now = Date.now();
    const TWELVE_HOURS = 12 * 60 * 60 * 1000;

    if (lastClick && now - parseInt(lastClick) < TWELVE_HOURS) {
      const remaining = TWELVE_HOURS - (now - parseInt(lastClick));
      const hours = Math.ceil(remaining / (1000 * 60 * 60));
      alert(`Slow down! You can do this again in ${hours} hours.`);
      return;
    }

    if (timerRef.current) clearTimeout(timerRef.current);
    
    const animType = actionType === 'run' ? 'run' : actionType === 'ball' ? 'withBall' : 'swipe';
    setAction(animType);
    
    const messages = {
      run: ["Catch me if you can!", "I'm zoomin'!", "Look at me go!", "Woooosh!"],
      ball: ["I love this ball!", "Throw it again!", "Yay, playtime!", "Mine!"],
      play: ["*nuzzles*", "Hehe, that tickles!", "You're fun!", "*purrs*"]
    };
    const randomMsg = messages[actionType][Math.floor(Math.random() * messages[actionType].length)];
    setDialogue(randomMsg);

    timerRef.current = setTimeout(() => {
      setAction('idle');
      setDialogue(null);
      timerRef.current = null;
    }, 4000);

    localStorage.setItem(cooldownKey, now.toString());
    
    try {
      const res = await fetch(`${API_URL}/public/pets/${token}/stats`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: actionType })
      });
      const data = await res.json();
      if (data.pet) setPet(data.pet);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#fdfaf5]">
      <div className="h-12 w-12 animate-bounce rounded-2xl bg-black flex items-center justify-center">
        <PawPrint className="h-6 w-6 text-white" />
      </div>
      <p className="mt-4 font-heading text-sm font-bold uppercase tracking-widest text-black/40">Waking up pet...</p>
    </div>
  );

  if (error || !pet) return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#fdfaf5] p-6 text-center">
      <div className="mb-4 text-6xl">😿</div>
      <h1 className="font-heading text-2xl font-bold">{error || 'Pet not found'}</h1>
      <p className="mt-2 font-body text-black/40">This pet might have moved to a new home.</p>
    </div>
  );

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#fdfaf5] p-6 font-body">
      <div className="w-full max-w-lg">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 rounded-full border-2 border-black bg-white px-4 py-1.5 font-heading text-xs font-bold uppercase tracking-widest shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <Heart className="h-3 w-3 text-rose-500 fill-rose-500" />
            Guest Visit
          </div>
        </div>

        <div className="relative mb-12 flex h-80 items-center justify-center rounded-[3.5rem] border-4 border-black bg-[#f5f0e8] shadow-[16px_16px_0px_0px_rgba(0,0,0,1)]">
          <AnimatePresence>
            {dialogue && (
              <motion.div 
                initial={{ scale: 0.8, opacity: 0, y: 10 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.8, opacity: 0, y: 10 }}
                className="absolute -top-10 right-4 rounded-2xl border-2 border-black bg-white px-5 py-3 font-heading text-sm font-bold shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] z-20"
              >
                {dialogue}
                <div className="absolute -bottom-2 right-6 h-4 w-4 rotate-45 border-b-2 border-r-2 border-black bg-white" />
              </motion.div>
            )}
          </AnimatePresence>

          <div className="relative z-10 transition-transform duration-500 hover:scale-110">
            <PetSprite
              alt={pet.name}
              src={getSpriteSrc()}
              maxWidth={220}
              maxHeight={200}
            />
          </div>

          <div className="absolute -bottom-7 rounded-[2rem] border-4 border-black bg-white px-8 py-3 font-heading text-2xl font-bold shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            {pet.name}
          </div>
        </div>

        <div className="mt-16 grid grid-cols-3 gap-4 sm:gap-6">
          <ActionButton icon={Zap} label="Run" onClick={() => handleGuestAction('run')} color="bg-amber-100 text-amber-600" />
          <ActionButton icon={CircleDashed} label="Ball" onClick={() => handleGuestAction('ball')} color="bg-blue-100 text-blue-600" />
          <ActionButton icon={Gamepad2} label="Play" onClick={() => handleGuestAction('play')} color="bg-rose-100 text-rose-600" />
        </div>

        <div className="mt-20 flex flex-col items-center gap-6 text-center border-t-2 border-black/5 pt-12">
          <div className="flex items-center gap-3 rounded-2xl bg-black/5 px-6 py-3">
            <PawPrint className="h-5 w-5 opacity-20" />
            <span className="font-heading text-sm font-bold uppercase tracking-widest text-black/60">Global Guest Interaction</span>
          </div>
          <div className="flex gap-12 sm:gap-20">
            <GlobalStat label="Runs" value={pet.guestStats?.run || 0} />
            <GlobalStat label="Balls" value={pet.guestStats?.ball || 0} />
            <GlobalStat label="Plays" value={pet.guestStats?.play || 0} />
          </div>
          
          <div className="mt-8 flex flex-col items-center gap-2">
            <p className="font-body text-[10px] text-black/30 uppercase tracking-[0.3em]">Built with love for pets</p>
            <span className="font-heading text-lg font-black tracking-tighter opacity-10 italic">Petecho</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function ActionButton({ icon: Icon, label, onClick, color }: any) {
  return (
    <button
      onClick={onClick}
      className={`group flex flex-col items-center gap-3 rounded-[2.5rem] border-2 border-black p-5 transition-all hover:translate-y-[-6px] active:translate-y-[2px] shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] ${color.split(' ')[0]}`}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/60 border border-black/5 transition-transform group-hover:scale-110">
        <Icon className={`h-6 w-6 ${color.split(' ')[1]}`} />
      </div>
      <span className="font-heading text-[10px] font-bold uppercase tracking-[0.2em]">{label}</span>
    </button>
  );
}

function GlobalStat({ label, value }: { label: string, value: number }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-widest text-black/30 mb-1">{label}</p>
      <p className="font-heading text-3xl font-bold tabular-nums">{value}</p>
    </div>
  );
}
