import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/lab-values?reportId=xxx - List lab values for a report
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const reportId = searchParams.get("reportId");

    if (!reportId) {
      return NextResponse.json(
        { error: "reportId query parameter is required" },
        { status: 400 }
      );
    }

    const labValues = await db.labValue.findMany({
      where: { reportId },
      orderBy: { testName: "asc" },
    });

    return NextResponse.json(labValues);
  } catch (error) {
    console.error("Error fetching lab values:", error);
    return NextResponse.json(
      { error: "Failed to fetch lab values" },
      { status: 500 }
    );
  }
}

// POST /api/lab-values - Create lab value(s)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { reportId, values } = body;

    if (!reportId) {
      return NextResponse.json(
        { error: "reportId is required" },
        { status: 400 }
      );
    }

    // Verify report exists
    const report = await db.medicalReport.findUnique({ where: { id: reportId } });
    if (!report) {
      return NextResponse.json(
        { error: "Report not found" },
        { status: 404 }
      );
    }

    // Support both single object and array of values
    const items = Array.isArray(values) ? values : [body];

    const created = await db.labValue.createMany({
      data: items.map((lv: Record<string, unknown>) => {
        const result = lv.result as number | undefined;
        const refLow = lv.referenceLow as number | undefined;
        const refHigh = lv.referenceHigh as number | undefined;
        const isAbnormal =
          result !== undefined &&
          result !== null &&
          ((refLow !== undefined && refLow !== null && result < refLow) ||
           (refHigh !== undefined && refHigh !== null && result > refHigh));

        return {
          reportId,
          testName: String(lv.testName || ""),
          result: result ?? null,
          unit: (lv.unit as string) || null,
          referenceLow: refLow ?? null,
          referenceHigh: refHigh ?? null,
          referenceText: (lv.referenceText as string) || null,
          isAbnormal,
          confidence: (lv.confidence as number) ?? null,
          isVerified: (lv.isVerified as boolean) || false,
          category: (lv.category as string) || null,
          notes: (lv.notes as string) || null,
        };
      }),
    });

    // Fetch the created lab values to return them
    const labValues = await db.labValue.findMany({
      where: { reportId },
      orderBy: { testName: "asc" },
    });

    return NextResponse.json(labValues, { status: 201 });
  } catch (error) {
    console.error("Error creating lab values:", error);
    return NextResponse.json(
      { error: "Failed to create lab values" },
      { status: 500 }
    );
  }
}

// PUT /api/lab-values - Update a lab value
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Lab value id is required" },
        { status: 400 }
      );
    }

    const existing = await db.labValue.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Lab value not found" },
        { status: 404 }
      );
    }

    const updateData: Record<string, unknown> = {};
    if (updates.testName !== undefined) updateData.testName = String(updates.testName);
    if (updates.result !== undefined) updateData.result = updates.result ?? null;
    if (updates.resultText !== undefined) updateData.resultText = updates.resultText || null;
    if (updates.unit !== undefined) updateData.unit = updates.unit || null;
    if (updates.referenceLow !== undefined) updateData.referenceLow = updates.referenceLow ?? null;
    if (updates.referenceHigh !== undefined) updateData.referenceHigh = updates.referenceHigh ?? null;
    if (updates.referenceText !== undefined) updateData.referenceText = updates.referenceText || null;
    if (updates.isVerified !== undefined) updateData.isVerified = Boolean(updates.isVerified);
    if (updates.category !== undefined) updateData.category = updates.category || null;
    if (updates.notes !== undefined) updateData.notes = updates.notes || null;
    if (updates.confidence !== undefined) updateData.confidence = updates.confidence ?? null;

    // Recalculate isAbnormal if result or references changed
    if (updates.result !== undefined || updates.referenceLow !== undefined || updates.referenceHigh !== undefined) {
      const result = updates.result !== undefined ? updates.result : existing.result;
      const refLow = updates.referenceLow !== undefined ? updates.referenceLow : existing.referenceLow;
      const refHigh = updates.referenceHigh !== undefined ? updates.referenceHigh : existing.referenceHigh;
      updateData.isAbnormal =
        result !== null &&
        result !== undefined &&
        ((refLow !== null && refLow !== undefined && result < refLow) ||
         (refHigh !== null && refHigh !== undefined && result > refHigh));
    }

    const labValue = await db.labValue.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(labValue);
  } catch (error) {
    console.error("Error updating lab value:", error);
    return NextResponse.json(
      { error: "Failed to update lab value" },
      { status: 500 }
    );
  }
}

// DELETE /api/lab-values - Delete lab values by IDs (accepts body with ids or query param)
export async function DELETE(request: NextRequest) {
  try {
    // Try reading from body first, fall back to query params
    let ids: string[] = [];
    try {
      const body = await request.json();
      const rawIds = body.ids;
      if (Array.isArray(rawIds)) {
        ids = rawIds.map((id: string) => String(id).trim()).filter(Boolean);
      } else if (typeof rawIds === "string") {
        ids = rawIds.split(",").map((id) => id.trim()).filter(Boolean);
      }
    } catch {
      // No JSON body, try query params
      const { searchParams } = new URL(request.url);
      const idsParam = searchParams.get("ids");
      if (idsParam) {
        ids = idsParam.split(",").map((id) => id.trim()).filter(Boolean);
      }
    }

    if (ids.length === 0) {
      return NextResponse.json(
        { error: "At least one id is required" },
        { status: 400 }
      );
    }

    const result = await db.labValue.deleteMany({
      where: { id: { in: ids } },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting lab values:", error);
    return NextResponse.json(
      { error: "Failed to delete lab values" },
      { status: 500 }
    );
  }
}
