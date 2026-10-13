/**
 * Data Preprocessing Module for Clinical Screening Platform
 * 
 * Handles data quality assurance, missing value imputation, deduplication,
 * outlier detection, feature scaling, normalization, and categorical encoding.
 * 
 * Clinical references:
 * - ATA Guidelines for Thyroid Nodules and Thyroid Cancer (2015)
 * - Rotterdam ESHRE/ASRM-Sponsored PCOS Consensus Workshop Group (2004)
 * - WHO Laboratory Quality Standards (2011)
 */

// ============================================================================
// Types
// ============================================================================

/** Patient clinical data fields expected by the preprocessing pipeline */
export interface PatientData {
  id?: string;
  name?: string;
  age?: number;
  gender?: string;
  weight?: number;
  height?: number;
  bmi?: number;
  bloodPressureSystolic?: number;
  bloodPressureDiastolic?: number;
  fastingBloodSugar?: number;
  menstrualCycleLength?: number;
  menstrualRegularity?: string;
  hairGrowthPattern?: string;
  skinDarkening?: string;
  follicleCount?: number;
  insulinResistance?: string;
  [key: string]: any;
}

/** Single lab test result */
export interface LabValue {
  testName: string;
  result: number;
  unit: string;
  referenceLow?: number;
  referenceHigh?: number;
  isAbnormal?: boolean;
  category?: string;
}

/** Complete result of the preprocessing pipeline */
export interface PreprocessingResult {
  steps: string[];
  missingFields: { field: string; strategy: string }[];
  duplicatesRemoved: number;
  outliers: { field: string; value: number; expectedRange: string }[];
  cleanedLabValues: any[];
  scaledFeatures: Record<string, number>;
  normalizedFeatures: Record<string, number>;
  encodedData: Record<string, number>;
  qualityScore: number; // 0-1
  warnings: string[];
}

// ============================================================================
// Constants – clinical reference ranges for outlier detection
// ============================================================================

/** 
 * Expected physiological ranges used for outlier flagging.
 * Values outside these ranges are physiologically implausible and likely errors.
 * 
 * References:
 * - Tietz Textbook of Clinical Chemistry (5th ed.)
 * - Henry's Clinical Diagnosis and Management by Laboratory Methods (23rd ed.)
 */
const PHYSIOLOGICAL_RANGES: Record<string, { min: number; max: number }> = {
  age: { min: 0, max: 120 },
  weight: { min: 20, max: 300 },         // kg
  height: { min: 50, max: 250 },          // cm
  bmi: { min: 10, max: 70 },              // kg/m²
  bloodPressureSystolic: { min: 60, max: 250 },
  bloodPressureDiastolic: { min: 30, max: 150 },
  fastingBloodSugar: { min: 30, max: 500 }, // mg/dL
  menstrualCycleLength: { min: 15, max: 60 }, // days
  follicleCount: { min: 0, max: 60 },     // per ovary (AFC)
};

/** Lab test name aliases for standardization */
const LAB_NAME_ALIASES: Record<string, string> = {
  'tsh': 'TSH',
  'thyroid stimulating hormone': 'TSH',
  'free t4': 'Free T4',
  'ft4': 'Free T4',
  'free thyroxine': 'Free T4',
  'free t3': 'Free T3',
  'ft3': 'Free T3',
  'free triiodothyronine': 'Free T3',
  'total t4': 'Total T4',
  'total t3': 'Total T3',
  'tpo antibodies': 'TPO Antibodies',
  'anti-tpo': 'TPO Antibodies',
  'tg antibodies': 'Tg Antibodies',
  'anti-tg': 'Tg Antibodies',
  'lh': 'LH',
  'fsh': 'FSH',
  'testosterone': 'Testosterone',
  'total testosterone': 'Testosterone',
  'free testosterone': 'Free Testosterone',
  'dheas': 'DHEAS',
  'shbg': 'SHBG',
  'prolactin': 'Prolactin',
  'estradiol': 'E2',
  'e2': 'Estradiol',
  'progesterone': 'Progesterone',
  'insulin': 'Insulin',
  'fasting insulin': 'Insulin',
  'hba1c': 'HbA1c',
  'hdl': 'HDL Cholesterol',
  'ldl': 'LDL Cholesterol',
  'triglycerides': 'Triglycerides',
  'total cholesterol': 'Total Cholesterol',
};

