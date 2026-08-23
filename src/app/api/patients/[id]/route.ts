import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

type RouteContext = {
  params: Promise<{ id: string }>;
};

// GET /api/patients/[id] - Get a single patient with full details
export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;

    const patient = await db.patient.findUnique({
      where: { id },
      include: {
        reports: {
          include: {
            labValues: true,
          },
          orderBy: { reportDate: "desc" },
        },
        symptoms: {
          orderBy: { dateReported: "desc" },
        },
        screeningResults: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!patient) {
      return NextResponse.json(
        { error: "Patient not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(patient);
  } catch (error) {
    console.error("Error fetching patient:", error);
    return NextResponse.json(
      { error: "Failed to fetch patient" },
      { status: 500 }
    );
  }
}

// PUT /api/patients/[id] - Update a patient
export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await request.json();

    const existing = await db.patient.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Patient not found" },
        { status: 404 }
      );
    }

    const {
      name,
      age,
      gender,
      email,
      medicalHistory,
      notes,
      weight,
      height,
      bmi,
      bloodPressureSystolic,
      bloodPressureDiastolic,
      fastingBloodSugar,
      menstrualCycleLength,
      menstrualRegularity,
      hairGrowthPattern,
      skinDarkening,
      follicleCount,
      insulinResistance,
    } = body;
    // Accept both "phone" (frontend) and "phoneNumber" field names
    const phoneNumber = body.phone || body.phoneNumber;

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = String(name).trim();
    if (age !== undefined) updateData.age = Number(age);
    if (gender !== undefined) updateData.gender = String(gender);
    if (phoneNumber !== undefined) updateData.phoneNumber = phoneNumber || null;
    if (email !== undefined) updateData.email = email || null;
    if (medicalHistory !== undefined) updateData.medicalHistory = medicalHistory || null;
    if (notes !== undefined) updateData.notes = notes || null;
    // Physical vitals
    if (weight !== undefined) updateData.weight = weight != null ? Number(weight) : null;
    if (height !== undefined) updateData.height = height != null ? Number(height) : null;
    if (bmi !== undefined) updateData.bmi = bmi != null ? Number(bmi) : null;
    if (bloodPressureSystolic !== undefined)
      updateData.bloodPressureSystolic = bloodPressureSystolic != null ? Number(bloodPressureSystolic) : null;
    if (bloodPressureDiastolic !== undefined)
      updateData.bloodPressureDiastolic = bloodPressureDiastolic != null ? Number(bloodPressureDiastolic) : null;
    if (fastingBloodSugar !== undefined)
      updateData.fastingBloodSugar = fastingBloodSugar != null ? Number(fastingBloodSugar) : null;
    // Reproductive / PCOS indicators
    if (menstrualCycleLength !== undefined)
      updateData.menstrualCycleLength = menstrualCycleLength != null ? Number(menstrualCycleLength) : null;
    if (menstrualRegularity !== undefined)
      updateData.menstrualRegularity = menstrualRegularity || null;
    if (hairGrowthPattern !== undefined)
      updateData.hairGrowthPattern = hairGrowthPattern || null;
    if (skinDarkening !== undefined)
      updateData.skinDarkening = skinDarkening || null;
    if (follicleCount !== undefined)
      updateData.follicleCount = follicleCount != null ? Number(follicleCount) : null;
    if (insulinResistance !== undefined)
      updateData.insulinResistance = insulinResistance || null;

    const patient = await db.patient.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(patient);
  } catch (error) {
    console.error("Error updating patient:", error);
    return NextResponse.json(
      { error: "Failed to update patient" },
      { status: 500 }
    );
  }
}

// DELETE /api/patients/[id] - Delete a patient and all related data
export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;

    const existing = await db.patient.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Patient not found" },
        { status: 404 }
      );
    }

    // Cascading delete will handle related records via onDelete: Cascade
    await db.patient.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting patient:", error);
    return NextResponse.json(
      { error: "Failed to delete patient" },
      { status: 500 }
    );
  }
}
