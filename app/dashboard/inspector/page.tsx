"use client"

import { useSearchParams } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import Link from "next/link"
import { ArrowLeft, FileDigit, HardDrive, Search } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Project, ModelAsset } from "@/lib/schemas/project"
import { useProjectModels } from "@/lib/hooks/use-projects"

async function fetchProject(id: string): Promise<Project> {
  const res = await fetch(`/api/projects/${id}`)
  if (!res.ok) throw new Error("Failed to fetch project")
  return res.json()
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
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

function ModelTable({ models }: { models: ModelAsset[] }) {
  if (models.length === 0) {
    return (
      <div className="bg-cream border border-sand rounded-[5px] p-10 text-center">
        <FileDigit className="size-10 text-sand mx-auto mb-3" />
        <p className="font-body-base text-dark-charcoal/60">
          No models uploaded yet.
        </p>
        <p className="font-body-sm text-dark-charcoal/40 mt-1">
          Use the Upload Model button to add a model file to this project.
        </p>
      </div>
    )
  }

  return (
    <div className="border border-sand rounded-[5px] overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="bg-light-sand">
            <th className="text-left px-4 py-2.5 font-label-caps text-[10px] text-dark-charcoal/60 tracking-[0.05em]">File Name</th>
            <th className="text-left px-4 py-2.5 font-label-caps text-[10px] text-dark-charcoal/60 tracking-[0.05em]">Size</th>
            <th className="text-left px-4 py-2.5 font-label-caps text-[10px] text-dark-charcoal/60 tracking-[0.05em]">Type</th>
            <th className="text-left px-4 py-2.5 font-label-caps text-[10px] text-dark-charcoal/60 tracking-[0.05em]">Uploaded</th>
          </tr>
        </thead>
        <tbody>
          {models.map((model, i) => (
            <tr
              key={model.id}
              className={cn(
                "border-t border-sand",
                i % 2 === 0 ? "bg-cream" : "bg-off-white"
              )}
            >
              <td className="px-4 py-3 font-body-sm text-zap-black">
                <div className="flex items-center gap-2">
                  <HardDrive className="size-4 text-zap-orange shrink-0" />
                  <span className="truncate">{model.file_name}</span>
                </div>
              </td>
              <td className="px-4 py-3 font-body-sm text-dark-charcoal/70">
                {formatBytes(model.file_size)}
              </td>
              <td className="px-4 py-3 font-body-sm text-dark-charcoal/70">
                {model.file_type === "application/octet-stream"
                  ? model.file_name.split(".").pop()?.toUpperCase() ?? "—"
                  : model.file_type}
              </td>
              <td className="px-4 py-3 font-body-sm text-dark-charcoal/50">
                {model.created_at
                  ? new Date(model.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })
                  : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function InspectorPage() {
  const searchParams = useSearchParams()
  const projectId = searchParams.get("project")

  const {
    data: project,
    isLoading: projectLoading,
    error: projectError,
  } = useQuery({
    queryKey: ["project", projectId],
    queryFn: () => fetchProject(projectId!),
    enabled: !!projectId,
  })

  const {
    data: models = [],
    isLoading: modelsLoading,
  } = useProjectModels(projectId)

  if (!projectId) {
    return (
      <div className="px-6 py-8 max-w-[1200px] mx-auto">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 font-body-sm text-dark-charcoal/60 hover:text-zap-orange transition-colors mb-6"
        >
          <ArrowLeft className="size-4" />
          Back to Dashboard
        </Link>

        <span className="font-label-caps text-warm-gray tracking-[0.05em] mb-2 block">
          Inspector
        </span>
        <h1 className="font-display-xl text-zap-black text-[2rem] md:text-[2.5rem] mb-2">
          Model Inspector
        </h1>
        <p className="font-body-base text-dark-charcoal/60 mb-10">
          Deep-dive into model architecture and layer-by-layer analysis.
        </p>

        <div className="bg-cream border border-sand rounded-[5px] p-12 text-center">
          <Search className="size-12 text-sand mx-auto mb-4" />
          <p className="font-body-base text-dark-charcoal/60">
            Select a project from the dashboard to inspect its model.
          </p>
        </div>
      </div>
    )
  }

  if (projectLoading) {
    return (
      <div className="px-6 py-8 max-w-[1200px] mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-light-sand rounded w-32" />
          <div className="h-8 bg-light-sand rounded w-64" />
          <div className="h-40 bg-light-sand rounded" />
        </div>
      </div>
    )
  }

  if (projectError || !project) {
    return (
      <div className="px-6 py-8 max-w-[1200px] mx-auto">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 font-body-sm text-dark-charcoal/60 hover:text-zap-orange transition-colors mb-6"
        >
          <ArrowLeft className="size-4" />
          Back to Dashboard
        </Link>
        <div className="bg-error/10 text-error rounded-[5px] p-6">
          <p className="font-body-base">Project not found or failed to load.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="px-6 py-8 max-w-[1200px] mx-auto">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 font-body-sm text-dark-charcoal/60 hover:text-zap-orange transition-colors mb-6"
      >
        <ArrowLeft className="size-4" />
        Back to Dashboard
      </Link>

      <span className="font-label-caps text-warm-gray tracking-[0.05em] mb-2 block">
        Inspector
      </span>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="font-display-xl text-zap-black text-[2rem] md:text-[2.5rem] mb-1">
            {project.name}
          </h1>
          {project.description && (
            <p className="font-body-base text-dark-charcoal/60">
              {project.description}
            </p>
          )}
        </div>
        <span
          className={cn(
            "font-label-caps text-[10px] px-2.5 py-1 rounded-[3px] shrink-0 mt-1",
            statusColors[project.status] ?? statusColors.draft
          )}
        >
          {statusLabels[project.status] ?? project.status}
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        <div className="bg-cream border border-sand rounded-[5px] p-4">
          <span className="font-label-caps text-[10px] text-dark-charcoal/50 tracking-[0.05em] block mb-1">Model Type</span>
          <span className="font-body-base text-zap-black font-medium capitalize">{project.model_type}</span>
        </div>
        <div className="bg-cream border border-sand rounded-[5px] p-4">
          <span className="font-label-caps text-[10px] text-dark-charcoal/50 tracking-[0.05em] block mb-1">Models</span>
          <span className="font-body-base text-zap-black font-medium">{models.length}</span>
        </div>
        <div className="bg-cream border border-sand rounded-[5px] p-4">
          <span className="font-label-caps text-[10px] text-dark-charcoal/50 tracking-[0.05em] block mb-1">Created</span>
          <span className="font-body-base text-zap-black font-medium">
            {project.created_at
              ? new Date(project.created_at).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })
              : "—"}
          </span>
        </div>
        <div className="bg-cream border border-sand rounded-[5px] p-4">
          <span className="font-label-caps text-[10px] text-dark-charcoal/50 tracking-[0.05em] block mb-1">Updated</span>
          <span className="font-body-base text-zap-black font-medium">
            {project.updated_at
              ? new Date(project.updated_at).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })
              : "—"}
          </span>
        </div>
      </div>

      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-headline-md text-zap-black text-lg">
          Uploaded Models
        </h2>
      </div>

      {modelsLoading ? (
        <div className="animate-pulse space-y-2">
          <div className="h-10 bg-light-sand rounded" />
          <div className="h-10 bg-light-sand rounded" />
        </div>
      ) : (
        <ModelTable models={models} />
      )}
    </div>
  )
}