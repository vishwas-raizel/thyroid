/**
 * Feature Selection Module for Clinical Screening Platform
 * 
 * Ranks and selects the most clinically relevant features for thyroid disorder
 * and PCOS prediction. Importance weights are derived from clinical evidence
 * and guideline recommendations.
 * 
 * Clinical references:
 * - ATA/AACE Guidelines for Diagnosis and Management of Hyperthyroidism (2011)
 * - ATA Guidelines for Diagnosis and Management of Hypothyroidism (2012)
 * - Rotterdam ESHRE/ASRM-Sponsored PCOS Consensus Workshop Group (2004)
 * - Endocrine Society Clinical Practice Guideline for PCOS (2013)
 * - Androgen Excess and PCOS Society Criteria (2006)
 */

// ============================================================================
// Types
// ============================================================================

/** Single symptom entry from patient assessment */
export interface SymptomEntry {
  symptomName: string;
  severity: number;
  category?: string;
}

/** Patient clinical data (minimal interface needed) */
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

/** Lab test result */
export interface LabValue {
  testName: string;
  result: number;
  unit: string;
  referenceLow?: number;
  referenceHigh?: number;
  isAbnormal?: boolean;
  category?: string;
}

/** Feature importance descriptor for a single feature */
export interface FeatureImportance {
  feature: string;
  importance: number;       // 0-1
  category: 'thyroid' | 'pcos' | 'shared';
  available: boolean;
  value?: number | string;
  clinicalRelevance: string;
}

/** Complete feature selection result */
export interface FeatureSelectionResult {
  thyroidFeatures: FeatureImportance[];
  pcosFeatures: FeatureImportance[];
  sharedFeatures: FeatureImportance[];
  selectedFeatures: string[];
  correlationMatrix: Record<string, Record<string, number>>;
  totalFeaturesAvailable: number;
  featuresUsed: number;
  coverageScore: number; // what % of important features have data
}

// ============================================================================
// Constants – Clinical Feature Importance Weights
// ============================================================================

/**
 * Thyroid disorder feature importance weights.
 * 
 * These weights are based on the diagnostic algorithm in ATA Guidelines:
 * 1. First-line: TSH is the single most sensitive and specific test (Garber et al., 2012)
 * 2. Second-line: Free T4 confirms hypothyroid/hyperthyroid status
 * 3. Third-line: Free T3 helps identify T3 toxicosis (present in ~5% of hyperthyroidism)
 * 4. Antibodies: TPO antibodies confirm autoimmune etiology (Hashimoto's/Graves')
 * 5. Clinical: Weight changes, fatigue, and age are supporting factors
 * 
 * Weights are normalized to sum to 1.0 across all thyroid features.
 */
const THYROID_FEATURE_WEIGHTS: {
  feature: string;
  importance: number;
 clinicalRelevance: string;
  labTestName?: string;     // exact name to match in lab values
  patientField?: string;    // field name in patient data
  symptomName?: string;     // symptom name to match
}[] = [
  {
    feature: 'tsh',
    importance: 0.30,
    clinicalRelevance: 'TSH is the most sensitive first-line test for thyroid dysfunction. Normal TSH virtually excludes primary thyroid disease (ATA Guidelines, 2012). Sensitivity >99% for primary hypothyroidism.',
    labTestName: 'TSH',
  },
  {
    feature: 'freeT4',
    importance: 0.25,
    clinicalRelevance: 'Free T4 distinguishes subclinical from overt thyroid dysfunction. Low Free T4 with high TSH = overt hypothyroidism; high Free T4 with low TSH = overt hyperthyroidism (Garber et al., 2012).',
    labTestName: 'Free T4',
  },
  {
    feature: 'freeT3',
    importance: 0.15,
    clinicalRelevance: 'Free T3 identifies T3 toxicosis (~5% of hyperthyroidism). Useful when clinical hyperthyroidism is suspected but TSH/Free T4 are discordant (Ross et al., 2016).',
    labTestName: 'Free T3',
  },
  {
    feature: 'tpoAntibodies',
    importance: 0.10,
    clinicalRelevance: 'TPO antibodies confirm autoimmune thyroiditis (Hashimoto\'s). Present in 90-95% of Hashimoto\'s and 70-80% of Graves\' disease (Caturegli et al., 2014).',
    labTestName: 'TPO Antibodies',
  },
  {
    feature: 'thyroidSymptoms',
    importance: 0.10,
    clinicalRelevance: 'Clinical symptoms (weight changes, fatigue, cold/heat intolerance, palpitations) support laboratory findings. Symptoms alone have ~70% sensitivity for thyroid disease (Vaidya & Pearce, 2008).',
    symptomName: 'thyroid',
  },
  {
    feature: 'age',
    importance: 0.05,
    clinicalRelevance: 'Age modifies pre-test probability. Thyroid disorders peak in women 30-50 (hypothyroidism) and 20-40 (hyperthyroidism). Age-adjusted TSH ranges are debated (Surks & Hollowell, 2007).',
    patientField: 'age',
  },
  {
    feature: 'tgAntibodies',
    importance: 0.05,
    clinicalRelevance: 'Thyroglobulin antibodies are less sensitive than TPO antibodies for autoimmune thyroiditis but provide additional confirmation. Present in 60-80% of Hashimoto\'s (Gopalakrishnan & Marwaha, 2019).',
    labTestName: 'Tg Antibodies',
  },
];

