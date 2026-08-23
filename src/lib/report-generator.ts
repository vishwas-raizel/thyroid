/**
 * Report Generation Module for Clinical Screening Platform
 * 
 * Generates comprehensive, clinically-formatted prediction reports for
 * thyroid disorder and PCOS screening. Reports include model comparisons,
 * contributing factors, data quality assessment, and precautionary guidance.
 * 
 * Clinical references:
 * - ATA Guidelines for Diagnosis and Management of Hypothyroidism/Hyperthyroidism
 * - Rotterdam ESHRE/ASRM-Sponsored PCOS Consensus Workshop Group (2004)
 * - Endocrine Society Clinical Practice Guideline for Diagnosis and Treatment of PCOS (2013)
 * - WHO recommendations on screening and early detection
 */

// ============================================================================
// Types
// ============================================================================

/** Patient data interface (minimal fields needed for report) */
export interface PatientInfo {
  name?: string;
  age?: number;
  [key: string]: any;
}

/** Single model prediction (subset needed for reporting) */
export interface ModelPrediction {
  model: string;
  thyroidPrediction: string;
  thyroidProbability: number;
  pcosPrediction: string;
  pcosProbability: number;
  confidence: number;
  accuracy: number;
  featureWeights: Record<string, number>;
  decisionPath?: string[];
}

/** Feature selection result (subset needed for reporting) */
export interface FeatureResult {
  thyroidFeatures: { feature: string; importance: number; available: boolean; value?: number | string; clinicalRelevance: string }[];
  pcosFeatures: { feature: string; importance: number; available: boolean; value?: number | string; clinicalRelevance: string }[];
  sharedFeatures: { feature: string; importance: number; available: boolean; value?: number | string; clinicalRelevance: string }[];
  selectedFeatures: string[];
  coverageScore: number;
}

/** Preprocessing result (subset needed for reporting) */
export interface PreprocessingResult {
  qualityScore: number;
  warnings: string[];
  steps: string[];
  missingFields: { field: string; strategy: string }[];
  outliers: { field: string; value: number; expectedRange: string }[];
}

/** Full prediction report */
export interface PredictionReport {
  patientName: string;
  patientAge: number;
  reportDate: string;
  thyroidAssessment: {
    verdict: string;
    probability: number;
    recommendation: string;
  };
  pcosAssessment: {
    verdict: string;
    probability: number;
    recommendation: string;
  };
  modelComparison: {
    model: string;
    thyroidPred: string;
    thyroidProb: number;
    pcosPred: string;
    pcosProb: number;
    accuracy: number;
  }[];
  topContributingFactors: { feature: string; impact: string; value: string }[];
  dataQuality: {
    score: number;
    issues: string[];
    preprocessingSteps: string[];
  };
  suggestedPrecautions: { category: string; item: string; priority: 'high' | 'medium' | 'low' }[];
  detailedReport: string;
  disclaimer: string;
}

// ============================================================================
// Clinical Recommendation Templates
// ============================================================================

/** Recommendations based on thyroid screening outcome */
const THYROID_RECOMMENDATIONS = {
  Positive: [
    'Consult an endocrinologist for comprehensive thyroid evaluation.',
    'Repeat thyroid function tests (TSH, Free T4, Free T3) in 6-8 weeks to confirm results.',
    'If TPO antibodies are elevated, consider Hashimoto\'s thyroiditis workup including thyroid ultrasound.',
    'Assess for symptoms of hypothyroidism or hyperthyroidism and document in clinical history.',
    'If hypothyroid: consider initiating levothyroxine therapy after endocrinology consultation.',
    'If hyperthyroid: consider thyroid scan (uptake study) and possible anti-thyroid medication.',
    'Monitor cardiac function if hyperthyroidism is suspected (ECG, heart rate assessment).',
    'Screen for lipid abnormalities (thyroid dysfunction affects lipid metabolism).',
  ],
  Negative: [
    'Thyroid function appears normal based on available data.',
    'No immediate thyroid intervention required.',
    'Consider repeat screening if symptoms develop, particularly in high-risk groups (family history, autoimmunity).',
    'Routine thyroid screening recommended every 3-5 years for adults over 35 (ATA Guidelines).',
    'If symptoms persist despite normal TSH, consider free T4 and T3 testing to rule out central hypothyroidism.',
  ],
};

