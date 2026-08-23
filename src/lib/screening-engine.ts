// Clinical Screening Engine - Thyroid & PCOS Risk Assessment
// This implements evidence-based clinical screening rules based on established medical guidelines.
// NOT a diagnostic system - provides screening support only.

import type { LabValue, SymptomEntry, ScreeningFactor, DataQualityIssue } from "./types";
import { THYROID_REFERENCE_RANGES, PCOS_REFERENCE_RANGES } from "./types";

export interface ScreeningOutput {
  condition: "thyroid" | "pcos" | "combined";
  riskLevel: "low" | "intermediate" | "elevated";
  riskScore: number;
  confidence: number;
  factors: ScreeningFactor[];
  summary: string;
  dataQuality: number;
  missingData: string[];
  dataQualityIssues: DataQualityIssue[];
}

// ============================================================
// THYROID SCREENING
// ============================================================
export function screenThyroid(
  labValues: LabValue[],
  symptoms: SymptomEntry[]
): ScreeningOutput {
  const factors: ScreeningFactor[] = [];
  const missingData: string[] = [];
  const dataQualityIssues: DataQualityIssue[] = [];
  let riskScore = 0;
  let maxPossibleScore = 0;

  // --- TSH Analysis (primary thyroid marker) ---
  const tsh = labValues.find(
    (v) =>
      v.testName.toLowerCase().includes("tsh") &&
      !v.testName.toLowerCase().includes("antibod")
  );

  if (tsh && tsh.result !== null && tsh.result !== undefined) {
    maxPossibleScore += 30;
    const ref = THYROID_REFERENCE_RANGES["TSH"];

    if (tsh.result > ref.high) {
      const severity = tsh.result > 10 ? "severely" : tsh.result > 6 ? "moderately" : "mildly";
      const points = tsh.result > 10 ? 30 : tsh.result > 6 ? 22 : 15;
      riskScore += points;
      factors.push({
        name: "TSH (Thyroid Stimulating Hormone)",
        value: `${tsh.result} ${tsh.unit || "mIU/L"}`,
        impact: "positive",
        weight: points / 30,
        description: `Elevated TSH at ${tsh.result} ${tsh.unit || "mIU/L"} (${severity} elevated, reference: ${ref.low}-${ref.high} ${ref.unit}). Suggests possible hypothyroidism.`,
      });
    } else if (tsh.result < ref.low) {
      const points = tsh.result < 0.1 ? 28 : tsh.result < 0.3 ? 22 : 15;
      riskScore += points;
      factors.push({
        name: "TSH",
        value: `${tsh.result} ${tsh.unit || "mIU/L"}`,
        impact: "positive",
        weight: points / 30,
        description: `Suppressed TSH at ${tsh.result} ${tsh.unit || "mIU/L"} (below reference: ${ref.low}-${ref.high} ${ref.unit}). Suggests possible hyperthyroidism.`,
      });
    } else {
      factors.push({
        name: "TSH",
        value: `${tsh.result} ${tsh.unit || "mIU/L"}`,
        impact: "negative",
        weight: 0,
        description: `TSH within normal range (${ref.low}-${ref.high} ${ref.unit}).`,
      });
    }
  } else {
    missingData.push("TSH");
    dataQualityIssues.push({
      field: "TSH",
      severity: "warning",
      message: "TSH is the primary thyroid function marker and is essential for screening. Its absence significantly limits assessment accuracy.",
    });
  }

  // --- Free T4 Analysis ---
  const freeT4 = labValues.find(
    (v) =>
      (v.testName.toLowerCase().includes("free t4") ||
        v.testName.toLowerCase().includes("ft4")) &&
      !v.testName.toLowerCase().includes("antibod")
  );

  if (freeT4 && freeT4.result !== null && freeT4.result !== undefined) {
    maxPossibleScore += 20;
    const ref = THYROID_REFERENCE_RANGES["Free T4"];

    if (freeT4.result < ref.low) {
      const points = 18;
      riskScore += points;
      factors.push({
        name: "Free T4",
        value: `${freeT4.result} ${freeT4.unit || "ng/dL"}`,
        impact: "positive",
        weight: points / 20,
        description: `Low Free T4 at ${freeT4.result} ${freeT4.unit || "ng/dL"} (reference: ${ref.low}-${ref.high} ${ref.unit}). Supports possible hypothyroidism.`,
      });
    } else if (freeT4.result > ref.high) {
      const points = 18;
      riskScore += points;
      factors.push({
        name: "Free T4",
        value: `${freeT4.result} ${freeT4.unit || "ng/dL"}`,
        impact: "positive",
        weight: points / 20,
        description: `Elevated Free T4 at ${freeT4.result} ${freeT4.unit || "ng/dL"} (reference: ${ref.low}-${ref.high} ${ref.unit}). Supports possible hyperthyroidism.`,
      });
    } else {
      factors.push({
        name: "Free T4",
        value: `${freeT4.result} ${freeT4.unit || "ng/dL"}`,
        impact: "negative",
        weight: 0,
        description: `Free T4 within normal range.`,
      });
    }
  } else {
    missingData.push("Free T4");
  }

  // --- Free T3 Analysis ---
  const freeT3 = labValues.find(
    (v) =>
      (v.testName.toLowerCase().includes("free t3") ||
        v.testName.toLowerCase().includes("ft3")) &&
      !v.testName.toLowerCase().includes("antibod")
  );

  if (freeT3 && freeT3.result !== null && freeT3.result !== undefined) {
    maxPossibleScore += 15;
    const ref = THYROID_REFERENCE_RANGES["Free T3"];

    if (freeT3.result < ref.low || freeT3.result > ref.high) {
      const points = 12;
      riskScore += points;
      factors.push({
        name: "Free T3",
        value: `${freeT3.result} ${freeT3.unit || "pg/mL"}`,
        impact: "positive",
        weight: points / 15,
        description: `Abnormal Free T3 at ${freeT3.result} ${freeT3.unit || "pg/mL"} (reference: ${ref.low}-${ref.high} ${ref.unit}).`,
      });
    }
  }

  // --- Antibody Analysis ---
  const antibodies = labValues.filter(
    (v) =>
      v.testName.toLowerCase().includes("antibod") ||
      v.testName.toLowerCase().includes("tpo") ||
      v.testName.toLowerCase().includes("tg ") ||
      v.testName.toLowerCase().includes("tshr")
  );

  for (const ab of antibodies) {
    if (ab.result !== null && ab.result !== undefined) {
      maxPossibleScore += 10;
      if (ab.result > (ab.referenceHigh || THYROID_REFERENCE_RANGES["TPO Antibodies"]?.high || 35)) {
        const points = 10;
        riskScore += points;
        factors.push({
          name: ab.testName,
          value: `${ab.result} ${ab.unit || ""}`,
          impact: "positive",
          weight: points / 10,
          description: `Elevated ${ab.testName} at ${ab.result} ${ab.unit || ""}. May indicate autoimmune thyroid disease.`,
        });
      }
    }
  }

  // --- Symptom Analysis for Thyroid ---
  const thyroidSymptoms = [
    { name: "Fatigue", category: "energy" },
    { name: "Cold intolerance", category: "other" },
    { name: "Constipation", category: "other" },
    { name: "Dry skin", category: "other" },
    { name: "Hair thinning/loss", category: "dermatological" },
    { name: "Weight gain", category: "weight" },
    { name: "Depression", category: "energy" },
    { name: "Brain fog", category: "energy" },
    { name: "Heat intolerance", category: "other" },
    { name: "Tremors", category: "other" },
    { name: "Palpitations", category: "other" },
    { name: "Sweating", category: "other" },
    { name: "Swollen neck/goiter", category: "other" },
    { name: "Puffy face", category: "other" },
    { name: "Low energy", category: "energy" },
    { name: "Mood swings", category: "energy" },
    { name: "Anxiety", category: "energy" },
    { name: "Unexplained weight gain", category: "weight" },
    { name: "Unexplained weight loss", category: "weight" },
    { name: "Joint pain", category: "other" },
  ];

  let symptomScore = 0;
  const reportedThyroidSymptoms: string[] = [];

  for (const ts of thyroidSymptoms) {
    const match = symptoms.find(
      (s) =>
        s.symptomName.toLowerCase().includes(ts.name.toLowerCase()) &&
        s.severity !== "none"
    );
    if (match) {
      reportedThyroidSymptoms.push(match.symptomName);
      const severityMult = match.severity === "severe" ? 3 : match.severity === "moderate" ? 2 : 1;
      symptomScore += 2 * severityMult;
    }
  }

  maxPossibleScore += 15;
  if (symptomScore > 0) {
    const points = Math.min(15, symptomScore);
    riskScore += points;
    factors.push({
      name: "Reported Symptoms",
      value: `${reportedThyroidSymptoms.length} symptom(s) reported`,
      impact: symptomScore >= 10 ? "positive" : symptomScore >= 5 ? "neutral" : "negative",
      weight: points / 15,
      description: `Patient reports symptoms potentially associated with thyroid dysfunction: ${reportedThyroidSymptoms.join(", ")}. Note: These symptoms are non-specific and can have multiple causes.`,
    });
  }

  // --- Calculate Risk Level ---
  const normalizedScore = maxPossibleScore > 0 ? (riskScore / maxPossibleScore) * 100 : 0;
  const riskLevel =
    normalizedScore >= 60 ? "elevated" : normalizedScore >= 30 ? "intermediate" : "low";

  // Data quality
  const totalExpected = 4; // TSH, Free T4, Free T3, symptoms
  const present = (tsh ? 1 : 0) + (freeT4 ? 1 : 0) + (symptoms.length > 0 ? 1 : 0);
  const dataQuality = present / totalExpected;

  if (dataQuality < 0.5) {
    dataQualityIssues.push({
      field: "Overall",
      severity: "warning",
      message: "Limited data available for thyroid screening. Results should be interpreted with caution.",
    });
  }

  // Generate summary
  const summary = generateThyroidSummary(riskLevel, factors, missingData);

  return {
    condition: "thyroid",
    riskLevel,
    riskScore: Math.round(normalizedScore),
    confidence: dataQuality,
    factors: factors.sort((a, b) => b.weight - a.weight),
    summary,
    dataQuality,
    missingData,
    dataQualityIssues,
  };
}

