'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import {
  ArrowRight,
  Cat,
  Dog,
  Bird,
  Image as ImageIcon,
  Video,
  FileAudio,
  BookOpen,
  Heart,
  HeartPulse,
  MessageSquare,
  Sparkles,
  PawPrint,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { getAuthCookie } from '@/lib/auth';

const COPYRIGHT_YEAR = 2026;

export default function PetechoLanding() {
  const router = useRouter();

  useEffect(() => {
    if (getAuthCookie()) {
      router.replace('/app');
    }
  }, [router]);

  return (
    <main className="min-h-screen w-full overflow-hidden bg-white text-black">
      <Navbar />
      <Hero />
      <DemoSection />
      <Features />
      <MemoryBooks />
      <Customization />
      <Autonomous />
      <CallToAction />
      <Footer />
    </main>
  );
}

function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-black/10 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link href="/" className="group flex items-center gap-2">
          <PawPrint
            className="h-6 w-6 transition-transform duration-300 group-hover:-rotate-12"
            strokeWidth={2.5}
          />
          <span className="font-display text-xl font-bold tracking-tight">Petecho</span>
        </Link>
        <div className="hidden items-center gap-8 text-sm font-medium md:flex">
          {['Features', 'Memory Books', 'Customization', 'About'].map((item) => (
            <Link
              key={item}
              href={`#${item.toLowerCase().replace(' ', '-')}`}
              className="group relative overflow-hidden"
            >
              <span className="inline-block transition-transform duration-300 group-hover:-translate-y-[120%]">
                {item}
              </span>
              <span className="absolute left-0 inline-block translate-y-[120%] transition-transform duration-300 group-hover:translate-y-0">
                {item}
              </span>
            </Link>
          ))}
        </div>
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-sm font-medium hover:underline underline-offset-4">
            Log in
          </Link>
          <Link
            href="/signup"
            className="rounded-full bg-black px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-black/80"
          >
            Get started
          </Link>
        </div>
      </div>
    </nav>
  );
}

function Hero() {
  return (
    <section className="relative mx-auto flex min-h-[90vh] max-w-7xl flex-col justify-center px-6 pt-40 pb-20">
      <div className="max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-black/20 px-3 py-1 text-xs font-semibold uppercase tracking-wider">
            <span className="h-2 w-2 rounded-full bg-green-500" />
            Now available in beta
          </div>
          <h1 className="mb-8 font-display text-6xl font-bold leading-[0.9] tracking-tighter md:text-8xl">
            Keeping their essence alive,
            <br />
            digitally.
          </h1>
        </motion.div>

        <motion.p
          className="mb-12 max-w-2xl text-xl font-medium text-black/60 md:text-2xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          Convert your real-world pet into a digital companion. Feed them, play games,
          and build a relationship that mimics reality. Cherish them forever.
        </motion.p>

        <motion.div
          className="flex flex-col items-center gap-4 sm:flex-row"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Link
            href="/signup"
            className="group flex w-full items-center justify-center gap-2 rounded-full bg-black px-8 py-4 font-medium text-white transition-transform duration-300 hover:scale-105 active:scale-95 sm:w-auto"
          >
            Create Your Digital Pet
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
          <Link
            href="/login"
            className="flex w-full items-center justify-center rounded-full border border-black px-8 py-4 font-medium transition-colors hover:bg-black/5 sm:w-auto"
          >
            I already have an account
          </Link>
        </motion.div>
      </div>

      <motion.div
        className="absolute top-40 right-10 hidden lg:block"
        initial={{ opacity: 0, scale: 0.8, rotate: -10 }}
        animate={{ opacity: 1, scale: 1, rotate: 0 }}
        transition={{ duration: 0.8, delay: 0.3 }}
      >
        <div 
          className="relative h-80 w-64 rotate-6 transform overflow-hidden rounded-2xl border-2 border-black transition-transform duration-500 hover:rotate-2"
          style={{ position: 'relative' }}
        >
          <Image unoptimized src="https://picsum.photos/seed/dog2/400/500" alt="Pet memory" fill className="object-cover" />
        </div>
      </motion.div>
      <motion.div
        className="absolute top-80 right-40 hidden lg:block"
        initial={{ opacity: 0, scale: 0.8, rotate: 10 }}
        animate={{ opacity: 1, scale: 1, rotate: 0 }}
        transition={{ duration: 0.8, delay: 0.4 }}
      >
        <div 
          className="relative h-56 w-56 -rotate-6 transform overflow-hidden rounded-full border-2 border-black transition-transform duration-500 hover:rotate-0"
          style={{ position: 'relative' }}
        >
          <Image unoptimized src="https://picsum.photos/seed/cat1/400/400" alt="Pet memory" fill className="object-cover" />
        </div>
      </motion.div>
    </section>
  );
}