/** Recommendations based on PCOS screening outcome */
const PCOS_RECOMMENDATIONS = {
  Positive: [
    'Consult a gynecologist or reproductive endocrinologist for PCOS evaluation.',
    'Confirm diagnosis using Rotterdam Criteria (2 of 3: oligo/anovulation, hyperandrogenism, polycystic ovaries).',
    'Assess metabolic profile: fasting glucose, HbA1c, lipid panel, and insulin resistance (HOMA-IR).',
    'Consider OGTT (Oral Glucose Tolerance Test) to screen for impaired glucose tolerance / diabetes.',
    'Evaluate cardiovascular risk factors: blood pressure, lipid profile, waist circumference.',
    'Lifestyle modification is first-line: weight management (5-10% weight loss can restore ovulation), exercise, diet.',
    'Consider hormonal contraceptive for menstrual regulation if not planning pregnancy.',
    'Screen for depression and anxiety, which have higher prevalence in PCOS patients.',
    'Endometrial protection assessment: consider progesterone challenge or ultrasound if amenorrheic >3 months.',
    'Discuss fertility implications and options if pregnancy is desired.',
  ],
  Negative: [
    'PCOS screening markers are within normal range based on available data.',
    'No immediate PCOS intervention required.',
    'If symptoms persist (irregular menses, hirsutism, acne), consider referral to endocrinology.',
    'Monitor weight and metabolic health as preventive measures.',
    'Repeat screening if symptoms develop or if planning pregnancy.',
  ],
};

/** Precautions organized by category */
const PRECAUTION_LIBRARY = {
  thyroid: {
    high: [
      { item: 'Seek immediate endocrinology consultation', priority: 'high' as const },
      { item: 'Do not start or stop thyroid medication without medical supervision', priority: 'high' as const },
      { item: 'Report any cardiac symptoms (palpitations, chest pain, shortness of breath) immediately', priority: 'high' as const },
    ],
    medium: [
      { item: 'Avoid excessive iodine intake (supplements, seaweed) until evaluated', priority: 'medium' as const },
      { item: 'Inform all healthcare providers about thyroid screening results', priority: 'medium' as const },
      { item: 'Monitor for symptoms: fatigue, weight changes, temperature sensitivity, mood changes', priority: 'medium' as const },
    ],
    low: [
      { item: 'Maintain a balanced diet supporting thyroid health (selenium, zinc, iodine)', priority: 'low' as const },
      { item: 'Regular exercise supports thyroid hormone metabolism', priority: 'low' as const },
      { item: 'Annual thyroid function monitoring recommended', priority: 'low' as const },
    ],
  },
  pcos: {
    high: [
      { item: 'Consult gynecologist/reproductive endocrinologist for confirmed diagnosis', priority: 'high' as const },
      { item: 'Screen for insulin resistance and impaired glucose tolerance', priority: 'high' as const },
      { item: 'Assess endometrial thickness if amenorrheic > 3 months (endometrial hyperplasia risk)', priority: 'high' as const },
      { item: 'Evaluate for metabolic syndrome components', priority: 'high' as const },
    ],
    medium: [
      { item: 'Implement lifestyle modifications: 150+ min/week moderate exercise', priority: 'medium' as const },
      { item: 'Dietary management: low glycemic index, balanced macronutrients', priority: 'medium' as const },
      { item: 'Weight management: 5-10% weight loss can significantly improve symptoms', priority: 'medium' as const },
      { item: 'Monitor menstrual cycle regularity', priority: 'medium' as const },
      { item: 'Screen for mood disorders (depression/anxiety prevalence ~40% in PCOS)', priority: 'medium' as const },
    ],
    low: [
      { item: 'Consider dermatology referral for hirsutism/acne management if needed', priority: 'low' as const },
      { item: 'Supplement with vitamin D if deficient (common in PCOS)', priority: 'low' as const },
      { item: 'Stress management techniques may help hormonal balance', priority: 'low' as const },
      { item: 'Consider support groups for PCOS management', priority: 'low' as const },
    ],
  },
  metabolic: {
    high: [
      { item: 'Fasting glucose and HbA1c testing recommended if not recently done', priority: 'high' as const },
      { item: 'Lipid panel assessment for cardiovascular risk stratification', priority: 'high' as const },
    ],
    medium: [
      { item: 'Reduce refined carbohydrate and sugar intake', priority: 'medium' as const },
      { item: 'Blood pressure monitoring at home', priority: 'medium' as const },
    ],
    low: [
      { item: 'Maintain regular physical activity (30 min moderate exercise, 5x/week)', priority: 'low' as const },
      { item: 'Annual metabolic health checkup', priority: 'low' as const },
    ],
  },
  general: {
    high: [
      { item: 'This is a screening tool only — not a diagnostic instrument. Confirm with a qualified healthcare provider.', priority: 'high' as const },
    ],
    medium: [
      { item: 'Ensure all recommended follow-up tests are completed', priority: 'medium' as const },
      { item: 'Bring this report to your next healthcare appointment', priority: 'medium' as const },
    ],
    low: [
      { item: 'Stay informed about your health conditions', priority: 'low' as const },
    ],
  },
};