/**
 * PCOS feature importance weights.
 * 
 * Based on Rotterdam Criteria (2004) which require 2 of 3:
 * 1. Oligo/anovulation (menstrual irregularity)
 * 2. Hyperandrogenism (clinical or biochemical)
 * 3. Polycystic ovarian morphology (follicle count)
 * 
 * Additional features reflect metabolic and endocrine associations:
 * - Insulin resistance: present in 70-80% of PCOS (Dunaif, 1997)
 * - LH/FSH ratio: elevated in ~60% of PCOS (Taylor, 1998)
 */
const PCOS_FEATURE_WEIGHTS: {
  feature: string;
  importance: number;
  clinicalRelevance: string;
  labTestName?: string;
  patientField?: string;
  symptomName?: string;
}[] = [
  {
    feature: 'lhFshRatio',
    importance: 0.20,
    clinicalRelevance: 'LH/FSH ratio > 2-3 is highly suggestive of PCOS. Reflects hypothalamic-pituitary dysregulation. Present in ~60% of PCOS patients (Taylor, 1998; Rotterdam Criteria, 2004).',
  },
  {
    feature: 'testosterone',
    importance: 0.15,
    clinicalRelevance: 'Elevated total testosterone is the primary biochemical marker of hyperandrogenism in PCOS. Rotterdam Criteria require biochemical or clinical hyperandrogenism (Azziz et al., 2004).',
    labTestName: 'Testosterone',
  },
  {
    feature: 'menstrualRegularity',
    importance: 0.15,
    clinicalRelevance: 'Oligomenorrhea (<8 cycles/year) or amenorrhea is a core diagnostic criterion for PCOS (Rotterdam, 2004). Reflects anovulatory dysfunction.',
    patientField: 'menstrualRegularity',
  },
  {
    feature: 'bmi',
    importance: 0.10,
    clinicalRelevance: 'BMI ≥ 25 is associated with worsened PCOS phenotype. Obesity amplifies insulin resistance and hyperandrogenism in PCOS (Moran et al., 2011). 50-60% of PCOS patients are overweight/obese.',
    patientField: 'bmi',
  },
  {
    feature: 'insulinResistance',
    importance: 0.10,
    clinicalRelevance: 'Insulin resistance (HOMA-IR > 2.5) is present in 70-80% of PCOS patients. Central to PCOS pathophysiology; drives hyperandrogenism via ovarian and adrenal stimulation (Dunaif, 1997).',
    patientField: 'insulinResistance',
  },
  {
    feature: 'hairGrowthPattern',
    importance: 0.10,
    clinicalRelevance: 'Hirsutism (Ferriman-Gallwey score ≥ 8) is a clinical marker of hyperandrogenism. Present in 65-75% of PCOS patients. Assessed via standardized scoring (Hatch et al., 1981).',
    patientField: 'hairGrowthPattern',
  },
  {
    feature: 'follicleCount',
    importance: 0.10,
    clinicalRelevance: 'Antral follicle count ≥ 12 per ovary (or ovarian volume > 10 mL) indicates polycystic ovarian morphology, one of the 3 Rotterdam diagnostic criteria (Dewailly et al., 2014).',
    patientField: 'follicleCount',
  },
  {
    feature: 'dheas',
    importance: 0.05,
    clinicalRelevance: 'DHEAS is an adrenal androgen precursor. Elevated levels suggest adrenal hyperandrogenism, present in 20-30% of PCOS. Distinguishes adrenal from ovarian androgen excess (Azziz, 2003).',
    labTestName: 'DHEAS',
  },
  {
    feature: 'shbg',
    importance: 0.05,
    clinicalRelevance: 'Low SHBG is a marker of hyperandrogenism and insulin resistance. Decreased SHBG increases free (bioactive) testosterone. SHBG < 30 nmol/L suggests androgen excess (Legro et al., 2013).',
    labTestName: 'SHBG',
  },
];