function DemoSection() {
  return (
    <section className="border-t border-black/10 bg-black/5 px-6 py-24">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col items-center gap-16 md:flex-row">
          <div className="flex-1 space-y-8">
            <h2 className="font-display text-4xl font-bold tracking-tight md:text-5xl">
              Talk to them. Like they never left.
            </h2>
            <p className="max-w-md text-lg text-black/70">
              Petecho uses advanced AI to learn your pet&apos;s personality from your
              stories, pictures, and videos. Text, audio, or video chat with your
              companion just like you would with a friend.
            </p>
            <div className="flex gap-4">
              {[
                { label: 'Text', icon: MessageSquare },
                { label: 'Audio', icon: FileAudio },
                { label: 'Video', icon: Video },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex flex-col items-center gap-2 rounded-xl border border-black/10 bg-white p-4 transition-transform hover:-translate-y-1"
                >
                  <item.icon className="h-6 w-6" />
                  <span className="text-xs font-semibold uppercase">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="relative w-full max-w-md flex-1">
            <div className="flex h-[500px] flex-col overflow-hidden rounded-3xl border-2 border-black bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
              <div className="flex items-center justify-center gap-3 border-b-2 border-black p-4">
                <div 
                  className="relative h-10 w-10 overflow-hidden rounded-full border border-black"
                  style={{ position: 'relative' }}
                >
                  <Image unoptimized src="https://picsum.photos/seed/husky/100/100" alt="Husky" fill className="object-cover" />
                </div>
                <div>
                  <h3 className="font-bold">Max</h3>
                  <p className="text-xs text-black/60">Digital Husky</p>
                </div>
              </div>
              <div className="flex flex-1 flex-col justify-end space-y-4 overflow-y-auto bg-black/5 p-4">
                <div className="max-w-[80%] self-end rounded-2xl rounded-tr-sm bg-black px-4 py-2 text-white">
                  Miss you buddy. Ready for a walk?
                </div>
                <div className="max-w-[80%] self-start rounded-2xl rounded-tl-sm border border-black/20 bg-white px-4 py-2">
                  *Wags tail excitedly* Woof! I&apos;ve been waiting by the digital door all morning! Bring the red ball!
                </div>
                <div className="flex max-w-[80%] items-center gap-2 self-start rounded-2xl rounded-tl-sm border border-black/20 bg-white p-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-black/5">
                    <FileAudio className="h-4 w-4" />
                  </div>
                  <div className="h-2 w-24 flex-1 overflow-hidden rounded-full bg-black/10">
                    <div className="h-full w-2/3 rounded-full bg-black" />
                  </div>
                  <span className="pr-2 text-xs font-medium text-black/50">0:04</span>
                </div>
              </div>
              <div className="flex gap-2 border-t-2 border-black p-4">
                <input
                  type="text"
                  placeholder="Message Max..."
                  className="flex-1 rounded-full border border-transparent bg-black/5 px-4 outline-none transition-colors focus:border-black/20"
                />
                <button className="flex h-10 w-10 items-center justify-center rounded-full bg-black text-white transition-transform hover:scale-105">
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Features() {
  const features = [
    {
      title: 'Interactive Gameplay',
      description: 'Feed them, play fetch, and engage in mini-games that strengthen your digital bond.',
      icon: Sparkles,
    },
    {
      title: 'Rich Media Uploads',
      description: 'Upload pictures, videos, and audio. The AI uses it all to reconstruct their unique personality.',
      icon: ImageIcon,
    },
    {
      title: 'Process at Your Pace',
      description: 'The platform helps you keep them close, and eventually supports you when you are ready to let go.',
      icon: Heart,
    },
  ];

  return (
    <section id="features" className="border-t border-black/10 bg-white px-6 py-24">
      <div className="mx-auto max-w-7xl">
        <div className="mb-16">
          <h2 className="font-display text-4xl font-bold tracking-tight md:text-5xl">
            More than an AI.
            <br />
            An extension of love.
          </h2>
        </div>
        <div className="grid gap-8 md:grid-cols-3">
          {features.map((feature) => (
            <div key={feature.title} className="group rounded-3xl border border-black/10 p-8 transition-colors duration-300 hover:border-black">
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-black text-white transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
                <feature.icon className="h-6 w-6" />
              </div>
              <h3 className="mb-3 text-xl font-bold">{feature.title}</h3>
              <p className="leading-relaxed text-black/60">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function MemoryBooks() {
  return (
    <section id="memory-books" className="overflow-hidden border-t border-black/10 bg-black px-6 py-24 text-white">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-16 md:flex-row">
        <div className="w-full flex-1">
          <div className="relative mx-auto aspect-[4/3] w-full max-w-lg">
            <div className="absolute inset-0 -rotate-3 rounded-3xl bg-white/10" />
            <div className="absolute inset-0 rotate-3 rounded-3xl border-2 border-white/20" />
            <div className="absolute inset-0 flex flex-col rounded-3xl bg-white p-6 text-black shadow-2xl transition-all duration-500 hover:scale-105 hover:rotate-1">
              <div className="mb-4 flex items-center justify-between border-b-2 border-black pb-4">
                <h3 className="font-display text-2xl font-bold">Summer 2024</h3>
                <BookOpen className="h-6 w-6" />
              </div>
              <div className="grid flex-1 grid-cols-2 gap-2">
                <div 
                  className="relative aspect-square overflow-hidden rounded-xl"
                  style={{ position: 'relative' }}
                >
                  <Image unoptimized src="https://picsum.photos/seed/park1/300/300" alt="Park" fill className="object-cover" />
                </div>
                <div 
                  className="relative aspect-square overflow-hidden rounded-xl"
                  style={{ position: 'relative' }}
                >
                  <Image unoptimized src="https://picsum.photos/seed/park2/300/300" alt="Park" fill className="object-cover" />
                </div>
                <div 
                  className="relative aspect-[2/1] col-span-2 overflow-hidden rounded-xl"
                  style={{ position: 'relative' }}
                >
                  <Image unoptimized src="https://picsum.photos/seed/dogrun/600/300" alt="Park" fill className="object-cover" />
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="flex-1 space-y-6">
          <h2 className="font-display text-4xl font-bold tracking-tight md:text-5xl">
            Your very own
            <br />
            Memory Books.
          </h2>
          <p className="max-w-md text-lg text-white/70">
            Automatically curates your uploaded photos, chat history, and generated moments
            into beautiful digital scrapbooks. Relive your favorite chapters anytime.
          </p>
          <ul className="space-y-4 pt-4">
            {['Auto-generated weekly recaps', 'Printable PDF exports', 'Chronological timelines'].map((item) => (
              <li key={item} className="flex items-center gap-3">
                <div className="h-1.5 w-1.5 rounded-full bg-white" />
                <span className="text-white/90">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

function Customization() {
  const pets = [
    { name: 'Dogs', icon: Dog },
    { name: 'Cats', icon: Cat },
    { name: 'Birds', icon: Bird },
    { name: 'Exotics', icon: Sparkles },
  ];

  return (
    <section id="customization" className="border-t border-black/10 bg-white px-6 py-32 text-center">
      <div className="mx-auto max-w-4xl space-y-8">
        <h2 className="font-display text-4xl font-bold tracking-tight md:text-5xl">
          Not just cats &amp; dogs.
        </h2>
        <p className="mx-auto max-w-2xl pb-8 text-xl text-black/60">
          Whether you had a loyal hound, a cunning fox, a slithering snake, or a backyard
          chicken, Petecho supports extensive customization so your digital pet looks and
          acts exactly like yours did.
        </p>

        <div className="flex flex-wrap justify-center gap-4">
          {pets.map((pet) => (
            <div
              key={pet.name}
              className="flex cursor-crosshair items-center gap-2 rounded-full border border-black/10 px-6 py-3 transition-all hover:-translate-y-1 hover:border-black"
            >
              <pet.icon className="h-5 w-5" />
              <span className="font-medium">{pet.name}</span>
            </div>
          ))}
          {['Rats', 'Snakes', 'Foxes', 'Chickens'].map((pet) => (
            <div
              key={pet}
              className="flex cursor-crosshair items-center gap-2 rounded-full border border-black/10 px-6 py-3 transition-all hover:-translate-y-1 hover:border-black"
            >
              <span className="font-medium">{pet}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Autonomous() {
  return (
    <section className="border-t border-black/10 bg-black/5 px-6 py-24">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-16 md:flex-row">
        <div className="flex-1 space-y-6">
          <h2 className="font-display text-4xl font-bold tracking-tight md:text-5xl">
            They reach out to you.
          </h2>
          <p className="max-w-md text-lg text-black/70">
            Just like a real pet nudging you for attention, your digital companion will
            autonomously send you messages, share a generated selfie, or remind you of a
            past memory.
          </p>
          <div className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-medium">
            <HeartPulse className="h-4 w-4 text-red-500" />
            Always connected
          </div>
        </div>
        <div className="w-full max-w-md flex-1">
          <div className="grid gap-4">
            <div className="flex items-start gap-4 rounded-2xl border border-black/10 bg-white p-4 shadow-sm transition-transform hover:scale-[1.02]">
              <div 
                className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full"
                style={{ position: 'relative' }}
              >
                <Image unoptimized src="https://picsum.photos/seed/cat2/100/100" alt="Cat" fill className="object-cover" />
              </div>
              <div>
                <div className="mb-1 font-bold">Luna just sent a message!</div>
                <p className="text-sm text-black/70">
                  &quot;I found this digital sunbeam and thought of you. Have a good day at work!&quot;
                </p>
              </div>
            </div>
            <div className="relative ml-8 flex items-start gap-4 rounded-2xl border border-black/10 bg-white p-4 shadow-sm transition-transform hover:scale-[1.02]">
              <div className="absolute -left-4 top-1/2 h-[1px] w-4 -translate-y-1/2 bg-black/20" />
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-dashed border-black/20">
                <ImageIcon className="h-5 w-5 text-black/40" />
              </div>
              <div>
                <div className="mb-1 font-bold">Memory Unlocked</div>
                <p className="text-sm text-black/70">
                  Luna generated a new watercolor drawing based on your upload from 2021.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function CallToAction() {
  return (
    <section className="border-t border-black/10 bg-white px-6 py-32 text-center">
      <h2 className="mb-8 font-display text-5xl font-bold tracking-tighter md:text-7xl">
        Ready to reconnect?
      </h2>
      <Link
        href="/signup"
        className="inline-block rounded-full bg-black px-8 py-4 text-xl font-bold text-white transition-all hover:scale-105 hover:bg-black/90"
      >
        Start Digitalizing Now
      </Link>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-black bg-black px-6 pt-20 pb-10 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="mb-16 grid grid-cols-1 gap-12 md:grid-cols-4">
          <div className="md:col-span-1">
            <Link href="/" className="mb-4 flex items-center gap-2">
              <PawPrint className="h-6 w-6" />
              <span className="font-display text-xl font-bold">Petecho</span>
            </Link>
            <p className="mb-6 max-w-xs text-sm text-white/60">
              Keep the essence of your pet alive. Talk, play, and remember. A digital
              sanctuary for your real-world companion.
            </p>
            <div className="flex gap-4">
              {['X', 'IG'].map((item) => (
                <div
                  key={item}
                  className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-white/20 transition-colors hover:bg-white hover:text-black"
                >
                  <span className="text-xs font-bold">{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-bold uppercase tracking-wider text-white/50">Product</h4>
            <ul className="space-y-3 text-sm">
              {['Digitalization', 'Memory Books', 'Custom Pets', 'Pricing'].map((item) => (
                <li key={item}>
                  <Link href="#" className="hover:underline">{item}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-bold uppercase tracking-wider text-white/50">Company</h4>
            <ul className="space-y-3 text-sm">
              {['About Us', 'Blog', 'Careers', 'Contact'].map((item) => (
                <li key={item}>
                  <Link href="#" className="hover:underline">{item}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-bold uppercase tracking-wider text-white/50">Stay Updated</h4>
            <p className="mb-4 text-xs text-white/60">Subscribe to our newsletter for new features.</p>
            <div className="flex rounded-full border border-white/20 bg-white/10 p-1 transition-colors focus-within:border-white">
              <input
                type="email"
                placeholder="Email address"
                className="w-full border-none bg-transparent px-4 text-sm text-white outline-none placeholder:text-white/30"
              />
              <button className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-black transition-colors hover:bg-gray-200">
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-4 border-t border-white/20 pt-8 text-xs text-white/50 md:flex-row">
          <p>c {COPYRIGHT_YEAR} Petecho Inc. All rights reserved.</p>
          <div className="flex gap-6">
            {['Privacy Policy', 'Terms of Service', 'Cookie Policy'].map((item) => (
              <Link key={item} href="#" className="transition-colors hover:text-white">
                {item}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