// ============================================================================
// Helper: Feature Display Names
// ============================================================================

/** Maps internal feature names to human-readable display names */
const FEATURE_DISPLAY_NAMES: Record<string, string> = {
  tsh: 'TSH (Thyroid Stimulating Hormone)',
  freeT4: 'Free T4 (Thyroxine)',
  freeT3: 'Free T3 (Triiodothyronine)',
  totalT4: 'Total T4',
  totalT3: 'Total T3',
  tpoAntibodies: 'TPO Antibodies',
  tgAntibodies: 'Thyroglobulin Antibodies',
  lh: 'LH (Luteinizing Hormone)',
  fsh: 'FSH (Follicle Stimulating Hormone)',
  lhFshRatio: 'LH/FSH Ratio',
  testosterone: 'Total Testosterone',
  freeTestosterone: 'Free Testosterone',
  dheas: 'DHEAS (Dehydroepiandrosterone Sulfate)',
  shbg: 'SHBG (Sex Hormone-Binding Globulin)',
  prolactin: 'Prolactin',
  estradiol: 'Estradiol',
  progesterone: 'Progesterone',
  fastingGlucose: 'Fasting Blood Glucose',
  hba1c: 'HbA1c (Glycated Hemoglobin)',
  insulin: 'Fasting Insulin',
  totalCholesterol: 'Total Cholesterol',
  hdl: 'HDL Cholesterol',
  ldl: 'LDL Cholesterol',
  triglycerides: 'Triglycerides',
  age: 'Age',
  bmi: 'Body Mass Index (BMI)',
  bloodPressureSystolic: 'Systolic Blood Pressure',
  bloodPressureDiastolic: 'Diastolic Blood Pressure',
  menstrualRegularity: 'Menstrual Regularity',
  hairGrowthPattern: 'Hair Growth Pattern (Hirsutism)',
  skinDarkening: 'Skin Darkening (Acanthosis Nigricans)',
  follicleCount: 'Antral Follicle Count',
  insulinResistance: 'Insulin Resistance',
  thyroidSymptomScore: 'Thyroid Symptom Score',
  pcosSymptomScore: 'PCOS Symptom Score',
};

/** Gets human-readable name for a feature */
function getFeatureDisplayName(feature: string): string {
  return FEATURE_DISPLAY_NAMES[feature] || feature;
}

/** Formats a probability as percentage string */
function formatPercent(probability: number): string {
  return `${(probability * 100).toFixed(1)}%`;
}

/** Determines impact level from a feature weight */
function getImpactLevel(weight: number): string {
  if (weight >= 0.15) return 'High';
  if (weight >= 0.08) return 'Medium';
  if (weight >= 0.03) return 'Low';
  return 'Minimal';
}

// ============================================================================
// Report Generation
// ============================================================================

/**
 * Generates a comprehensive prediction report.
 * 
 * The report includes:
 * - Patient identification and report metadata
 * - Thyroid and PCOS assessment summaries
 * - Model-by-model comparison table
 * - Top contributing factors with clinical context
 * - Data quality assessment
 * - Clinical precautions and next steps
 * - Full markdown-formatted detailed report
 * 
 * @param patient - Patient demographic information
 * @param predictions - Array of model predictions (from runAllModels)
 * @param featureResult - Feature selection result (from runFeatureSelection)
 * @param preprocessingResult - Preprocessing result (from runPreprocessingPipeline)
 * @returns Complete PredictionReport
 */
