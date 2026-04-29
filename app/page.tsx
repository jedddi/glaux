"use client";

import { HeroSection } from "@/components/ui/hero-section-1";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { Rocket } from "lucide-react";

export default function Home() {
  return (
    <>
      <main className="w-full">
        <HeroSection />

        <section className="px-6 pt-4 pb-14 md:pb-16 max-w-[1200px] mx-auto">
          <ScrollReveal delay={0.1}>
            <div className="mb-8 md:mb-10">
              <span className="font-label-caps text-warm-gray tracking-[0.05em] mb-3 block">
                01 / Analysis
              </span>
              <h2 className="font-heading text-zap-black mb-2">
                Analysis Suite
              </h2>
              <p className="font-body-lg text-dark-charcoal">
                Professional tools for deep model interrogation.
              </p>
            </div>
          </ScrollReveal>

          <div className="bento-grid">
            <ScrollReveal delay={0.15} className="col-span-12 lg:col-span-8">
              <div className="bg-cream border border-sand rounded-[5px] p-8 h-full hover:border-warm-gray transition-colors group">
                <div className="flex justify-between items-start mb-12">
                  <div>
                    <span className="material-symbols-outlined text-zap-orange mb-4 p-3 bg-light-sand rounded-[5px]" data-icon="error_outline">error_outline</span>
                    <h3 className="font-headline-md text-zap-black">Failure Explorer</h3>
                    <p className="text-dark-charcoal/70 font-body-base mt-2">Identify clusters of misclassifications across high-dimensional feature spaces.</p>
                  </div>
                  <span className="material-symbols-outlined text-sand group-hover:text-zap-orange transition-colors" data-icon="open_in_new">open_in_new</span>
                </div>
                <div className="w-full h-64 bg-light-sand rounded-[5px] overflow-hidden border border-sand relative">
                  <img className="w-full h-full object-cover opacity-80" alt="Technical data visualization" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAXucOlFPH_gYNNkxoaGV52owNBE4Eg4fa6AeajosxcJVri-dvKp4t95ysH3jDU1gvIO3eDmEr7fsXwnOhdiX3HLnI5WrfWuG70DXq_bwNaGprMl67SsoL8JedL2BgA9U8Q6HTgbIft3ksxuh7vvsXahAlu079NT1750WQMg-V8NhhW_MFGbtYzeiYB_90iCE8L5qiRWXHC5WhVSqEWjM4l8KmRWbTa_OW4t2bA_U9pDlmDxJ_dH4nd3N17eewtJ7jCIFXLfST2XS_m" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-cream/90 backdrop-blur p-4 rounded-[5px] border border-sand flex gap-4 items-center">
                      <div className="w-2 h-2 rounded-full bg-zap-orange animate-pulse"></div>
                      <span className="font-mono-data text-xs text-zap-black">High entropy cluster detected at Layer 14</span>
                    </div>
                  </div>
                </div>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={0.25} className="col-span-12 md:col-span-6 lg:col-span-4">
              <div className="bg-cream border border-sand rounded-[5px] p-8 h-full hover:border-warm-gray transition-colors">
                <span className="material-symbols-outlined text-zap-orange mb-4 p-3 bg-light-sand rounded-[5px]" data-icon="account_tree">account_tree</span>
                <h3 className="font-headline-md text-zap-black">Model Summary</h3>
                <p className="text-dark-charcoal/70 font-body-base mt-2 mb-8">Architectural breakdown and parameter efficiency metrics.</p>
                <div className="space-y-3">
                  <div className="flex justify-between py-2 border-b border-sand/50">
                    <span className="font-body-sm text-dark-charcoal/60">Total Parameters</span>
                    <span className="font-mono-data font-semibold text-zap-black">24.5M</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-sand/50">
                    <span className="font-body-sm text-dark-charcoal/60">Architecture</span>
                    <span className="font-mono-data font-semibold text-zap-black">ResNet-50</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="font-body-sm text-dark-charcoal/60">Top-1 Accuracy</span>
                    <span className="font-mono-data font-semibold text-zap-orange">94.2%</span>
                  </div>
                </div>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={0.35} className="col-span-12 md:col-span-6 lg:col-span-4">
              <div className="bg-cream border border-sand rounded-[5px] p-8 h-full hover:border-warm-gray transition-colors">
                <span className="material-symbols-outlined text-zap-orange mb-4 p-3 bg-light-sand rounded-[5px]" data-icon="grid_view">grid_view</span>
                <h3 className="font-headline-md text-zap-black">Confusion Matrix</h3>
                <p className="text-dark-charcoal/70 font-body-base mt-2 mb-6">Interactive heatmaps to visualize class-wise performance and overlap.</p>
                <div className="grid grid-cols-4 gap-1 opacity-60">
                  <div className="aspect-square bg-zap-orange/80 rounded-[3px]"></div>
                  <div className="aspect-square bg-zap-orange/20 rounded-[3px]"></div>
                  <div className="aspect-square bg-zap-orange/10 rounded-[3px]"></div>
                  <div className="aspect-square bg-zap-orange/5 rounded-[3px]"></div>
                  <div className="aspect-square bg-zap-orange/10 rounded-[3px]"></div>
                  <div className="aspect-square bg-zap-orange/90 rounded-[3px]"></div>
                  <div className="aspect-square bg-zap-orange/5 rounded-[3px]"></div>
                  <div className="aspect-square bg-zap-orange/20 rounded-[3px]"></div>
                  <div className="aspect-square bg-zap-orange/5 rounded-[3px]"></div>
                  <div className="aspect-square bg-zap-orange/10 rounded-[3px]"></div>
                  <div className="aspect-square bg-zap-orange/70 rounded-[3px]"></div>
                  <div className="aspect-square bg-zap-orange/10 rounded-[3px]"></div>
                  <div className="aspect-square bg-zap-orange/5 rounded-[3px]"></div>
                  <div className="aspect-square bg-zap-orange/10 rounded-[3px]"></div>
                  <div className="aspect-square bg-zap-orange/5 rounded-[3px]"></div>
                  <div className="aspect-square bg-zap-orange/95 rounded-[3px]"></div>
                </div>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={0.2} className="col-span-12 lg:col-span-8">
              <div className="bg-zap-black text-cream rounded-lg p-10 md:p-14 flex flex-col md:flex-row items-center justify-between overflow-hidden relative group border border-zap-black h-full">
                <div className="relative z-10 flex-1">
                  <h3 className="font-display-xl text-[2rem] md:text-[2.5rem] mb-3">Ready to optimize?</h3>
                  <p className="text-warm-gray font-body-base mb-8 leading-relaxed">Start your first model inspection in minutes. No credit card required.</p>
                  <button className="bg-zap-orange text-cream border border-zap-orange rounded-[4px] px-6 py-3 font-button hover:bg-zap-orange/90 active:scale-[0.98] transition-all">Launch Inspector</button>
                </div>
                <div className="hidden md:flex items-center justify-center flex-shrink-0 md:ml-8 opacity-10 group-hover:opacity-20 transition-all duration-700 pointer-events-none">
                  <Rocket size={120} strokeWidth={1} className="text-sand rotate-[-15deg] group-hover:rotate-[-10deg] transition-all duration-700" />
                </div>
              </div>
            </ScrollReveal>
          </div>
        </section>

        <section className="bg-light-sand py-24 px-6 border-y border-sand">
          <div className="max-w-[1200px] mx-auto">
            <ScrollReveal delay={0.1}>
              <div className="text-center mb-16">
                <span className="font-label-caps text-warm-gray tracking-[0.05em] mb-3 block">02 / Process</span>
                <h2 className="font-heading text-zap-black mb-2">How it works</h2>
                <p className="font-body-lg text-dark-charcoal">From raw model to production-ready insights.</p>
              </div>
            </ScrollReveal>

            <ScrollReveal stagger staggerDelay={0.15} delay={0.2}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
                <div className="hidden md:block absolute top-12 left-0 w-full h-px bg-sand"></div>
                {[
                  { num: "01", title: "Upload Model", desc: "Securely upload your CNN weights (PyTorch, TensorFlow, or ONNX format)." },
                  { num: "02", title: "Upload Dataset", desc: "Provide a validation set to baseline your performance across target classes." },
                  { num: "03", title: "View Insights", desc: "Access deep-dive analysis dashboards and pinpoint structural weaknesses." },
                ].map((step) => (
                  <div key={step.num} className="relative z-10 flex flex-col items-center text-center">
                    <div className="w-16 h-16 bg-cream border border-sand rounded-full flex items-center justify-center mb-6">
                      <span className="font-mono-data text-zap-orange text-xl font-semibold">{step.num}</span>
                    </div>
                    <h4 className="font-headline-md text-lg text-zap-black mb-3">{step.title}</h4>
                    <p className="font-body-sm text-dark-charcoal/60 px-4">{step.desc}</p>
                  </div>
                ))}
              </div>
            </ScrollReveal>
          </div>
        </section>

        <ScrollReveal delay={0.1} direction="none">
          <section className="py-20 px-6 border-b border-sand">
            <div className="max-w-[1200px] mx-auto flex flex-wrap justify-center gap-12 opacity-50 grayscale hover:grayscale-0 transition-all">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-3xl text-dark-charcoal" data-icon="shield">shield</span>
                <span className="font-button-sm text-zap-black tracking-[0.5px]">SOC2 COMPLIANT</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-3xl text-dark-charcoal" data-icon="speed">speed</span>
                <span className="font-button-sm text-zap-black tracking-[0.5px]">1.2ms LATENCY</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-3xl text-dark-charcoal" data-icon="memory">memory</span>
                <span className="font-button-sm text-zap-black tracking-[0.5px]">MULTI-GPU ACCEL</span>
              </div>
            </div>
          </section>
        </ScrollReveal>
      </main>

      <ScrollReveal delay={0.1} direction="up" distance={20}>
        <footer className="w-full py-12 mt-auto bg-zap-black">
          <div className="max-w-[1200px] mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
            <span className="font-body-sm text-sand">© 2024 Glaux Intelligence Systems. All rights reserved.</span>
            <div className="flex gap-8">
              <a className="font-body-sm text-warm-gray hover:text-cream transition-colors" href="#">Privacy Policy</a>
              <a className="font-body-sm text-warm-gray hover:text-cream transition-colors" href="#">Terms of Service</a>
              <a className="font-body-sm text-warm-gray hover:text-cream transition-colors" href="#">Security</a>
              <a className="font-body-sm text-warm-gray hover:text-cream transition-colors" href="#">Status</a>
            </div>
          </div>
        </footer>
      </ScrollReveal>
    </>
  );
}