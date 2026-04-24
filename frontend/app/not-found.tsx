import { PawPrint, Bone, Search, Sparkles } from 'lucide-react';

export default function NotFound() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#f5f0e8] px-6 py-10 text-black">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-5xl items-center justify-center">
        <div className="relative w-full overflow-hidden rounded-[2rem] border-2 border-black bg-white shadow-[12px_12px_0px_rgba(0,0,0,1)]">
          <div className="absolute -left-14 top-10 h-32 w-32 rounded-full bg-black/5 blur-2xl" />
          <div className="absolute bottom-0 right-0 h-40 w-40 rounded-full bg-black/10 blur-3xl" />

          <div className="relative grid gap-10 p-8 md:grid-cols-[1.2fr_0.8fr] md:p-12">
            <section>
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-black/15 bg-black/[0.03] px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em]">
                <Search className="h-4 w-4" />
                Lost In The Yard
              </div>
              <h1 className="font-display text-6xl font-bold leading-none tracking-tight md:text-8xl">
                404
              </h1>
              <h2 className="mt-4 font-heading text-2xl font-bold md:text-3xl">
                Your page chased a squirrel and never came back.
              </h2>
              <p className="mt-5 max-w-xl text-base leading-7 text-black/65 md:text-lg">
                Petecho sniffed around, checked under the couch, and even looked behind the treat jar.
                This page is definitely not here.
              </p>
            </section>

            <section className="flex min-h-[280px] items-center justify-center rounded-[1.75rem] border border-black/10 bg-[#f5f0e8] p-6">
              <div className="relative flex h-56 w-56 items-center justify-center rounded-full border-2 border-dashed border-black/20 bg-white">
                <div className="absolute -top-3 right-6 rounded-full border border-black bg-white px-3 py-1 text-xs font-bold uppercase tracking-[0.2em]">
                  Oops
                </div>
                <div className="absolute left-6 top-8">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div className="absolute bottom-10 right-10">
                  <Bone className="h-6 w-6 -rotate-12" />
                </div>
                <div className="flex h-28 w-28 items-center justify-center rounded-[2rem] border-2 border-black bg-black text-white shadow-[8px_8px_0px_rgba(0,0,0,0.12)]">
                  <PawPrint className="h-12 w-12" />
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
