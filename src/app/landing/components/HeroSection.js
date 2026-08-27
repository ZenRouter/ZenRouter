"use client";
import { useRouter } from "next/navigation";

export default function HeroSection() {
  const router = useRouter();
  return (
    <section className="relative pt-32 pb-20 px-6 min-h-[90vh] flex flex-col items-center justify-center overflow-hidden">
      {/* Glow effect */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-[#4B72A4]/15 rounded-full blur-[140px] pointer-events-none"></div>
      <div className="absolute top-20 right-1/4 w-[400px] h-[300px] bg-[#E85D3F]/10 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="relative z-10 max-w-4xl w-full text-center flex flex-col items-center gap-8">
        {/* Version badge */}
        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-[#141414]/90 px-3.5 py-1.5 text-xs font-medium text-gray-300">
          <span className="flex h-2 w-2 rounded-full bg-[#FF3B1D] animate-pulse"></span>
          ZenRouter Engine • Free &amp; Unlimited AI Gateway
        </div>

        {/* Main heading */}
        <h1 className="text-5xl md:text-7xl font-black leading-[1.1] tracking-tight">
          Serene AI Gateway for <br/>
          <span className="bg-gradient-to-r from-[#7b9fc8] via-[#5D87B8] to-[#E85D3F] bg-clip-text text-transparent">All AI Providers</span>
        </h1>

        {/* Description */}
        <p className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto font-light leading-relaxed">
          Cultivate, prune, and route all your AI models from a single unified gateway. Seamlessly integrates Claude Code, OpenAI Codex, Cursor, Cline, and Antigravity with RTK token saving and instant combo fallback.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-4 w-full">
          <button
            onClick={() => router.push("/dashboard")}
            className="h-12 px-8 rounded-lg bg-[#4B72A4] hover:bg-[#3c5e8c] text-white text-base font-semibold transition-all shadow-[0_0_20px_rgba(75,114,164,0.35)] hover:shadow-[0_0_25px_rgba(75,114,164,0.55)] flex items-center gap-2 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">rocket_launch</span>
            Open Dashboard
          </button>
          <a
            href="https://github.com/ZenRouter/ZenRouter"
            target="_blank"
            rel="noopener noreferrer"
            className="h-12 px-8 rounded-lg border border-[#233044] bg-[#141b24] hover:bg-[#1e293b] text-white text-base font-medium transition-all flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[20px]">code</span>
            View on GitHub
          </a>
        </div>
      </div>
    </section>
  );
}

