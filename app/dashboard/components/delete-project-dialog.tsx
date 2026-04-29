"use client"

import { createPortal } from "react-dom"
import { motion, AnimatePresence } from "framer-motion"
import { Trash2, X } from "lucide-react"
import { useDeleteProject } from "@/lib/hooks/use-projects"
import { useDashboardStore } from "@/lib/stores/dashboard"

export function DeleteProjectDialog() {
  const projectToDelete = useDashboardStore((s) => s.projectToDelete)
  const setProjectToDelete = useDashboardStore((s) => s.setProjectToDelete)
  const deleteMutation = useDeleteProject()

  const open = projectToDelete !== null

  const handleClose = () => {
    deleteMutation.reset()
    setProjectToDelete(null)
  }

  const handleDelete = () => {
    if (!projectToDelete) return
    deleteMutation.mutate(projectToDelete.id, {
      onSuccess: handleClose,
    })
  }

  if (typeof document === "undefined") return null

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          key="delete-project-dialog"
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
            onClick={handleClose}
            className="absolute inset-0 cursor-default bg-zap-black/40 backdrop-blur-[2px]"
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-project-title"
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            onClick={(e) => e.stopPropagation()}
            className="relative z-10 w-full min-w-0 max-w-[28rem] rounded-[5px] border border-sand bg-cream shadow-lg overflow-hidden"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-sand">
              <div className="flex items-center gap-2.5 min-w-0">
                <Trash2 className="size-5 text-error shrink-0" />
                <h2
                  id="delete-project-title"
                  className="font-headline-md text-base text-zap-black truncate"
                >
                  Delete Project
                </h2>
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="size-8 flex items-center justify-center rounded-[4px] hover:bg-light-sand transition-colors shrink-0"
              >
                <X className="size-4 text-dark-charcoal/60" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <p className="font-body-sm text-dark-charcoal/80">
                Are you sure you want to delete{" "}
                <span className="font-semibold text-zap-black">
                  {projectToDelete?.name}
                </span>
                ? This action cannot be undone. All models and analysis data will be permanently removed.
              </p>

              {deleteMutation.error && (
                <p className="text-sm text-error">{deleteMutation.error.message}</p>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 px-4 py-2.5 rounded-[5px] border border-sand font-button text-dark-charcoal bg-cream hover:bg-light-sand transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleteMutation.isPending}
                  className="flex-1 px-4 py-2.5 rounded-[4px] bg-error text-cream border border-error font-button hover:bg-error/90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {deleteMutation.isPending ? "Deleting..." : "Delete Project"}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  )
}