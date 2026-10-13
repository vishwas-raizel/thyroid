import { NextRequest, NextResponse } from "next/server";
import ZAI from "z-ai-web-dev-sdk";

const OCR_PROMPT = `Extract all laboratory test results from this medical report image. For each test, provide: test name, result value, unit, reference range (low and high). Return as a JSON array with fields: testName, result (numeric), unit, referenceLow, referenceHigh, referenceText. If any value cannot be confidently determined, set confidence to 0.5 or lower.

Return ONLY the JSON array, no other text.`;

interface ExtractedLabValue {
  testName: string;
  result?: number;
  unit?: string;
  referenceLow?: number;
  referenceHigh?: number;
  referenceText?: string;
  confidence: number;
  category?: string;
}

// POST /api/ocr - Process an image using VLM OCR
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    // Accept both "image" (frontend) and "imageData" field names
    const imageData = body.image || body.imageData;
    const { reportType } = body;

    if (!imageData || typeof imageData !== "string") {
      return NextResponse.json(
        { error: "image or imageData (base64 string) is required" },
        { status: 400 }
      );
    }

    // Strip data URL prefix if present
    const base64Data = imageData.includes(",")
      ? imageData.split(",")[1]
      : imageData;

    const zai = await ZAI.create();
    const result = await zai.chat.completions.createVision({
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: OCR_PROMPT },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${base64Data}`,
              },
            },
          ],
        },
      ],
      thinking: { type: "disabled" },
    });

    // Parse the VLM response
    const responseText =
      typeof result === "string"
        ? result
        : (result as { choices?: Array<{ message?: { content?: string } }> })
            .choices?.[0]?.message?.content || "";

    // Extract JSON from the response (handle markdown code blocks)
    let jsonStr = responseText;
    const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1].trim();
    }

    // Try to find a JSON array in the response
    const arrayMatch = jsonStr.match(/\[[\s\S]*\]/);
    if (arrayMatch) {
      jsonStr = arrayMatch[0];
    }

    let extractedValues: ExtractedLabValue[];
    try {
      extractedValues = JSON.parse(jsonStr);
    } catch {
      // If parsing fails, return raw text with low confidence
      return NextResponse.json({
        labValues: [],
        rawText: responseText,
        ocrConfidence: 0.2,
        reportType: reportType || "general",
        warning:
          "Could not parse structured lab values from the image. Raw text is provided for manual review.",
      });
    }

    if (!Array.isArray(extractedValues)) {
      extractedValues = [extractedValues];
    }

    // Validate and clean each extracted value
    const labValues: ExtractedLabValue[] = extractedValues
      .filter((v) => v.testName && typeof v.testName === "string")
      .map((v) => ({
        testName: v.testName.trim(),
        result:
          v.result !== undefined && v.result !== null
            ? Number(v.result)
            : undefined,
        unit: v.unit ? String(v.unit).trim() : undefined,
        referenceLow:
          v.referenceLow !== undefined && v.referenceLow !== null
            ? Number(v.referenceLow)
            : undefined,
        referenceHigh:
          v.referenceHigh !== undefined && v.referenceHigh !== null
            ? Number(v.referenceHigh)
            : undefined,
        referenceText: v.referenceText
          ? String(v.referenceText).trim()
          : undefined,
        confidence:
          typeof v.confidence === "number"
            ? Math.min(1, Math.max(0, v.confidence))
            : 0.8,
        category: v.category || reportType || "other",
      }));

    // Calculate overall confidence
    const avgConfidence =
      labValues.length > 0
        ? labValues.reduce((sum, v) => sum + v.confidence, 0) /
          labValues.length
        : 0;

    return NextResponse.json({
      labValues,
      ocrConfidence: Math.round(avgConfidence * 100) / 100,
      reportType: reportType || "general",
      extractedCount: labValues.length,
    });
  } catch (error) {
    console.error("Error processing OCR:", error);
    return NextResponse.json(
      { error: "Failed to process image with OCR" },
      { status: 500 }
    );
  }
}
