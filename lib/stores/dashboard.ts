import { create } from "zustand"

type ProjectToDelete = {
  id: string
  name: string
} | null

type DashboardState = {
  sidebarOpen: boolean
  activeProjectId: string | null
  filterStatus: string | null
  searchQuery: string
  showCreateDialog: boolean
  showUploadDialog: boolean
  projectToDelete: ProjectToDelete

  setSidebarOpen: (open: boolean) => void
  toggleSidebar: () => void
  setActiveProjectId: (id: string | null) => void
  setFilterStatus: (status: string | null) => void
  setSearchQuery: (query: string) => void
  setShowCreateDialog: (open: boolean) => void
  setShowUploadDialog: (open: boolean) => void
  setProjectToDelete: (project: ProjectToDelete) => void
}

export const useDashboardStore = create<DashboardState>((set) => ({
  sidebarOpen: true,
  activeProjectId: null,
  filterStatus: null,
  searchQuery: "",
  showCreateDialog: false,
  showUploadDialog: false,
  projectToDelete: null,

  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setActiveProjectId: (id) => set({ activeProjectId: id }),
  setFilterStatus: (status) => set({ filterStatus: status }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setShowCreateDialog: (open) => set({ showCreateDialog: open }),
  setShowUploadDialog: (open) => set({ showUploadDialog: open }),
  setProjectToDelete: (project) => set({ projectToDelete: project }),
}))
