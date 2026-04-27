import { HeroSection } from "@/components/ui/hero-section-1";
import { Rocket } from "lucide-react";

export default function Home() {
  return (
    <>
      <main className="w-full">
        <HeroSection />

        <section className="px-6 pt-8 pb-24 max-w-7xl mx-auto">
          <div className="mb-12">
            <h2 className="font-headline-lg text-on-surface">Analysis Suite</h2>
            <p className="text-secondary font-body-base mt-2">Professional tools for deep model interrogation.</p>
          </div>
          <div className="bento-grid">
            <div className="col-span-12 lg:col-span-8 bg-white border border-slate-200 rounded-xl p-8 shadow-sm hover:shadow-md transition-all group">
              <div className="flex justify-between items-start mb-12">
                <div>
                  <span className="material-symbols-outlined text-primary mb-4 p-3 bg-primary-fixed rounded-lg" data-icon="error_outline">error_outline</span>
                  <h3 className="font-headline-md text-on-surface">Failure Explorer</h3>
                  <p className="text-secondary font-body-base mt-2">Identify clusters of misclassifications across high-dimensional feature spaces.</p>
                </div>
                <span className="material-symbols-outlined text-slate-300 group-hover:text-primary transition-colors" data-icon="open_in_new">open_in_new</span>
              </div>
              <div className="w-full h-64 bg-slate-50 rounded-lg overflow-hidden border border-slate-100 relative">
                <img className="w-full h-full object-cover opacity-80" alt="Technical data visualization" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAXucOlFPH_gYNNkxoaGV52owNBE4Eg4fa6AeajosxcJVri-dvKp4t95ysH3jDU1gvIO3eDmEr7fsXwnOhdiX3HLnI5WrfWuG70DXq_bwNaGprMl67SsoL8JedL2BgA9U8Q6HTgbIft3ksxuh7vvsXahAlu079NT1750WQMg-V8NhhW_MFGbtYzeiYB_90iCE8L5qiRWXHC5WhVSqEWjM4l8KmRWbTa_OW4t2bA_U9pDlmDxJ_dH4nd3N17eewtJ7jCIFXLfST2XS_m"/>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-white/90 backdrop-blur p-4 rounded-lg border border-primary/20 flex gap-4 items-center">
                    <div className="w-2 h-2 rounded-full bg-error animate-pulse"></div>
                    <span className="font-mono-data text-xs text-on-surface">High entropy cluster detected at Layer 14</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-span-12 md:col-span-6 lg:col-span-4 bg-white border border-slate-200 rounded-xl p-8 shadow-sm hover:shadow-md transition-all">
              <span className="material-symbols-outlined text-primary mb-4 p-3 bg-primary-fixed rounded-lg" data-icon="account_tree">account_tree</span>
              <h3 className="font-headline-md text-on-surface">Model Summary</h3>
              <p className="text-secondary font-body-base mt-2 mb-8">Architectural breakdown and parameter efficiency metrics.</p>
              <div className="space-y-3">
                <div className="flex justify-between py-2 border-b border-slate-50">
                  <span className="text-body-sm text-secondary">Total Parameters</span>
                  <span className="font-mono-data text-body-sm font-bold">24.5M</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-50">
                  <span className="text-body-sm text-secondary">Architecture</span>
                  <span className="font-mono-data text-body-sm font-bold">ResNet-50</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-body-sm text-secondary">Top-1 Accuracy</span>
                  <span className="font-mono-data text-body-sm font-bold text-primary">94.2%</span>
                </div>
              </div>
            </div>

            <div className="col-span-12 md:col-span-6 lg:col-span-4 bg-white border border-slate-200 rounded-xl p-8 shadow-sm hover:shadow-md transition-all">
              <span className="material-symbols-outlined text-primary mb-4 p-3 bg-primary-fixed rounded-lg" data-icon="grid_view">grid_view</span>
              <h3 className="font-headline-md text-on-surface">Confusion Matrix</h3>
              <p className="text-secondary font-body-base mt-2 mb-6">Interactive heatmaps to visualize class-wise performance and overlap.</p>
              <div className="grid grid-cols-4 gap-1 opacity-60">
                <div className="aspect-square bg-primary/80 rounded-lg"></div>
                <div className="aspect-square bg-primary/20 rounded-lg"></div>
                <div className="aspect-square bg-primary/10 rounded-lg"></div>
                <div className="aspect-square bg-primary/5 rounded-lg"></div>
                <div className="aspect-square bg-primary/10 rounded-lg"></div>
                <div className="aspect-square bg-primary/90 rounded-lg"></div>
                <div className="aspect-square bg-primary/5 rounded-lg"></div>
                <div className="aspect-square bg-primary/20 rounded-lg"></div>
                <div className="aspect-square bg-primary/5 rounded-lg"></div>
                <div className="aspect-square bg-primary/10 rounded-lg"></div>
                <div className="aspect-square bg-primary/70 rounded-lg"></div>
                <div className="aspect-square bg-primary/10 rounded-lg"></div>
                <div className="aspect-square bg-primary/5 rounded-lg"></div>
                <div className="aspect-square bg-primary/10 rounded-lg"></div>
                <div className="aspect-square bg-primary/5 rounded-lg"></div>
                <div className="aspect-square bg-primary/95 rounded-lg"></div>
              </div>
            </div>

            {/* Ready to Optimize CTA - Matching Image */}
            <div className="col-span-12 lg:col-span-8 bg-[#0B1221] text-white rounded-3xl p-10 md:p-14 flex flex-row items-center justify-between overflow-hidden relative group border border-white/5 hover:border-white/10 transition-all duration-500">
              <div className="relative z-10 flex-1">
                <h3 className="font-['Manrope'] text-2xl md:text-3xl font-bold mb-3 tracking-tight leading-[1.1]">Ready to optimize?</h3>
                <p className="text-slate-400 text-sm md:text-base mb-8 leading-relaxed">Start your first model inspection in minutes. No credit card required.</p>
                <button className="bg-[#FF5722] text-white px-8 py-3 rounded-xl font-bold text-sm hover:bg-[#E64A19] transition-all active:scale-95 shadow-2xl shadow-orange-500/20">Launch Inspector</button>
              </div>
              <div className="hidden md:flex items-center justify-center flex-shrink-0 ml-8 opacity-20 group-hover:opacity-30 transition-all duration-700 pointer-events-none">
                <Rocket size={120} strokeWidth={1} className="text-slate-400 rotate-[-15deg] group-hover:rotate-[-10deg] transition-all duration-700" />
              </div>
            </div>
          </div>
        </section>

        <section className="bg-surface-container-lowest py-24 px-6 border-y border-slate-100">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="font-headline-lg text-on-surface">How it works</h2>
              <p className="text-secondary font-body-base">From raw model to production-ready insights.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
              <div className="hidden md:block absolute top-12 left-0 w-full h-[1px] bg-slate-200 -z-0"></div>
              <div className="relative z-10 flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-white border-2 border-primary-container rounded-full flex items-center justify-center mb-6 shadow-xl shadow-primary/10">
                  <span className="font-mono-data text-primary text-xl font-bold">01</span>
                </div>
                <h4 className="font-headline-md text-lg mb-3">Upload Model</h4>
                <p className="text-secondary text-sm px-4">Securely upload your CNN weights (PyTorch, TensorFlow, or ONNX format).</p>
              </div>
              <div className="relative z-10 flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-white border-2 border-primary-container rounded-full flex items-center justify-center mb-6 shadow-xl shadow-primary/10">
                  <span className="font-mono-data text-primary text-xl font-bold">02</span>
                </div>
                <h4 className="font-headline-md text-lg mb-3">Upload Dataset</h4>
                <p className="text-secondary text-sm px-4">Provide a validation set to baseline your performance across target classes.</p>
              </div>
              <div className="relative z-10 flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-white border-2 border-primary-container rounded-full flex items-center justify-center mb-6 shadow-xl shadow-primary/10">
                  <span className="font-mono-data text-primary text-xl font-bold">03</span>
                </div>
                <h4 className="font-headline-md text-lg mb-3">View Insights</h4>
                <p className="text-secondary text-sm px-4">Access deep-dive analysis dashboards and pinpoint structural weaknesses.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-20 px-6">
          <div className="max-w-7xl mx-auto flex flex-wrap justify-center gap-12 opacity-60 grayscale hover:grayscale-0 transition-all">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-3xl" data-icon="shield">shield</span>
              <span className="font-bold text-on-surface">SOC2 COMPLIANT</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-3xl" data-icon="speed">speed</span>
              <span className="font-bold text-on-surface">1.2ms LATENCY</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-3xl" data-icon="memory">memory</span>
              <span className="font-bold text-on-surface">MULTI-GPU ACCEL</span>
            </div>
          </div>
        </section>
      </main>

      <footer className="w-full py-8 mt-auto bg-white border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <span className="font-['Manrope'] text-xs text-slate-500">© 2024 Glaux Intelligence Systems. All rights reserved.</span>
          <div className="flex gap-6">
            <a className="font-['Manrope'] text-xs text-slate-500 hover:text-slate-700 transition-colors" href="#">Privacy Policy</a>
            <a className="font-['Manrope'] text-xs text-slate-500 hover:text-slate-700 transition-colors" href="#">Terms of Service</a>
            <a className="font-['Manrope'] text-xs text-slate-500 hover:text-slate-700 transition-colors" href="#">Security</a>
            <a className="font-['Manrope'] text-xs text-slate-500 hover:text-slate-700 transition-colors" href="#">Status</a>
          </div>
        </div>
      </footer>
    </>
  );
}
