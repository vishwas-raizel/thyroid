import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/patients - List all patients with report counts
export async function GET() {
  try {
    const patients = await db.patient.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { reports: true },
        },
      },
    });

    return NextResponse.json(patients);
  } catch (error) {
    console.error("Error fetching patients:", error);
    return NextResponse.json(
      { error: "Failed to fetch patients" },
      { status: 500 }
    );
  }
}

// POST /api/patients - Create a new patient
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    // Accept both "phone" (frontend) and "phoneNumber" field names
    const {
      name, age, gender, email, medicalHistory, notes,
      weight, height, bmi, bloodPressureSystolic, bloodPressureDiastolic,
      fastingBloodSugar, menstrualCycleLength, menstrualRegularity,
      hairGrowthPattern, skinDarkening, follicleCount, insulinResistance,
    } = body;
    const phoneNumber = body.phone || body.phoneNumber;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }

    if (age === undefined || age === null || typeof age !== "number" || age < 0 || age > 150) {
      return NextResponse.json(
        { error: "Valid age is required (0-150)" },
        { status: 400 }
      );
    }

    const patient = await db.patient.create({
      data: {
        name: name.trim(),
        age,
        gender: gender || "Female",
        phoneNumber: phoneNumber || null,
        email: email || null,
        medicalHistory: medicalHistory || null,
        notes: notes || null,
        weight: weight != null ? Number(weight) : null,
        height: height != null ? Number(height) : null,
        bmi: bmi != null ? Number(bmi) : null,
        bloodPressureSystolic: bloodPressureSystolic != null ? Number(bloodPressureSystolic) : null,
        bloodPressureDiastolic: bloodPressureDiastolic != null ? Number(bloodPressureDiastolic) : null,
        fastingBloodSugar: fastingBloodSugar != null ? Number(fastingBloodSugar) : null,
        menstrualCycleLength: menstrualCycleLength != null ? Number(menstrualCycleLength) : null,
        menstrualRegularity: menstrualRegularity || null,
        hairGrowthPattern: hairGrowthPattern || null,
        skinDarkening: skinDarkening || null,
        follicleCount: follicleCount != null ? Number(follicleCount) : null,
        insulinResistance: insulinResistance || null,
      },
    });

    return NextResponse.json(patient, { status: 201 });
  } catch (error) {
    console.error("Error creating patient:", error);
    return NextResponse.json(
      { error: "Failed to create patient" },
      { status: 500 }
    );
  }
}
