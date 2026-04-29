"use client"

import { useMemo, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { AnimatePresence, motion } from "framer-motion"
import { FileUp, Upload, X } from "lucide-react"
import {
  ALLOWED_MODEL_EXTENSIONS,
  MAX_MODEL_UPLOAD_BYTES,
} from "@/lib/schemas/project"
import { useProjects, useUploadModel } from "@/lib/hooks/use-projects"
import { cn } from "@/lib/utils"

type UploadModelDialogProps = {
  open: boolean
  onClose: () => void
}

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`
  return `${Math.round((bytes / (1024 * 1024)) * 10) / 10} MB`
}

function validateModelFile(file: File | null) {
  if (!file) return "Choose an .onnx or .tflite model file."

  const lowerName = file.name.toLowerCase()
  const supported = ALLOWED_MODEL_EXTENSIONS.some((extension) =>
    lowerName.endsWith(extension)
  )

  if (!supported) return "Only .onnx and .tflite model files are supported."
  if (file.size <= 0) return "File must not be empty."
  if (file.size > MAX_MODEL_UPLOAD_BYTES) {
    return `Model file must be ${formatBytes(MAX_MODEL_UPLOAD_BYTES)} or smaller.`
  }

  return null
}

export function UploadModelDialog({ open, onClose }: UploadModelDialogProps) {
  const { data: projects, isLoading: projectsLoading } = useProjects()
  const uploadMutation = useUploadModel()
  const uploadControllerRef = useRef<AbortController | null>(null)
  const [projectId, setProjectId] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)

  const availableProjects = useMemo(() => projects ?? [], [projects])
  const selectedProjectId = projectId || availableProjects[0]?.id || ""
  const selectedProject = availableProjects.find((project) => project.id === selectedProjectId)
  const hasProjects = availableProjects.length > 0

  const resetAndClose = () => {
    uploadControllerRef.current?.abort()
    uploadControllerRef.current = null
    setFile(null)
    setError(null)
    uploadMutation.reset()
    onClose()
  }

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()

    if (!selectedProjectId) {
      setError("Choose a project before uploading.")
      return
    }

    const fileError = validateModelFile(file)
    if (fileError) {
      setError(fileError)
      return
    }

    setError(null)
    uploadControllerRef.current?.abort()
    uploadControllerRef.current = new AbortController()
    uploadMutation.mutate(
      { projectId: selectedProjectId, file: file as File, signal: uploadControllerRef.current.signal },
      {
        onSuccess: () => {
          resetAndClose()
        },
        onSettled: () => {
          uploadControllerRef.current = null
        },
      }
    )
  }

  if (typeof document === "undefined") return null

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          key="upload-model-dialog"
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
            aria-labelledby="upload-model-title"
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            onClick={(event) => event.stopPropagation()}
            className="relative z-10 w-full min-w-0 max-w-[28rem] rounded-[5px] border border-sand bg-cream shadow-lg overflow-hidden"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-sand">
              <div className="flex items-center gap-2.5 min-w-0">
                <Upload className="size-5 text-zap-orange shrink-0" />
                <h2
                  id="upload-model-title"
                  className="font-headline-md text-base text-zap-black truncate"
                >
                  Upload Model
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

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="font-body-sm font-semibold text-zap-black mb-1.5 block">
                  Project
                </label>
                <select
                  value={selectedProjectId}
                  onChange={(event) => setProjectId(event.target.value)}
                  disabled={projectsLoading || !hasProjects || uploadMutation.isPending}
                  className="w-full px-3 py-2.5 bg-cream border border-sand rounded-[5px] font-body-sm text-zap-black focus:outline-none focus:border-zap-orange transition-colors disabled:opacity-60"
                >
                  {projectsLoading && <option>Loading projects...</option>}
                  {!projectsLoading && !hasProjects && (
                    <option value="">Create a project first</option>
                  )}
                  {!projectsLoading &&
                    availableProjects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                      </option>
                    ))}
                </select>
                {!hasProjects && !projectsLoading && (
                  <p className="text-xs text-dark-charcoal/50 mt-1">
                    Use New Project first, then upload a model into it.
                  </p>
                )}
              </div>

              <div>
                <label className="font-body-sm font-semibold text-zap-black mb-1.5 block">
                  Model file
                </label>
                <label
                  className={cn(
                    "flex min-h-32 cursor-pointer flex-col items-center justify-center gap-3 rounded-[5px] border border-dashed border-sand bg-off-white px-4 py-6 text-center transition-colors hover:border-zap-orange",
                    uploadMutation.isPending && "pointer-events-none opacity-60"
                  )}
                >
                  <FileUp className="size-8 text-zap-orange" />
                  <span className="font-body-sm text-zap-black">
                    {file ? file.name : "Choose an .onnx or .tflite file"}
                  </span>
                  <span className="font-body-sm text-dark-charcoal/50">
                    {file
                      ? formatBytes(file.size)
                      : `Max ${formatBytes(MAX_MODEL_UPLOAD_BYTES)}`}
                  </span>
                  <input
                    type="file"
                    accept={ALLOWED_MODEL_EXTENSIONS.join(",")}
                    className="sr-only"
                    disabled={uploadMutation.isPending}
                    onChange={(event) => {
                      const nextFile = event.target.files?.[0] ?? null
                      setFile(nextFile)
                      setError(validateModelFile(nextFile))
                    }}
                  />
                </label>
              </div>

              {selectedProject && (
                <p className="font-body-sm text-dark-charcoal/50">
                  Uploading will attach the model to{" "}
                  <span className="text-zap-black">{selectedProject.name}</span> and mark
                  it as analyzing.
                </p>
              )}

              {(error || uploadMutation.error) && (
                <p className="text-sm text-error">
                  {error ?? uploadMutation.error?.message}
                </p>
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
                  disabled={!hasProjects || uploadMutation.isPending}
                  className="flex-1 px-4 py-2.5 rounded-[4px] bg-zap-orange text-cream border border-zap-orange font-button hover:bg-zap-orange/90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploadMutation.isPending ? "Uploading..." : "Upload Model"}
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