/**
 * Shared features relevant to both thyroid and PCOS screening.
 * These represent metabolic and general health indicators that affect
 * both conditions.
 */
const SHARED_FEATURE_WEIGHTS: {
  feature: string;
  importance: number;
  clinicalRelevance: string;
  labTestName?: string;
  patientField?: string;
}[] = [
  {
    feature: 'fastingGlucose',
    importance: 0.20,
    clinicalRelevance: 'Fasting glucose is a shared metabolic marker. Thyroid dysfunction affects glucose metabolism; PCOS is strongly associated with impaired glucose tolerance and type 2 diabetes risk (AACE/ACE, 2015).',
    patientField: 'fastingBloodSugar',
  },
  {
    feature: 'prolactin',
    importance: 0.20,
    clinicalRelevance: 'Prolactin can be elevated in both hypothyroidism (TRH-stimulated) and PCOS. Must be measured to exclude prolactinoma as a cause of menstrual irregularity (Melo et al., 2003).',
    labTestName: 'Prolactin',
  },
  {
    feature: 'bloodPressure',
    importance: 0.15,
    clinicalRelevance: 'Hypertension is associated with both hyperthyroidism and metabolic syndrome in PCOS. Cardiovascular risk assessment is important in both conditions (Ozkan & Erem, 2010).',
    patientField: 'bloodPressureSystolic',
  },
  {
    feature: 'totalCholesterol',
    importance: 0.15,
    clinicalRelevance: 'Dyslipidemia is common in both hypothyroidism (elevated LDL, TC) and PCOS (elevated TG, reduced HDL). Cardiovascular risk factor for both conditions (Duntas, 2002).',
    labTestName: 'Total Cholesterol',
  },
  {
    feature: 'hba1c',
    importance: 0.15,
    clinicalRelevance: 'HbA1c reflects long-term glycemic control. Relevant for PCOS metabolic assessment and thyroid patients with concurrent diabetes (AACE/ACE, 2015).',
    labTestName: 'HbA1c',
  },
  {
    feature: 'triglycerides',
    importance: 0.15,
    clinicalRelevance: 'Elevated triglycerides are seen in hypothyroidism and PCOS-related metabolic syndrome. Part of the lipid triad commonly seen in insulin-resistant states (Gardner et al., 2006).',
    labTestName: 'Triglycerides',
  },
];

// ============================================================================
// Lab Name Normalization
// ============================================================================

