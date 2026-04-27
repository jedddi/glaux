"use client";

import { motion } from "framer-motion";
import { Circle } from "lucide-react";
import { cn } from "@/lib/utils";

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
            initial={{
                opacity: 0,
                y: -150,
                rotate: rotate - 15,
            }}
            animate={{
                opacity: 1,
                y: 0,
                rotate: rotate,
            }}
            transition={{
                duration: 2.4,
                delay,
                ease: [0.23, 0.86, 0.39, 0.96],
                opacity: { duration: 1.2 },
            }}
            className={cn("absolute", className)}
        >
            <motion.div
                animate={{
                    y: [0, 15, 0],
                }}
                transition={{
                    duration: 12,
                    repeat: Number.POSITIVE_INFINITY,
                    ease: "easeInOut",
                }}
                style={{
                    width,
                    height,
                }}
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

function HeroGeometric({
    badge = "SYSTEM READY",
    title1 = "Inspect CNN models. Test them on data.",
    title2 = "Understand failures.",
}: {
    badge?: string;
    title1?: string;
    title2?: string;
}) {
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
        <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-background">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.05] via-transparent to-primary-container/[0.05] blur-3xl pointer-events-none" />

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
                    className="right-[-5%] md:right-[0%] top-[70%] md:top-[75%]"
                />

                <ElegantShape
                    delay={0.4}
                    width={300}
                    height={80}
                    rotate={-8}
                    gradient="from-tertiary/[0.15]"
                    className="left-[5%] md:left-[10%] bottom-[5%] md:bottom-[10%]"
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

            <div className="relative z-10 w-full pt-32 pb-0">
                <div className="max-w-7xl mx-auto text-center relative z-10 w-full px-6">
                    <motion.div
                        custom={0}
                        variants={fadeUpVariants}
                        initial="hidden"
                        animate="visible"
                        className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/5 border border-primary/10 mb-8 block w-fit mx-auto"
                    >
                        <span className="font-label-caps text-primary tracking-[0.2em]">
                            {badge}
                        </span>
                    </motion.div>

                    <motion.div
                        custom={1}
                        variants={fadeUpVariants}
                        initial="hidden"
                        animate="visible"
                    >
                        <h1 className="font-display-xl text-on-surface mb-6 max-w-4xl mx-auto">
                            <span>
                                {title1}
                            </span>
                            {" "}
                            <span className="text-primary-container">
                                {title2}
                            </span>
                        </h1>
                    </motion.div>

                    <motion.div
                        custom={2}
                        variants={fadeUpVariants}
                        initial="hidden"
                        animate="visible"
                    >
                        <p className="font-body-base text-secondary max-w-2xl mx-auto mb-10 text-lg">
                            Glaux provides clinical precision for machine learning engineers. Deploy with absolute confidence by isolating edge cases and visualizing high-dimensional failure patterns.
                        </p>
                    </motion.div>
                    
                    <motion.div
                        custom={3}
                        variants={fadeUpVariants}
                        initial="hidden"
                        animate="visible"
                        className="flex flex-col sm:flex-row gap-4 justify-center mb-20 relative z-20"
                    >
                        <button className="bg-primary text-white font-['Manrope'] px-8 py-4 rounded-xl text-md font-bold shadow-lg hover:shadow-primary/20 transition-all active:scale-95">Get Started Free</button>
                        <button className="bg-white border border-outline-variant text-on-surface font-['Manrope'] px-8 py-4 rounded-xl text-md font-bold hover:bg-surface-container transition-all active:scale-95">View Documentation</button>
                    </motion.div>
                    
                    <motion.div
                        custom={4}
                        variants={fadeUpVariants}
                        initial="hidden"
                        animate="visible"
                        className="relative w-full max-w-6xl mx-auto mt-12 mb-[-80px] md:mb-[-120px] lg:mb-[-200px]"
                    >
                        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[120%] h-[150%] bg-[radial-gradient(circle_at_center,_rgba(255,87,34,0.12)_0%,_transparent_70%)] pointer-events-none rounded-full blur-[100px] -z-10"></div>

                        <div className="browser-mockup fade-bottom relative bg-white rounded-t-2xl border-x border-t border-slate-200 overflow-hidden transform perspective-1000 rotate-x-2 shadow-2xl relative z-20">

                            <div className="h-10 bg-slate-100/80 backdrop-blur border-b border-slate-200 flex items-center px-4 gap-2">
                                <div className="flex gap-1.5">
                                    <div className="w-2.5 h-2.5 rounded-full bg-slate-300"></div>
                                    <div className="w-2.5 h-2.5 rounded-full bg-slate-300"></div>
                                    <div className="w-2.5 h-2.5 rounded-full bg-slate-300"></div>
                                </div>
                                <div className="mx-auto bg-white/60 rounded py-0.5 px-12 text-[10px] text-slate-400 font-mono">glaux.ai/dashboard</div>
                            </div>

                            <div className="w-full bg-background overflow-hidden max-h-[350px]">
                                <img alt="Glaux Dashboard Preview" className="w-full object-top object-cover" src="/dashboard-preview.png"/>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
            
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-0 opacity-10 pointer-events-none" style={{ backgroundImage: "radial-gradient(#b02f00 0.5px, transparent 0.5px)", backgroundSize: "24px 24px" }}></div>
            
            {/* Smooth transition fade to the next section */}
            <div className="absolute bottom-0 left-0 w-full h-40 md:h-64 lg:h-96 bg-gradient-to-t from-background via-background/80 to-transparent pointer-events-none z-10" />
        </div>
    );
}

export { HeroGeometric };
