"use client";

export default function HowItWorks() {
  return (
    <section className="py-24 border-y border-[#232f42] bg-[#141b24]/40" id="how-it-works">
      <div className="max-w-7xl mx-auto px-6">
        <div className="mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">How ZenRouter Works</h2>
          <p className="text-gray-400 max-w-xl text-lg">
            Traffic flows serenely from your local editor or terminal through our intelligent routing and token-saving engine to the optimal provider.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {/* Connection line */}
          <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-[2px] bg-gradient-to-r from-slate-700 via-[#5D87B8] to-slate-700 -z-10"></div>
          
          {/* Step 1: CLI & SDKs */}
          <div className="flex flex-col gap-6 relative group">
            <div className="w-24 h-24 rounded-2xl bg-[#10151f] border border-[#233044] flex items-center justify-center shadow-xl group-hover:border-slate-500 transition-colors z-10 mx-auto md:mx-0">
              <span className="material-symbols-outlined text-4xl text-gray-300">terminal</span>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-2 text-white">1. Developer Tools</h3>
              <p className="text-sm text-gray-400">
                Claude Code, Cursor, Codex, Cline, and Copilot connect to a unified local OpenAI-compatible endpoint.
              </p>
            </div>
          </div>

          {/* Step 2: ZenRouter Hub */}
          <div className="flex flex-col gap-6 relative group md:items-center md:text-center">
            <div className="w-24 h-24 rounded-2xl bg-[#10151f] border-2 border-[#5D87B8] flex items-center justify-center shadow-[0_0_30px_rgba(93,135,184,0.25)] z-10 mx-auto">
              <span className="material-symbols-outlined text-4xl text-[#5D87B8] animate-pulse">alt_route</span>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-2 text-[#7b9fc8]">2. ZenRouter Engine</h3>
              <p className="text-sm text-gray-400">
                RTK token-killer cuts redundant noise (-40%), validates health, and switches routes seamlessly on quota exhaustion.
              </p>
            </div>
          </div>

          {/* Step 3: AI Providers */}
          <div className="flex flex-col gap-6 relative group md:items-end md:text-right">
            <div className="w-24 h-24 rounded-2xl bg-[#10151f] border border-[#233044] flex items-center justify-center shadow-xl group-hover:border-slate-500 transition-colors z-10 mx-auto md:mx-0">
              <div className="grid grid-cols-2 gap-2">
                <div className="w-6 h-6 rounded bg-emerald-500/30 border border-emerald-500/40"></div>
                <div className="w-6 h-6 rounded bg-amber-500/30 border border-amber-500/40"></div>
                <div className="w-6 h-6 rounded bg-blue-500/30 border border-blue-500/40"></div>
                <div className="w-6 h-6 rounded bg-[#E85D3F]/30 border border-[#E85D3F]/40"></div>
              </div>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-2 text-white">3. Upstream AI Providers</h3>
              <p className="text-sm text-gray-400">
                Requests are processed with real-time SSE streaming across Claude, OpenAI, Gemini, Antigravity, Groq, and more.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

