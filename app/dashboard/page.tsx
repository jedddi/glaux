"use client"

import { StatsGrid } from "@/app/dashboard/components/stats-grid"
import { RecentProjects } from "@/app/dashboard/components/recent-projects"
import { GreetingArea } from "@/app/dashboard/components/greeting-area"
import { ScrollReveal } from "@/components/ui/scroll-reveal"
import { Search } from "lucide-react"
import { useDashboardStore } from "@/lib/stores/dashboard"

export default function DashboardPage() {
  const {
    searchQuery,
    setSearchQuery,
    filterStatus,
    setFilterStatus,
    setShowUploadDialog,
  } = useDashboardStore()

  const filters = [
    { label: "All", value: null },
    { label: "Complete", value: "complete" },
    { label: "Analyzing", value: "analyzing" },
    { label: "Uploading", value: "uploading" },
    { label: "Failed", value: "failed" },
    { label: "Draft", value: "draft" },
  ]

  return (
    <div className="px-6 py-8 max-w-[1200px] mx-auto">
      <GreetingArea onUploadClick={() => setShowUploadDialog(true)} />

      <ScrollReveal delay={0.1} className="mt-10">
        <StatsGrid />
      </ScrollReveal>

      {/* Search & Filters */}
      <ScrollReveal delay={0.15}>
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mt-10 mb-6">
          <h2 className="font-headline-md text-zap-black">Recent Projects</h2>

          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-warm-gray" />
              <input
                type="text"
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 bg-cream border border-sand rounded-[5px] font-body-sm text-zap-black placeholder:text-warm-gray focus:outline-none focus:border-zap-orange transition-colors w-48"
              />
            </div>

            {/* Filter pills */}
            <div className="flex gap-1.5">
              {filters.map((f) => (
                <button
                  key={f.label}
                  onClick={() => setFilterStatus(f.value)}
                  className="px-3 py-1.5 rounded-[20px] border border-sand font-button-sm text-dark-charcoal bg-cream hover:bg-light-sand transition-colors data-[active=true]:text-zap-orange data-[active=true]:border-zap-orange"
                  data-active={filterStatus === f.value}
                  style={
                    filterStatus === f.value
                      ? {
                          boxShadow:
                            "rgb(255, 79, 0) 0px -4px 0px 0px inset",
                        }
                      : {
                          boxShadow:
                            "rgb(197, 192, 177) 0px -4px 0px 0px inset",
                        }
                  }
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </ScrollReveal>

      <ScrollReveal delay={0.2} stagger staggerDelay={0.1}>
        <RecentProjects />
      </ScrollReveal>

    </div>
  )
}
