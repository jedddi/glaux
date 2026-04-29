import Link from "next/link"
import { BarChart3, ArrowLeft } from "lucide-react"

export default function EvaluatorPage() {
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
        Evaluator
      </span>
      <h1 className="font-display-xl text-zap-black text-[2rem] md:text-[2.5rem] mb-2">
        Model Evaluator
      </h1>
      <p className="font-body-base text-dark-charcoal/60 mb-10">
        Run evaluations against datasets and measure performance metrics.
      </p>

      <div className="bg-cream border border-sand rounded-[5px] p-12 text-center">
        <BarChart3 className="size-12 text-sand mx-auto mb-4" />
        <p className="font-body-base text-dark-charcoal/60">
          No evaluations yet. Start by uploading a dataset to a project.
        </p>
      </div>
    </div>
  )
}
