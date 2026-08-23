// Clinical Screening Platform - Type Definitions

export interface Patient {
  id: string;
  name: string;
  age: number;
  gender: string;
  phoneNumber?: string;
  email?: string;
  medicalHistory?: string;
  notes?: string;
  // Physical vitals
  weight?: number;         // kg
  height?: number;         // cm
  bmi?: number;
  bloodPressureSystolic?: number;   // mmHg
  bloodPressureDiastolic?: number;  // mmHg
  fastingBloodSugar?: number;       // mg/dL
  // Reproductive / PCOS indicators
  menstrualCycleLength?: number;    // days
  menstrualRegularity?: string;     // "regular", "irregular", "absent"
  hairGrowthPattern?: string;       // "normal", "mild_hirsutism", "moderate_hirsutism", "severe_hirsutism"
  skinDarkening?: string;          // "none", "mild_acanthosis", "moderate_acanthosis", "severe_acanthosis"
  follicleCount?: number;          // per ovary
  insulinResistance?: string;      // "none", "mild", "moderate", "severe"
  createdAt: string;
  updatedAt: string;
  reports?: MedicalReport[];
  symptoms?: SymptomEntry[];
  screeningResults?: ScreeningResult[];
  predictions?: Prediction[];
}

export interface MedicalReport {
  id: string;
  patientId: string;
  reportDate: string;
  reportType: string;
  fileName?: string;
  fileType?: string;
  fileData?: string;
  ocrExtracted?: string;
  ocrConfidence?: number;
  status: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  labValues?: LabValue[];
}

export interface LabValue {
  id: string;
  reportId: string;
  testName: string;
  result?: number;
  resultText?: string;
  unit?: string;
  referenceLow?: number;
  referenceHigh?: number;
  referenceText?: string;
  isAbnormal: boolean;
  confidence?: number;
  isVerified: boolean;
  category?: string;
  notes?: string;
  createdAt: string;
}

export interface SymptomEntry {
  id: string;
  patientId: string;
  symptomName: string;
  severity: "mild" | "moderate" | "severe" | "none";
  dateReported: string;
  notes?: string;
  category?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ScreeningResult {
  id: string;
  patientId: string;
  reportId?: string;
  condition: "thyroid" | "pcos" | "combined";
  riskLevel: "low" | "intermediate" | "elevated";
  riskScore?: number;
  confidence?: number;
  factors: string; // JSON
  summary?: string;
  dataQuality?: number;
  missingData?: string; // JSON
  createdAt: string;
}

export interface Prediction {
  id: string;
  patientId: string;
  reportId?: string;
  thyroidPrediction: string;   // "Positive" | "Negative"
  thyroidProbability: number;  // 0-1
  pcosPrediction: string;      // "Positive" | "Negative"
  pcosProbability: number;     // 0-1
  modelUsed: string;            // "DecisionTree" | "RandomForest" | "SVM" | "XGBoost" | "Ensemble"
  modelAccuracy?: number;
  modelVersion?: string;
  topFeatures: string;          // JSON
  preprocessingLog?: string;   // JSON
  dataQualityScore?: number;
  detailedReport?: string;
  suggestedPrecautions?: string; // JSON
  createdAt: string;
}

export interface ScreeningFactor {
  name: string;
  value: string | number;
  impact: "positive" | "negative" | "neutral";
  weight: number;
  description: string;
}

export interface DataQualityIssue {
  field: string;
  severity: "warning" | "error" | "info";
  message: string;
}

export type ViewType =
  | "dashboard"
  | "patients"
  | "patient-detail"
  | "upload-report"
  | "screening"
  | "prediction"
  | "trends"
  | "admin";

// Reference ranges for common lab tests
export const THYROID_REFERENCE_RANGES: Record<string, { low: number; high: number; unit: string }> = {
  TSH: { low: 0.4, high: 4.0, unit: "mIU/L" },
  "Free T4": { low: 0.8, high: 1.8, unit: "ng/dL" },
  "Free T3": { low: 2.3, high: 4.2, unit: "pg/mL" },
  "Total T4": { low: 5.0, high: 12.0, unit: "μg/dL" },
  "Total T3": { low: 80.0, high: 200.0, unit: "ng/dL" },
  "TPO Antibodies": { low: 0, high: 35, unit: "IU/mL" },
  "Tg Antibodies": { low: 0, high: 40, unit: "IU/mL" },
  "TSH Receptor Antibodies": { low: 0, high: 1.75, unit: "IU/L" },
};

export const PCOS_REFERENCE_RANGES: Record<string, { low: number; high: number; unit: string }> = {
  LH: { low: 1.68, high: 15.0, unit: "mIU/mL" },
  FSH: { low: 3.03, high: 8.08, unit: "mIU/mL" },
  "LH/FSH Ratio": { low: 0.5, high: 2.0, unit: "ratio" },
  "Total Testosterone": { low: 15, high: 70, unit: "ng/dL" },
  "Free Testosterone": { low: 0.3, high: 1.9, unit: "pg/mL" },
  DHEAS: { low: 35, high: 430, unit: "μg/dL" },
  SHBG: { low: 18, high: 144, unit: "nmol/L" },
  Prolactin: { low: 3.0, high: 18.6, unit: "ng/mL" },
  "Fasting Glucose": { low: 70, high: 100, unit: "mg/dL" },
  HbA1c: { low: 4.0, high: 5.6, unit: "%" },
  "Total Cholesterol": { low: 0, high: 200, unit: "mg/dL" },
  HDL: { low: 40, high: 100, unit: "mg/dL" },
  LDL: { low: 0, high: 130, unit: "mg/dL" },
  Triglycerides: { low: 0, high: 150, unit: "mg/dL" },
  Insulin: { low: 2.6, high: 24.9, unit: "μIU/mL" },
  "17-OH Progesterone": { low: 0.2, high: 1.5, unit: "ng/mL" },
  Cortisol: { low: 6.0, high: 19.0, unit: "μg/dL" },
  Estradiol: { low: 12.5, high: 166.0, unit: "pg/mL" },
  Progesterone: { low: 0.2, high: 1.5, unit: "ng/mL" },
};

export const SYMPTOM_CATEGORIES = {
  menstrual: [
    "Irregular periods",
    "Missed periods",
    "Heavy periods (menorrhagia)",
    "Light periods",
    "Period pain (dysmenorrhea)",
  ],
  dermatological: [
    "Excess facial hair (hirsutism)",
    "Body hair excess",
    "Acne",
    "Oily skin",
    "Hair thinning/loss",
    "Acanthosis nigricans",
  ],
  weight: [
    "Unexplained weight gain",
    "Difficulty losing weight",
    "Unexplained weight loss",
    "Difficulty gaining weight",
  ],
  reproductive: [
    "Difficulty conceiving",
    "Infertility",
    "Recurrent miscarriages",
  ],
  energy: [
    "Fatigue",
    "Low energy",
    "Sleep disturbances",
    "Brain fog",
    "Depression",
    "Anxiety",
    "Mood swings",
  ],
  other: [
    "Cold intolerance",
    "Heat intolerance",
    "Sweating",
    "Tremors",
    "Palpitations",
    "Constipation",
    "Frequent urination",
    "Thirst",
    "Dry skin",
    "Puffy face",
    "Swollen neck/goiter",
    "Joint pain",
  ],
};
