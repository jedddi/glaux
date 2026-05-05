import type { ParseAdapter, ParseAdapterInput } from "./stub-adapter"
import type { ParsedModelResult } from "@/lib/schemas/model"

export const tfliteAdapter: ParseAdapter = async (input: ParseAdapterInput): Promise<ParsedModelResult> => {
  // TODO: Replace with real TFLite parsing (e.g., via Python microservice or tflite parser)
  // For now, return a stub result that preserves file metadata.
  return {
    format: "tflite",
    fileSizeBytes: input.fileSizeBytes,
    layerCount: null,
    operatorCount: null,
    inputs: [],
    outputs: [],
    operators: [],
    architecture: {
      graphName: null,
      topOperatorTypes: [],
      raw: { stub: true, note: "TFLite adapter not yet implemented" },
    },
    tfliteMetadata: null,
    edgeHints: {
      quantized: null,
      hasMetadata: null,
      notes: ["TFLite parsing is not yet fully implemented."],
      warnings: [],
    },
  }
}
