"use client"

import Link from "next/link"
import { cn } from "@/lib/utils"
import type { Project } from "@/lib/schemas/project"
import { ArrowUpRight, Clock, BarChart3, Trash2 } from "lucide-react"
import { useDashboardStore } from "@/lib/stores/dashboard"

type ProjectCardProps = {
  project: Project
  className?: string
}

const statusLabels: Record<string, string> = {
  draft: "Draft",
  uploading: "Uploading",
  analyzing: "Analyzing",
  complete: "Complete",
  failed: "Failed",
}

const statusColors: Record<string, string> = {
  draft: "bg-sand text-dark-charcoal",
  uploading: "bg-light-sand text-dark-charcoal",
  analyzing: "bg-zap-orange/15 text-zap-orange",
  complete: "bg-zap-orange/10 text-zap-orange",
  failed: "bg-error/10 text-error",
}

export function ProjectCard({ project, className }: ProjectCardProps) {
  const setProjectToDelete = useDashboardStore((s) => s.setProjectToDelete)
  const status = project.status
  const date = project.created_at
    ? new Date(project.created_at).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })
    : null

  return (
    <div
      className={cn(
        "bg-cream border border-sand rounded-[5px] p-6 transition-colors hover:border-warm-gray group relative",
        className
      )}
    >
      <Link
        href={`/dashboard/inspector?project=${project.id}`}
        className="absolute inset-0 z-0"
      />
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2 min-w-0">
          <BarChart3 className="size-5 text-zap-orange shrink-0" />
          <h3 className="font-headline-md text-zap-black text-base leading-tight line-clamp-1">
            {project.name}
          </h3>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              setProjectToDelete({ id: project.id!, name: project.name })
            }}
            className="size-7 flex items-center justify-center rounded-[4px] text-dark-charcoal/30 hover:text-error hover:bg-error/5 transition-colors relative z-10"
            aria-label={`Delete ${project.name}`}
          >
            <Trash2 className="size-3.5" />
          </button>
          <span className="text-dark-charcoal/30 group-hover:text-zap-orange transition-colors">
            <ArrowUpRight className="size-4" />
          </span>
        </div>
      </div>

      {project.description && (
        <p className="font-body-sm text-dark-charcoal/60 mb-4 line-clamp-2">
          {project.description}
        </p>
      )}

      <div className="flex items-center justify-between">
        <span
          className={cn(
            "font-label-caps text-[10px] px-2 py-0.5 rounded-[3px]",
            statusColors[status] ?? statusColors.draft
          )}
        >
          {statusLabels[status] ?? status}
        </span>

        {date && (
          <span className="font-body-sm text-dark-charcoal/40 flex items-center gap-1">
            <Clock className="size-3" />
            {date}
          </span>
        )}
      </div>
    </div>
  )
}