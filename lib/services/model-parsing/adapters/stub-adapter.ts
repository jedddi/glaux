import type { ParsedModelResult } from "@/lib/schemas/model"

export type ParseAdapterInput = {
  format: "onnx" | "tflite"
  fileName: string
  fileSizeBytes: number
  buffer: Buffer
}

export type ParseAdapter = (input: ParseAdapterInput) => Promise<ParsedModelResult>

export async function stubAdapter(input: ParseAdapterInput): Promise<ParsedModelResult> {
  return {
    format: input.format,
    fileSizeBytes: input.fileSizeBytes,
    layerCount: null,
    operatorCount: null,
    inputs: [],
    outputs: [],
    operators: [],
    architecture: {
      graphName: null,
      topOperatorTypes: [],
      raw: { stub: true },
    },
    tfliteMetadata: null,
    edgeHints: input.format === "tflite"
      ? {
          quantized: null,
          hasMetadata: null,
          notes: ["TFLite parsing is not yet fully implemented."],
          warnings: [],
        }
      : null,
  }
}