function generateThyroidSummary(
  riskLevel: string,
  factors: ScreeningFactor[],
  missing: string[]
): string {
  const positiveFactors = factors.filter((f) => f.impact === "positive");

  if (positiveFactors.length === 0) {
    return missing.length > 0
      ? `Available data does not suggest thyroid dysfunction. However, key tests (${missing.join(", ")}) are missing, limiting the completeness of this assessment. Clinical evaluation recommended if symptoms persist.`
      : `Available thyroid markers are within normal ranges. No immediate concern for thyroid dysfunction based on current data. This is a screening assessment only — not a diagnosis.`;
  }

  const factorNames = positiveFactors.map((f) => f.name).join(", ");

  switch (riskLevel) {
    case "elevated":
      return `Elevated screening risk is associated with abnormal findings in: ${factorNames}. These results warrant clinical evaluation by a qualified healthcare professional. Additional thyroid function tests and possibly antibody panels may be needed. This is a screening result, not a diagnosis.`;
    case "intermediate":
      return `Intermediate screening risk noted. Some thyroid-related parameters show variation: ${factorNames}. These findings alone do not confirm thyroid dysfunction but suggest follow-up testing may be beneficial. Please consult a healthcare provider for proper evaluation.`;
    default:
      return `Low screening risk. Minor variations noted in ${factorNames}, but overall pattern does not strongly suggest thyroid dysfunction. Continue routine monitoring and consult a healthcare provider if symptoms develop.`;
  }
}