// ============================================================================
// Missing Value Handling
// ============================================================================

/**
 * Identifies missing fields in patient data and lab values, then suggests
 * clinically appropriate imputation strategies.
 * 
 * Imputation strategies follow TRIPOD guidelines for clinical prediction models:
 * - Continuous vitals: median imputation (robust to skew)
 * - Categorical fields: mode imputation (most frequent category)
 * - Lab values: no imputation (flag as missing; model must handle)
 * - Derived fields (BMI): recompute if possible
 * 
 * @param patientData - Raw patient demographic and clinical data
 * @param labValues - Array of lab test results
 * @returns Array of missing field descriptors with suggested strategies
 */
export function handleMissingValues(
  patientData: PatientData,
  labValues: LabValue[]
): { field: string; strategy: string }[] {
  const missing: { field: string; strategy: string }[] = [];

  // --- Critical patient fields ---
  const criticalNumericFields: { field: keyof PatientData; label: string; defaultImpute: number }[] = [
    { field: 'age', label: 'Age', defaultImpute: 30 },
    { field: 'weight', label: 'Weight (kg)', defaultImpute: 65 },
    { field: 'height', label: 'Height (cm)', defaultImpute: 165 },
  { field: 'bloodPressureSystolic', label: 'Systolic BP', defaultImpute: 120 },
    { field: 'bloodPressureDiastolic', label: 'Diastolic BP', defaultImpute: 80 },
    { field: 'fastingBloodSugar', label: 'Fasting Blood Sugar', defaultImpute: 90 },
  { field: 'menstrualCycleLength', label: 'Menstrual Cycle Length', defaultImpute: 28 },
    { field: 'follicleCount', label: 'Follicle Count', defaultImpute: 8 },
  ];

  for (const { field, label, defaultImpute } of criticalNumericFields) {
    const val = patientData[field];
    if (val === undefined || val === null || val === '') {
      missing.push({
        field: label,
        strategy: `Median imputation (suggested default: ${defaultImpute}). Clinical reference: population median for adult patients.`,
      });
    }
  }

  // --- BMI can be derived ---
  if (!patientData.bmi && patientData.weight && patientData.height) {
    missing.push({
      field: 'BMI',
      strategy: 'Derivable from weight and height. Compute: BMI = weight(kg) / height(m)².',
    });
  } else if (!patientData.bmi && (!patientData.weight || !patientData.height)) {
    missing.push({
      field: 'BMI',
      strategy: 'Cannot derive: both weight and height are missing. Suggest median imputation (default: 24.0).',
    });
  }

  // --- Categorical fields ---
  const categoricalFields: { field: keyof PatientData; label: string; defaultVal: string }[] = [
    { field: 'gender', label: 'Gender', defaultVal: 'Female' },
    { field: 'menstrualRegularity', label: 'Menstrual Regularity', defaultVal: 'Regular' },
    { field: 'hairGrowthPattern', label: 'Hair Growth Pattern', defaultVal: 'Normal' },
    { field: 'skinDarkening', label: 'Skin Darkening (Acanthosis Nigricans)', defaultVal: 'None' },
    { field: 'insulinResistance', label: 'Insulin Resistance', defaultVal: 'No' },
  ];

  for (const { field, label, defaultVal } of categoricalFields) {
    const val = patientData[field];
    if (val === undefined || val === null || val === '') {
      missing.push({
        field: label,
        strategy: `Mode imputation (suggested default: "${defaultVal}"). Based on most common presentation in clinical cohorts.`,
      });
    }
  }

  // --- Critical lab tests for thyroid and PCOS screening ---
  // Reference: ATA Guidelines (2015); Rotterdam Criteria (2004)
  const criticalLabs = [
    { name: 'TSH', importance: 'Essential for thyroid dysfunction screening (ATA Guidelines)' },
    { name: 'Free T4', importance: 'Required to classify hypothyroidism vs. hyperthyroidism' },
    { name: 'Free T3', importance: 'Helps identify T3 toxicosis; supports thyroid assessment' },
    { name: 'LH', importance: 'Key component of LH/FSH ratio for PCOS (Rotterdam Criteria)' },
    { name: 'FSH', importance: 'Paired with LH to compute LH/FSH ratio' },
    { name: 'Testosterone', importance: 'Hyperandrogenism marker per Rotterdam Criteria' },
    { name: 'Prolactin', importance: 'Differential diagnosis for menstrual irregularity' },
    { name: 'Insulin', importance: 'HOMA-IR calculation for metabolic assessment in PCOS' },
  ];

  const availableLabNames = new Set(
    labValues.map(l => LAB_NAME_ALIASES[l.testName.toLowerCase().trim()] || l.testName)
  );

  for (const lab of criticalLabs) {
    if (!availableLabNames.has(lab.name)) {
      missing.push({
        field: `Lab: ${lab.name}`,
        strategy: `No imputation recommended for lab values. ${lab.importance}. Flag as unavailable; model predictions will have reduced confidence.`,
      });
    }
  }

  return missing;
}