export function generatePredictionReport(
  patient: PatientInfo,
  predictions: ModelPrediction[],
  featureResult: FeatureResult,
  preprocessingResult: PreprocessingResult
): PredictionReport {
  const reportDate = new Date().toISOString().split('T')[0];
  const patientName = patient.name || 'Unknown Patient';
  const patientAge = patient.age || 0;

  // --- Get ensemble prediction (last item) ---
  const ensemble = predictions.find(p => p.model === 'Ensemble') || predictions[predictions.length - 1];

  // --- Thyroid Assessment ---
  const thyroidVerdict = ensemble.thyroidPrediction;
  const thyroidProbability = ensemble.thyroidProbability;
  const thyroidRecommendation = THYROID_RECOMMENDATIONS[thyroidVerdict as 'Positive' | 'Negative']?.[0] || 'Consult a healthcare provider.';

  // --- PCOS Assessment ---
  const pcosVerdict = ensemble.pcosPrediction;
  const pcosProbability = ensemble.pcosProbability;
  const pcosRecommendation = PCOS_RECOMMENDATIONS[pcosVerdict as 'Positive' | 'Negative']?.[0] || 'Consult a healthcare provider.';

  // --- Model Comparison ---
  const modelComparison = predictions.map(p => ({
    model: p.model,
    thyroidPred: p.thyroidPrediction,
    thyroidProb: p.thyroidProbability,
    pcosPred: p.pcosPrediction,
    pcosProb: p.pcosProbability,
    accuracy: p.accuracy,
  }));

  // --- Top Contributing Factors ---
  // Aggregate feature weights across all models, preferring ensemble weights
  const aggregatedWeights: Record<string, number> = {};
  const aggregatedValues: Record<string, string> = {};

  // Use ensemble weights as primary source
  for (const [feature, weight] of Object.entries(ensemble.featureWeights)) {
    aggregatedWeights[feature] = weight;
  }

  // Look up values from feature result
  const allFeatureLists = [
    ...featureResult.thyroidFeatures,
    ...featureResult.pcosFeatures,
    ...featureResult.sharedFeatures,
  ];
  for (const f of allFeatureLists) {
    if (f.value !== undefined) {
      aggregatedValues[f.feature] = String(f.value);
    }
  }

  // Sort by weight and take top 8
  const topContributingFactors = Object.entries(aggregatedWeights)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8)
    .map(([feature, weight]) => ({
      feature: getFeatureDisplayName(feature),
      impact: getImpactLevel(weight),
      value: aggregatedValues[feature] || 'Not available',
    }));

  // --- Data Quality ---
  const dataQuality = {
    score: preprocessingResult.qualityScore,
    issues: [
      ...preprocessingResult.warnings,
      ...preprocessingResult.missingFields.map(m => `Missing field: ${m.field}`),
      ...preprocessingResult.outliers.map(o => `Outlier: ${o.field} = ${o.value} (expected: ${o.expectedRange})`),
    ],
    preprocessingSteps: preprocessingResult.steps,
  };

  // --- Suggested Precautions ---
  const suggestedPrecautions = generatePrecautions(ensemble, {} as any);

  // --- Generate Detailed Markdown Report ---
  const detailedReport = generateDetailedMarkdown({
    patientName,
    patientAge,
    reportDate,
    thyroidVerdict,
    thyroidProbability,
    thyroidRecommendation,
    pcosVerdict,
    pcosProbability,
    pcosRecommendation,
    modelComparison,
    topContributingFactors,
    dataQuality,
    suggestedPrecautions,
    ensemble,
    predictions,
    featureResult,
    preprocessingResult,
  });

  return {
    patientName,
    patientAge,
    reportDate,
    thyroidAssessment: {
      verdict: thyroidVerdict,
      probability: thyroidProbability,
      recommendation: thyroidRecommendation,
    },
    pcosAssessment: {
      verdict: pcosVerdict,
      probability: pcosProbability,
      recommendation: pcosRecommendation,
    },
    modelComparison,
    topContributingFactors,
    dataQuality,
    suggestedPrecautions,
    detailedReport,
    disclaimer: generateDisclaimer(),
  };
}

// ============================================================================
// Precautions Generation
// ============================================================================

/**
 * Generates clinically relevant precautions based on prediction results.
 * 
 * Precautions are organized by category (thyroid, PCOS, metabolic, general)
 * and prioritized (high, medium, low) based on prediction severity and probability.
 * 
 * @param prediction - Ensemble model prediction
 * @param features - Prediction features (for context)
 * @returns Array of precautions with category, description, and priority
 */
