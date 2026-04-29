import { Layers, Target, AlertTriangle, TrendingUp } from "lucide-react"
import { useDashboardStats } from "@/lib/hooks/use-projects"
import { cn } from "@/lib/utils"

export function StatsGrid({ className }: { className?: string }) {
  const { data: stats, isLoading } = useDashboardStats()

  const statsData = [
    {
      label: "Total Projects",
      value: stats?.total_projects ?? "0",
      change: "—",
      icon: Layers,
    },
    {
      label: "Models Analyzed",
      value: stats?.models_analyzed ?? "0",
      change: "—",
      icon: Target,
    },
    {
      label: "Failures Flagged",
      value: stats?.failures_flagged ?? "0",
      change: "—",
      icon: AlertTriangle,
    },
    {
      label: "Avg Accuracy",
      value: stats?.avg_accuracy != null ? `${stats.avg_accuracy}%` : "—",
      change: "—",
      icon: TrendingUp,
    },
  ]

  if (isLoading) {
    return (
      <div className={cn("grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4", className)}>
        {statsData.map((stat) => (
          <div
            key={stat.label}
            className="bg-cream border border-sand rounded-[5px] p-5 animate-pulse"
          >
            <div className="h-5 bg-light-sand rounded w-5 mb-3" />
            <div className="h-8 bg-light-sand rounded w-16 mb-2" />
            <div className="h-4 bg-light-sand rounded w-24" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className={cn("grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4", className)}>
      {statsData.map((stat) => (
        <div
          key={stat.label}
          className="bg-cream border border-sand rounded-[5px] p-5 hover:border-warm-gray transition-colors"
        >
          <div className="flex items-center justify-between mb-3">
            <stat.icon className="size-5 text-zap-orange" />
            <span className="font-mono-data text-xs text-dark-charcoal/50">
              {stat.change}
            </span>
          </div>
          <p className="font-display-xl text-zap-black text-[2rem] mb-1">
            {stat.value}
          </p>
          <p className="font-body-sm text-dark-charcoal/60">{stat.label}</p>
        </div>
      ))}
    </div>
  )
}