// ============================================================================
// Deduplication
// ============================================================================

/**
 * Detects and removes duplicate lab values based on test name.
 * Keeps the most recent entry (last occurrence) and discards earlier duplicates.
 * 
 * In clinical workflows, duplicate lab entries often arise from:
 * - Repeat orders within the same encounter
 * - Manual re-entry of results
 * - Interface engine double-transmission (HL7 duplicates)
 * 
 * @param labValues - Array of lab test results (may contain duplicates)
 * @returns Cleaned array with duplicates removed
 */
export function removeDuplicateLabValues(labValues: LabValue[]): LabValue[] {
  const seen = new Map<string, LabValue>();

  for (const lab of labValues) {
    // Normalize the test name using alias lookup
    const normalized = LAB_NAME_ALIASES[lab.testName.toLowerCase().trim()] || lab.testName;

    // Keep the latest occurrence (overwrites earlier entries)
    seen.set(normalized, { ...lab, testName: normalized });
  }

  return Array.from(seen.values());
}

// ============================================================================
// Data Cleaning & Outlier Detection
// ============================================================================

/**
 * Validates clinical data ranges and flags outliers.
 * 
 * Outlier detection uses a two-tier approach:
 * 1. Hard limits (physiological impossibility) – values that cannot occur in living patients
 * 2. Soft limits (clinical suspicion) – values that are technically possible but warrant verification
 * 
 * Lab values are checked against their own reference ranges (referenceLow/referenceHigh)
 * as well as hard physiological limits.
 * 
 * @param patientData - Raw patient data
 * @param labValues - Array of lab test results
 * @returns Object containing cleaned lab values, detected outliers, and warnings
 */
