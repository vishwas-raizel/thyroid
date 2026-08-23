import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { runPreprocessingPipeline } from "@/lib/preprocessing";
import { runFeatureSelection } from "@/lib/feature-selection";
import { runAllModels } from "@/lib/ml-engine";
import { generatePredictionReport } from "@/lib/report-generator";
import type { PredictionFeatures } from "@/lib/ml-engine";
import type { LabValue, SymptomEntry } from "@/lib/types";
import { SYMPTOM_CATEGORIES } from "@/lib/types";

// ---------------------------------------------------------------------------
// POST /api/predictions – Run the full ML prediction pipeline for a patient
// ---------------------------------------------------------------------------
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { patientId, reportId } = body as {
      patientId: string;
      reportId?: string;
    };

    if (!patientId) {
      return NextResponse.json(
        { error: "patientId is required" },
        { status: 400 },
      );
    }

    // 1. Fetch the patient from DB
    const patient = await db.patient.findUnique({ where: { id: patientId } });
    if (!patient) {
      return NextResponse.json(
        { error: "Patient not found" },
        { status: 404 },
      );
    }

    // 2. Fetch lab values – either for a specific report or all reports
    let labValues: any[];
    if (reportId) {
      const report = await db.medicalReport.findUnique({
        where: { id: reportId },
        include: { labValues: true },
      });
      if (!report) {
        return NextResponse.json(
          { error: "Report not found" },
          { status: 404 },
        );
      }
      labValues = report.labValues;
    } else {
      const reports = await db.medicalReport.findMany({
        where: { patientId },
        include: { labValues: true },
      });
      labValues = reports.flatMap((r) => r.labValues);
    }

    // 3. Fetch all symptoms for the patient
    const symptoms = await db.symptomEntry.findMany({
      where: { patientId },
      orderBy: { dateReported: "desc" },
    });

    // 4. Build PredictionFeatures from patient data + lab values + symptoms
    const features = buildPredictionFeatures(patient, labValues, symptoms);

    // 5. Run the preprocessing pipeline
    const preprocessingResult = runPreprocessingPipeline(
      {
        id: patient.id,
        name: patient.name,
        age: patient.age,
        gender: patient.gender,
        weight: patient.weight ?? undefined,
        height: patient.height ?? undefined,
        bmi: patient.bmi ?? undefined,
        bloodPressureSystolic: patient.bloodPressureSystolic ?? undefined,
        bloodPressureDiastolic: patient.bloodPressureDiastolic ?? undefined,
        fastingBloodSugar: patient.fastingBloodSugar ?? undefined,
        menstrualCycleLength: patient.menstrualCycleLength ?? undefined,
        menstrualRegularity: patient.menstrualRegularity ?? undefined,
        hairGrowthPattern: patient.hairGrowthPattern ?? undefined,
        skinDarkening: patient.skinDarkening ?? undefined,
        follicleCount: patient.follicleCount ?? undefined,
        insulinResistance: patient.insulinResistance ?? undefined,
      },
      labValues.map((lv) => ({
        testName: lv.testName,
        result: lv.result ?? 0,
        unit: lv.unit ?? "",
        referenceLow: lv.referenceLow ?? undefined,
        referenceHigh: lv.referenceHigh ?? undefined,
        isAbnormal: lv.isAbnormal,
        category: lv.category ?? undefined,
      })),
    );

    // 6. Run feature selection
    const featureResult = runFeatureSelection(
      {
        id: patient.id,
        name: patient.name,
        age: patient.age,
        gender: patient.gender,
        weight: patient.weight ?? undefined,
        height: patient.height ?? undefined,
        bmi: patient.bmi ?? undefined,
        bloodPressureSystolic: patient.bloodPressureSystolic ?? undefined,
        bloodPressureDiastolic: patient.bloodPressureDiastolic ?? undefined,
        fastingBloodSugar: patient.fastingBloodSugar ?? undefined,
        menstrualCycleLength: patient.menstrualCycleLength ?? undefined,
        menstrualRegularity: patient.menstrualRegularity ?? undefined,
        hairGrowthPattern: patient.hairGrowthPattern ?? undefined,
        skinDarkening: patient.skinDarkening ?? undefined,
        follicleCount: patient.follicleCount ?? undefined,
        insulinResistance: patient.insulinResistance ?? undefined,
      },
      labValues.map((lv) => ({
        testName: lv.testName,
        result: lv.result ?? 0,
        unit: lv.unit ?? "",
        referenceLow: lv.referenceLow ?? undefined,
        referenceHigh: lv.referenceHigh ?? undefined,
        isAbnormal: lv.isAbnormal,
        category: lv.category ?? undefined,
      })),
      symptoms.map((s) => ({
        symptomName: s.symptomName,
        severity: severityToNumber(s.severity),
        category: s.category ?? undefined,
      })),
    );

    // 7. Run all ML models
    const predictions = runAllModels(features);

    // 8. Generate the detailed report (using the ensemble prediction)
    const report = generatePredictionReport(
      { name: patient.name, age: patient.age },
      predictions,
      featureResult,
      preprocessingResult,
    );

    // 9. Build top-features list from ensemble feature weights
    const ensemble = predictions.find((p) => p.model === "Ensemble") ?? predictions[predictions.length - 1];
    const topFeaturesList = (Object.entries(ensemble.featureWeights) as [string, number][])
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([feature, weight]) => ({ name: feature, importance: weight }));

    // 10. Save each model's prediction to the DB
    for (const pred of predictions) {
      await db.prediction.create({
        data: {
          patientId,
          reportId: reportId || null,
          thyroidPrediction: pred.thyroidPrediction,
          thyroidProbability: pred.thyroidProbability,
          pcosPrediction: pred.pcosPrediction,
          pcosProbability: pred.pcosProbability,
          modelUsed: pred.model,
          modelAccuracy: pred.accuracy,
          modelVersion: "1.0.0",
          topFeatures: JSON.stringify(topFeaturesList),
          preprocessingLog: JSON.stringify(preprocessingResult.steps),
          dataQualityScore: preprocessingResult.qualityScore,
          detailedReport:
            pred.model === "Ensemble" ? report.detailedReport : undefined,
          suggestedPrecautions:
            pred.model === "Ensemble"
              ? JSON.stringify(report.suggestedPrecautions)
              : undefined,
        },
      });
    }

    return NextResponse.json({
      success: true,
      patientId,
      reportId: reportId || null,
      predictions,
      featureSelection: {
        selectedFeatures: featureResult.selectedFeatures,
        coverageScore: featureResult.coverageScore,
      },
      dataQualityScore: preprocessingResult.qualityScore,
      report,
    });
  } catch (error) {
    console.error("Error running predictions:", error);
    return NextResponse.json(
      { error: "Failed to run predictions" },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// GET /api/predictions?patientId=xxx – Get predictions for a patient
// ---------------------------------------------------------------------------
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get("patientId");

    if (!patientId) {
      return NextResponse.json(
        { error: "patientId query parameter is required" },
        { status: 400 },
      );
    }

    const predictions = await db.prediction.findMany({
      where: { patientId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(predictions);
  } catch (error) {
    console.error("Error fetching predictions:", error);
    return NextResponse.json(
      { error: "Failed to fetch predictions" },
      { status: 500 },
    );
  }
}

// ===========================================================================
// Helper: Build PredictionFeatures from patient, lab values, and symptoms
// ===========================================================================

/** Map of lab test names (as stored in DB) → PredictionFeatures field names. */
const LAB_TO_FEATURE_MAP: Record<string, keyof PredictionFeatures> = {
  TSH: "tsh",
  "Free T4": "freeT4",
  FreeT4: "freeT4",
  "Free T3": "freeT3",
  FreeT3: "freeT3",
  "Total T4": "totalT4",
  "Total T3": "totalT3",
  "TPO Antibodies": "tpoAntibodies",
  "Tg Antibodies": "tgAntibodies",
  LH: "lh",
  FSH: "fsh",
  "Total Testosterone": "testosterone",
  Testosterone: "testosterone",
  "Free Testosterone": "freeTestosterone",
  DHEAS: "dheas",
  SHBG: "shbg",
  Prolactin: "prolactin",
  "Fasting Glucose": "fastingGlucose",
  HbA1c: "hba1c",
  Insulin: "insulin",
  "Total Cholesterol": "totalCholesterol",
  HDL: "hdl",
  LDL: "ldl",
  Triglycerides: "triglycerides",
  Estradiol: "estradiol",
  Progesterone: "progesterone",
  "17-OH Progesterone": "progesterone",
};

/** Encoding maps for categorical patient fields */
const MENSTRUAL_REGULARITY_ENCODE: Record<string, number> = {
  regular: 0,
  irregular: 1,
  absent: 2,
};

const HAIR_GROWTH_ENCODE: Record<string, number> = {
  normal: 0,
  mild_hirsutism: 1,
  moderate_hirsutism: 2,
  severe_hirsutism: 3,
};

const SKIN_DARKENING_ENCODE: Record<string, number> = {
  none: 0,
  mild: 1,
  mild_acanthosis: 1,
  moderate: 2,
  moderate_acanthosis: 2,
  severe: 3,
  severe_acanthosis: 3,
};

const INSULIN_RESISTANCE_ENCODE: Record<string, number> = {
  none: 0,
  mild: 1,
  moderate: 2,
  severe: 3,
};

function buildPredictionFeatures(
  patient: {
    age: number;
    bmi?: number | null;
    bloodPressureSystolic?: number | null;
    bloodPressureDiastolic?: number | null;
    menstrualRegularity?: string | null;
    hairGrowthPattern?: string | null;
    skinDarkening?: string | null;
    follicleCount?: number | null;
    insulinResistance?: string | null;
  },
  labValues: LabValue[],
  symptoms: { symptomName: string; severity: string; category?: string | null }[],
): PredictionFeatures {
  const features: PredictionFeatures = {
    age: patient.age,
  };

  // --- Patient vitals ---
  if (patient.bmi != null) features.bmi = patient.bmi;
  if (patient.bloodPressureSystolic != null)
    features.bloodPressureSystolic = patient.bloodPressureSystolic;
  if (patient.bloodPressureDiastolic != null)
    features.bloodPressureDiastolic = patient.bloodPressureDiastolic;

  // --- Encoded categorical fields ---
  if (patient.menstrualRegularity) {
    const encoded = MENSTRUAL_REGULARITY_ENCODE[patient.menstrualRegularity];
    if (encoded !== undefined) features.menstrualRegularity = encoded;
  }
  if (patient.hairGrowthPattern) {
    const encoded = HAIR_GROWTH_ENCODE[patient.hairGrowthPattern];
    if (encoded !== undefined) features.hairGrowthPattern = encoded;
  }
  if (patient.skinDarkening) {
    const encoded = SKIN_DARKENING_ENCODE[patient.skinDarkening];
    if (encoded !== undefined) features.skinDarkening = encoded;
  }
  if (patient.follicleCount != null) features.follicleCount = patient.follicleCount;
  if (patient.insulinResistance) {
    const encoded = INSULIN_RESISTANCE_ENCODE[patient.insulinResistance];
    if (encoded !== undefined) features.insulinResistance = encoded;
  }

  // --- Lab values → feature fields ---
  let lhValue: number | undefined;
  let fshValue: number | undefined;

  for (const lv of labValues) {
    if (lv.result == null) continue;

    const featureKey = LAB_TO_FEATURE_MAP[lv.testName];
    if (featureKey && typeof featureKey === "string") {
      (features as unknown as Record<string, unknown>)[featureKey] = lv.result;
    }

    // Track LH / FSH separately to compute ratio
    if (lv.testName === "LH") lhValue = lv.result;
    if (lv.testName === "FSH") fshValue = lv.result;
  }

  // Calculate LH/FSH ratio
  if (lhValue != null && fshValue != null && fshValue !== 0) {
    features.lhFshRatio = lhValue / fshValue;
  }

  // --- Symptom scores ---
  const thyroidSymptomNames = new Set([
    ...SYMPTOM_CATEGORIES.energy,
    ...SYMPTOM_CATEGORIES.other,
  ]);
  const pcosSymptomNames = new Set([
    ...SYMPTOM_CATEGORIES.menstrual,
    ...SYMPTOM_CATEGORIES.dermatological,
    ...SYMPTOM_CATEGORIES.reproductive,
  ]);

  let thyroidCount = 0;
  let pcosCount = 0;

  for (const s of symptoms) {
    if (s.severity === "none") continue;
    if (thyroidSymptomNames.has(s.symptomName)) thyroidCount++;
    if (pcosSymptomNames.has(s.symptomName)) pcosCount++;
  }

  const maxThyroidSymptoms = thyroidSymptomNames.size;
  const maxPcosSymptoms = pcosSymptomNames.size;

  features.thyroidSymptomScore =
    maxThyroidSymptoms > 0 ? thyroidCount / maxThyroidSymptoms : 0;
  features.pcosSymptomScore =
    maxPcosSymptoms > 0 ? pcosCount / maxPcosSymptoms : 0;

  return features;
}

// ===========================================================================
// Helper: Convert severity string to number for feature-selection module
// ===========================================================================
function severityToNumber(
  severity: string,
): number {
  switch (severity) {
    case "mild":
      return 1;
    case "moderate":
      return 2;
    case "severe":
      return 3;
    default:
      return 0;
  }
}
