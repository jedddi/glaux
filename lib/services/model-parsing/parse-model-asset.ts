// LEGACY: not used in the ephemeral flow
import { createServerSupabase } from "@/lib/supabase/server"
import type { ParsedModelResult } from "@/lib/schemas/model"
import { modelAssetSchema } from "@/lib/schemas/model"
import { fastapiPost } from "@/lib/server/fastapi-client"
import { inspectionResultSchema, type InspectionResult } from "@/lib/schemas/execution"
import { onnxAdapter } from "./adapters/onnx-adapter"
import { tfliteAdapter } from "./adapters/tflite-adapter"
import { stubAdapter } from "./adapters/stub-adapter"

const adapters = {
  onnx: onnxAdapter,
  tflite: tfliteAdapter,
}

function snakeToCamel(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase())
}

function convertKeysToCamel(obj: unknown): unknown {
  if (Array.isArray(obj)) {
    return obj.map(convertKeysToCamel)
  }
  if (obj !== null && typeof obj === "object") {
    return Object.fromEntries(
      Object.entries(obj as Record<string, unknown>).map(([key, value]) => [
        snakeToCamel(key),
        convertKeysToCamel(value),
      ])
    )
  }
  return obj
}

function inspectionResultToParsedModel(result: InspectionResult): ParsedModelResult {
  const format: "onnx" | "tflite" = result.format === "tflite" ? "tflite" : "onnx"

  return {
    format,
    fileSizeBytes: result.fileSizeBytes ?? null,
    layerCount: result.layerCount ?? null,
    operatorCount: result.operatorCount ?? null,
    inputs: (result.inputTensors ?? []).map((tensor) => ({
      name: tensor.name,
      dtype: tensor.dtype ?? null,
      shape: tensor.shape,
    })),
    outputs: (result.outputTensors ?? []).map((tensor) => ({
      name: tensor.name,
      dtype: tensor.dtype ?? null,
      shape: tensor.shape,
    })),
    operators: (result.operators ?? []).map((operator) => ({
      index: operator.index,
      name: operator.name ?? null,
      opType: operator.opType,
      inputs: operator.inputs ?? [],
      outputs: operator.outputs ?? [],
    })),
    architecture: {
      graphName: result.architecture?.graphName ?? null,
      topOperatorTypes: result.architecture?.topOperatorTypes ?? [],
    },
    tfliteMetadata: result.tfliteMetadata ?? null,
    edgeHints: result.edgeHints
      ? {
          quantized: result.edgeHints.quantized ?? null,
          hasMetadata: result.edgeHints.hasMetadata ?? null,
          notes: result.edgeHints.notes ?? [],
          warnings: result.edgeHints.warnings ?? [],
        }
      : null,
  }
}

async function tryFastAPIInspection(
  projectId: string,
  asset: ReturnType<typeof modelAssetSchema.parse>
): Promise<ParsedModelResult | null> {
  const supabase = await createServerSupabase()
  const { data: signedUrlData, error: signedUrlError } = await supabase.storage
    .from(asset.storage_bucket)
    .createSignedUrl(asset.file_path, 120)

  if (signedUrlError || !signedUrlData?.signedUrl) {
    return null
  }

  const response = await fastapiPost<Record<string, unknown>>("/inspect", {
    project_id: projectId,
    model_asset_id: asset.id ?? null,
    model_format: asset.format ?? null,
    file_name: asset.file_name,
    model_download_url: signedUrlData.signedUrl,
  })

  const jobData = ((response.job as Record<string, unknown> | undefined) ?? response)
  const jobStatus = typeof jobData.status === "string" ? jobData.status : null
  if (jobStatus === "failed") {
    const errorMessage =
      typeof jobData.error_message === "string"
        ? jobData.error_message
        : typeof jobData.errorMessage === "string"
          ? jobData.errorMessage
          : "FastAPI inspection failed"
    throw new Error(errorMessage)
  }

  const inspectionResultRaw =
    (jobData.inspection_result as Record<string, unknown> | undefined) ??
    (jobData.result_summary as Record<string, unknown> | undefined)

  if (!inspectionResultRaw) {
    throw new Error("FastAPI returned no inspection_result payload")
  }

  const camel = convertKeysToCamel(inspectionResultRaw)
  const inspectionResult = inspectionResultSchema.parse(camel)
  return inspectionResultToParsedModel(inspectionResult)
}

export async function parseModelAsset(modelAssetId: string): Promise<ParsedModelResult> {
  const supabase = await createServerSupabase()

  const { data: assetRow, error: assetError } = await supabase
    .from("model_assets")
    .select("*")
    .eq("id", modelAssetId)
    .single()

  if (assetError || !assetRow) {
    throw new Error("MODEL_ASSET_NOT_FOUND")
  }

  const asset = modelAssetSchema.parse(assetRow)
  const projectId = asset.project_id

  const format = asset.format ?? (asset.file_name.toLowerCase().endsWith(".tflite") ? "tflite" : "onnx")

  // Primary path: real parsing via FastAPI execution service.
  const fastapiResult = await tryFastAPIInspection(projectId, asset)
  if (fastapiResult) {
    return fastapiResult
  }

  // Fallback path: local adapter parsing.
  const { data: fileData, error: downloadError } = await supabase.storage
    .from(asset.storage_bucket)
    .download(asset.file_path)

  if (downloadError || !fileData) {
    throw new Error("FILE_DOWNLOAD_FAILED")
  }

  const arrayBuffer = await fileData.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  const adapter = adapters[format] ?? stubAdapter

  const result = await adapter({
    format,
    fileName: asset.file_name,
    fileSizeBytes: asset.file_size,
    buffer,
  })

  return result
}
