import { NextResponse } from "next/server"
import { ZodError } from "zod"
import { getProjects, createProject } from "@/lib/services/projects"
import { projectFormSchema } from "@/lib/schemas/project"

export async function GET() {
  try {
    const projects = await getProjects()
    return NextResponse.json(projects)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch projects" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const validated = projectFormSchema.parse(body)
    const project = await createProject(validated)
    return NextResponse.json(project, { status: 201 })
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create project" },
      { status: 500 }
    )
  }
}
