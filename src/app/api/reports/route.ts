import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/reports?patientId=xxx - List reports for a patient
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

    const reports = await db.medicalReport.findMany({
      where: { patientId },
      include: {
        labValues: {
          orderBy: { testName: "asc" },
        },
      },
      orderBy: { reportDate: "desc" },
    });

    return NextResponse.json(reports);
  } catch (error) {
    console.error("Error fetching reports:", error);
    return NextResponse.json(
      { error: "Failed to fetch reports" },
      { status: 500 }
    );
  }
}

// POST /api/reports - Create a new report with optional lab values
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { patientId, reportDate, reportType, notes, labValues } = body;

    if (!patientId) {
      return NextResponse.json(
        { error: "patientId is required" },
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

    const report = await db.medicalReport.create({
      data: {
        patientId,
        reportDate: reportDate ? new Date(reportDate) : new Date(),
        reportType: reportType || "general",
        notes: notes || null,
        labValues: labValues && Array.isArray(labValues)
          ? {
              create: labValues.map((lv: {
                testName: string;
                result?: number;
                unit?: string;
                referenceLow?: number;
                referenceHigh?: number;
                referenceText?: string;
                category?: string;
                confidence?: number;
              }) => {
                const isAbnormal =
                  lv.result !== undefined &&
                  lv.result !== null &&
                  ((lv.referenceLow !== undefined && lv.referenceLow !== null && lv.result < lv.referenceLow) ||
                   (lv.referenceHigh !== undefined && lv.referenceHigh !== null && lv.result > lv.referenceHigh));

                return {
                  testName: lv.testName,
                  result: lv.result ?? null,
                  unit: lv.unit || null,
                  referenceLow: lv.referenceLow ?? null,
                  referenceHigh: lv.referenceHigh ?? null,
                  referenceText: lv.referenceText || null,
                  isAbnormal,
                  confidence: lv.confidence ?? null,
                  category: lv.category || null,
                };
              }),
            }
          : undefined,
      },
      include: {
        labValues: true,
      },
    });

    return NextResponse.json(report, { status: 201 });
  } catch (error) {
    console.error("Error creating report:", error);
    return NextResponse.json(
      { error: "Failed to create report" },
      { status: 500 }
    );
  }
}
