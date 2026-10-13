import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

const VALID_SEVERITIES = ["mild", "moderate", "severe", "none"] as const;

// GET /api/symptoms?patientId=xxx - List symptoms for a patient
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get("patientId");

    if (!patientId) {
      return NextResponse.json(
        { error: "patientId query parameter is required" },
        { status: 400 }
      );
    }

    const symptoms = await db.symptomEntry.findMany({
      where: { patientId },
      orderBy: { dateReported: "desc" },
    });

    return NextResponse.json(symptoms);
  } catch (error) {
    console.error("Error fetching symptoms:", error);
    return NextResponse.json(
      { error: "Failed to fetch symptoms" },
      { status: 500 }
    );
  }
}

// POST /api/symptoms - Create a symptom entry
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { patientId, symptomName, severity, notes, category } = body;

    if (!patientId) {
      return NextResponse.json(
        { error: "patientId is required" },
        { status: 400 }
      );
    }

    if (!symptomName || typeof symptomName !== "string" || symptomName.trim().length === 0) {
      return NextResponse.json(
        { error: "symptomName is required" },
        { status: 400 }
      );
    }

    // Verify patient exists
    const patient = await db.patient.findUnique({ where: { id: patientId } });
    if (!patient) {
      return NextResponse.json(
        { error: "Patient not found" },
        { status: 404 }
      );
    }

    const validatedSeverity = VALID_SEVERITIES.includes(severity) ? severity : "mild";

    const symptom = await db.symptomEntry.create({
      data: {
        patientId,
        symptomName: symptomName.trim(),
        severity: validatedSeverity,
        notes: notes || null,
        category: category || null,
      },
    });

    return NextResponse.json(symptom, { status: 201 });
  } catch (error) {
    console.error("Error creating symptom:", error);
    return NextResponse.json(
      { error: "Failed to create symptom" },
      { status: 500 }
    );
  }
}

// DELETE /api/symptoms?id=xxx - Delete symptom by ID
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "id query parameter is required" },
        { status: 400 }
      );
    }

    const existing = await db.symptomEntry.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Symptom not found" },
        { status: 404 }
      );
    }

    await db.symptomEntry.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting symptom:", error);
    return NextResponse.json(
      { error: "Failed to delete symptom" },
      { status: 500 }
    );
  }
}
