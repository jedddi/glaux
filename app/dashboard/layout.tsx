"use client"

import { Sidebar } from "@/app/dashboard/components/sidebar"
import { CreateProjectDialog } from "@/app/dashboard/components/create-project-dialog"
import { UploadModelDialog } from "@/app/dashboard/components/upload-model-dialog"
import { DeleteProjectDialog } from "@/app/dashboard/components/delete-project-dialog"
import { useDashboardStore } from "@/lib/stores/dashboard"
import { cn } from "@/lib/utils"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const sidebarOpen = useDashboardStore((s) => s.sidebarOpen)
  const showCreateDialog = useDashboardStore((s) => s.showCreateDialog)
  const setShowCreateDialog = useDashboardStore((s) => s.setShowCreateDialog)
  const showUploadDialog = useDashboardStore((s) => s.showUploadDialog)
  const setShowUploadDialog = useDashboardStore((s) => s.setShowUploadDialog)

  return (
    <div className="min-h-screen bg-cream">
      <Sidebar />
      <main
        className={cn(
          "transition-all duration-300 min-h-screen",
          sidebarOpen ? "ml-60" : "ml-[68px]"
        )}
      >
        {children}
      </main>
      <CreateProjectDialog
        open={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
      />
      <UploadModelDialog
        open={showUploadDialog}
        onClose={() => setShowUploadDialog(false)}
      />
      <DeleteProjectDialog />
    </div>
  )
}