export function cleanData(
  patientData: PatientData,
  labValues: LabValue[]
): {
  cleanedLabValues: any[];
  outliers: { field: string; value: number; expectedRange: string }[];
  warnings: string[];
} {
  const outliers: { field: string; value: number; expectedRange: string }[] = [];
  const warnings: string[] = [];

  // --- Validate patient numeric fields against physiological ranges ---
  for (const [field, range] of Object.entries(PHYSIOLOGICAL_RANGES)) {
    const value = patientData[field];
    if (value !== undefined && value !== null && typeof value === 'number') {
      if (value < range.min || value > range.max) {
        outliers.push({
          field,
          value,
          expectedRange: `${range.min} - ${range.max}`,
        });
        warnings.push(
          `OUTLIER: ${field} = ${value} is outside physiological range [${range.min}, ${range.max}]. Verify data entry.`
        );
      }
    }
  }

  // --- Validate lab values ---
  const cleanedLabValues: any[] = [];

  // Hard physiological limits for common lab tests
  // Reference: Tietz Textbook of Clinical Chemistry (5th ed.)
  const labPhysiologicalLimits: Record<string, { min: number; max: number; unit: string }> = {
    'TSH': { min: 0.001, max: 100, unit: 'mIU/L' },
    'Free T4': { min: 0.1, max: 10, unit: 'ng/dL' },
    'Free T3': { min: 0.1, max: 10, unit: 'pg/mL' },
    'Total T4': { min: 1, max: 25, unit: 'μg/dL' },
    'Total T3': { min: 10, max: 500, unit: 'ng/dL' },
    'TPO Antibodies': { min: 0, max: 2000, unit: 'IU/mL' },
    'Tg Antibodies': { min: 0, max: 3000, unit: 'IU/mL' },
    'LH': { min: 0.1, max: 100, unit: 'mIU/mL' },
    'FSH': { min: 0.1, max: 100, unit: 'mIU/mL' },
    'Testosterone': { min: 0, max: 20, unit: 'ng/mL' },
    'Free Testosterone': { min: 0, max: 5, unit: 'pg/mL' },
    'DHEAS': { min: 0, max: 1000, unit: 'μg/dL' },
    'SHBG': { min: 5, max: 300, unit: 'nmol/L' },
    'Prolactin': { min: 0, max: 500, unit: 'ng/mL' },
    'Estradiol': { min: 0, max: 1000, unit: 'pg/mL' },
    'Progesterone': { min: 0, max: 50, unit: 'ng/mL' },
    'Insulin': { min: 0, max: 500, unit: 'μIU/mL' },
    'HbA1c': { min: 3, max: 18, unit: '%' },
    'HDL Cholesterol': { min: 10, max: 120, unit: 'mg/dL' },
    'LDL Cholesterol': { min: 10, max: 400, unit: 'mg/dL' },
    'Triglycerides': { min: 10, max: 2000, unit: 'mg/dL' },
    'Total Cholesterol': { min: 50, max: 500, unit: 'mg/dL' },
  };

  for (const lab of labValues) {
    const testName = LAB_NAME_ALIASES[lab.testName.toLowerCase().trim()] || lab.testName;
    const limits = labPhysiologicalLimits[testName];

    let isValid = true;

    if (limits) {
      if (lab.result < limits.min || lab.result > limits.max) {
        outliers.push({
          field: `Lab: ${testName}`,
          value: lab.result,
          expectedRange: `${limits.min} - ${limits.max} ${limits.unit} (physiological)`,
        });
        warnings.push(
          `OUTLIER: ${testName} = ${lab.result} ${lab.unit} is outside physiological range. Verify lab result.`
        );
        // Still include but flag
        isValid = false;
      }
    }

    // Check against test-specific reference range if provided
    if (lab.referenceLow !== undefined && lab.referenceHigh !== undefined) {
      lab.isAbnormal = lab.result < lab.referenceLow || lab.result > lab.referenceHigh;
    }

    cleanedLabValues.push({
      ...lab,
      testName,
      isPhysiologicallyValid: isValid,
    });
  }

  // --- Additional clinical warnings ---
  if (patientData.gender === 'Male' && (patientData.menstrualCycleLength || patientData.menstrualRegularity)) {
    warnings.push('WARNING: Menstrual data provided for male patient. These fields are typically not applicable.');
  }

  if (patientData.age !== undefined && patientData.age < 12 && patientData.follicleCount !== undefined) {
    warnings.push('WARNING: Follicle count in pre-pubertal patient may not be clinically meaningful.');
  }

  return { cleanedLabValues, outliers, warnings };
}

// ============================================================================
// Feature Scaling (Min-Max)
// ============================================================================

/**
 * Applies min-max scaling to transform features to the [0, 1] range.
 * 
 * Formula: x_scaled = (x - x_min) / (x_max - x_min)
 * 
 * This is particularly useful for algorithms that assume bounded input ranges
 * (e.g., neural networks, KNN). Not recommended when outliers are present
 * (use normalization instead).
 * 
 * @param features - Record of feature name to numeric value
 * @returns Record of feature name to scaled value in [0, 1]
 */
