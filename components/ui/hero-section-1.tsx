"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, Menu, X, Layers, Target, ScanSearch } from "lucide-react";
import { motion } from "framer-motion";
import { AnimatedGroup } from "@/components/ui/animated-group";
import { cn } from "@/lib/utils";

/* ─────────────────────────────────────────────────────────────────────────────
   Floating background shapes – kept from the original Glaux hero design
───────────────────────────────────────────────────────────────────────────── */

function ElegantShape({
  className,
  delay = 0,
  width = 400,
  height = 100,
  rotate = 0,
  gradient = "from-primary/[0.08]",
}: {
  className?: string;
  delay?: number;
  width?: number;
  height?: number;
  rotate?: number;
  gradient?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -150, rotate: rotate - 15 }}
      animate={{ opacity: 1, y: 0, rotate }}
      transition={{
        duration: 2.4,
        delay,
        ease: [0.23, 0.86, 0.39, 0.96],
        opacity: { duration: 1.2 },
      }}
      className={cn("absolute", className)}
    >
      <motion.div
        animate={{ y: [0, 15, 0] }}
        transition={{
          duration: 12,
          repeat: Number.POSITIVE_INFINITY,
          ease: "easeInOut",
        }}
        style={{ width, height }}
        className="relative"
      >
        <div
          className={cn(
            "absolute inset-0 rounded-[9999px]",
            "bg-gradient-to-r to-transparent",
            gradient,
            "backdrop-blur-[2px] border-2 border-primary/[0.15]",
            "shadow-[0_8px_32px_0_rgba(176,47,0,0.1)]",
            "after:absolute after:inset-0 after:rounded-[9999px]",
            "after:bg-[radial-gradient(circle_at_50%_50%,rgba(176,47,0,0.2),transparent_70%)]"
          )}
        />
      </motion.div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   Animation variants
───────────────────────────────────────────────────────────────────────────── */

const transitionVariants = {
  item: {
    hidden: { opacity: 0, filter: "blur(12px)", y: 12 },
    visible: {
      opacity: 1,
      filter: "blur(0px)",
      y: 0,
      transition: { type: "spring", bounce: 0.3, duration: 1.5 },
    },
  },
};

/* ─────────────────────────────────────────────────────────────────────────────
   Navigation
───────────────────────────────────────────────────────────────────────────── */

const menuItems = [
  { name: "Product", href: "#" },
  { name: "Solutions", href: "#" },
  { name: "Pricing", href: "#" },
  { name: "Docs", href: "#" },
];