// ============================================================
// PCOS SCREENING (Rotterdam Criteria-Informed)
// ============================================================
export function screenPCOS(
  labValues: LabValue[],
  symptoms: SymptomEntry[]
): ScreeningOutput {
  const factors: ScreeningFactor[] = [];
  const missingData: string[] = [];
  const dataQualityIssues: DataQualityIssue[] = [];
  let riskScore = 0;
  let maxPossibleScore = 0;

  // --- Rotterdam Criteria Check ---
  // Criteria: Oligo/anovulation + Hyperandrogenism (clinical or biochemical) + Polycystic ovaries on ultrasound
  // 2 out of 3 needed for diagnosis (this is screening, not diagnosis)

  // --- Menstrual Irregularity ---
  const menstrualSymptoms = symptoms.filter(
    (s) =>
      (s.symptomName.toLowerCase().includes("irregular") ||
        s.symptomName.toLowerCase().includes("missed") ||
        s.symptomName.toLowerCase().includes("heavy period") ||
        s.symptomName.toLowerCase().includes("light period")) &&
      s.severity !== "none"
  );

  if (menstrualSymptoms.length > 0) {
    maxPossibleScore += 20;
    const points = 18;
    riskScore += points;
    factors.push({
      name: "Menstrual Irregularity",
      value: `${menstrualSymptoms.length} symptom(s) reported`,
      impact: "positive",
      weight: points / 20,
      description: `Patient reports menstrual irregularity (${menstrualSymptoms.map((s) => s.symptomName).join(", ")}). This aligns with one Rotterdam criterion. Note: Menstrual irregularity has many causes beyond PCOS.`,
    });
  } else {
    missingData.push("Menstrual history");
    factors.push({
      name: "Menstrual Regularity",
      value: "No irregularity reported",
      impact: "negative",
      weight: 0,
      description: "No menstrual irregularity reported.",
    });
  }

  // --- Hyperandrogenism - Clinical (Hirsutism, Acne, Hair loss) ---
  const hyperandrogenSymptoms = symptoms.filter(
    (s) =>
      ((s.symptomName.toLowerCase().includes("facial hair") ||
        s.symptomName.toLowerCase().includes("hirsutism") ||
        s.symptomName.toLowerCase().includes("body hair") ||
        s.symptomName.toLowerCase().includes("acne") ||
        s.symptomName.toLowerCase().includes("oily skin") ||
        s.symptomName.toLowerCase().includes("hair thinning") ||
        s.symptomName.toLowerCase().includes("hair loss")) &&
        s.severity !== "none")
  );

  if (hyperandrogenSymptoms.length > 0) {
    maxPossibleScore += 15;
    const points = Math.min(15, hyperandrogenSymptoms.length * 5);
    riskScore += points;
    factors.push({
      name: "Clinical Hyperandrogenism",
      value: `${hyperandrogenSymptoms.length} sign(s) present`,
      impact: "positive",
      weight: points / 15,
      description: `Signs of possible hyperandrogenism: ${hyperandrogenSymptoms.map((s) => s.symptomName).join(", ")}. These are common in PCOS but also occur in other conditions.`,
    });
  }

  // --- LH/FSH Ratio ---
  const lh = labValues.find((v) => v.testName.toUpperCase().trim() === "LH");
  const fsh = labValues.find((v) => v.testName.toUpperCase().trim() === "FSH");

  if (lh && lh.result && fsh && fsh.result) {
    maxPossibleScore += 20;
    const lhRef = PCOS_REFERENCE_RANGES["LH"];
    const fshRef = PCOS_REFERENCE_RANGES["FSH"];
    const ratio = lh.result / fsh.result;

    if (ratio > 2.0) {
      const points = 20;
      riskScore += points;
      factors.push({
        name: "LH/FSH Ratio",
        value: `${ratio.toFixed(2)} (LH: ${lh.result}, FSH: ${fsh.result})`,
        impact: "positive",
        weight: points / 20,
        description: `Elevated LH/FSH ratio of ${ratio.toFixed(2)} (LH: ${lh.result} ${lh.unit || "mIU/mL"}, FSH: ${fsh.result} ${fsh.unit || "mIU/mL"}). A ratio > 2:1 is commonly associated with PCOS, though this is not diagnostic.`,
      });
    } else if (ratio > 1.5) {
      const points = 12;
      riskScore += points;
      factors.push({
        name: "LH/FSH Ratio",
        value: `${ratio.toFixed(2)}`,
        impact: "neutral",
        weight: points / 20,
        description: `LH/FSH ratio of ${ratio.toFixed(2)} is mildly elevated. This pattern can be seen in PCOS but also in other conditions.`,
      });
    } else {
      factors.push({
        name: "LH/FSH Ratio",
        value: `${ratio.toFixed(2)}`,
        impact: "negative",
        weight: 0,
        description: `LH/FSH ratio within normal range.`,
      });
    }
  } else {
    if (!lh) missingData.push("LH");
    if (!fsh) missingData.push("FSH");
  }

  // --- Testosterone ---
  const testosterone = labValues.find((v) =>
    v.testName.toLowerCase().includes("testosterone")
  );

  if (testosterone && testosterone.result !== null && testosterone.result !== undefined) {
    maxPossibleScore += 20;
    const ref = PCOS_REFERENCE_RANGES["Total Testosterone"];
    const high = testosterone.referenceHigh || ref.high;

    if (testosterone.result > high) {
      const points = 20;
      riskScore += points;
      factors.push({
        name: "Total Testosterone",
        value: `${testosterone.result} ${testosterone.unit || "ng/dL"}`,
        impact: "positive",
        weight: points / 20,
        description: `Elevated total testosterone at ${testosterone.result} ${testosterone.unit || "ng/dL"} (reference: up to ${high} ${ref.unit}). Biochemical hyperandrogenism is a key PCOS criterion.`,
      });
    } else {
      factors.push({
        name: "Total Testosterone",
        value: `${testosterone.result} ${testosterone.unit || "ng/dL"}`,
        impact: "negative",
        weight: 0,
        description: "Testosterone within normal range.",
      });
    }
  } else {
    missingData.push("Testosterone");
  }

  // --- SHBG ---
  const shbg = labValues.find((v) =>
    v.testName.toUpperCase().includes("SHBG")
  );

  if (shbg && shbg.result !== null && shbg.result !== undefined) {
    maxPossibleScore += 10;
    const ref = PCOS_REFERENCE_RANGES["SHBG"];
    const low = shbg.referenceLow || ref.low;

    if (shbg.result < low) {
      const points = 10;
      riskScore += points;
      factors.push({
        name: "SHBG",
        value: `${shbg.result} ${shbg.unit || "nmol/L"}`,
        impact: "positive",
        weight: points / 10,
        description: `Low SHBG at ${shbg.result} ${shbg.unit || "nmol/L"} (reference: ${ref.low}-${ref.high} ${ref.unit}). Low SHBG is associated with hyperandrogenism and insulin resistance, both common in PCOS.`,
      });
    }
  }

  // --- DHEAS ---
  const dheas = labValues.find((v) =>
    v.testName.toUpperCase().includes("DHEAS")
  );

  if (dheas && dheas.result !== null && dheas.result !== undefined) {
    maxPossibleScore += 10;
    const ref = PCOS_REFERENCE_RANGES["DHEAS"];

    if (dheas.result > ref.high) {
      const points = 10;
      riskScore += points;
      factors.push({
        name: "DHEAS",
        value: `${dheas.result} ${dheas.unit || "μg/dL"}`,
        impact: "positive",
        weight: points / 10,
        description: `Elevated DHEAS at ${dheas.result} ${dheas.unit || "μg/dL"}. May indicate adrenal hyperandrogenism which can be associated with PCOS.`,
      });
    }
  }

  // --- Prolactin ---
  const prolactin = labValues.find((v) =>
    v.testName.toLowerCase().includes("prolactin")
  );

  if (prolactin && prolactin.result !== null && prolactin.result !== undefined) {
    maxPossibleScore += 5;
    const ref = PCOS_REFERENCE_RANGES["Prolactin"];

    if (prolactin.result > ref.high * 1.5) {
      factors.push({
        name: "Prolactin",
        value: `${prolactin.result} ${prolactin.unit || "ng/mL"}`,
        impact: "neutral",
        weight: 0,
        description: `Elevated prolactin at ${prolactin.result} ${prolactin.unit || "ng/mL"}. This may indicate a different condition (e.g., prolactinoma) rather than PCOS and should be investigated separately.`,
      });
    }
  }

  // --- Metabolic Markers ---
  const glucose = labValues.find((v) =>
    v.testName.toLowerCase().includes("glucose") ||
    v.testName.toLowerCase().includes("fasting glucose") ||
    v.testName.toLowerCase().includes("sugar")
  );
  const hba1c = labValues.find((v) =>
    v.testName.toLowerCase().includes("hba1c") ||
    v.testName.toLowerCase().includes("glycated")
  );
  const insulin = labValues.find((v) =>
    v.testName.toLowerCase().includes("insulin") &&
    !v.testName.toLowerCase().includes("antibod")
  );

  if (glucose && glucose.result !== null && glucose.result !== undefined) {
    maxPossibleScore += 5;
    const ref = PCOS_REFERENCE_RANGES["Fasting Glucose"];

    if (glucose.result > ref.high) {
      const points = 5;
      riskScore += points;
      factors.push({
        name: "Fasting Glucose",
        value: `${glucose.result} ${glucose.unit || "mg/dL"}`,
        impact: "positive",
        weight: points / 5,
        description: `Elevated fasting glucose. Insulin resistance is common in PCOS and warrants further evaluation.`,
      });
    }
  }

  if (insulin && insulin.result !== null && insulin.result !== undefined) {
    maxPossibleScore += 5;
    if (glucose && glucose.result) {
      const ref = PCOS_REFERENCE_RANGES["Insulin"];
      const refG = PCOS_REFERENCE_RANGES["Fasting Glucose"];
      // HOMA-IR approximation
      const homaIR = (insulin.result * glucose.result) / 405;

      if (homaIR > 2.5) {
        const points = 5;
        riskScore += points;
        factors.push({
          name: "HOMA-IR (Insulin Resistance)",
          value: `${homaIR.toFixed(2)}`,
          impact: "positive",
          weight: points / 5,
          description: `HOMA-IR of ${homaIR.toFixed(2)} suggests insulin resistance, which is strongly associated with PCOS. Reference: < 2.5 considered normal.`,
        });
      }
    }
  }

  // --- Weight / Reproductive Symptoms ---
  const weightSymptoms = symptoms.filter(
    (s) =>
      (s.symptomName.toLowerCase().includes("weight gain") ||
        s.symptomName.toLowerCase().includes("difficulty losing")) &&
      s.severity !== "none"
  );
  const reproSymptoms = symptoms.filter(
    (s) =>
      (s.symptomName.toLowerCase().includes("difficulty conceiving") ||
        s.symptomName.toLowerCase().includes("infertility") ||
        s.symptomName.toLowerCase().includes("recurrent miscarriag")) &&
      s.severity !== "none"
  );

  if (weightSymptoms.length > 0 || reproSymptoms.length > 0) {
    maxPossibleScore += 5;
    const points = 4;
    riskScore += points;
    const desc: string[] = [];
    if (weightSymptoms.length > 0) desc.push("weight management difficulties");
    if (reproSymptoms.length > 0) desc.push("reproductive concerns");
    factors.push({
      name: "Associated Symptoms",
      value: `${weightSymptoms.length + reproSymptoms.length} symptom(s)`,
      impact: "neutral",
      weight: points / 5,
      description: `Patient reports ${desc.join(" and ")}. These are commonly associated with PCOS but have many other causes.`,
    });
  }

  // --- Calculate Risk Level ---
  const normalizedScore = maxPossibleScore > 0 ? (riskScore / maxPossibleScore) * 100 : 0;
  const riskLevel =
    normalizedScore >= 55 ? "elevated" : normalizedScore >= 25 ? "intermediate" : "low";

  // Data quality
  const totalExpected = 5; // Menstrual history, LH, FSH, Testosterone, Symptoms
  const hasMenstrual = menstrualSymptoms.length > 0;
  const present = (hasMenstrual ? 1 : 0) + (lh ? 1 : 0) + (fsh ? 1 : 0) + (testosterone ? 1 : 0) + (hyperandrogenSymptoms.length > 0 ? 1 : 0);
  const dataQuality = present / totalExpected;

  if (dataQuality < 0.5) {
    dataQualityIssues.push({
      field: "Overall",
      severity: "warning",
      message: "Limited data available for PCOS screening. Rotterdam criteria assessment requires multiple data points. Results should be interpreted with caution.",
    });
  }

  const summary = generatePCOSSummary(riskLevel, factors, missingData);

  return {
    condition: "pcos",
    riskLevel,
    riskScore: Math.round(normalizedScore),
    confidence: dataQuality,
    factors: factors.sort((a, b) => b.weight - a.weight),
    summary,
    dataQuality,
    missingData,
    dataQualityIssues,
  };
}