export function scaleFeatures(features: Record<string, number>): Record<string, number> {
  const keys = Object.keys(features);
  if (keys.length === 0) return {};

  const scaled: Record<string, number> = {};

  // Compute min/max for each feature
  for (const key of keys) {
    const value = features[key];
    if (typeof value !== 'number' || isNaN(value)) {
      scaled[key] = 0;
      continue;
    }
    scaled[key] = value; // Will be rescaled below
  }

  // Min-max scaling: x' = (x - min) / (max - min)
  const values = Object.values(scaled).filter(v => typeof v === 'number' && !isNaN(v));
  if (values.length === 0) return {};

  const min = Math.min(...values);
  const max = Math.max(...values);

  const range = max - min;
  if (range === 0) {
    // All values are the same; map to 0.5 (neutral)
    for (const key of keys) {
      scaled[key] = 0.5;
    }
    return scaled;
  }

  for (const key of keys) {
    const value = features[key];
    if (typeof value !== 'number' || isNaN(value)) {
      scaled[key] = 0;
    } else {
      scaled[key] = (value - min) / range;
    }
  }

  return scaled;
}

// ============================================================================
// Feature Normalization (Z-Score)
// ============================================================================

/**
 * Applies Z-score (standard score) normalization to features.
 * 
 * Formula: z = (x - μ) / σ
 * 
 * Z-score normalization centers the data at 0 with standard deviation 1.
 * This is preferred when the data contains outliers, as it preserves
 * the relative distances between all data points.
 * 
 * Useful for: SVM, logistic regression, and distance-based methods.
 * 
 * @param features - Record of feature name to numeric value
 * @returns Record of feature name to Z-score normalized value
 */
export function normalizeFeatures(features: Record<string, number>): Record<string, number> {
  const keys = Object.keys(features);
  if (keys.length === 0) return {};

  const normalized: Record<string, number> = {};
  const values = keys
    .map(k => features[k])
    .filter((v): v is number => typeof v === 'number' && !isNaN(v));

  if (values.length === 0) return {};

  // Compute mean (μ)
  const mean = values.reduce((sum, v) => sum + v, 0) / values.length;

  // Compute standard deviation (σ)
  const variance = values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length;
  const stdDev = Math.sqrt(variance);

  for (const key of keys) {
    const value = features[key];
    if (typeof value !== 'number' || isNaN(value)) {
      normalized[key] = 0;
    } else if (stdDev === 0) {
      // Zero variance: all values identical, map to 0
      normalized[key] = 0;
    } else {
      normalized[key] = (value - mean) / stdDev;
    }
  }

  return normalized;
}

// ============================================================================
// Categorical Encoding
// ============================================================================

/**
 * Encodes categorical patient data fields into numeric representations
 * suitable for ML model input.
 * 
 * Encoding scheme:
 * - Gender: 0 = Female, 1 = Male (binary; thyroid/PCOS screening primarily targets females)
 * - Menstrual Regularity: 0 = Regular, 1 = Irregular, 2 = Absent/Amenorrhea
 *   (ordinal encoding reflects clinical severity)
 * - Hair Growth Pattern (Hirsutism): 0 = Normal, 1 = Mild, 2 = Moderate, 3 = Severe
 *   (ordinal; based on Ferriman-Gallwey score categories)
 * - Skin Darkening (Acanthosis Nigricans): 0 = None, 1 = Mild, 2 = Moderate, 3 = Severe
 *   (ordinal; reflects insulin resistance severity)
 * - Insulin Resistance: 0 = No, 1 = Borderline, 2 = Yes
 *   (ordinal; clinical classification)
 * 
 * References:
 * - Ferriman-Gallwey scoring for hirsutism (1961)
 * - Acanthosis nigricans grading (Burke et al., 1999)
 * - HOMA-IR thresholds for insulin resistance (Matthews et al., 1985)
 * 
 * @param patientData - Patient data with categorical fields
 * @returns Record mapping encoded field names to their numeric values
 */