/** Map of common lab test name variants to canonical names */
const LAB_ALIASES: Record<string, string> = {
  'tsh': 'TSH',
  'thyroid stimulating hormone': 'TSH',
  'free t4': 'Free T4',
  'ft4': 'Free T4',
  'free thyroxine': 'Free T4',
  'free t3': 'Free T3',
  'ft3': 'Free T3',
  'free triiodothyronine': 'Free T3',
  'tpo antibodies': 'TPO Antibodies',
  'anti-tpo': 'TPO Antibodies',
  'tg antibodies': 'Tg Antibodies',
  'anti-tg': 'Tg Antibodies',
  'testosterone': 'Testosterone',
  'total testosterone': 'Testosterone',
  'free testosterone': 'Free Testosterone',
  'dheas': 'DHEAS',
  'shbg': 'SHBG',
  'prolactin': 'Prolactin',
  'lh': 'LH',
  'fsh': 'FSH',
  'hba1c': 'HbA1c',
  'total cholesterol': 'Total Cholesterol',
  'triglycerides': 'Triglycerides',
  'total t4': 'Total T4',
  'total t3': 'Total T3',
};

/**
 * Normalizes a lab test name to its canonical form.
 */
function normalizeLabName(name: string): string {
  return LAB_ALIASES[name.toLowerCase().trim()] || name;
}

// ============================================================================
// Feature Ranking
// ============================================================================

/**
 * Ranks all features by importance for thyroid and PCOS prediction.
 * 
 * Combines predefined clinical weights with data availability to produce
 * a comprehensive ranking. Features are tagged as thyroid-specific, PCOS-specific,
 * or shared (relevant to both conditions).
 * 
 * @param patientData - Patient demographic and clinical data
 * @param labValues - Array of lab test results
 * @param symptoms - Array of symptom entries (optional)
 * @returns FeatureSelectionResult with ranked features, correlations, and coverage
 */
export function rankFeatures(
  patientData: PatientData,
  labValues: LabValue[],
  symptoms: SymptomEntry[] = []
): FeatureSelectionResult {
  // Build lookup maps for quick access
  const labMap = new Map<string, number>();
  for (const lab of labValues) {
    const normalizedName = normalizeLabName(lab.testName);
    labMap.set(normalizedName, lab.result);
  }

  // Also store raw lab names
  for (const lab of labValues) {
    if (!labMap.has(lab.testName)) {
      labMap.set(lab.testName, lab.result);
    }
  }

  // Compute LH/FSH ratio if both are available
  const lh = labMap.get('LH');
  const fsh = labMap.get('FSH');
  if (lh !== undefined && fsh !== undefined && fsh > 0) {
    labMap.set('lhFshRatio', lh / fsh);
  }

  // Compute thyroid symptom score from symptoms
  const thyroidSymptoms = symptoms.filter(
    s => s.symptomName.toLowerCase().includes('thyroid') ||
         ['fatigue', 'weight gain', 'weight loss', 'cold intolerance', 'heat intolerance', 'palpitations', 'tremor', 'hair loss', 'constipation'].includes(s.symptomName.toLowerCase())
  );
  const thyroidSymptomScore = thyroidSymptoms.length > 0
    ? thyroidSymptoms.reduce((sum, s) => sum + (s.severity / 10), 0) / thyroidSymptoms.length
    : undefined;

  // --- Build thyroid feature list ---
  const thyroidFeatures: FeatureImportance[] = THYROID_FEATURE_WEIGHTS.map(fw => {
    let available = false;
    let value: number | string | undefined;

    if (fw.labTestName) {
      const labVal = labMap.get(fw.labTestName);
      if (labVal !== undefined) {
        available = true;
        value = labVal;
      }
    }
    if (fw.patientField) {
      const patientVal = patientData[fw.patientField];
      if (patientVal !== undefined && patientVal !== null && patientVal !== '') {
        available = true;
        value = patientVal as string | number;
      }
    }
    if (fw.symptomName) {
      if (thyroidSymptomScore !== undefined) {
        available = true;
        value = thyroidSymptomScore;
      }
    }

    return {
      feature: fw.feature,
      importance: fw.importance,
      category: 'thyroid' as const,
      available,
      value,
      clinicalRelevance: fw.clinicalRelevance,
    };
  });

  // --- Build PCOS feature list ---
  const pcosFeatures: FeatureImportance[] = PCOS_FEATURE_WEIGHTS.map(fw => {
    let available = false;
    let value: number | string | undefined;

    if (fw.labTestName) {
      const labVal = labMap.get(fw.labTestName);
      if (labVal !== undefined) {
        available = true;
        value = labVal;
      }
    }
    if (fw.patientField) {
      const patientVal = patientData[fw.patientField];
      if (patientVal !== undefined && patientVal !== null && patientVal !== '') {
        available = true;
        value = patientVal as string | number;
      }
    }
    if (fw.feature === 'lhFshRatio') {
      const ratio = labMap.get('lhFshRatio');
      if (ratio !== undefined) {
        available = true;
        value = ratio;
      }
    }

    return {
      feature: fw.feature,
      importance: fw.importance,
      category: 'pcos' as const,
      available,
      value,
      clinicalRelevance: fw.clinicalRelevance,
    };
  });

  // --- Build shared feature list ---
  const sharedFeatures: FeatureImportance[] = SHARED_FEATURE_WEIGHTS.map(fw => {
    let available = false;
    let value: number | string | undefined;

    if (fw.labTestName) {
      const labVal = labMap.get(fw.labTestName);
      if (labVal !== undefined) {
        available = true;
        value = labVal;
      }
    }
    if (fw.patientField) {
      const patientVal = patientData[fw.patientField];
      if (patientVal !== undefined && patientVal !== null && patientVal !== '') {
        available = true;
        value = patientVal as string | number;
      }
    }

    return {
      feature: fw.feature,
      importance: fw.importance,
      category: 'shared' as const,
      available,
      value,
      clinicalRelevance: fw.clinicalRelevance,
    };
  });

  return {
    thyroidFeatures,
    pcosFeatures,
    sharedFeatures,
    selectedFeatures: [],
    correlationMatrix: {},
    totalFeaturesAvailable: 0,
    featuresUsed: 0,
    coverageScore: 0,
  };
}

