import { NextResponse } from "next/server"
import { getProjectModels } from "@/lib/services/projects"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const models = await getProjectModels(id)
    return NextResponse.json(models)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch models" },
      { status: 500 }
    )
  }
}