export function generatePrecautions(
  prediction: ModelPrediction,
  features: Record<string, any>
): { category: string; item: string; priority: 'high' | 'medium' | 'low' }[] {
  const precautions: { category: string; item: string; priority: 'high' | 'medium' | 'low' }[] = [];

  // --- General precautions (always included) ---
  precautions.push(...PRECAUTION_LIBRARY.general.high.map(p => ({ ...p, category: 'General' })));
  precautions.push(...PRECAUTION_LIBRARY.general.medium.map(p => ({ ...p, category: 'General' })));

  // --- Thyroid precautions ---
  if (prediction.thyroidPrediction === 'Positive') {
    const thyroidProb = prediction.thyroidProbability;
    if (thyroidProb >= 0.8) {
      // High probability: include all thyroid precautions
      precautions.push(...PRECAUTION_LIBRARY.thyroid.high.map(p => ({ ...p, category: 'Thyroid' })));
      precautions.push(...PRECAUTION_LIBRARY.thyroid.medium.map(p => ({ ...p, category: 'Thyroid' })));
      precautions.push(...PRECAUTION_LIBRARY.thyroid.low.map(p => ({ ...p, category: 'Thyroid' })));
    } else if (thyroidProb >= 0.6) {
      // Moderate probability
      precautions.push(...PRECAUTION_LIBRARY.thyroid.high.map(p => ({ ...p, category: 'Thyroid' })));
      precautions.push(...PRECAUTION_LIBRARY.thyroid.medium.map(p => ({ ...p, category: 'Thyroid' })));
    } else {
      // Low probability positive: high + some medium
      precautions.push(...PRECAUTION_LIBRARY.thyroid.high.map(p => ({ ...p, category: 'Thyroid' })));
      precautions.push(...PRECAUTION_LIBRARY.thyroid.medium.slice(0, 2).map(p => ({ ...p, category: 'Thyroid' })));
    }
  } else {
    // Negative: include low-priority monitoring advice
    precautions.push(...PRECAUTION_LIBRARY.thyroid.low.map(p => ({ ...p, category: 'Thyroid' })));
    precautions.push(...PRECAUTION_LIBRARY.thyroid.medium.slice(2, 3).map(p => ({ ...p, category: 'Thyroid' })));
  }

  // --- PCOS precautions ---
  if (prediction.pcosPrediction === 'Positive') {
    const pcosProb = prediction.pcosProbability;
    if (pcosProb >= 0.8) {
      precautions.push(...PRECAUTION_LIBRARY.pcos.high.map(p => ({ ...p, category: 'PCOS' })));
      precautions.push(...PRECAUTION_LIBRARY.pcos.medium.map(p => ({ ...p, category: 'PCOS' })));
      precautions.push(...PRECAUTION_LIBRARY.pcos.low.map(p => ({ ...p, category: 'PCOS' })));
    } else if (pcosProb >= 0.6) {
      precautions.push(...PRECAUTION_LIBRARY.pcos.high.map(p => ({ ...p, category: 'PCOS' })));
      precautions.push(...PRECAUTION_LIBRARY.pcos.medium.map(p => ({ ...p, category: 'PCOS' })));
    } else {
      precautions.push(...PRECAUTION_LIBRARY.pcos.high.map(p => ({ ...p, category: 'PCOS' })));
      precautions.push(...PRECAUTION_LIBRARY.pcos.medium.slice(0, 3).map(p => ({ ...p, category: 'PCOS' })));
    }
  } else {
    precautions.push(...PRECAUTION_LIBRARY.pcos.low.map(p => ({ ...p, category: 'PCOS' })));
  }

  // --- Metabolic precautions ---
  // Always include some metabolic advice since both conditions affect metabolism
  const hasMetabolicRisk =
    (features.bmi !== undefined && features.bmi >= 25) ||
    (features.fastingGlucose !== undefined && features.fastingGlucose >= 100) ||
    (features.insulinResistance !== undefined && features.insulinResistance >= 1);

  if (hasMetabolicRisk) {
    precautions.push(...PRECAUTION_LIBRARY.metabolic.high.map(p => ({ ...p, category: 'Metabolic' })));
    precautions.push(...PRECAUTION_LIBRARY.metabolic.medium.map(p => ({ ...p, category: 'Metabolic' })));
  } else {
    precautions.push(...PRECAUTION_LIBRARY.metabolic.medium.map(p => ({ ...p, category: 'Metabolic' })));
  }
  precautions.push(...PRECAUTION_LIBRARY.metabolic.low.map(p => ({ ...p, category: 'Metabolic' })));

  return precautions;
}

// ============================================================================
// Summary Generation
// ============================================================================

/**
 * Generates an overall summary from all model predictions.
 * 
 * The summary includes:
 * - Agreement analysis across models
 * - Average probabilities
 * - Range (min-max) of probabilities
 * - Overall consensus verdict
 * 
 * @param predictions - Array of all model predictions (including ensemble)
 * @returns Markdown-formatted summary string
 */
