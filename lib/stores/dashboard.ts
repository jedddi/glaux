// LEGACY: not used in the ephemeral flow
import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"

type ProjectToDelete = {
  id: string
  name: string
} | null

type DashboardState = {
  sidebarOpen: boolean
  activeProjectId: string | null
  hasHydrated: boolean
  filterStatus: string | null
  searchQuery: string
  showCreateDialog: boolean
  showUploadDialog: boolean
  projectToDelete: ProjectToDelete

  setSidebarOpen: (open: boolean) => void
  toggleSidebar: () => void
  setActiveProjectId: (id: string | null) => void
  ensureActiveProjectId: (projectIds: string[]) => void
  setHasHydrated: (hydrated: boolean) => void
  setFilterStatus: (status: string | null) => void
  setSearchQuery: (query: string) => void
  setShowCreateDialog: (open: boolean) => void
  setShowUploadDialog: (open: boolean) => void
  setProjectToDelete: (project: ProjectToDelete) => void
}

export const useDashboardStore = create<DashboardState>()(
  persist(
    (set) => ({
      sidebarOpen: true,
      activeProjectId: null,
      hasHydrated: false,
      filterStatus: null,
      searchQuery: "",
      showCreateDialog: false,
      showUploadDialog: false,
      projectToDelete: null,

      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
      setActiveProjectId: (id) => set({ activeProjectId: id }),
      ensureActiveProjectId: (projectIds) =>
        set((state) => {
          if (projectIds.length === 0) {
            return state.activeProjectId ? { activeProjectId: null } : {}
          }

          if (state.activeProjectId && projectIds.includes(state.activeProjectId)) {
            return {}
          }

          return { activeProjectId: projectIds[0] }
        }),
      setHasHydrated: (hydrated) => set({ hasHydrated: hydrated }),
      setFilterStatus: (status) => set({ filterStatus: status }),
      setSearchQuery: (query) => set({ searchQuery: query }),
      setShowCreateDialog: (open) => set({ showCreateDialog: open }),
      setShowUploadDialog: (open) => set({ showUploadDialog: open }),
      setProjectToDelete: (project) => set({ projectToDelete: project }),
    }),
    {
      name: "dashboard-store",
      storage: createJSONStorage(() =>
        typeof window !== "undefined"
          ? localStorage
          : {
              getItem: () => null,
              setItem: () => {},
              removeItem: () => {},
            }
      ),
      partialize: (state) => ({
        sidebarOpen: state.sidebarOpen,
        activeProjectId: state.activeProjectId,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true)
      },
    }
  )
)