function generatePCOSSummary(
  riskLevel: string,
  factors: ScreeningFactor[],
  missing: string[]
): string {
  const positiveFactors = factors.filter((f) => f.impact === "positive");

  if (positiveFactors.length === 0) {
    return missing.length > 0
      ? `Available data does not suggest elevated PCOS risk. However, key parameters (${missing.join(", ")}) are missing. Rotterdam criteria assessment requires evaluation of menstrual patterns, androgen levels, and ovarian morphology. Clinical evaluation recommended.`
      : `Available data does not indicate elevated PCOS screening risk. Current hormonal and symptom profile does not show patterns commonly associated with PCOS. This is a screening assessment only — not a diagnosis.`;
  }

  const factorNames = positiveFactors.map((f) => f.name).join(", ");

  switch (riskLevel) {
    case "elevated":
      return `Elevated screening risk is associated with findings in: ${factorNames}. Multiple Rotterdam criteria-aligned indicators are present. Clinical evaluation by a qualified healthcare professional is recommended for proper diagnosis, which may include pelvic ultrasound. This is a screening result, not a diagnosis.`;
    case "intermediate":
      return `Intermediate screening risk noted. Some PCOS-associated indicators present: ${factorNames}. These findings warrant further evaluation. PCOS diagnosis requires meeting 2 of 3 Rotterdam criteria, which may include ultrasound assessment. Please consult a healthcare provider.`;
    default:
      return `Low screening risk. Some variation noted in ${factorNames}, but overall pattern does not strongly suggest PCOS. Routine monitoring is recommended. Please consult a healthcare provider if symptoms develop or persist.`;
  }
}