export function generateSummary(predictions: ModelPrediction[]): string {
  if (!predictions || predictions.length === 0) {
    return 'No predictions available to generate summary.';
  }

  // Separate ensemble from individual models
  const individualModels = predictions.filter(p => p.model !== 'Ensemble');
  const ensemble = predictions.find(p => p.model === 'Ensemble');

  // --- Thyroid summary ---
  const thyroidPositive = individualModels.filter(p => p.thyroidPrediction === 'Positive').length;
  const thyroidNegative = individualModels.length - thyroidPositive;
  const thyroidAgreement = thyroidPositive === individualModels.length || thyroidNegative === individualModels.length;
  const avgThyroidProb = individualModels.reduce((s, p) => s + p.thyroidProbability, 0) / individualModels.length;
  const thyroidProbRange = {
    min: Math.min(...individualModels.map(p => p.thyroidProbability)),
    max: Math.max(...individualModels.map(p => p.thyroidProbability)),
  };

  // --- PCOS summary ---
  const pcosPositive = individualModels.filter(p => p.pcosPrediction === 'Positive').length;
  const pcosNegative = individualModels.length - pcosPositive;
  const pcosAgreement = pcosPositive === individualModels.length || pcosNegative === individualModels.length;
  const avgPcosProb = individualModels.reduce((s, p) => s + p.pcosProbability, 0) / individualModels.length;
  const pcosProbRange = {
    min: Math.min(...individualModels.map(p => p.pcosProbability)),
    max: Math.max(...individualModels.map(p => p.pcosProbability)),
  };

  let summary = '## Prediction Summary\n\n';
  summary += `**Models evaluated:** ${individualModels.map(p => p.model).join(', ')} + Ensemble\n\n`;

  // Thyroid section
  summary += '### Thyroid Disorder Screening\n\n';
  summary += `- **Models predicting Positive:** ${thyroidPositive}/${individualModels.length}\n`;
  summary += `- **Models predicting Negative:** ${thyroidNegative}/${individualModels.length}\n`;
  summary += `- **Average probability:** ${formatPercent(avgThyroidProb)}\n`;
  summary += `- **Probability range:** ${formatPercent(thyroidProbRange.min)} – ${formatPercent(thyroidProbRange.max)}\n`;
  summary += `- **Model agreement:** ${thyroidAgreement ? '✅ Full consensus' : '⚠️ Partial disagreement'}\n`;
  if (ensemble) {
    summary += `- **Ensemble verdict:** **${ensemble.thyroidPrediction}** (${formatPercent(ensemble.thyroidProbability)})\n`;
  }
  summary += '\n';

  // PCOS section
  summary += '### PCOS Screening\n\n';
  summary += `- **Models predicting Positive:** ${pcosPositive}/${individualModels.length}\n`;
  summary += `- **Models predicting Negative:** ${pcosNegative}/${individualModels.length}\n`;
  summary += `- **Average probability:** ${formatPercent(avgPcosProb)}\n`;
  summary += `- **Probability range:** ${formatPercent(pcosProbRange.min)} – ${formatPercent(pcosProbRange.max)}\n`;
  summary += `- **Model agreement:** ${pcosAgreement ? '✅ Full consensus' : '⚠️ Partial disagreement'}\n`;
  if (ensemble) {
    summary += `- **Ensemble verdict:** **${ensemble.pcosPrediction}** (${formatPercent(ensemble.pcosProbability)})\n`;
  }
  summary += '\n';

  // Consensus section
  summary += '### Overall Consensus\n\n';
  if (thyroidAgreement && pcosAgreement) {
    summary += 'All models agree on both thyroid and PCOS predictions, providing high confidence in the results.\n';
  } else if (thyroidAgreement || pcosAgreement) {
    summary += 'Models show consensus on one condition but disagreement on the other. ';
    summary += 'The ensemble prediction balances these differences using confidence-weighted voting.\n';
  } else {
    summary += 'Models show disagreement on both conditions. This may indicate borderline results or insufficient data. ';
    summary += 'Clinical confirmation is strongly recommended. The ensemble prediction provides the most balanced assessment.\n';
  }

  return summary;
}

// ============================================================================
// Internal: Detailed Markdown Report Generation
// ============================================================================

/** Parameters for the markdown report generator */
interface ReportParams {
  patientName: string;
  patientAge: number;
  reportDate: string;
  thyroidVerdict: string;
  thyroidProbability: number;
  thyroidRecommendation: string;
  pcosVerdict: string;
  pcosProbability: number;
  pcosRecommendation: string;
  modelComparison: { model: string; thyroidPred: string; thyroidProb: number; pcosPred: string; pcosProb: number; accuracy: number }[];
  topContributingFactors: { feature: string; impact: string; value: string }[];
  dataQuality: { score: number; issues: string[]; preprocessingSteps: string[] };
  suggestedPrecautions: { category: string; item: string; priority: 'high' | 'medium' | 'low' }[];
  ensemble: ModelPrediction;
  predictions: ModelPrediction[];
  featureResult: FeatureResult;
  preprocessingResult: PreprocessingResult;
}

