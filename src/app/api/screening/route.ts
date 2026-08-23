import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { screenThyroid, screenPCOS, screenCombined } from "@/lib/screening-engine";
import type { LabValue, SymptomEntry } from "@/lib/types";

// POST /api/screening - Run screening for a patient
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { patientId, reportId } = body;

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

    // Fetch lab values - from specific report or all reports
    const labValuesFromDb = await db.labValue.findMany({
      where: reportId
        ? { reportId }
        : {
            report: { patientId },
          },
      include: {
        report: {
          select: { id: true, patientId: true },
        },
      },
    });

    // Verify the report belongs to the patient if reportId was specified
    if (reportId) {
      const report = await db.medicalReport.findUnique({
        where: { id: reportId },
        select: { patientId: true },
      });
      if (!report || report.patientId !== patientId) {
        return NextResponse.json(
          { error: "Report not found or does not belong to patient" },
          { status: 404 }
        );
      }
    }

    // Fetch symptoms
    const symptomsFromDb = await db.symptomEntry.findMany({
      where: { patientId },
    });

    // Map DB records to the type format expected by screening engine
    const labValues: LabValue[] = labValuesFromDb.map((lv) => ({
      id: lv.id,
      reportId: lv.reportId,
      testName: lv.testName,
      result: lv.result ?? undefined,
      unit: lv.unit ?? undefined,
      referenceLow: lv.referenceLow ?? undefined,
      referenceHigh: lv.referenceHigh ?? undefined,
      referenceText: lv.referenceText ?? undefined,
      isAbnormal: lv.isAbnormal,
      confidence: lv.confidence ?? undefined,
      isVerified: lv.isVerified,
      category: lv.category ?? undefined,
      createdAt: lv.createdAt.toISOString(),
    }));

    const symptoms: SymptomEntry[] = symptomsFromDb.map((s) => ({
      id: s.id,
      patientId: s.patientId,
      symptomName: s.symptomName,
      severity: s.severity as SymptomEntry["severity"],
      dateReported: s.dateReported.toISOString(),
      notes: s.notes ?? undefined,
      category: s.category ?? undefined,
      createdAt: s.createdAt.toISOString(),
      updatedAt: s.updatedAt.toISOString(),
    }));

    if (labValues.length === 0 && symptoms.length === 0) {
      return NextResponse.json(
        { error: "No lab values or symptoms found for screening" },
        { status: 400 }
      );
    }

    // Run all three screening analyses
    const thyroidResult = screenThyroid(labValues, symptoms);
    const pcosResult = screenPCOS(labValues, symptoms);
    const combinedResult = screenCombined(thyroidResult, pcosResult);

    // Save all three results to the database
    const savedResults = await db.screeningResult.createMany({
      data: [
        {
          patientId,
          reportId: reportId || null,
          condition: thyroidResult.condition,
          riskLevel: thyroidResult.riskLevel,
          riskScore: thyroidResult.riskScore,
          confidence: thyroidResult.confidence,
          factors: JSON.stringify(thyroidResult.factors),
          summary: thyroidResult.summary,
          dataQuality: thyroidResult.dataQuality,
          missingData: JSON.stringify(thyroidResult.missingData),
        },
        {
          patientId,
          reportId: reportId || null,
          condition: pcosResult.condition,
          riskLevel: pcosResult.riskLevel,
          riskScore: pcosResult.riskScore,
          confidence: pcosResult.confidence,
          factors: JSON.stringify(pcosResult.factors),
          summary: pcosResult.summary,
          dataQuality: pcosResult.dataQuality,
          missingData: JSON.stringify(pcosResult.missingData),
        },
        {
          patientId,
          reportId: reportId || null,
          condition: combinedResult.condition,
          riskLevel: combinedResult.riskLevel,
          riskScore: combinedResult.riskScore,
          confidence: combinedResult.confidence,
          factors: JSON.stringify(combinedResult.factors),
          summary: combinedResult.summary,
          dataQuality: combinedResult.dataQuality,
          missingData: JSON.stringify(combinedResult.missingData),
        },
      ],
    });

    // Fetch the saved results to return them
    const screeningResults = await db.screeningResult.findMany({
      where: { patientId },
      orderBy: { createdAt: "desc" },
      take: 3,
    });

    // Return the saved DB records as an array directly
    return NextResponse.json(screeningResults);
  } catch (error) {
    console.error("Error running screening:", error);
    return NextResponse.json(
      { error: "Failed to run screening" },
      { status: 500 }
    );
  }
}

// GET /api/screening?patientId=xxx - List screening results for a patient
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

    const results = await db.screeningResult.findMany({
      where: { patientId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(results);
  } catch (error) {
    console.error("Error fetching screening results:", error);
    return NextResponse.json(
      { error: "Failed to fetch screening results" },
      { status: 500 }
    );
  }
}