// ============================================================
// COMBINED SCREENING
// ============================================================
export function screenCombined(
  thyroidResult: ScreeningOutput,
  pcosResult: ScreeningOutput
): ScreeningOutput {
  const hasOverlap =
    thyroidResult.riskLevel !== "low" && pcosResult.riskLevel !== "low";
  const maxRisk = Math.max(thyroidResult.riskScore, pcosResult.riskScore);
  const riskLevel =
    maxRisk >= 55 ? "elevated" : maxRisk >= 25 ? "intermediate" : "low";

  const summary = hasOverlap
    ? `Both thyroid and PCOS screening suggest possible findings that may benefit from clinical evaluation. Thyroid dysfunction and PCOS can co-occur, and thyroid abnormalities can mimic or exacerbate PCOS-like symptoms. A qualified healthcare professional should evaluate both conditions. This is a screening result, not a diagnosis.`
    : `Screening results for both conditions have been assessed separately. The combined view does not indicate significant overlap requiring dual investigation. Continue routine monitoring. This is a screening assessment only.`;

  return {
    condition: "combined",
    riskLevel,
    riskScore: Math.round(((thyroidResult?.riskScore || 0) + (pcosResult?.riskScore || 0)) / 2),
    confidence: Math.min(thyroidResult?.confidence || 0, pcosResult?.confidence || 0),
    factors: [
      ...(thyroidResult?.factors || []).filter((f) => f.impact === "positive").slice(0, 3),
      ...(pcosResult?.factors || []).filter((f) => f.impact === "positive").slice(0, 3),
    ],
    summary,
    dataQuality: ((thyroidResult?.dataQuality || 1) + (pcosResult?.dataQuality || 1)) / 2,
    missingData: [...new Set([...(thyroidResult?.missingData || []), ...(pcosResult?.missingData || [])])],
    dataQualityIssues: [
      ...(thyroidResult?.dataQualityIssues || []),
      ...(pcosResult?.dataQualityIssues || []),
    ],
  };
}
