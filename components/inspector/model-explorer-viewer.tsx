"use client"

import { useEffect, useMemo, useRef } from "react"
import type { SessionGraphResponse } from "@/lib/schemas/session"

type GraphCollections = SessionGraphResponse["graphCollections"]
type VisualizerConfig = SessionGraphResponse["visualizerConfig"]

export function ModelExplorerViewer({ graphCollections, visualizerConfig }: { graphCollections: GraphCollections; visualizerConfig?: VisualizerConfig }) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null)
  const frameSrcDoc = useMemo(
    () => `
<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      html, body {
        margin: 0;
        padding: 0;
        width: 100%;
        height: 100%;
        overflow: hidden;
        background: #ffffff;
        color: #111111;
      }
      #root {
        width: 100%;
        height: 100%;
      }
      model-explorer-visualizer {
        display: block;
        width: 100%;
        height: 100%;
        background: #ffffff;
      }
    </style>
    <script src="/model-explorer/main_browser.js"></script>
  </head>
  <body>
    <div id="root"></div>
    <script>
      (function() {
        window.modelExplorer = window.modelExplorer || {};
        window.modelExplorer.assetFilesBaseUrl = "/model-explorer/static_files";
        window.modelExplorer.workerScriptPath = "/model-explorer/worker.js";

        const root = document.getElementById("root");
        const visualizer = document.createElement("model-explorer-visualizer");
        root.appendChild(visualizer);

        window.addEventListener("message", function(event) {
          if (!event || !event.data) return;

          if (event.data.type === "glaux:set-graph-collections") {
            visualizer.graphCollections = event.data.payload.graphCollections || [];
            if (event.data.payload.config) {
              visualizer.config = event.data.payload.config;
            }
          }
        });
      })();
    </script>
  </body>
</html>
`.trim(),
    []
  )

  useEffect(() => {
    const iframe = iframeRef.current
    if (!iframe) return

    const postGraph = () => {
      iframe.contentWindow?.postMessage(
        {
          type: "glaux:set-graph-collections",
          payload: {
            graphCollections,
            config: visualizerConfig,
          },
        },
        "*"
      )
    }

    postGraph()
    iframe.addEventListener("load", postGraph)
    return () => iframe.removeEventListener("load", postGraph)
  }, [graphCollections, visualizerConfig])

  return (
    <iframe
      ref={iframeRef}
      title="Model Explorer"
      srcDoc={frameSrcDoc}
      className="h-full w-full border-0"
      style={{
        filter: "invert(1) hue-rotate(180deg)",
      }}
      sandbox="allow-scripts allow-same-origin"
    />
  )
}
