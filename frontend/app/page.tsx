'use client';

import { motion } from 'motion/react';
import { 
  ArrowRight, 
  Cat, 
  Dog, 
  Bird, 
  Image as ImageIcon, 
  Video, 
  FileAudio,
  FileText, 
  ChevronRight, 
  BookOpen, 
  Heart, 
  HeartPulse,
  MessageSquare,
  Sparkles,
  PawPrint
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

export default function PetechoLanding() {
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
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-black/10">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <PawPrint className="w-6 h-6 transform group-hover:-rotate-12 transition-transform duration-300" strokeWidth={2.5}/>
          <span className="font-display font-bold text-xl tracking-tight">Petecho</span>
        </Link>
        <div className="hidden md:flex items-center gap-8 font-medium text-sm">
          {['Features', 'Memory Books', 'Customization', 'About'].map((item) => (
            <Link 
              key={item} 
              href={`#${item.toLowerCase().replace(' ', '-')}`}
              className="relative group overflow-hidden"
            >
              <span className="inline-block transition-transform duration-300 group-hover:-translate-y-[120%]">{item}</span>
              <span className="absolute left-0 inline-block translate-y-[120%] transition-transform duration-300 group-hover:translate-y-0">{item}</span>
            </Link>
          ))}
        </div>
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-sm font-medium hover:underline underline-offset-4">Log in</Link>
          <Link href="/signup" className="text-sm font-medium bg-black text-white px-5 py-2 rounded-full hover:bg-black/80 transition-colors">
            Get started
          </Link>
        </div>
      </div>
    </nav>
  );
}

function Hero() {
  return (
    <section className="relative pt-40 pb-20 px-6 min-h-[90vh] flex flex-col justify-center max-w-7xl mx-auto">
      <div className="max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-black/20 text-xs font-semibold uppercase tracking-wider mb-8">
            <span className="w-2 h-2 rounded-full bg-green-500"></span>
            Now available in beta
          </div>
          <h1 className="font-display text-6xl md:text-8xl font-bold leading-[0.9] tracking-tighter mb-8">
            Keeping their essence alive,<br />digitally.
          </h1>
        </motion.div>
        
        <motion.p 
          className="text-xl md:text-2xl text-black/60 font-medium max-w-2xl mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          Convert your real-world pet into a digital companion. Feed them, play games, and build a relationship that mimics reality. Cherish them forever.
        </motion.p>

        <motion.div 
          className="flex flex-col sm:flex-row items-center gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <button className="w-full sm:w-auto px-8 py-4 bg-black text-white rounded-full font-medium flex items-center justify-center gap-2 group hover:scale-105 active:scale-95 transition-transform duration-300">
            Create Your Digital Pet
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
          <button className="w-full sm:w-auto px-8 py-4 border border-black rounded-full font-medium flex items-center justify-center hover:bg-black/5 transition-colors">
            See how it works
          </button>
        </motion.div>
      </div>

      {/* Decorative Elements */}
      <motion.div 
        className="absolute right-10 top-40 hidden lg:block"
        initial={{ opacity: 0, scale: 0.8, rotate: -10 }}
        animate={{ opacity: 1, scale: 1, rotate: 0 }}
        transition={{ duration: 0.8, delay: 0.3 }}
      >
        <div className="relative w-64 h-80 rounded-2xl border-2 border-black overflow-hidden transform rotate-6 hover:rotate-2 transition-transform duration-500">
          <Image unoptimized src="https://picsum.photos/seed/dog2/400/500" alt="Pet memory" fill className="object-cover" />
        </div>
      </motion.div>
      <motion.div 
        className="absolute right-40 top-80 hidden lg:block"
        initial={{ opacity: 0, scale: 0.8, rotate: 10 }}
        animate={{ opacity: 1, scale: 1, rotate: 0 }}
        transition={{ duration: 0.8, delay: 0.4 }}
      >
        <div className="relative w-56 h-56 rounded-full border-2 border-black overflow-hidden transform -rotate-6 hover:-rotate-0 transition-transform duration-500">
          <Image unoptimized src="https://picsum.photos/seed/cat1/400/400" alt="Pet memory" fill className="object-cover" />
        </div>
      </motion.div>
    </section>
  );
}