export function encodeCategoricalData(patientData: PatientData): Record<string, number> {
  const encoded: Record<string, number> = {};

  // --- Gender encoding (binary) ---
  // Clinical context: Thyroid disorders and PCOS predominantly affect females,
  // but males can also have thyroid conditions. Gender is a relevant covariate.
  switch ((patientData.gender || '').toLowerCase()) {
    case 'male':
    case 'm':
      encoded['gender'] = 1;
      break;
    case 'female':
    case 'f':
    default:
      encoded['gender'] = 0;
      break;
  }

  // --- Menstrual Regularity (ordinal, 0-2) ---
  // Rotterdam Criteria: oligomenorrhea or amenorrhea is a diagnostic criterion for PCOS
  switch ((patientData.menstrualRegularity || '').toLowerCase()) {
    case 'absent':
    case 'amenorrhea':
    case 'none':
      encoded['menstrualRegularity'] = 2;
      break;
    case 'irregular':
    case 'oligomenorrhea':
      encoded['menstrualRegularity'] = 1;
      break;
    case 'regular':
    case 'eumenorrhea':
    default:
      encoded['menstrualRegularity'] = 0;
      break;
  }

  // --- Hair Growth Pattern / Hirsutism (ordinal, 0-3) ---
  // Based on Ferriman-Gallwey score categories:
  // 0 = Normal (FG score < 8), 1 = Mild (8-15), 2 = Moderate (16-24), 3 = Severe (> 24)
  switch ((patientData.hairGrowthPattern || '').toLowerCase()) {
    case 'severe':
    case 'marked':
      encoded['hairGrowthPattern'] = 3;
      break;
    case 'moderate':
      encoded['hairGrowthPattern'] = 2;
      break;
    case 'mild':
    case 'slight':
      encoded['hairGrowthPattern'] = 1;
      break;
    case 'normal':
    case 'none':
    default:
      encoded['hairGrowthPattern'] = 0;
      break;
  }

  // --- Skin Darkening / Acanthosis Nigricans (ordinal, 0-3) ---
  // Acanthosis nigricans is a clinical marker of insulin resistance,
  // commonly associated with PCOS and metabolic syndrome.
  // Burke et al. (1999) grading scale
  switch ((patientData.skinDarkening || '').toLowerCase()) {
    case 'severe':
      encoded['skinDarkening'] = 3;
      break;
    case 'moderate':
      encoded['skinDarkening'] = 2;
      break;
    case 'mild':
    case 'slight':
      encoded['skinDarkening'] = 1;
      break;
    case 'none':
    case 'absent':
    default:
      encoded['skinDarkening'] = 0;
      break;
  }

  // --- Insulin Resistance (ordinal, 0-2) ---
  // HOMA-IR > 2.5 is commonly used as threshold for insulin resistance
  switch ((patientData.insulinResistance || '').toLowerCase()) {
    case 'yes':
    case 'positive':
    case 'high':
      encoded['insulinResistance'] = 2;
      break;
    case 'borderline':
    case 'mild':
    case 'moderate':
      encoded['insulinResistance'] = 1;
      break;
    case 'no':
    case 'negative':
    case 'normal':
    default:
      encoded['insulinResistance'] = 0;
      break;
  }

  return encoded;
}

// ============================================================================
// Main Pipeline: Full Preprocessing
// ============================================================================

/**
 * Runs the complete preprocessing pipeline on patient data and lab values.
 * 
 * Pipeline steps:
 * 1. Handle missing values – identify and suggest imputation
 * 2. Remove duplicate lab entries
 * 3. Clean data – validate ranges, flag outliers
 * 4. Scale features (min-max to [0, 1])
 * 5. Normalize features (z-score)
 * 6. Encode categorical data to numeric
 * 
 * @param patientData - Raw patient demographic and clinical data
 * @param labValues - Array of lab test results
 * @returns Complete PreprocessingResult with all intermediate outputs
 */