/**
 * Generates the full markdown-formatted detailed report.
 * 
 * This produces a clinical-grade report suitable for healthcare provider review.
 * The report follows a structured format with clear sections and clinical context.
 */
function generateDetailedMarkdown(params: ReportParams): string {
  const { patientName, patientAge, reportDate } = params;
  const lines: string[] = [];

  // ----- Header -----
  lines.push('# Clinical Screening Report');
  lines.push('## Thyroid Disorder & PCOS Risk Assessment\n');
  lines.push(`**Patient:** ${patientName}`);
  lines.push(`**Age:** ${patientAge}`);
  lines.push(`**Report Date:** ${reportDate}`);
  lines.push(`**Screening Platform:** ML-Enhanced Clinical Decision Support`);
  lines.push('');

  // ----- Executive Summary -----
  lines.push('---');
  lines.push('## Executive Summary\n');

  const thyroidEmoji = params.thyroidVerdict === 'Positive' ? '🔴' : '🟢';
  const pcosEmoji = params.pcosVerdict === 'Positive' ? '🔴' : '🟢';

  lines.push(`${thyroidEmoji} **Thyroid Disorder:** ${params.thyroidVerdict} (Probability: ${formatPercent(params.thyroidProbability)})`);
  lines.push(`${pcosEmoji} **PCOS:** ${params.pcosVerdict} (Probability: ${formatPercent(params.pcosProbability)})`);
  lines.push('');

  lines.push(`**Thyroid Recommendation:** ${params.thyroidRecommendation}`);
  lines.push('');
  lines.push(`**PCOS Recommendation:** ${params.pcosRecommendation}`);
  lines.push('');

  // ----- Model Comparison -----
  lines.push('---');
  lines.push('## Model Comparison\n');
  lines.push('| Model | Thyroid | Thyroid Prob | PCOS | PCOS Prob | Simulated Accuracy |');
  lines.push('|-------|---------|-------------|------|-----------|-------------------|');

  for (const mc of params.modelComparison) {
    lines.push(
      `| ${mc.model} | ${mc.thyroidPred} | ${formatPercent(mc.thyroidProb)} | ${mc.pcosPred} | ${formatPercent(mc.pcosProb)} | ${formatPercent(mc.accuracy)} |`
    );
  }
  lines.push('');

  // Model agreement note
  const thyroidPositive = params.modelComparison.filter(m => m.thyroidPred === 'Positive').length;
  const pcosPositive = params.modelComparison.filter(m => m.pcosPred === 'Positive').length;
  lines.push(`> **Note:** ${thyroidPositive}/5 models predict thyroid positive. ${pcosPositive}/5 models predict PCOS positive.`);
  lines.push('');

  // ----- Top Contributing Factors -----
  lines.push('---');
  lines.push('## Top Contributing Factors\n');
  lines.push('| Factor | Impact | Value |');
  lines.push('|--------|--------|-------|');

  for (const factor of params.topContributingFactors) {
    lines.push(`| ${factor.feature} | ${factor.impact} | ${factor.value} |`);
  }
  lines.push('');

  // ----- Decision Path (if available from Decision Tree) -----
  const decisionTree = params.predictions.find(p => p.model === 'DecisionTree');
  if (decisionTree?.decisionPath && decisionTree.decisionPath.length > 0) {
    lines.push('---');
    lines.push('## Decision Tree Reasoning Path\n');
    lines.push('The following decision path illustrates how the Decision Tree model arrived at its conclusion:\n');
    for (const step of decisionTree.decisionPath) {
      lines.push(`1. ${step}`);
    }
    lines.push('');
  }

  // ----- Data Quality Assessment -----
  lines.push('---');
  lines.push('## Data Quality Assessment\n');
  const qualityPercent = formatPercent(params.dataQuality.score);
  const qualityLabel = params.dataQuality.score >= 0.8 ? 'Good' : params.dataQuality.score >= 0.5 ? 'Fair' : 'Poor';

  lines.push(`**Overall Data Quality Score:** ${qualityPercent} (${qualityLabel})`);
  lines.push('');
  lines.push('**Preprocessing Steps Applied:**');
  for (const step of params.dataQuality.preprocessingSteps) {
    lines.push(`- ${step}`);
  }
  lines.push('');

  if (params.dataQuality.issues.length > 0) {
    lines.push('**Data Issues & Warnings:**');
    // Limit to top 10 issues to avoid overwhelming the report
    const displayIssues = params.dataQuality.issues.slice(0, 10);
    for (const issue of displayIssues) {
      lines.push(`- ${issue}`);
    }
    if (params.dataQuality.issues.length > 10) {
      lines.push(`- ... and ${params.dataQuality.issues.length - 10} more issue(s)`);
    }
    lines.push('');
  }

  // ----- Feature Coverage -----
  lines.push(`**Feature Coverage:** ${params.featureResult.selectedFeatures.length} of ${params.featureResult.thyroidFeatures.length + params.featureResult.pcosFeatures.length + params.featureResult.sharedFeatures.length} key features available (${formatPercent(params.featureResult.coverageScore)}).`);
  lines.push('');

  // ----- Suggested Precautions -----
  lines.push('---');
  lines.push('## Suggested Precautions & Next Steps\n');

  // Group by category
  const groupedPrecautions = new Map<string, typeof params.suggestedPrecautions>();
  for (const p of params.suggestedPrecautions) {
    const existing = groupedPrecautions.get(p.category) || [];
    existing.push(p);
    groupedPrecautions.set(p.category, existing);
  }

  const priorityOrder = { high: 0, medium: 1, low: 2 };

  for (const [category, items] of Array.from(groupedPrecautions)) {
    lines.push(`### ${category}\n`);
    const sorted = items.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
    for (const item of sorted) {
      const badge = item.priority === 'high' ? '🔴' : item.priority === 'medium' ? '🟡' : '🟢';
      lines.push(`${badge} ${item.item} \[${item.priority}\]`);
    }
    lines.push('');
  }

  // ----- Clinical Recommendations Detail -----
  lines.push('---');
  lines.push('## Detailed Clinical Recommendations\n');

  if (params.thyroidVerdict === 'Positive') {
    lines.push('### Thyroid Disorder\n');
    lines.push('Based on the screening results, the following clinical actions are recommended:\n');
    for (const rec of THYROID_RECOMMENDATIONS.Positive) {
      lines.push(`- ${rec}`);
    }
    lines.push('');
  } else {
    lines.push('### Thyroid Disorder\n');
    for (const rec of THYROID_RECOMMENDATIONS.Negative) {
      lines.push(`- ${rec}`);
    }
    lines.push('');
  }

  if (params.pcosVerdict === 'Positive') {
    lines.push('### PCOS\n');
    lines.push('Based on the screening results, the following clinical actions are recommended:\n');
    for (const rec of PCOS_RECOMMENDATIONS.Positive) {
      lines.push(`- ${rec}`);
    }
    lines.push('');
  } else {
    lines.push('### PCOS\n');
    for (const rec of PCOS_RECOMMENDATIONS.Negative) {
      lines.push(`- ${rec}`);
    }
    lines.push('');
  }

  // ----- Disclaimer -----
  lines.push('---');
  lines.push(generateDisclaimer());

  return lines.join('\n');
}

