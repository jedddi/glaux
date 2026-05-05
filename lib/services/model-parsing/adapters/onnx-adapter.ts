import type { ParseAdapter, ParseAdapterInput } from "./stub-adapter"
import type { ParsedModelResult } from "@/lib/schemas/model"

export const onnxAdapter: ParseAdapter = async (input: ParseAdapterInput): Promise<ParsedModelResult> => {
  // TODO: Replace with real ONNX parsing (e.g., via Python microservice or onnxruntime)
  // For now, return a stub result that preserves file metadata.
  return {
    format: "onnx",
    fileSizeBytes: input.fileSizeBytes,
    layerCount: null,
    operatorCount: null,
    inputs: [],
    outputs: [],
    operators: [],
    architecture: {
      graphName: null,
      topOperatorTypes: [],
      raw: { stub: true, note: "ONNX adapter not yet implemented" },
    },
    tfliteMetadata: null,
    edgeHints: null,
  }
}
