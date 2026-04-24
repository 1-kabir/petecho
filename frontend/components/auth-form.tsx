'use client';

import { useEffect, useMemo, useState, startTransition, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import {
  Cat,
  LoaderCircle,
  LockKeyhole,
  PawPrint,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { PetSprite } from '@/components/pet-sprite';
import { API_URL, setAuthCookie, getAuthCookie } from '@/lib/auth';
import { getPetTypeByKey, petCatalog } from '@/lib/pet-catalog';

type PetGender = 'male' | 'female' | 'unknown';

const genderOptions: Array<{ value: PetGender; label: string }> = [
  { value: 'male', label: 'Boy' },
  { value: 'female', label: 'Girl' },
  { value: 'unknown', label: 'Unknown' },
];

const defaultPetType = petCatalog.petTypes[0];

export function AuthForm({ mode }: { mode: 'login' | 'signup' }) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [petName, setPetName] = useState('');
  const [petGender, setPetGender] = useState<PetGender>('unknown');
  const [petType, setPetType] = useState(defaultPetType.key);
  const [petSprite, setPetSprite] = useState(defaultPetType.sprites[0].key);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const selectedPetType = useMemo(
    () => getPetTypeByKey(petType) ?? defaultPetType,
    [petType]
  );
  const selectedSprite =
    selectedPetType.sprites.find((sprite) => sprite.key === petSprite) ??
    selectedPetType.sprites[0];

  useEffect(() => {
    if (getAuthCookie()) {
      router.replace('/app');
      return;
    }

    if (!selectedPetType.sprites.some((sprite) => sprite.key === petSprite)) {
      setPetSprite(selectedPetType.sprites[0].key);
    }
  }, [petSprite, selectedPetType, router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/${mode}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          petName,
          petGender,
          petType,
          petSprite,
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        setError(payload.error || 'Something went wrong.');
        return;
      }

      setAuthCookie(payload.token);
      startTransition(() => {
        router.replace('/app');
        router.refresh();
      });
    } catch {
      setError('Could not reach the backend. Make sure it is running on port 3001.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#f5f0e8] text-black">
      <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col justify-center px-6 py-10 lg:flex-row lg:items-center lg:gap-10">
        <div className="pointer-events-none absolute left-[-8rem] top-10 h-64 w-64 rounded-full bg-black/5 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 right-[-5rem] h-72 w-72 rounded-full bg-black/10 blur-3xl" />

        <section className="relative z-10 flex-1 py-10">
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-black/15 bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em]">
            <PawPrint className="h-4 w-4" />
            {mode === 'signup' ? 'Pet Setup Portal' : 'Private Pet Portal'}
          </div>
          <h1 className="max-w-3xl font-display text-5xl font-bold leading-[0.9] tracking-tight md:text-7xl">
            {mode === 'signup'
              ? "Build your pet's little digital self before you walk in."
              : 'Walk back into their little digital world.'}
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-black/65">
            {mode === 'signup'
              ? "On first signup we collect the basics: your pet's name, gender, supported species, and the sprite that feels closest."
              : 'Log in with your email and password to return to your pet dashboard.'}
          </p>

          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {[
              {
                title: 'Organized sprite library',
                text: `${petCatalog.petTypes.length} supported pet types, grouped and ready to pick from.`,
                icon: Cat,
              },
              {
                title: 'Hashed accounts',
                text: 'Email and password login backed by SQLite with hashed passwords.',
                icon: LockKeyhole,
              },
              {
                title: 'Guarded routes',
                text: 'Guests stay out of /app and signed-in users skip the auth screens.',
                icon: ShieldCheck,
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-3xl border border-black/10 bg-white/80 p-5 shadow-[6px_6px_0px_rgba(0,0,0,0.06)]"
              >
                <item.icon className="mb-4 h-5 w-5" />
                <h2 className="font-heading text-lg font-bold">{item.title}</h2>
                <p className="mt-2 text-sm leading-6 text-black/60">{item.text}</p>
              </div>
            ))}
          </div>
        </section>

        <motion.section
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="relative z-10 w-full max-w-xl"
        >
          <div className="overflow-hidden rounded-[2rem] border-2 border-black bg-white shadow-[12px_12px_0px_rgba(0,0,0,1)]">
            <div className="border-b-2 border-black px-6 py-5">
              <div className="flex items-center gap-2">
                <PawPrint className="h-5 w-5" />
                <span className="font-heading text-lg font-bold">Petecho Access</span>
              </div>
              <p className="mt-2 text-sm text-black/55">
                {mode === 'signup'
                  ? 'Create an account and choose the pet you want waiting on the other side.'
                  : 'Welcome back. Log in to return to your dashboard.'}
              </p>
            </div>

            <div className="p-6">
              <form className="space-y-4" onSubmit={handleSubmit}>
                <label className="block">
                  <span className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-black/45">
                    Email
                  </span>
                  <input
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@example.com"
                    className="w-full rounded-2xl border border-black/10 bg-black/[0.03] px-4 py-3.5 text-sm outline-none transition-colors focus:border-black"
                    required
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-black/45">
                    Password
                  </span>
                  <input
                    type="password"
                    autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder={mode === 'signup' ? 'At least 8 characters' : 'Enter your password'}
                    className="w-full rounded-2xl border border-black/10 bg-black/[0.03] px-4 py-3.5 text-sm outline-none transition-colors focus:border-black"
                    minLength={8}
                    required
                  />
                </label>

                {mode === 'signup' ? (
                  <div className="space-y-4 rounded-[1.75rem] border border-black/10 bg-[#f5f0e8] p-4">
                    <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.2em] text-black/50">
                      <Sparkles className="h-4 w-4" />
                      Pet Setup
                    </div>

                    <label className="block">
                      <span className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-black/45">
                        Pet Name
                      </span>
                      <input
                        type="text"
                        value={petName}
                        onChange={(event) => setPetName(event.target.value)}
                        placeholder="Max"
                        className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3.5 text-sm outline-none transition-colors focus:border-black"
                        required
                      />
                    </label>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <label className="block">
                        <span className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-black/45">
                          Gender
                        </span>
                        <select
                          value={petGender}
                          onChange={(event) =>
                            setPetGender(event.target.value as PetGender)
                          }
                          className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3.5 text-sm outline-none transition-colors focus:border-black"
                        >
                          {genderOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label className="block">
                        <span className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-black/45">
                          Pet Type
                        </span>
                        <select
                          value={petType}
                          onChange={(event) => setPetType(event.target.value)}
                          className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3.5 text-sm outline-none transition-colors focus:border-black"
                        >
                          {petCatalog.petTypes.map((type) => (
                            <option key={type.key} value={type.key}>
                              {type.label}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>

                    <div className="rounded-[1.5rem] border border-black/10 bg-white p-4">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                        <div className="rounded-[1.25rem] border border-black/10 bg-[#f5f0e8] p-3">
                          <PetSprite
                            alt={selectedSprite.label}
                            src={selectedSprite.idle}
                            maxWidth={144}
                            maxHeight={144}
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold uppercase tracking-[0.2em] text-black/45">
                            Selected Sprite
                          </p>
                          <h3 className="mt-2 font-heading text-2xl font-bold">
                            {selectedSprite.label}
                          </h3>
                          <p className="mt-1 text-sm text-black/55">
                            This idle GIF will be the default pet shown in your dashboard.
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        {selectedPetType.sprites.map((sprite) => {
                          const active = sprite.key === petSprite;

                          return (
                            <button
                              key={sprite.key}
                              type="button"
                              onClick={() => setPetSprite(sprite.key)}
                              className={`rounded-[1.25rem] border bg-[#f5f0e8] p-3 text-left transition-all ${
                                active
                                  ? 'border-black shadow-[4px_4px_0px_rgba(0,0,0,1)]'
                                  : 'border-black/10 hover:border-black/40'
                              }`}
                            >
                              <div className="flex items-center justify-center rounded-xl bg-white">
                                <PetSprite
                                  alt={sprite.label}
                                  src={sprite.idle}
                                  maxWidth={128}
                                  maxHeight={96}
                                />
                              </div>
                              <div className="mt-3">
                                <p className="font-heading text-sm font-bold">
                                  {sprite.label}
                                </p>
                                <p className="mt-1 text-xs text-black/50">
                                  Idle + walk GIFs available
                                </p>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ) : null}

                {error ? (
                  <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                    {error}
                  </div>
                ) : null}

                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-black px-5 py-4 text-sm font-bold text-white transition-all hover:bg-black/85 disabled:cursor-not-allowed disabled:bg-black/60"
                >
                  {loading ? (
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                  ) : (
                    <PawPrint className="h-4 w-4" />
                  )}
                  {mode === 'signup' ? 'Create account' : 'Log in'}
                </button>
              </form>
            </div>
          </div>
        </motion.section>
      </div>
    </main>
  );
}