function HeroHeader() {
  const [menuState, setMenuState] = React.useState(false);
  const [isScrolled, setIsScrolled] = React.useState(false);

  React.useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header>
      <nav
        data-state={menuState ? "active" : undefined}
        className="fixed z-50 w-full px-2 group"
      >
        <div
          className={cn(
            "mx-auto mt-2 max-w-6xl px-6 transition-all duration-300 lg:px-12",
            isScrolled &&
            "bg-background/80 max-w-4xl rounded-2xl border border-outline-variant/30 backdrop-blur-lg lg:px-5"
          )}
        >
          <div className="relative flex flex-wrap items-center justify-between gap-6 py-3 lg:gap-0 lg:py-4">
            {/* Logo + mobile toggle */}
            <div className="flex w-full justify-between lg:w-auto">
              <Link href="/" aria-label="home" className="flex items-center">
                <GlauxLogo />
              </Link>

              <button
                onClick={() => setMenuState(!menuState)}
                aria-label={menuState ? "Close Menu" : "Open Menu"}
                className="relative z-20 -m-2.5 -mr-4 block cursor-pointer p-2.5 lg:hidden"
              >
                <Menu className="group-data-[state=active]:scale-0 group-data-[state=active]:opacity-0 m-auto size-6 duration-200" />
                <X className="group-data-[state=active]:rotate-0 group-data-[state=active]:scale-100 group-data-[state=active]:opacity-100 absolute inset-0 m-auto size-6 -rotate-180 scale-0 opacity-0 duration-200" />
              </button>
            </div>

            {/* Desktop nav links – centred */}
            <div className="absolute inset-0 m-auto hidden size-fit lg:block">
              <ul className="flex gap-8 text-sm">
                {menuItems.map((item, i) => (
                  <li key={i}>
                    <Link
                      href={item.href}
                      className="text-on-surface/60 hover:text-primary block duration-150 font-['Manrope'] font-medium text-sm"
                    >
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* CTA buttons */}
            <div
              className={cn(
                "bg-background group-data-[state=active]:block lg:group-data-[state=active]:flex",
                "mb-6 hidden w-full flex-wrap items-center justify-end space-y-8",
                "rounded-3xl border border-outline-variant/20 p-6 shadow-2xl shadow-black/10",
                "md:flex-nowrap lg:m-0 lg:flex lg:w-fit lg:gap-4 lg:space-y-0",
                "lg:border-transparent lg:bg-transparent lg:p-0 lg:shadow-none"
              )}
            >
              {/* Mobile links */}
              <div className="lg:hidden">
                <ul className="space-y-6 text-base">
                  {menuItems.map((item, i) => (
                    <li key={i}>
                      <Link
                        href={item.href}
                        className="text-on-surface/60 hover:text-primary block duration-150 font-['Manrope']"
                      >
                        {item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex w-full flex-col space-y-3 sm:flex-row sm:gap-3 sm:space-y-0 md:w-fit">
                <Link
                  href="#"
                  className={cn(
                    "inline-flex items-center justify-center rounded-lg border border-outline-variant/40 bg-transparent px-5 py-2 text-sm font-semibold font-['Manrope'] text-on-surface transition-colors hover:bg-surface-container-low",
                    isScrolled && "lg:hidden"
                  )}
                >
                  Sign In
                </Link>
                <Link
                  href="#"
                  className={cn(
                    "inline-flex items-center justify-center rounded-lg bg-primary px-5 py-2 text-sm font-semibold font-['Manrope'] text-white transition-all hover:bg-primary/90 active:scale-95",
                    isScrolled && "lg:hidden"
                  )}
                >
                  Sign Up
                </Link>
                <Link
                  href="#"
                  className={cn(
                    "inline-flex items-center justify-center rounded-lg bg-primary px-5 py-2 text-sm font-semibold font-['Manrope'] text-white transition-all hover:bg-primary/90 active:scale-95",
                    isScrolled ? "lg:inline-flex" : "hidden"
                  )}
                >
                  Get Started
                </Link>
              </div>
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   Main Hero Section
───────────────────────────────────────────────────────────────────────────── */

export function HeroSection() {
  const fadeUpVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        duration: 1,
        delay: 0.5 + i * 0.2,
        ease: [0.25, 0.4, 0.25, 1] as [number, number, number, number],
      },
    }),
  };

  return (
    <>
      <HeroHeader />
      <main className="overflow-hidden">
        {/* ── Hero section ────────────── */}
        <div className="relative min-h-screen w-full flex flex-col items-center overflow-hidden bg-background">
          {/* Subtle radial background overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.05] via-transparent to-primary-container/[0.05] blur-3xl pointer-events-none" />

          {/* Dot grid */}
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-0 opacity-10 pointer-events-none"
            style={{
              backgroundImage: "radial-gradient(#b02f00 0.5px, transparent 0.5px)",
              backgroundSize: "24px 24px",
            }}
          />

          {/* Floating background ellipses */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <ElegantShape
              delay={0.3}
              width={600}
              height={140}
              rotate={12}
              gradient="from-primary/[0.15]"
              className="left-[-10%] md:left-[-5%] top-[15%] md:top-[20%]"
            />
            <ElegantShape
              delay={0.5}
              width={500}
              height={120}
              rotate={-15}
              gradient="from-primary-container/[0.15]"
              className="right-[-5%] md:right-[0%] top-[60%] md:top-[65%]"
            />
            <ElegantShape
              delay={0.4}
              width={300}
              height={80}
              rotate={-8}
              gradient="from-tertiary/[0.15]"
              className="left-[5%] md:left-[10%] bottom-[20%] md:bottom-[15%]"
            />
            <ElegantShape
              delay={0.6}
              width={200}
              height={60}
              rotate={20}
              gradient="from-error/[0.15]"
              className="right-[15%] md:right-[20%] top-[10%] md:top-[15%]"
            />
            <ElegantShape
              delay={0.7}
              width={150}
              height={40}
              rotate={-25}
              gradient="from-primary-fixed-dim/[0.15]"
              className="left-[20%] md:left-[25%] top-[5%] md:top-[10%]"
            />
          </div>

          {/* Hero content */}
          <div className="relative z-10 w-full pt-36 pb-0 px-6">
            <div className="max-w-7xl mx-auto text-center">

              {/* Badge */}
              <motion.div
                custom={0}
                variants={fadeUpVariants}
                initial="hidden"
                animate="visible"
                className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-primary/5 border border-primary/15 mb-8 mx-auto"
              >
                <span className="font-label-caps text-primary tracking-[0.2em]">
                  SYSTEM READY
                </span>
                <span className="block h-4 w-px bg-primary/30" />
                <div className="bg-primary/10 size-6 overflow-hidden rounded-full">
                  <div className="flex w-12 -translate-x-1/2 duration-500 ease-in-out hover:translate-x-0">
                    <span className="flex size-6 items-center justify-center">
                      <ArrowRight className="size-3 text-primary" />
                    </span>
                    <span className="flex size-6 items-center justify-center">
                      <ArrowRight className="size-3 text-primary" />
                    </span>
                  </div>
                </div>
              </motion.div>

              {/* Headline */}
              <motion.h1
                custom={1}
                variants={fadeUpVariants}
                initial="hidden"
                animate="visible"
                className="font-display-xl text-on-surface mb-6 max-w-4xl mx-auto md:text-[3.75rem] lg:text-[4.5rem] xl:text-[5.25rem]"
              >
                <span>Inspect CNN models.</span>{" "}
                <span>Test them on data.</span>{" "}
                <span className="text-primary">Understand failures.</span>
              </motion.h1>

              {/* Subheadline */}
              <motion.p
                custom={2}
                variants={fadeUpVariants}
                initial="hidden"
                animate="visible"
                className="font-body-base text-secondary max-w-2xl mx-auto mb-10 text-lg"
              >
                Glaux provides clinical precision for machine learning engineers.
                Deploy with absolute confidence by isolating edge cases and
                visualizing high-dimensional failure patterns.
              </motion.p>

              {/* CTAs */}
              <motion.div
                custom={3}
                variants={fadeUpVariants}
                initial="hidden"
                animate="visible"
                className="flex flex-col sm:flex-row gap-4 justify-center mb-20 relative z-20"
              >
                <div className="bg-primary/10 rounded-[14px] border border-primary/20 p-0.5">
                  <button className="bg-primary text-white font-['Manrope'] px-8 py-4 rounded-xl text-md font-bold shadow-lg hover:shadow-primary/20 hover:bg-primary/90 transition-all active:scale-95">
                    Get Started Free
                  </button>
                </div>
                <button className="bg-white border border-outline-variant text-on-surface font-['Manrope'] px-8 py-4 rounded-xl text-md font-bold hover:bg-surface-container transition-all active:scale-95">
                  View Documentation
                </button>
              </motion.div>

              {/* Browser mockup */}
              <motion.div
                custom={4}
                variants={fadeUpVariants}
                initial="hidden"
                animate="visible"
                className="relative w-full max-w-6xl mx-auto mt-4 mb-[-80px] md:mb-[-120px] lg:mb-[-160px]"
              >
                {/* Glow halo behind mockup */}
                <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[120%] h-[150%] bg-[radial-gradient(circle_at_center,_rgba(176,47,0,0.12)_0%,_transparent_70%)] pointer-events-none rounded-full blur-[100px] -z-10" />

                <div className="browser-mockup fade-bottom relative bg-white rounded-t-2xl border-x border-t border-slate-200 overflow-hidden shadow-2xl">
                  {/* Browser chrome */}
                  <div className="h-10 bg-slate-100/80 backdrop-blur border-b border-slate-200 flex items-center px-4 gap-2">
                    <div className="flex gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                      <div className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                      <div className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                    </div>
                    <div className="mx-auto bg-white/60 rounded py-0.5 px-12 text-[10px] text-slate-400 font-mono">
                      glaux.ai/dashboard
                    </div>
                  </div>

                  {/* Dashboard screenshot */}
                  <div className="w-full bg-background overflow-hidden max-h-[380px]">
                    <img
                      alt="Glaux Dashboard Preview"
                      className="w-full object-top object-cover"
                      src="/dashboard-preview.png"
                    />
                  </div>
                </div>
              </motion.div>
            </div>
          </div>

          {/* Bottom fade-out */}
          <div className="absolute bottom-0 left-0 w-full h-40 md:h-64 bg-gradient-to-t from-background via-background/80 to-transparent pointer-events-none z-10" />
        </div>

        {/* ── Interrogation modes ─────── */}
        <section className="bg-background pb-8 pt-16 md:pb-12 md:pt-24">
          <div className="mx-auto max-w-6xl px-6">
            <div className="flex flex-col sm:flex-row items-start justify-center gap-12 sm:gap-0 sm:divide-x sm:divide-outline-variant/20">
              {[
                {
                  icon: <Layers className="size-32" strokeWidth={1} />,
                  title: "The Structural Eye",
                  description: "Analyze layer hierarchy and tensor shapes.",
                },
                {
                  icon: <Target className="size-32" strokeWidth={1} />,
                  title: "The Performance Lens",
                  description: "Evaluate accuracy, precision, and recall on custom datasets.",
                },
                {
                  icon: <ScanSearch className="size-32" strokeWidth={1} />,
                  title: "The Failure Explorer",
                  description: "Isolate misclassified samples to improve model robustness.",
                },
              ].map((mode) => (
                <div
                  key={mode.title}
                  className="group flex flex-col items-center cursor-default flex-1 px-8 lg:px-12"
                >
                  {/* Icon — always visible */}
                  <div className="text-on-surface/20 transition-all duration-500 group-hover:text-primary group-hover:scale-110">
                    {mode.icon}
                  </div>

                  {/* Text — fades + rises on hover */}
                  <div className="mt-8 flex flex-col items-center text-center pointer-events-none min-h-[100px]">
                    <p className="font-['Manrope'] font-bold text-lg text-on-surface opacity-0 translate-y-4 transition-all duration-500 ease-out group-hover:opacity-100 group-hover:translate-y-0">
                      {mode.title}
                    </p>
                    <p className="font-['Inter'] text-sm text-secondary leading-relaxed mt-3 max-w-[240px] opacity-0 translate-y-4 transition-all duration-500 ease-out delay-100 group-hover:opacity-100 group-hover:translate-y-0">
                      {mode.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   Glaux Logo (text-based, matching the existing nav style)
───────────────────────────────────────────────────────────────────────────── */

function GlauxLogo({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "text-xl font-extrabold tracking-tighter text-primary font-['Manrope']",
        className
      )}
    >
      Glaux
    </span>
  );
}