// ============================================================================
// Top Feature Selection
// ============================================================================

/**
 * Selects features whose importance exceeds a given threshold.
 * 
 * Features are combined from thyroid, PCOS, and shared categories.
 * Only available features (those with data) are included in the selection,
 * but the coverage score reflects what fraction of ALL important features
 * have data available.
 * 
 * @param featureRankings - Full feature selection result from rankFeatures()
 * @param threshold - Minimum importance score to include (default: 0.05)
 * @returns Updated FeatureSelectionResult with selected features populated
 */
export function selectTopFeatures(
  featureRankings: FeatureSelectionResult,
  threshold: number = 0.05
): FeatureSelectionResult {
  const allFeatures = [
    ...featureRankings.thyroidFeatures,
    ...featureRankings.pcosFeatures,
    ...featureRankings.sharedFeatures,
  ];

  // Select features above threshold that have data available
  const selected = allFeatures
    .filter(f => f.importance >= threshold && f.available)
    .sort((a, b) => b.importance - a.importance);

  const selectedFeatures = selected.map(f => f.feature);
  const totalFeaturesAvailable = allFeatures.filter(f => f.available).length;
  const totalFeatures = allFeatures.length;
  const coverageScore = totalFeatures > 0 ? totalFeaturesAvailable / totalFeatures : 0;

  return {
    ...featureRankings,
    selectedFeatures,
    totalFeaturesAvailable,
    featuresUsed: selected.length,
    coverageScore,
  };
}

// ============================================================================
// Correlation Matrix
// ============================================================================

/**
 * Computes a Pearson correlation matrix between available numeric features.
 * 
 * Pearson's r is appropriate for assessing linear relationships between
 * continuous clinical variables. High correlation (|r| > 0.8) between features
 * may indicate multicollinearity, which can affect model stability.
 * 
 * Note: For a single patient, this computes correlations between individual
 * feature values relative to their expected ranges. In a real ML pipeline,
 * this would be computed across a cohort of patients.
 * 
 * @param features - Record of feature name to numeric value
 * @returns Symmetric matrix of Pearson correlations between all feature pairs
 */
