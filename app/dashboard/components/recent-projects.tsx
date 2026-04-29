"use client"

import { useProjects } from "@/lib/hooks/use-projects"
import { ProjectCard } from "@/app/dashboard/components/project-card"
import type { Project } from "@/lib/schemas/project"
import { cn } from "@/lib/utils"
import { useDashboardStore } from "@/lib/stores/dashboard"

export function RecentProjects({ className }: { className?: string }) {
  const { data: projects, isLoading } = useProjects()
  const { searchQuery, filterStatus } = useDashboardStore()

  const filtered = projects?.filter((p: Project) => {
    if (filterStatus && p.status !== filterStatus) return false
    if (searchQuery && !p.name.toLowerCase().includes(searchQuery.toLowerCase())) return false
    return true
  })

  if (isLoading) {
    return (
      <div className={cn("grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5", className)}>
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="bg-cream border border-sand rounded-[5px] p-6 h-40 animate-pulse"
          >
            <div className="h-5 bg-light-sand rounded w-2/3 mb-4" />
            <div className="h-4 bg-light-sand rounded w-full mb-2" />
            <div className="h-4 bg-light-sand rounded w-1/2" />
          </div>
        ))}
      </div>
    )
  }

  if (filtered?.length === 0) {
    return (
      <div className={cn("bg-cream border border-sand rounded-[5px] p-12 text-center", className)}>
        <p className="font-body-base text-dark-charcoal/60">
          No projects found. Create one to get started.
        </p>
      </div>
    )
  }

  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5", className)}>
      {filtered?.map((project: Project) => (
        <ProjectCard key={project.id} project={project} />
      ))}
    </div>
  )
}
