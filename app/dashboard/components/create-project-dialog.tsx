"use client"

import { useState } from "react"
import { createPortal } from "react-dom"
import { motion, AnimatePresence } from "framer-motion"
import { X, Upload } from "lucide-react"
import { cn } from "@/lib/utils"
import { useCreateProject } from "@/lib/hooks/use-projects"
import { projectFormSchema } from "@/lib/schemas/project"
import type { ProjectForm } from "@/lib/schemas/project"

type CreateProjectDialogProps = {
  open: boolean
  onClose: () => void
}

const MODEL_TYPES = [
  { value: "pytorch", label: "PyTorch" },
  { value: "tensorflow", label: "TensorFlow" },
  { value: "onnx", label: "ONNX" },
  { value: "other", label: "Other" },
] as const

export function CreateProjectDialog({ open, onClose }: CreateProjectDialogProps) {
  const createMutation = useCreateProject()
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [modelType, setModelType] = useState<ProjectForm["model_type"]>("pytorch")
  const [errors, setErrors] = useState<Record<string, string>>({})

  const resetAndClose = () => {
    setErrors({})
    createMutation.reset()
    onClose()
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})

    const result = projectFormSchema.safeParse({ name, description, model_type: modelType })
    if (!result.success) {
      const fieldErrors: Record<string, string> = {}
      for (const err of result.error.issues) {
        const field = err.path[0] as string
        fieldErrors[field] = err.message
      }
      setErrors(fieldErrors)
      return
    }

    createMutation.mutate(result.data, {
      onSuccess: () => {
        setName("")
        setDescription("")
        setModelType("pytorch")
        setErrors({})
        resetAndClose()
      },
    })
  }

  if (typeof document === "undefined") return null

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          key="create-project-dialog"
          role="presentation"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={resetAndClose}
            className="absolute inset-0 cursor-default bg-zap-black/40 backdrop-blur-[2px]"
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-project-title"
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            onClick={(e) => e.stopPropagation()}
            className="relative z-10 w-full min-w-0 max-w-[28rem] rounded-[5px] border border-sand bg-cream shadow-lg overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-sand">
              <div className="flex items-center gap-2.5 min-w-0">
                <Upload className="size-5 text-zap-orange shrink-0" />
                <h2
                  id="create-project-title"
                  className="font-headline-md text-base text-zap-black truncate"
                >
                  New Project
                </h2>
              </div>
              <button
                type="button"
                onClick={resetAndClose}
                className="size-8 flex items-center justify-center rounded-[4px] hover:bg-light-sand transition-colors shrink-0"
              >
                <X className="size-4 text-dark-charcoal/60" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Name */}
              <div>
                <label className="font-body-sm font-semibold text-zap-black mb-1.5 block">
                  Project name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. ResNet-50 v3"
                  className={cn(
                    "w-full px-3 py-2.5 bg-cream border rounded-[5px] font-body-sm text-zap-black placeholder:text-warm-gray focus:outline-none transition-colors",
                    errors.name ? "border-zap-orange" : "border-sand focus:border-zap-orange"
                  )}
                />
                {errors.name && (
                  <p className="text-xs text-zap-orange mt-1">{errors.name}</p>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="font-body-sm font-semibold text-zap-black mb-1.5 block">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description of the model and purpose..."
                  rows={3}
                  className={cn(
                    "w-full px-3 py-2.5 bg-cream border rounded-[5px] font-body-sm text-zap-black placeholder:text-warm-gray focus:outline-none transition-colors resize-none",
                    errors.description ? "border-zap-orange" : "border-sand focus:border-zap-orange"
                  )}
                />
                {errors.description && (
                  <p className="text-xs text-zap-orange mt-1">{errors.description}</p>
                )}
              </div>

              {/* Model Type */}
              <div>
                <label className="font-body-sm font-semibold text-zap-black mb-1.5 block">
                  Model framework
                </label>
                <div className="flex gap-2">
                  {MODEL_TYPES.map((t) => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setModelType(t.value)}
                      className={cn(
                        "min-w-0 flex-1 px-3 py-2 rounded-[5px] border font-button-sm transition-all",
                        modelType === t.value
                          ? "border-zap-orange text-zap-orange bg-zap-orange/5"
                          : "border-sand text-dark-charcoal/60 hover:bg-light-sand"
                      )}
                      style={
                        modelType === t.value
                          ? { boxShadow: "rgb(255, 79, 0) 0px -4px 0px 0px inset" }
                          : undefined
                      }
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Actions */}
              {createMutation.error && (
                <p className="text-sm text-error">{createMutation.error.message}</p>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={resetAndClose}
                  className="flex-1 px-4 py-2.5 rounded-[5px] border border-sand font-button text-dark-charcoal bg-cream hover:bg-light-sand transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="flex-1 px-4 py-2.5 rounded-[4px] bg-zap-orange text-cream border border-zap-orange font-button hover:bg-zap-orange/90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {createMutation.isPending ? "Creating..." : "Create Project"}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  )
}
