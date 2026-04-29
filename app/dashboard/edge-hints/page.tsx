import Link from "next/link"
import { Lightbulb, ArrowLeft } from "lucide-react"

export default function EdgeHintsPage() {
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
        Edge Hints
      </span>
      <h1 className="font-display-xl text-zap-black text-[2rem] md:text-[2.5rem] mb-2">
        Edge Hints
      </h1>
      <p className="font-body-base text-dark-charcoal/60 mb-10">
        Edge-case suggestions and boundary condition predictions for your models.
      </p>

      <div className="bg-cream border border-sand rounded-[5px] p-12 text-center">
        <Lightbulb className="size-12 text-sand mx-auto mb-4" />
        <p className="font-body-base text-dark-charcoal/60">
          Edge hint analysis will be available after evaluations are complete.
        </p>
      </div>
    </div>
  )
}
