"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useDashboardStore } from "@/lib/stores/dashboard"
import {
  LayoutDashboard,
  Search,
  BarChart3,
  AlertTriangle,
  Lightbulb,
  ChevronLeft,
  ChevronRight,
  Plus,
} from "lucide-react"

const navItems = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Inspector",
    href: "/dashboard/inspector",
    icon: Search,
  },
  {
    label: "Evaluator",
    href: "/dashboard/evaluator",
    icon: BarChart3,
  },
  {
    label: "Failures",
    href: "/dashboard/failures",
    icon: AlertTriangle,
  },
  {
    label: "Edge Hints",
    href: "/dashboard/edge-hints",
    icon: Lightbulb,
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const { sidebarOpen, toggleSidebar, setShowCreateDialog } = useDashboardStore()

  return (
    <aside
      className={cn(
        "fixed top-0 left-0 z-40 h-full bg-cream border-r border-sand flex flex-col transition-all duration-300",
        sidebarOpen ? "w-60" : "w-[68px]"
      )}
    >
      {/* Logo area */}
      <div
        className={cn(
          "flex items-center h-14 px-4 border-b border-sand shrink-0",
          sidebarOpen ? "gap-3" : "justify-center"
        )}
      >
        <Link href="/" className="shrink-0">
          <span
            className={cn(
              "font-extrabold tracking-tighter text-zap-orange font-['Degular_Display']",
              sidebarOpen ? "text-lg" : "text-sm"
            )}
          >
            G
          </span>
        </Link>
        {sidebarOpen && (
          <Link href="/" className="truncate">
            <span className="text-lg font-extrabold tracking-tighter text-zap-orange font-['Degular_Display']">
              Glaux
            </span>
          </Link>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href)

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center rounded-md transition-all group relative",
                sidebarOpen ? "gap-3 px-3 py-2" : "justify-center p-2.5",
                isActive
                  ? "text-zap-orange"
                  : "text-dark-charcoal/70 hover:text-zap-black hover:bg-light-sand"
              )}
              style={
                isActive
                  ? {
                      boxShadow: "rgb(255, 79, 0) 0px -4px 0px 0px inset",
                    }
                  : undefined
              }
            >
              <item.icon className="size-5 shrink-0" />
              {sidebarOpen && (
                <span className="font-body-sm font-medium truncate">
                  {item.label}
                </span>
              )}
              {!sidebarOpen && (
                <span className="absolute left-full ml-3 px-2 py-1 bg-zap-black text-cream text-xs rounded-md opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity">
                  {item.label}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* New Project button */}
      <div className={cn("p-3 border-t border-sand", !sidebarOpen && "flex justify-center")}>
        <button
          onClick={() => setShowCreateDialog(true)}
          className={cn(
            "flex items-center gap-2 rounded-md bg-zap-orange text-cream font-button-sm transition-all hover:bg-zap-orange/90 active:scale-[0.98]",
            sidebarOpen ? "w-full px-4 py-2.5 justify-center" : "p-2.5"
          )}
        >
          <Plus className="size-4 shrink-0" />
          {sidebarOpen && "New Project"}
        </button>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={toggleSidebar}
        className="absolute -right-3 top-[50%] -translate-y-1/2 z-50 size-6 rounded-full bg-cream border border-sand flex items-center justify-center hover:bg-light-sand transition-colors"
      >
        {sidebarOpen ? (
          <ChevronLeft className="size-3 text-dark-charcoal" />
        ) : (
          <ChevronRight className="size-3 text-dark-charcoal" />
        )}
      </button>
    </aside>
  )
}
