'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'motion/react';
import { Heart, Download, PawPrint, Calendar } from 'lucide-react';
import { PetSprite } from '@/components/pet-sprite';
import { getPetTypeByKey, getSpriteByKeys } from '@/lib/pet-catalog';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function ShareMemoryPage() {
  const { id } = useParams();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API_URL}/public/memory-cards/${id}`)
      .then(res => res.json())
      .then(resData => {
        if (resData.error) setError(resData.error);
        else setData(resData);
      })
      .catch(() => setError('Failed to load memory.'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleDownload = async () => {
    if (!data?.card?.image_url) return;
    const response = await fetch(`${API_URL}/files/${data.card.image_url.split(/[/\\]/).pop()}`);
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `memory_${data.pet?.name || 'pet'}_${id}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#fdfaf5]">
      <div className="h-12 w-12 animate-pulse rounded-2xl bg-black flex items-center justify-center">
        <Heart className="h-6 w-6 text-white" />
      </div>
      <p className="mt-4 font-heading text-sm font-bold uppercase tracking-widest text-black/40">Loading memory...</p>
    </div>
  );

  if (error || !data) return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#fdfaf5] p-6 text-center">
      <div className="mb-4 text-6xl">🎞️</div>
      <h1 className="font-heading text-2xl font-bold">{error || 'Memory not found'}</h1>
      <p className="mt-2 font-body text-black/40">This memory card might have been removed.</p>
    </div>
  );

  const { card, pet } = data;
  const sprite = pet ? (getSpriteByKeys(pet.typeKey, pet.spriteKey) || getPetTypeByKey(pet.typeKey)?.sprites[0]) : null;

  return (
    <div className="flex min-h-screen flex-col items-center bg-[#fdfaf5] p-6 font-body pt-12 md:pt-24">
      <div className="w-full max-w-3xl">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 rounded-full border-2 border-black bg-white px-4 py-1.5 font-heading text-xs font-bold uppercase tracking-widest shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mb-6">
            <Heart className="h-3 w-3 text-rose-500 fill-rose-500" />
            Shared Memory
          </div>
          <h1 className="font-heading text-4xl font-bold tracking-tight md:text-5xl">
            {card.title}
          </h1>
          <div className="mt-4 flex items-center justify-center gap-4 text-black/40">
            <div className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              <span className="text-sm font-medium">{new Date(card.created_at).toLocaleDateString()}</span>
            </div>
            {pet && (
              <div className="flex items-center gap-1.5">
                <PawPrint className="h-4 w-4" />
                <span className="text-sm font-medium">{pet.name}</span>
              </div>
            )}
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="relative group"
        >
          <div className="overflow-hidden rounded-[2.5rem] border-4 border-black bg-white shadow-[20px_20px_0px_0px_rgba(0,0,0,1)]">
            <img 
              src={`${API_URL}/files/${card.image_url.split(/[/\\]/).pop()}`} 
              alt={card.title}
              className="w-full aspect-[4/3] object-cover"
            />
          </div>
          
          <button 
            onClick={handleDownload}
            className="absolute -bottom-6 -right-6 flex h-16 w-16 items-center justify-center rounded-3xl border-4 border-black bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-transform hover:scale-110 active:scale-95 group-hover:bg-black group-hover:text-white"
            title="Download Memory"
          >
            <Download className="h-6 w-6" />
          </button>
        </motion.div>

        <div className="mt-24 flex flex-col items-center gap-8 text-center border-t-2 border-black/5 pt-12">
          {pet && sprite && (
            <div className="flex flex-col items-center gap-4">
              <PetSprite
                alt={pet.name}
                src={sprite.idle}
                maxWidth={100}
                maxHeight={100}
              />
              <p className="font-heading text-lg font-bold">Created with {pet.name}</p>
            </div>
          )}
          
          <div className="mt-8 flex flex-col items-center gap-2">
            <p className="font-body text-[10px] text-black/30 uppercase tracking-[0.3em]">Built with love for pets</p>
            <span className="font-heading text-lg font-black tracking-tighter opacity-10 italic">Petecho</span>
          </div>
        </div>
      </div>
    </div>
  );
}
