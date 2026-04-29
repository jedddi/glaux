"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Upload, Sun, Moon, CloudSun } from "lucide-react"

function getGreeting(): { text: string; icon: typeof Sun } {
  const hour = new Date().getHours()
  if (hour < 12) return { text: "Good morning", icon: Sun }
  if (hour < 18) return { text: "Good afternoon", icon: CloudSun }
  return { text: "Good evening", icon: Moon }
}

const greetings = ["Let's find edge cases.", "Ready to inspect?", "What are we breaking today?", "Models demand scrutiny."]

type GreetingAreaProps = {
  onUploadClick: () => void
}

export function GreetingArea({ onUploadClick }: GreetingAreaProps) {
  const [tagline, setTagline] = useState(greetings[0])

  useEffect(() => {
    const interval = setInterval(() => {
      setTagline((prev) => {
        const remaining = greetings.filter((g) => g !== prev)
        return remaining[Math.floor(Math.random() * remaining.length)]
      })
    }, 6000)
    return () => clearInterval(interval)
  }, [])

  const { text, icon: TimeIcon } = getGreeting()

  return (
    <div className="bg-cream border border-sand rounded-[5px] p-6 md:p-8 relative overflow-hidden">
      {/* Subtle dot pattern */}
      <div
        className="absolute inset-0 opacity-[0.035] pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(#ff4f00 0.7px, transparent 0.7px)",
          backgroundSize: "20px 20px",
        }}
      />

      {/* Floating accent shape */}
      <motion.div
        initial={{ opacity: 0, x: 80, rotate: 10 }}
        animate={{ opacity: 0.06, x: 0, rotate: 0 }}
        transition={{ duration: 1.2, ease: [0.23, 0.86, 0.39, 0.96] }}
        className="absolute -right-8 -top-8 w-48 h-48 rounded-full bg-zap-orange pointer-events-none"
      />
      <motion.div
        initial={{ opacity: 0, x: -40 }}
        animate={{ opacity: 0.04, x: 0 }}
        transition={{ duration: 1.4, delay: 0.2, ease: [0.23, 0.86, 0.39, 0.96] }}
        className="absolute -left-4 bottom-0 w-32 h-32 rounded-full bg-zap-orange pointer-events-none"
      />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-5">
        {/* Greeting text */}
        <div className="min-w-0">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.25, 0.4, 0.25, 1] }}
            className="flex items-center gap-2.5 mb-2"
          >
            <motion.div
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 15, delay: 0.3 }}
            >
              <TimeIcon className="size-5 text-zap-orange" />
            </motion.div>
            <span className="font-label-caps text-warm-gray tracking-[0.05em]">
              {text}
            </span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 16, filter: "blur(8px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.25, 0.4, 0.25, 1] }}
            className="font-display-xl text-zap-black text-[1.75rem] md:text-[2.25rem] leading-[0.9] mb-2"
          >
            What&apos;s on the bench?
          </motion.h2>

          <div className="h-5 overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.p
                key={tagline}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -20, opacity: 0 }}
                transition={{ duration: 0.35, ease: [0.25, 0.4, 0.25, 1] }}
                className="font-body-base text-dark-charcoal/60"
              >
                {tagline}
              </motion.p>
            </AnimatePresence>
          </div>
        </div>

        {/* Upload button */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.3, ease: [0.25, 0.4, 0.25, 1] }}
          className="shrink-0"
        >
          <button
            onClick={onUploadClick}
            className="group relative flex items-center gap-2.5 bg-zap-orange text-cream border border-zap-orange rounded-[4px] px-5 py-2.5 font-button transition-all hover:bg-zap-orange/90 active:scale-[0.98]"
          >
            <span className="relative">
              <Upload className="size-4 transition-transform group-hover:-translate-y-0.5" />
            </span>
            Upload Model
            <span className="absolute inset-0 rounded-[4px] animate-ping opacity-0 group-hover:opacity-20 bg-zap-orange pointer-events-none transition-opacity" />
          </button>
        </motion.div>
      </div>
    </div>
  )
}
