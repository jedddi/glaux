"use client"

import { useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useCreateSession, useUploadToSession } from "@/lib/hooks/use-session"
import { useSessionInspect } from "@/lib/hooks/use-session-inspector"
import { useSessionGraph } from "@/lib/hooks/use-session-graph"
import { useSessionEvaluate, useRunSessionEvaluate } from "@/lib/hooks/use-session-evaluator"
import { useSessionFailures } from "@/lib/hooks/use-session-failures"
import { useSessionStore } from "@/lib/stores/session"
import { getSessionModelDownloadUrl } from "@/lib/services/session-service"
import { ModelExplorerViewer } from "@/components/inspector/model-explorer-viewer"
import { Upload, FileBox, BarChart3, AlertTriangle, ArrowLeft, HardDrive, Info } from "lucide-react"
import { cn } from "@/lib/utils"
import type {
  SessionInspectResponse,
  SessionEvaluateResponse,
  SessionFailuresResponse,
  SessionGraphResponse,
} from "@/lib/schemas/session"

const fade = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.3 } },
}

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.04, delayChildren: 0.05 } },
}

const item = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.25 } },
}

export default function Home() {
  const { sessionId, status, modelFileName, activeTool, setSessionId, setStatus, setModelFileName, setActiveTool, reset } = useSessionStore()
  const [dragActive, setDragActive] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const createSession = useCreateSession()
  const uploadToSession = useUploadToSession()
  const inspectQuery = useSessionInspect(sessionId)
  const graphQuery = useSessionGraph(sessionId)
  const evaluateQuery = useSessionEvaluate(sessionId)
  const runEvaluate = useRunSessionEvaluate()
  const failuresQuery = useSessionFailures(sessionId)

  const handleFile = useCallback(async (file: File) => {
    setUploadError(null)
    try {
      const newSessionId = await createSession.mutateAsync()
      setSessionId(newSessionId)
      setStatus("uploading")
      await uploadToSession.mutateAsync({ sessionId: newSessionId, file })
      setModelFileName(file.name)
    } catch (err) {
      setUploadError((err as Error).message ?? "Upload failed")
      setStatus("error")
    }
  }, [createSession, uploadToSession, setSessionId, setStatus, setModelFileName])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }, [handleFile])

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }, [handleFile])

  const handleEvaluate = useCallback(() => {
    if (!sessionId) return
    runEvaluate.mutate({ sessionId })
  }, [sessionId, runEvaluate])

  const handleReset = useCallback(() => { reset() }, [reset])

  const isUploading = status === "uploading" || uploadToSession.isPending
  const isAnalyzing = inspectQuery.isLoading && !inspectQuery.data

  if (!sessionId) {
    return <UploadScreen
      dragActive={dragActive}
      setDragActive={setDragActive}
      handleDrop={handleDrop}
      handleFileInput={handleFileInput}
      uploadError={uploadError}
      isUploading={isUploading}
    />
  }

  const tools = [
    { id: "inspector" as const, label: "Inspector", icon: FileBox },
    { id: "evaluator" as const, label: "Evaluator", icon: BarChart3 },
    { id: "failures" as const, label: "Failures", icon: AlertTriangle },
  ]

  return (
    <motion.div
      className="flex h-dvh min-h-0 w-full overflow-hidden"
      variants={fade}
      initial="hidden"
      animate="show"
    >
      <aside className="flex w-60 shrink-0 flex-col border-r border-border bg-canvas">
        <div className="px-4 py-4 border-b border-border">
          <button
            onClick={handleReset}
            className="flex items-center gap-2 text-text-muted hover:text-text transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="font-body-sm">New session</span>
          </button>
        </div>

        <nav className="shrink-0 space-y-1 px-2 py-3">
          {tools.map((tool) => (
            <button
              key={tool.id}
              onClick={() => setActiveTool(tool.id)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2 rounded text-left transition-colors font-body-sm",
                activeTool === tool.id
                  ? "text-accent"
                  : "text-text-secondary hover:text-text"
              )}
            >
              <tool.icon className="h-4 w-4 shrink-0" />
              {tool.label}
            </button>
          ))}
        </nav>

        <div className="min-h-0 flex-1" aria-hidden />

        {modelFileName && (
          <div className="shrink-0 border-t border-border px-4 py-4">
            <p className="font-label text-text-muted mb-1.5">Model</p>
            <p className="mono-data text-text-secondary truncate">{modelFileName}</p>
          </div>
        )}
      </aside>

      <main className="min-h-0 flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          {activeTool === "inspector" && (
            <motion.div key="inspector" variants={stagger} initial="hidden" animate="show" exit="hidden" className="p-10">
              <InspectorPanel
                data={inspectQuery.data}
                isLoading={isAnalyzing}
                isError={inspectQuery.isError}
                error={inspectQuery.error?.message}
                onRetry={() => inspectQuery.refetch()}
                graphData={graphQuery.data}
                isGraphLoading={graphQuery.isLoading}
                isGraphError={graphQuery.isError}
                graphError={graphQuery.error?.message}
                onRetryGraph={() => graphQuery.refetch()}
                modelDownloadUrl={sessionId ? getSessionModelDownloadUrl(sessionId) : null}
              />
            </motion.div>
          )}
          {activeTool === "evaluator" && (
            <motion.div key="evaluator" variants={stagger} initial="hidden" animate="show" exit="hidden" className="p-10">
              <EvaluatorPanel data={evaluateQuery.data} isLoading={evaluateQuery.isLoading} onRun={handleEvaluate} isRunning={runEvaluate.isPending} isError={evaluateQuery.isError} error={evaluateQuery.error?.message} onRetry={() => evaluateQuery.refetch()} />
            </motion.div>
          )}
          {activeTool === "failures" && (
            <motion.div key="failures" variants={stagger} initial="hidden" animate="show" exit="hidden" className="p-10">
              <FailuresPanel data={failuresQuery.data} isLoading={failuresQuery.isLoading} hasEvaluation={!!evaluateQuery.data} isError={failuresQuery.isError} error={failuresQuery.error?.message} onRetry={() => failuresQuery.refetch()} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </motion.div>
  )
}

