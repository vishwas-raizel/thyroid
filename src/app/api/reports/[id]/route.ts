import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

type RouteContext = {
  params: Promise<{ id: string }>;
};

// GET /api/reports/[id] - Get a single report with lab values
export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;

    const report = await db.medicalReport.findUnique({
      where: { id },
      include: {
        labValues: {
          orderBy: { testName: "asc" },
        },
      },
    });

    if (!report) {
      return NextResponse.json(
        { error: "Report not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(report);
  } catch (error) {
    console.error("Error fetching report:", error);
    return NextResponse.json(
      { error: "Failed to fetch report" },
      { status: 500 }
    );
  }
}

// PUT /api/reports/[id] - Update report status or notes
export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await request.json();

    const existing = await db.medicalReport.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Report not found" },
        { status: 404 }
      );
    }

    const { reportDate, reportType, status, notes, ocrExtracted, ocrConfidence } = body;

    const updateData: Record<string, unknown> = {};
    if (reportDate !== undefined) updateData.reportDate = new Date(reportDate);
    if (reportType !== undefined) updateData.reportType = String(reportType);
    if (status !== undefined) updateData.status = String(status);
    if (notes !== undefined) updateData.notes = notes || null;
    if (ocrExtracted !== undefined) updateData.ocrExtracted = ocrExtracted || null;
    if (ocrConfidence !== undefined) updateData.ocrConfidence = Number(ocrConfidence);

    const report = await db.medicalReport.update({
      where: { id },
      data: updateData,
      include: { labValues: true },
    });

    return NextResponse.json(report);
  } catch (error) {
    console.error("Error updating report:", error);
    return NextResponse.json(
      { error: "Failed to update report" },
      { status: 500 }
    );
  }
}

// DELETE /api/reports/[id] - Delete a report
export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;

    const existing = await db.medicalReport.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Report not found" },
        { status: 404 }
      );
    }

    await db.medicalReport.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting report:", error);
    return NextResponse.json(
      { error: "Failed to delete report" },
      { status: 500 }
    );
  }
}
