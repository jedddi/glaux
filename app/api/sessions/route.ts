import { NextResponse } from "next/server"
import { randomUUID } from "crypto"

export async function POST() {
  const sessionId = randomUUID()
  return NextResponse.json({ sessionId })
}