/* ─── Upload Screen ─── */

function UploadScreen({ dragActive, setDragActive, handleDrop, handleFileInput, uploadError, isUploading }: {
  dragActive: boolean
  setDragActive: (v: boolean) => void
  handleDrop: (e: React.DragEvent) => void
  handleFileInput: (e: React.ChangeEvent<HTMLInputElement>) => void
  uploadError: string | null
  isUploading: boolean
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6">
      <motion.div className="max-w-lg w-full text-center" variants={stagger} initial="hidden" animate="show">
        <motion.h1 variants={item} className="font-display text-text mb-3">
          Glaux
        </motion.h1>

        <motion.p variants={item} className="font-body text-text-secondary mb-10 max-w-sm mx-auto leading-relaxed">
          Upload a model to inspect, evaluate, and analyze. Sessions are ephemeral.
        </motion.p>

        <motion.div
          variants={item}
          onDragOver={(e) => { e.preventDefault(); setDragActive(true) }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          onClick={() => document.getElementById("file-input")?.click()}
          className={cn(
            "rounded-lg p-14 cursor-pointer transition-colors duration-200",
            "border border-dashed",
            dragActive
              ? "border-accent/40 bg-accent/[0.04]"
              : "border-border hover:border-border-hover"
          )}
        >
          <input id="file-input" type="file" accept=".onnx,.tflite" className="hidden" onChange={handleFileInput} />

          <Upload className={cn("h-6 w-6 mx-auto mb-4 transition-colors", dragActive ? "text-accent" : "text-text-muted")} />

          <p className="font-heading text-text mb-1.5">
            {dragActive ? "Release to upload" : "Drop a model or click to upload"}
          </p>
          <p className="font-body-sm text-text-muted">
            ONNX and TFLite
          </p>
        </motion.div>

        <AnimatePresence>
          {uploadError && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mt-3 font-body-sm text-error">
              {uploadError}
            </motion.p>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {isUploading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mt-6 flex items-center justify-center gap-1.5">
              <DotPulse />
              <span className="font-body-sm text-text-secondary ml-1">Uploading</span>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}

/* ─── Shared Components ─── */

function DotPulse() {
  return (
    <div className="flex gap-1">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="w-1 h-1 rounded-full bg-text-muted"
          style={{ animation: `pulse-dot 1.2s ease-in-out ${i * 0.15}s infinite` }}
        />
      ))}
    </div>
  )
}

function Stat({ label, value, accent }: { label: string; value: string | number; accent?: boolean }) {
  return (
    <motion.div variants={item} className="py-4">
      <p className="font-label text-text-muted mb-1.5">{label}</p>
      <p className={cn("mono-lg", accent ? "text-accent" : "text-text")}>{value}</p>
    </motion.div>
  )
}

function Table({ headers, rows }: { headers: string[]; rows: React.ReactNode[][] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr>
            {headers.map((h) => (
              <th key={h} className="text-left pb-2.5 pr-5 font-label text-text-muted">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-t border-border hover:bg-white/[0.02] transition-colors">
              {row.map((cell, j) => (
                <td key={j} className="py-2.5 pr-5 mono-data text-text">{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function Loading({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[300px]">
      <DotPulse />
      <p className="font-body-sm text-text-secondary mt-3">{text}</p>
    </div>
  )
}

function Empty({ title, description, action }: { title: string; description: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-center">
      <h2 className="font-heading text-text mb-1">{title}</h2>
      <p className="font-body text-text-secondary mb-5 max-w-xs">{description}</p>
      {action}
    </div>
  )
}

function Error({ title, message, onRetry }: { title: string; message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-center">
      <h2 className="font-heading text-text mb-1">{title}</h2>
      <p className="font-body text-text-secondary mb-5 max-w-xs">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="font-button text-accent hover:underline underline-offset-2">
          Retry
        </button>
      )}
    </div>
  )
}

/* ─── Inspector Panel ─── */

function InspectorPanel({
  data,
  isLoading,
  isError,
  error,
  onRetry,
  graphData,
  isGraphLoading,
  isGraphError,
  graphError,
  onRetryGraph,
  modelDownloadUrl,
}: {
  data?: SessionInspectResponse
  isLoading: boolean
  isError?: boolean
  error?: string
  onRetry?: () => void
  graphData?: SessionGraphResponse
  isGraphLoading: boolean
  isGraphError?: boolean
  graphError?: string
  onRetryGraph?: () => void
  modelDownloadUrl?: string | null
}) {
  if (isLoading) return <Loading text="Analyzing model..." />
  if (isError) return <Error title="Inspection failed" message={error ?? "An unexpected error occurred"} onRetry={onRetry} />
  if (!data) return <Empty title="No model data" description="Upload a model to see its structure." />

  const inputCount = data.inputTensors?.length ?? 0
  const outputCount = data.outputTensors?.length ?? 0
  const topOps = data.architecture?.topOperatorTypes ?? []
  const allWarnings = [...(data.warnings ?? []), ...(data.edgeHints?.warnings ?? [])]
  const edgeNotes = data.edgeHints?.notes ?? []
  const isQuantized = data.edgeHints?.quantized === true

  return (
    <div className="space-y-10">
      <motion.div variants={item} className="bg-surface rounded-lg px-6 py-4 flex items-center gap-5 flex-wrap">
        <div className="flex items-center gap-2.5 min-w-0">
          <HardDrive className="h-4 w-4 text-text-muted shrink-0" />
          <span className="mono-data text-text truncate max-w-[240px]">
            {data.graphName || data.fileName || "Model"}
          </span>
        </div>
        <Divider />
        <span className="mono-data text-text-secondary uppercase tracking-wide">{data.format}</span>
        <Divider />
        {data.fileSizeBytes != null && (
          <>
            <span className="mono-data text-text-secondary">{formatFileSize(data.fileSizeBytes)}</span>
            <Divider />
          </>
        )}
        {data.parameterCount != null && (
          <>
            <span className="mono-data text-text-secondary">{formatNumber(data.parameterCount)} params</span>
            <Divider />
          </>
        )}
        {data.operatorCount != null && (
          <>
            <span className="mono-data text-text-secondary">{data.operatorCount} ops</span>
            <Divider />
          </>
        )}
        <span className="mono-data text-text-muted">{inputCount} in / {outputCount} out</span>
        {isQuantized && (
          <>
            <Divider />
            <span className="mono-data text-accent uppercase tracking-wide">Quantized</span>
          </>
        )}
      </motion.div>

      <motion.div variants={item} className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h3 className="font-body text-text">Model Graph</h3>
          {modelDownloadUrl && (
            <a
              href={modelDownloadUrl}
              className="font-body-sm text-accent hover:underline underline-offset-2"
            >
              Download source model
            </a>
          )}
        </div>
        <div className="h-[600px] min-h-[420px] w-full overflow-hidden rounded-lg border border-border bg-canvas">
          {isGraphLoading && <Loading text="Preparing graph visualization..." />}
          {!isGraphLoading && isGraphError && (
            <Error
              title="Graph unavailable"
              message={graphError ?? "Unable to render model graph"}
              onRetry={onRetryGraph}
            />
          )}
          {!isGraphLoading && !isGraphError && graphData?.graphCollections?.length ? (
            <ModelExplorerViewer 
              graphCollections={graphData.graphCollections} 
              visualizerConfig={graphData.visualizerConfig} 
            />
          ) : null}
          {!isGraphLoading && !isGraphError && !graphData?.graphCollections?.length ? (
            <Empty title="No graph data" description="Graph data is unavailable for this model." />
          ) : null}
        </div>
      </motion.div>

      {allWarnings.length > 0 && (
        <motion.div variants={item} className="space-y-1.5">
          {allWarnings.map((w, i) => (
            <div key={i} className="flex items-start gap-2.5 py-2 px-3.5 rounded bg-warning/[0.06]">
              <AlertTriangle className="h-4 w-4 text-warning mt-0.5 shrink-0" />
              <span className="font-body-sm text-warning/90">{w}</span>
            </div>
          ))}
        </motion.div>
      )}

      {edgeNotes.length > 0 && (
        <motion.div variants={item} className="flex flex-wrap gap-2">
          {edgeNotes.map((note, i) => (
            <div key={i} className="flex items-center gap-2 py-1.5 px-3 rounded bg-white/[0.02]">
              <Info className="h-4 w-4 text-text-muted shrink-0" />
              <span className="font-body-sm text-text-secondary">{note}</span>
            </div>
          ))}
        </motion.div>
      )}

      {topOps.length > 0 && (
        <motion.div variants={item}>
          <h3 className="font-body text-text mb-4">Operator Frequency</h3>
          <div className="space-y-2">
            {topOps.slice(0, 8).map((op, i) => {
              const maxCount = topOps[0]?.count ?? 1
              const pct = (op.count / maxCount) * 100
              return (
                <div key={i} className="flex items-center gap-4 group">
                  <span className="mono-data text-accent w-28 truncate text-right">{op.opType}</span>
                  <div className="flex-1 h-2.5 bg-white/[0.03] rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-accent/30 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.5, delay: 0.03 * i }}
                    />
                  </div>
                  <span className="mono-data text-text-muted w-10 text-right font-body-sm">{op.count}</span>
                </div>
              )
            })}
          </div>
        </motion.div>
      )}

      <motion.div variants={item} className="flex gap-10">
        <Stat label="Layers" value={data.layerCount ?? "—"} />
        <Stat label="Operators" value={data.operatorCount ?? "—"} />
        <Stat label="Parameters" value={data.parameterCount ? formatNumber(data.parameterCount) : "—"} accent />
      </motion.div>

      {data.inputTensors?.length > 0 && (
        <div>
          <motion.h3 variants={item} className="font-body text-text mb-4">Input Tensors</motion.h3>
          <Table
            headers={["Name", "Dtype", "Shape"]}
            rows={data.inputTensors.map((t) => [
              t.name,
              <span key={t.name} className="text-accent">{t.dtype}</span>,
              <ShapeDisplay key={t.name + "-shape"} shape={t.shape} />,
            ])}
          />
        </div>
      )}

      {data.outputTensors?.length > 0 && (
        <div>
          <motion.h3 variants={item} className="font-body text-text mb-4">Output Tensors</motion.h3>
          <Table
            headers={["Name", "Dtype", "Shape"]}
            rows={data.outputTensors.map((t) => [
              t.name,
              <span key={t.name} className="text-accent">{t.dtype}</span>,
              <ShapeDisplay key={t.name + "-shape"} shape={t.shape} />,
            ])}
          />
        </div>
      )}

      {data.operators?.length > 0 && (
        <div>
          <motion.h3 variants={item} className="font-body text-text mb-4">
            Operators <span className="text-text-muted font-body-sm">({data.operators.length})</span>
          </motion.h3>
          <div className="max-h-[min(52vh,560px)] overflow-y-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="text-left pb-2.5 pr-5 font-label text-text-muted w-14">#</th>
                  <th className="text-left pb-2.5 pr-5 font-label text-text-muted">Type</th>
                  <th className="text-left pb-2.5 pr-5 font-label text-text-muted">Name</th>
                </tr>
              </thead>
              <tbody>
                {data.operators.map((op, i) => (
                  <tr key={i} className="border-t border-border hover:bg-white/[0.02] transition-colors">
                    <td className="py-2 pr-5 mono-data text-text-muted">{op.index}</td>
                    <td className="py-2 pr-5 mono-data text-accent">{op.opType}</td>
                    <td className="py-2 pr-5 mono-data text-text">{op.name ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

function Divider() {
  return <div className="w-px h-4 bg-border self-center" />
}

/* ─── Evaluator Panel ─── */

function EvaluatorPanel({ data, isLoading, onRun, isRunning, isError, error, onRetry }: {
  data?: SessionEvaluateResponse | null; isLoading: boolean; onRun: () => void; isRunning: boolean; isError?: boolean; error?: string; onRetry?: () => void
}) {
  if (isLoading) return <Loading text="Loading evaluation..." />
  if (isError) return <Error title="Evaluation failed" message={error ?? "An unexpected error occurred"} onRetry={onRetry} />

  if (!data) {
    return (
      <Empty
        title="No evaluation yet"
        description="Run an evaluation to see performance metrics."
        action={
          <button
            onClick={onRun}
            disabled={isRunning}
            className="font-button text-accent hover:underline underline-offset-2 disabled:opacity-40"
          >
            {isRunning ? "Running..." : "Run Evaluation"}
          </button>
        }
      />
    )
  }

  return (
    <div className="space-y-10">
      <motion.div variants={item} className="flex items-center justify-between">
        <div>
          <h2 className="font-heading text-text">Evaluation</h2>
          <p className="font-body-sm text-text-secondary mt-0.5">Model performance metrics</p>
        </div>
        <button
          onClick={onRun}
          disabled={isRunning}
          className="font-button text-text-secondary hover:text-text disabled:opacity-40 transition-colors"
        >
          {isRunning ? "Running..." : "Re-run"}
        </button>
      </motion.div>

      <motion.div variants={item} className="flex gap-10">
        <Stat label="Accuracy" value={`${(data.accuracy * 100).toFixed(1)}%`} accent />
        <Stat label="Precision" value={data.precision.toFixed(3)} />
        <Stat label="Recall" value={data.recall.toFixed(3)} />
        <Stat label="F1" value={data.f1Score.toFixed(3)} />
      </motion.div>

      {data.perClassMetrics?.length > 0 && (
        <div>
          <motion.h3 variants={item} className="font-body text-text mb-4">Per-Class Metrics</motion.h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="text-left pb-2.5 pr-5 font-label text-text-muted">Class</th>
                  <th className="text-left pb-2.5 pr-5 font-label text-text-muted">Precision</th>
                  <th className="text-left pb-2.5 pr-5 font-label text-text-muted">Recall</th>
                  <th className="text-left pb-2.5 pr-5 font-label text-text-muted">F1</th>
                  <th className="text-left pb-2.5 pr-5 font-label text-text-muted">Support</th>
                </tr>
              </thead>
              <tbody>
                {data.perClassMetrics.map((m, i) => (
                  <motion.tr key={i} variants={item} className="border-t border-border hover:bg-white/[0.02] transition-colors">
                    <td className="py-2.5 pr-5 mono-data text-text">{m.className}</td>
                    <td className="py-2.5 pr-5 mono-data text-text-secondary">{m.precision.toFixed(3)}</td>
                    <td className="py-2.5 pr-5 mono-data text-text-secondary">{m.recall.toFixed(3)}</td>
                    <td className={cn("py-2.5 pr-5 mono-data", m.f1 >= 0.8 ? "text-success" : m.f1 >= 0.5 ? "text-warning" : "text-error")}>
                      {m.f1.toFixed(3)}
                    </td>
                    <td className="py-2.5 pr-5 mono-data text-text-secondary">{m.support}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {data.provenance === "simulated" && (
        <motion.p variants={item} className="font-body-sm text-text-muted">
          Simulated evaluation — no real dataset provided.
        </motion.p>
      )}
    </div>
  )
}

/* ─── Failures Panel ─── */

function FailuresPanel({ data, isLoading, hasEvaluation, isError, error, onRetry }: {
  data?: SessionFailuresResponse | null; isLoading: boolean; hasEvaluation: boolean; isError?: boolean; error?: string; onRetry?: () => void
}) {
  if (isLoading) return <Loading text="Loading failures..." />
  if (isError) return <Error title="Failed to load" message={error ?? "An unexpected error occurred"} onRetry={onRetry} />

  if (!hasEvaluation) {
    return <Empty title="No failure data" description="Run an evaluation first to see failure analysis." />
  }

  if (!data) return null

  return (
    <div className="space-y-10">
      <motion.div variants={item}>
        <h2 className="font-heading text-text">Failures</h2>
        <p className="font-body-sm text-text-secondary mt-0.5">Misclassification analysis</p>
      </motion.div>

      <motion.div variants={item} className="flex gap-10">
        <Stat label="Failures" value={data.totalFailures} />
        <Stat label="Accuracy" value={data.accuracy ? `${(data.accuracy * 100).toFixed(1)}%` : "—"} accent />
      </motion.div>

      {data.topConfusedPairs?.length > 0 && (
        <div>
          <motion.h3 variants={item} className="font-body text-text mb-4">Confused Pairs</motion.h3>
          <div className="space-y-1">
            {data.topConfusedPairs.map((p, i) => (
              <motion.div
                key={i}
                variants={item}
                className="flex items-center justify-between py-2 border-b border-border group"
              >
                <div className="flex items-center gap-2">
                  <span className="mono-data text-text">{p.trueLabel}</span>
                  <span className="text-text-ghost font-body-sm">→</span>
                  <span className="mono-data text-error">{p.predictedLabel}</span>
                </div>
                <span className="mono-data text-text-muted">{p.count}</span>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {data.samples?.length > 0 && (
        <div>
          <motion.h3 variants={item} className="font-body text-text mb-4">Samples</motion.h3>
          <div className="max-h-[min(52vh,560px)] overflow-y-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="text-left pb-2.5 pr-5 font-label text-text-muted w-14">#</th>
                  <th className="text-left pb-2.5 pr-5 font-label text-text-muted">Predicted</th>
                  <th className="text-left pb-2.5 pr-5 font-label text-text-muted">Actual</th>
                  <th className="text-left pb-2.5 pr-5 font-label text-text-muted">Confidence</th>
                </tr>
              </thead>
              <tbody>
                {data.samples.map((s, i) => (
                  <tr key={i} className="border-t border-border hover:bg-white/[0.02] transition-colors">
                    <td className="py-2 pr-5 mono-data text-text-muted">{s.rank}</td>
                    <td className="py-2 pr-5 mono-data text-error">{s.predictedLabel}</td>
                    <td className="py-2 pr-5 mono-data text-text">{s.actualLabel}</td>
                    <td className="py-2 pr-5 mono-data text-text-secondary">{(s.confidence * 100).toFixed(0)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {data.provenance === "simulated" && (
        <motion.p variants={item} className="font-body-sm text-text-muted">
          Simulated failure analysis.
        </motion.p>
      )}
    </div>
  )
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return n.toString()
}

function formatFileSize(bytes: number): string {
  if (bytes >= 1_048_576) return `${(bytes / 1_048_576).toFixed(1)} MB`
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${bytes} B`
}

function ShapeDisplay({ shape }: { shape: (string | number | null)[] }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {shape.map((dim, i) => (
        <span key={i} className="flex items-center gap-0.5">
          {i > 0 && <span className="text-text-ghost font-body-sm">×</span>}
          <span className={cn(
            "mono-data px-1.5 py-0.5 rounded",
            dim === null || typeof dim === "string"
              ? "text-warning bg-warning/[0.08]"
              : "text-text-secondary"
          )}>
            {dim === null ? "?" : dim}
          </span>
        </span>
      ))}
    </span>
  )
}