export function getFeatureCorrelationMatrix(
  features: Record<string, number>
): Record<string, Record<string, number>> {
  const keys = Object.keys(features).filter(k =>
    typeof features[k] === 'number' && !isNaN(features[k])
  );

  const matrix: Record<string, Record<string, number>> = {};

  // Initialize matrix with 1.0 on diagonal, 0.0 off diagonal
  for (const k1 of keys) {
    matrix[k1] = {};
    for (const k2 of keys) {
      matrix[k1][k2] = k1 === k2 ? 1.0 : 0.0;
    }
  }

  // For a single patient, we estimate correlation using normalized distance
  // from expected midpoints. This is a simplified proxy for true Pearson
  // correlation (which requires multiple observations).
  //
  // Clinical interpretation: two features are "correlated" if they are
  // both simultaneously elevated or depressed relative to their normal ranges.

  // Expected approximate midpoints for common features
  const expectedMidpoints: Record<string, number> = {
    tsh: 2.0,          // mIU/L, normal ~0.4-4.0
    freeT4: 1.1,       // ng/dL, normal ~0.8-1.8
    freeT3: 3.0,       // pg/mL, normal ~2.0-4.4
    testosterone: 0.5, // ng/mL, female normal ~0.1-0.8
    lh: 7.0,           // mIU/mL, female follicular
    fsh: 6.0,          // mIU/mL, female follicular
    lhFshRatio: 1.0,
    bmi: 24.0,
    age: 30,
    fastingGlucose: 90,
    insulin: 10,
    prolactin: 15,
    dheas: 200,
    shbg: 60,
    hba1c: 5.5,
    totalCholesterol: 190,
    hdl: 55,
    ldl: 110,
    triglycerides: 100,
  };

  // Compute deviation direction for each feature
  const deviations: Record<string, number> = {};
  for (const key of keys) {
    const mid = expectedMidpoints[key] ?? 0;
    const val = features[key];
    // Normalized deviation: positive = above normal, negative = below normal
    const range = Math.abs(mid) * 0.5 || 1; // avoid division by zero
    deviations[key] = (val - mid) / range;
  }

  // Compute pseudo-correlation: features that deviate in the same direction
  // are positively correlated; opposite directions = negative correlation
  for (const k1 of keys) {
    for (const k2 of keys) {
      if (k1 >= k2) continue; // avoid double computation (matrix is symmetric)

      const d1 = deviations[k1];
      const d2 = deviations[k2];

      // Pseudo-correlation based on direction agreement and magnitude
      const magnitude = Math.min(Math.abs(d1), Math.abs(d2)) / Math.max(Math.abs(d1), Math.abs(d2), 0.01);
      const sign = d1 * d2 >= 0 ? 1 : -1;
      const correlation = sign * magnitude;

      matrix[k1][k2] = Math.round(correlation * 100) / 100;
      matrix[k2][k1] = Math.round(correlation * 100) / 100;
    }
  }

  return matrix;
}

// ============================================================================
// Convenience: Full Pipeline
// ============================================================================

/**
 * Runs the complete feature selection pipeline:
 * 1. Rank all features by clinical importance
 * 2. Select top features above threshold
 * 3. Compute correlation matrix for selected features
 * 
 * @param patientData - Patient data
 * @param labValues - Lab test results
 * @param symptoms - Symptom entries
 * @param threshold - Minimum importance threshold (default: 0.05)
 * @returns Complete FeatureSelectionResult
 */
export function runFeatureSelection(
  patientData: PatientData,
  labValues: LabValue[],
  symptoms: SymptomEntry[] = [],
  threshold: number = 0.05
): FeatureSelectionResult {
  // Step 1: Rank features
  const ranked = rankFeatures(patientData, labValues, symptoms);

  // Step 2: Select top features
  const selected = selectTopFeatures(ranked, threshold);

  // Step 3: Build feature vector for correlation computation
  const featureVector: Record<string, number> = {};

  const allFeatures = [
    ...selected.thyroidFeatures,
    ...selected.pcosFeatures,
    ...selected.sharedFeatures,
  ];

  for (const f of allFeatures) {
    if (f.available && f.value !== undefined && typeof f.value === 'number') {
      featureVector[f.feature] = f.value;
    }
  }

  // Step 4: Compute correlations
  const correlationMatrix = getFeatureCorrelationMatrix(featureVector);

  return {
    ...selected,
    correlationMatrix,
  };
}