function DemoSection() {
  return (
    <section className="py-24 px-6 border-t border-black/10 bg-black/5">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row gap-16 items-center">
          <div className="flex-1 space-y-8">
            <h2 className="font-display text-4xl md:text-5xl font-bold tracking-tight">Talk to them. Like they never left.</h2>
            <p className="text-lg text-black/70 max-w-md">
              Petecho uses advanced AI to learn your pet&apos;s personality from your stories, pictures, and videos. Text, audio, or video chat with your companion just like you would with a friend.
            </p>
            <div className="flex gap-4">
              <div className="flex flex-col items-center gap-2 p-4 border border-black/10 rounded-xl bg-white hover:-translate-y-1 transition-transform">
                <MessageSquare className="w-6 h-6" />
                <span className="text-xs font-semibold uppercase">Text</span>
              </div>
              <div className="flex flex-col items-center gap-2 p-4 border border-black/10 rounded-xl bg-white hover:-translate-y-1 transition-transform">
                <FileAudio className="w-6 h-6" />
                <span className="text-xs font-semibold uppercase">Audio</span>
              </div>
              <div className="flex flex-col items-center gap-2 p-4 border border-black/10 rounded-xl bg-white hover:-translate-y-1 transition-transform">
                <Video className="w-6 h-6" />
                <span className="text-xs font-semibold uppercase">Video</span>
              </div>
            </div>
          </div>
          <div className="flex-1 w-full max-w-md relative">
            {/* Chat UI Mockup */}
            <div className="bg-white border-2 border-black rounded-3xl overflow-hidden shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col h-[500px]">
              <div className="border-b-2 border-black p-4 flex items-center justify-center gap-3">
                <div className="relative w-10 h-10 rounded-full border border-black overflow-hidden">
                   <Image unoptimized src="https://picsum.photos/seed/husky/100/100" alt="Husky" fill className="object-cover" />
                </div>
                <div>
                  <h3 className="font-bold">Max 🐾</h3>
                  <p className="text-xs text-black/60">Digital Husky</p>
                </div>
              </div>
              <div className="flex-1 p-4 space-y-4 overflow-y-auto bg-black/5 flex flex-col justify-end">
                <div className="self-end bg-black text-white px-4 py-2 rounded-2xl rounded-tr-sm max-w-[80%]">
                  Miss you buddy. Ready for a walk?
                </div>
                <div className="self-start bg-white border border-black/20 px-4 py-2 rounded-2xl rounded-tl-sm max-w-[80%]">
                  *Wags tail excitedly* Woof! I&apos;ve been waiting by the digital door all morning! Bring the red ball! 🎾
                </div>
                <div className="self-start bg-white border border-black/20 p-2 rounded-2xl rounded-tl-sm max-w-[80%] flex items-center gap-2">
                  <div className="w-10 h-10 bg-black/5 rounded-full flex items-center justify-center">
                    <FileAudio className="w-4 h-4" />
                  </div>
                  <div className="flex-1 h-2 bg-black/10 rounded-full overflow-hidden w-24">
                     <div className="w-2/3 h-full bg-black rounded-full" />
                  </div>
                  <span className="text-xs font-medium text-black/50 pr-2">0:04</span>
                </div>
              </div>
              <div className="border-t-2 border-black p-4 flex gap-2">
                <input type="text" placeholder="Message Max..." className="flex-1 bg-black/5 rounded-full px-4 outline-none border border-transparent focus:border-black/20 transition-colors" />
                <button className="w-10 h-10 bg-black text-white rounded-full flex items-center justify-center hover:scale-105 transition-transform">
                  <ArrowRight className="w-4 h-4" />
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
      icon: Sparkles
    },
    {
      title: 'Rich Media Uploads',
      description: 'Upload pictures, videos, and audio. The AI uses it all to reconstruct their unique personality.',
      icon: ImageIcon
    },
    {
      title: 'Process at Your Pace',
      description: 'The platform helps you keep them close, and eventually supports you when you are ready to let go.',
      icon: Heart
    }
  ];

  return (
    <section id="features" className="py-24 px-6 border-t border-black/10 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="mb-16">
          <h2 className="font-display text-4xl md:text-5xl font-bold tracking-tight mb-4">More than an AI.<br/>An extension of love.</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, idx) => (
            <div key={idx} className="group border border-black/10 p-8 rounded-3xl hover:border-black transition-colors duration-300">
              <div className="w-12 h-12 bg-black text-white rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                <feature.icon className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
              <p className="text-black/60 leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function MemoryBooks() {
  return (
    <section id="memory-books" className="py-24 px-6 border-t border-black/10 bg-black text-white overflow-hidden">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-16">
        <div className="flex-1 w-full">
           <div className="relative aspect-[4/3] w-full max-w-lg mx-auto">
             <div className="absolute inset-0 bg-white/10 rounded-3xl transform -rotate-3" />
             <div className="absolute inset-0 border-2 border-white/20 rounded-3xl transform rotate-3" />
             <div className="absolute inset-0 bg-white text-black p-6 rounded-3xl flex flex-col transform hover:rotate-1 hover:scale-105 transition-all duration-500 shadow-2xl">
                <div className="flex items-center justify-between border-b-2 border-black pb-4 mb-4">
                   <h3 className="font-display font-bold text-2xl">Summer 2024</h3>
                   <BookOpen className="w-6 h-6" />
                </div>
                <div className="grid grid-cols-2 gap-2 flex-1">
                   <div className="relative rounded-xl overflow-hidden">
                      <Image unoptimized src="https://picsum.photos/seed/park1/300/300" alt="Park" fill className="object-cover" />
                   </div>
                   <div className="relative rounded-xl overflow-hidden">
                      <Image unoptimized src="https://picsum.photos/seed/park2/300/300" alt="Park" fill className="object-cover" />
                   </div>
                   <div className="relative rounded-xl overflow-hidden col-span-2">
                      <Image unoptimized src="https://picsum.photos/seed/dogrun/600/300" alt="Park" fill className="object-cover" />
                   </div>
                </div>
             </div>
           </div>
        </div>
        <div className="flex-1 space-y-6">
          <h2 className="font-display text-4xl md:text-5xl font-bold tracking-tight">Your very own<br/>Memory Books.</h2>
          <p className="text-lg text-white/70 max-w-md">
            Automatically curates your uploaded photos, chat history, and generated moments into beautiful digital scrapbooks. Relive your favorite chapters anytime.
          </p>
          <ul className="space-y-4 pt-4">
            {['Auto-generated weekly recaps', 'Printable PDF exports', 'Chronological timelines'].map((item, i) => (
              <li key={i} className="flex items-center gap-3">
                <div className="w-1.5 h-1.5 bg-white rounded-full" />
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
    // Rats, Snakes, Foxes, Chickens are supported
  ];

  return (
    <section id="customization" className="py-32 px-6 border-t border-black/10 bg-white text-center">
      <div className="max-w-4xl mx-auto space-y-8">
        <h2 className="font-display text-4xl md:text-5xl font-bold tracking-tight">Not just cats & dogs.</h2>
        <p className="text-xl text-black/60 max-w-2xl mx-auto pb-8">
          Whether you had a loyal hound, a cunning fox, a slithering snake, or a backyard chicken. Petecho supports extensive customization so your digital pet looks and acts exactly like yours did.
        </p>
        
        <div className="flex flex-wrap justify-center gap-4">
          {pets.map((pet) => (
            <div key={pet.name} className="flex items-center gap-2 px-6 py-3 border border-black/10 rounded-full hover:border-black hover:-translate-y-1 transition-all cursor-crosshair">
              <pet.icon className="w-5 h-5" />
              <span className="font-medium">{pet.name}</span>
            </div>
          ))}
          <div className="flex items-center gap-2 px-6 py-3 border border-black/10 rounded-full hover:border-black hover:-translate-y-1 transition-all cursor-crosshair">
            <span className="font-medium">Rats</span>
          </div>
          <div className="flex items-center gap-2 px-6 py-3 border border-black/10 rounded-full hover:border-black hover:-translate-y-1 transition-all cursor-crosshair">
            <span className="font-medium">Snakes</span>
          </div>
          <div className="flex items-center gap-2 px-6 py-3 border border-black/10 rounded-full hover:border-black hover:-translate-y-1 transition-all cursor-crosshair">
            <span className="font-medium">Foxes</span>
          </div>
          <div className="flex items-center gap-2 px-6 py-3 border border-black/10 rounded-full hover:border-black hover:-translate-y-1 transition-all cursor-crosshair">
            <span className="font-medium">Chickens</span>
          </div>
        </div>
      </div>
    </section>
  );
}

function Autonomous() {
  return (
    <section className="py-24 px-6 border-t border-black/10 bg-black/5">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-16">
        <div className="flex-1 space-y-6">
          <h2 className="font-display text-4xl md:text-5xl font-bold tracking-tight">They reach out to you.</h2>
          <p className="text-lg text-black/70 max-w-md">
            Just like a real pet nudging you for attention, your digital companion will autonomously send you messages, share a generated &quot;selfie,&quot; or remind you of a past memory.
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-2 border border-black/10 bg-white rounded-full text-sm font-medium">
             <HeartPulse className="w-4 h-4 text-red-500" />
             Always connected
          </div>
        </div>
        <div className="flex-1 w-full max-w-md">
          <div className="grid gap-4">
             <div className="bg-white p-4 border border-black/10 rounded-2xl shadow-sm flex gap-4 items-start transform hover:scale-[1.02] transition-transform">
                <div className="w-12 h-12 rounded-full overflow-hidden relative shrink-0">
                   <Image unoptimized src="https://picsum.photos/seed/cat2/100/100" alt="Cat" fill className="object-cover" />
                </div>
                <div>
                   <div className="font-bold mb-1">Luna just sent a message!</div>
                   <p className="text-sm text-black/70">&quot;I found this digital sunbeam and thought of you. Have a good day at work! 🐾&quot;</p>
                </div>
             </div>
             <div className="bg-white p-4 border border-black/10 rounded-2xl shadow-sm flex gap-4 items-start transform hover:scale-[1.02] transition-transform ml-8 relative">
                <div className="absolute -left-4 top-1/2 -translate-y-1/2 w-4 h-[1px] bg-black/20" />
                <div className="w-12 h-12 rounded-full border-2 border-dashed border-black/20 flex items-center justify-center shrink-0">
                   <ImageIcon className="w-5 h-5 text-black/40" />
                </div>
                <div>
                   <div className="font-bold mb-1">Memory Unlocked</div>
                   <p className="text-sm text-black/70">Luna generated a new watercolor drawing based on your upload from 2021.</p>
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
    <section className="py-32 px-6 border-t border-black/10 bg-white text-center">
      <h2 className="font-display text-5xl md:text-7xl font-bold tracking-tighter mb-8">Ready to reconnect?</h2>
      <button className="px-8 py-4 bg-black text-white rounded-full font-bold text-xl hover:bg-black/90 hover:scale-105 transition-all">
        Start Digitalizing Now
      </button>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-black bg-black text-white pt-20 pb-10 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div className="md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <PawPrint className="w-6 h-6" />
              <span className="font-display font-bold text-xl">Petecho</span>
            </Link>
            <p className="text-white/60 text-sm max-w-xs mb-6">
              Keep the essence of your pet alive. Talk, play, and remember. A digital sanctuary for your real-world companion.
            </p>
            <div className="flex gap-4">
              {/* Fake social links */}
              <div className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center hover:bg-white hover:text-black transition-colors cursor-pointer">
                <span className="font-bold text-xs">X</span>
              </div>
              <div className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center hover:bg-white hover:text-black transition-colors cursor-pointer">
                <span className="font-bold text-xs">IG</span>
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="font-bold mb-4 uppercase tracking-wider text-sm text-white/50">Product</h4>
            <ul className="space-y-3 text-sm">
              <li><Link href="#" className="hover:underline">Digitalization</Link></li>
              <li><Link href="#" className="hover:underline">Memory Books</Link></li>
              <li><Link href="#" className="hover:underline">Custom Pets</Link></li>
              <li><Link href="#" className="hover:underline">Pricing</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-bold mb-4 uppercase tracking-wider text-sm text-white/50">Company</h4>
            <ul className="space-y-3 text-sm">
              <li><Link href="#" className="hover:underline">About Us</Link></li>
              <li><Link href="#" className="hover:underline">Blog</Link></li>
              <li><Link href="#" className="hover:underline">Careers</Link></li>
              <li><Link href="#" className="hover:underline">Contact</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-4 uppercase tracking-wider text-sm text-white/50">Stay Updated</h4>
            <p className="text-xs text-white/60 mb-4">Subscribe to our newsletter for new features.</p>
            <div className="flex bg-white/10 rounded-full p-1 border border-white/20 focus-within:border-white transition-colors">
              <input type="email" placeholder="Email address" className="bg-transparent border-none outline-none px-4 text-sm w-full text-white placeholder:text-white/30" />
              <button className="w-8 h-8 bg-white text-black rounded-full flex items-center justify-center flex-shrink-0 hover:bg-gray-200 transition-colors">
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
        
        <div className="border-t border-white/20 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-white/50">
          <p>© {new Date().getFullYear()} Petecho Inc. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="#" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link href="#" className="hover:text-white transition-colors">Terms of Service</Link>
            <Link href="#" className="hover:text-white transition-colors">Cookie Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
