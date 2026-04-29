import { NextResponse } from "next/server"
import { ZodError } from "zod"
import { createServerSupabase } from "@/lib/supabase/server"
import { uploadSchema } from "@/lib/schemas/project"

function buildStoragePath(projectId: string, fileName: string) {
  const extension = fileName.toLowerCase().endsWith(".tflite") ? ".tflite" : ".onnx"
  const baseName = fileName
    .slice(0, -extension.length)
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80)

  const safeName = `${baseName || "model"}-${Date.now()}-${crypto.randomUUID()}${extension}`
  return `${projectId}/${safeName}`
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get("file")
    const projectId = formData.get("project_id")

    if (!(file instanceof File) || typeof projectId !== "string") {
      return NextResponse.json(
        { error: "File and project_id are required" },
        { status: 400 }
      )
    }

    const validated = uploadSchema.parse({
      project_id: projectId,
      file_name: file.name,
      file_size: file.size,
      file_type: file.type || "application/octet-stream",
    })

    const supabase = await createServerSupabase()
    const storagePath = buildStoragePath(validated.project_id, validated.file_name)

    const { data: project, error: projectLookupError } = await supabase
      .from("projects")
      .select("id")
      .eq("id", validated.project_id)
      .single()

    if (projectLookupError || !project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      )
    }

    await supabase
      .from("projects")
      .update({ status: "uploading" })
      .eq("id", validated.project_id)

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("models")
      .upload(storagePath, file, {
        cacheControl: "3600",
        contentType: validated.file_type,
        upsert: false,
      })

    if (uploadError) {
      await supabase
        .from("projects")
        .update({ status: "failed" })
        .eq("id", validated.project_id)

      return NextResponse.json(
        { error: uploadError.message },
        { status: 500 }
      )
    }

    const { data: assetData, error: assetError } = await supabase
      .from("model_assets")
      .insert({
        project_id: validated.project_id,
        file_name: validated.file_name,
        file_path: uploadData.path,
        file_size: validated.file_size,
        file_type: validated.file_type,
        storage_bucket: "models",
      })
      .select()
      .single()

    if (assetError) {
      await supabase.storage.from("models").remove([uploadData.path])
      await supabase
        .from("projects")
        .update({ status: "failed" })
        .eq("id", validated.project_id)

      return NextResponse.json(
        { error: assetError.message },
        { status: 500 }
      )
    }

    const { data: projectData, error: projectError } = await supabase
      .from("projects")
      .update({ status: "analyzing" })
      .eq("id", validated.project_id)
      .select()
      .single()

    if (projectError) {
      return NextResponse.json(
        { error: projectError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      asset: assetData,
      project: projectData,
      path: uploadData.path,
    })
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload failed" },
      { status: 500 }
    )
  }
}
