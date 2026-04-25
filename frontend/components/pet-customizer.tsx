'use client';

import { useState, useRef, useEffect } from 'react';
import { Plus, X, Sparkles, Zap, CircleDashed, Gamepad2, Info } from 'lucide-react';
import { PetSprite } from './pet-sprite';
import { petCatalog, getPetTypeByKey, getSpriteByKeys } from '@/lib/pet-catalog';
import { cn } from '@/lib/utils';

interface PetCustomizerProps {
  initialTypeKey?: string;
  initialSpriteKey?: string;
  initialCustomSprites?: {
    idle?: string | null;
    run?: string | null;
    ball?: string | null;
    play?: string | null;
  };
  onChange: (data: {
    typeKey: string;
    spriteKey: string;
    customFiles: {
      idle?: File | null;
      run?: File | null;
      ball?: File | null;
      play?: File | null;
    };
    useCustom: boolean;
  }) => void;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export function PetCustomizer({
  initialTypeKey,
  initialSpriteKey,
  initialCustomSprites,
  onChange,
}: PetCustomizerProps) {
  const [useCustom, setUseCustom] = useState(!!initialCustomSprites?.idle);
  const [selectedTypeKey, setSelectedTypeKey] = useState(initialTypeKey || petCatalog.petTypes[0].key);
  const [selectedSpriteKey, setSelectedSpriteKey] = useState(initialSpriteKey || petCatalog.petTypes[0].sprites[0].key);
  
  const [customFiles, setCustomFiles] = useState<{
    idle?: File | null;
    run?: File | null;
    ball?: File | null;
    play?: File | null;
  }>({});

  const [previews, setPreviews] = useState<{
    idle?: string | null;
    run?: string | null;
    ball?: string | null;
    play?: string | null;
  }>({
    idle: initialCustomSprites?.idle ? (initialCustomSprites.idle.startsWith('http') ? initialCustomSprites.idle : `${API_URL}/files/${initialCustomSprites.idle.split(/[/\\]/).pop()}`) : null,
    run: initialCustomSprites?.run ? (initialCustomSprites.run.startsWith('http') ? initialCustomSprites.run : `${API_URL}/files/${initialCustomSprites.run.split(/[/\\]/).pop()}`) : null,
    ball: initialCustomSprites?.ball ? (initialCustomSprites.ball.startsWith('http') ? initialCustomSprites.ball : `${API_URL}/files/${initialCustomSprites.ball.split(/[/\\]/).pop()}`) : null,
    play: initialCustomSprites?.play ? (initialCustomSprites.play.startsWith('http') ? initialCustomSprites.play : `${API_URL}/files/${initialCustomSprites.play.split(/[/\\]/).pop()}`) : null,
  });

  const fileInputs = {
    idle: useRef<HTMLInputElement>(null),
    run: useRef<HTMLInputElement>(null),
    ball: useRef<HTMLInputElement>(null),
    play: useRef<HTMLInputElement>(null),
  };

  useEffect(() => {
    onChange({
      typeKey: selectedTypeKey,
      spriteKey: selectedSpriteKey,
      customFiles,
      useCustom,
    });
  }, [selectedTypeKey, selectedSpriteKey, customFiles, useCustom]);

  const handleFileChange = (key: keyof typeof customFiles, file: File | null) => {
    setCustomFiles(prev => ({ ...prev, [key]: file }));
    if (file) {
      const url = URL.createObjectURL(file);
      setPreviews(prev => ({ ...prev, [key]: url }));
    } else {
      setPreviews(prev => ({ ...prev, [key]: null }));
    }
  };

  const selectedType = getPetTypeByKey(selectedTypeKey) || petCatalog.petTypes[0];
  const selectedSprite = getSpriteByKeys(selectedTypeKey, selectedSpriteKey) || selectedType.sprites[0];

  return (
    <div className="space-y-6">
      <div className="flex rounded-2xl border-2 border-black bg-black/5 p-1">
        <button
          type="button"
          onClick={() => setUseCustom(false)}
          className={cn(
            "flex-1 rounded-xl py-2 font-heading text-xs font-bold uppercase tracking-widest transition-all",
            !useCustom ? "bg-black text-white shadow-sm" : "text-black/40 hover:text-black"
          )}
        >
          Presets
        </button>
        <button
          type="button"
          onClick={() => setUseCustom(true)}
          className={cn(
            "flex-1 rounded-xl py-2 font-heading text-xs font-bold uppercase tracking-widest transition-all",
            useCustom ? "bg-black text-white shadow-sm" : "text-black/40 hover:text-black"
          )}
        >
          Custom
        </button>
      </div>

      {!useCustom ? (
        <div className="space-y-4">
          <div className="grid grid-cols-4 gap-2">
            {petCatalog.petTypes.map((type) => (
              <button
                key={type.key}
                type="button"
                onClick={() => {
                  setSelectedTypeKey(type.key);
                  setSelectedSpriteKey(type.sprites[0].key);
                }}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-xl border-2 p-2 transition-all",
                  selectedTypeKey === type.key ? "border-black bg-black/5" : "border-black/5 hover:border-black/20"
                )}
              >
                <div className="flex h-10 w-10 items-center justify-center overflow-hidden">
                   <PetSprite src={type.sprites[0].idle} alt={type.label} maxWidth={32} maxHeight={32} />
                </div>
                <span className="text-[8px] font-bold uppercase tracking-tighter">{type.label}</span>
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            {selectedType.sprites.map((s) => (
              <button
                key={s.key}
                type="button"
                onClick={() => setSelectedSpriteKey(s.key)}
                className={cn(
                  "flex h-12 w-12 items-center justify-center rounded-xl border-2 transition-all",
                  selectedSpriteKey === s.key ? "border-black bg-black/5 shadow-sm" : "border-black/5 hover:border-black/20"
                )}
              >
                <PetSprite src={s.idle} alt={s.label} maxWidth={36} maxHeight={36} />
              </button>
            ))}
          </div>
          
          <div className="flex justify-center rounded-2xl border-2 border-black/5 bg-black/[0.02] p-8">
             <PetSprite src={selectedSprite.idle} alt="Preview" maxWidth={120} maxHeight={120} />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          <UploadSlot 
            label="Idle (Default)" 
            icon={Sparkles} 
            preview={previews.idle} 
            inputRef={fileInputs.idle}
            onUpload={(f: File | null) => handleFileChange('idle', f)}
            presetSrc={selectedSprite.idle}
          />
          <UploadSlot 
            label="Running" 
            icon={Zap} 
            preview={previews.run} 
            inputRef={fileInputs.run}
            onUpload={(f: File | null) => handleFileChange('run', f)}
            presetSrc={selectedSprite.run || selectedSprite.idle.replace('_idle_', '_run_')}
          />
          <UploadSlot 
            label="Give Ball" 
            icon={CircleDashed} 
            preview={previews.ball} 
            inputRef={fileInputs.ball}
            onUpload={(f: File | null) => handleFileChange('ball', f)}
            presetSrc={selectedSprite.withBall || selectedSprite.idle.replace('_idle_', '_with_ball_')}
          />
          <UploadSlot 
            label="Playing" 
            icon={Gamepad2} 
            preview={previews.play} 
            inputRef={fileInputs.play}
            onUpload={(f: File | null) => handleFileChange('play', f)}
            presetSrc={selectedSprite.swipe || selectedSprite.idle.replace('_idle_', '_swipe_')}
          />
        </div>
      )}
    </div>
  );
}

function UploadSlot({ label, icon: Icon, preview, inputRef, onUpload, presetSrc }: any) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5 px-1">
        <Icon className="h-3 w-3 text-black/40" />
        <label className="text-[10px] font-bold uppercase tracking-wider text-black/40">{label}</label>
      </div>
      <div 
        className={cn(
          "relative flex aspect-square flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed transition-all",
          preview ? "border-black bg-white shadow-sm" : "border-black/10 bg-black/[0.02] hover:border-black/20 hover:bg-black/[0.04]"
        )}
      >
        {preview ? (
          <div className="group relative flex h-full w-full items-center justify-center p-4">
            <PetSprite src={preview} alt="Preview" maxWidth={80} maxHeight={80} />
            <button
              type="button"
              onClick={() => onUpload(null)}
              className="absolute right-2 top-2 rounded-lg bg-black p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex flex-col items-center gap-2 text-black/20 hover:text-black/40"
          >
            <div className="relative opacity-20 grayscale">
               <PetSprite src={presetSrc} alt="Placeholder" maxWidth={40} maxHeight={40} />
            </div>
            <Plus className="h-4 w-4" />
          </button>
        )}
        <input
          type="file"
          ref={inputRef}
          className="hidden"
          accept="image/*"
          onChange={(e) => onUpload(e.target.files?.[0] || null)}
        />
      </div>
    </div>
  );
}