export function runPreprocessingPipeline(
  patientData: PatientData,
  labValues: LabValue[]
): PreprocessingResult {
  const steps: string[] = [];
  const warnings: string[] = [];

  // Step 1: Identify missing values
  steps.push('Missing value analysis');
  const missingFields = handleMissingValues(patientData, labValues);

  // Step 2: Remove duplicates
  steps.push('Duplicate lab value removal');
  const deduplicatedLabs = removeDuplicateLabValues(labValues);
  const duplicatesRemoved = labValues.length - deduplicatedLabs.length;

  if (duplicatesRemoved > 0) {
    warnings.push(`Removed ${duplicatesRemoved} duplicate lab entry(ies).`);
  }

  // Step 3: Clean data – validate ranges, detect outliers
  steps.push('Data cleaning and outlier detection');
  const { cleanedLabValues, outliers, warnings: cleaningWarnings } = cleanData(patientData, deduplicatedLabs);
  warnings.push(...cleaningWarnings);

  // Step 4: Extract numeric features for scaling/normalization
  steps.push('Feature extraction');
  const numericFeatures: Record<string, number> = {};

  // Patient numeric fields
  const numericKeys: (keyof PatientData)[] = [
    'age', 'weight', 'height', 'bmi',
    'bloodPressureSystolic', 'bloodPressureDiastolic',
    'fastingBloodSugar', 'menstrualCycleLength', 'follicleCount',
  ];

  for (const key of numericKeys) {
    const val = patientData[key];
    if (typeof val === 'number' && !isNaN(val)) {
      numericFeatures[key as string] = val;
    }
  }

  // Lab values (numeric results)
  for (const lab of cleanedLabValues) {
    if (typeof lab.result === 'number' && !isNaN(lab.result)) {
      // Use camelCase version of test name as feature key
      const featureKey = lab.testName
        .replace(/[^a-zA-Z0-9]/g, '')
        .replace(/^[A-Z]/, c => c.toLowerCase());
      numericFeatures[featureKey] = lab.result;
    }
  }

  // Step 5: Scale features (min-max)
  steps.push('Min-max feature scaling (0-1)');
  const scaledFeatures = scaleFeatures(numericFeatures);

  // Step 6: Normalize features (z-score)
  steps.push('Z-score feature normalization');
  const normalizedFeatures = normalizeFeatures(numericFeatures);

  // Step 7: Encode categorical data
  steps.push('Categorical data encoding');
  const encodedData = encodeCategoricalData(patientData);

  // --- Compute quality score (0-1) ---
  // Quality is based on:
  // - % of critical fields present (weight: 0.3)
  // - Absence of outliers (weight: 0.3)
  // - Absence of duplicates (weight: 0.1)
  // - % of critical lab tests present (weight: 0.3)
  const totalCriticalFields = 10; // age, weight, height, BP sys, BP dia, FBS, cycle length, gender, menstrual reg, hair growth
  const presentCriticalFields = totalCriticalFields - missingFields.filter(
    m => !m.field.startsWith('Lab:') && !m.field.includes('BMI')
  ).length;
  const fieldCoverage = presentCriticalFields / totalCriticalFields;

  const outlierPenalty = Math.min(outliers.length * 0.1, 0.3);
  const duplicatePenalty = duplicatesRemoved > 0 ? 0.1 : 0;

  const totalCriticalLabs = 8;
  const missingLabs = missingFields.filter(m => m.field.startsWith('Lab:')).length;
  const labCoverage = (totalCriticalLabs - missingLabs) / totalCriticalLabs;

  const qualityScore = Math.max(0, Math.min(1,
    fieldCoverage * 0.3 +
    (1 - outlierPenalty) * 0.3 +
    (1 - duplicatePenalty) * 0.1 +
    labCoverage * 0.3
  ));

  return {
    steps,
    missingFields,
    duplicatesRemoved,
    outliers,
    cleanedLabValues,
    scaledFeatures,
    normalizedFeatures,
    encodedData,
    qualityScore,
    warnings,
  };
}