/**
 * Generates the medical disclaimer for the report.
 * 
 * This disclaimer is critical for regulatory compliance and patient safety.
 * The screening tool is NOT a diagnostic instrument and must not be used
 * as the sole basis for clinical decisions.
 */
function generateDisclaimer(): string {
  return `
## ⚠️ Important Medical Disclaimer\n
**This report is generated by a machine learning-enhanced screening tool and is intended for clinical decision support only. It does NOT constitute a medical diagnosis.**

1. **Not a diagnosis:** The predictions in this report represent risk assessments based on statistical models, not clinical diagnoses. Only a qualified healthcare provider can diagnose thyroid disorders or PCOS.

2. **Screening limitations:** The accuracy of these predictions depends on the quality and completeness of input data. Missing or inaccurate lab values may significantly affect results.

3. **Model limitations:** The ML models used in this platform are simulated based on clinical rule-based algorithms. They approximate the behavior of trained machine learning models but may not capture all clinical nuances.

4. **Clinical correlation required:** All screening results must be correlated with clinical findings, patient history, physical examination, and confirmed through appropriate diagnostic testing.

5. **False positives/negatives:** Like all screening tools, this system may produce false positive or false negative results. A negative screening result does not rule out disease, and a positive result requires clinical confirmation.

6. **Regulatory compliance:** This tool is intended for use by licensed healthcare professionals as a decision support aid. It should not be used for self-diagnosis.

7. **Data privacy:** Patient data used in this screening is processed in accordance with applicable data protection regulations (HIPAA/GDPR as applicable).

*Report generated by Clinical Screening Platform. For clinical use only.*
`;
}
