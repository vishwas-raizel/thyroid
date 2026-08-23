import { PrismaClient } from '@prisma/client';
import { screenThyroid, screenPCOS, screenCombined } from '../src/lib/screening-engine';
import type { LabValue, SymptomEntry } from '../src/lib/types';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding clinical dataset reports and patients...');

  const now = new Date();
  const d = (daysAgo: number) => new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);

  const dataset = [
    {
      patient: {
        name: 'Elena Rostova',
        age: 34,
        gender: 'Female',
        phoneNumber: '+1 (555) 234-5678',
        email: 'elena.rostova@healthmail.org',
        medicalHistory: 'Family history of autoimmune thyroiditis (mother). Prior diagnosis of Hashimoto thyroiditis.',
        notes: 'Complaining of persistent morning fatigue and cold intolerance. Managed with Levothyroxine 75mcg.',
        weight: 74.0,
        height: 162.0,
        bmi: 28.2,
        bloodPressureSystolic: 128,
        bloodPressureDiastolic: 82,
        fastingBloodSugar: 94.0,
        menstrualCycleLength: 30,
        menstrualRegularity: 'regular',
        hairGrowthPattern: 'normal',
        skinDarkening: 'none',
        follicleCount: 6,
        insulinResistance: 'none',
      },
      symptoms: [
        { symptomName: 'Fatigue & Lethargy', severity: 'severe', category: 'energy', notes: 'Severe morning exhaustion' },
        { symptomName: 'Cold Intolerance', severity: 'severe', category: 'temperature', notes: 'Extremities cold constantly' },
        { symptomName: 'Weight Gain', severity: 'moderate', category: 'weight', notes: 'Unintentional 6kg gain' },
        { symptomName: 'Dry Skin & Brittle Nails', severity: 'moderate', category: 'dermatological', notes: 'Flaking on forearms' },
        { symptomName: 'Brain Fog & Memory Lag', severity: 'moderate', category: 'cognitive', notes: 'Difficulty concentrating at work' },
        { symptomName: 'Constipation', severity: 'mild', category: 'gastrointestinal', notes: 'Mild sluggish motility' },
      ],
      reports: [
        {
          reportDate: d(180),
          reportType: 'thyroid_panel',
          status: 'verified',
          notes: 'Baseline diagnosis panel - Uncontrolled Primary Hypothyroidism',
          labValues: [
            { testName: 'TSH', result: 8.8, unit: 'mIU/L', referenceLow: 0.4, referenceHigh: 4.0, isAbnormal: true, category: 'thyroid' },
            { testName: 'Free T4', result: 0.65, unit: 'ng/dL', referenceLow: 0.8, referenceHigh: 1.8, isAbnormal: true, category: 'thyroid' },
            { testName: 'Free T3', result: 1.70, unit: 'pg/mL', referenceLow: 2.0, referenceHigh: 4.4, isAbnormal: true, category: 'thyroid' },
            { testName: 'Anti-TPO', result: 165.0, unit: 'IU/mL', referenceLow: 0, referenceHigh: 34, isAbnormal: true, category: 'thyroid' },
            { testName: 'Total Cholesterol', result: 228.0, unit: 'mg/dL', referenceLow: 125, referenceHigh: 200, isAbnormal: true, category: 'lipid' },
          ],
        },
        {
          reportDate: d(120),
          reportType: 'thyroid_panel',
          status: 'verified',
          notes: '6-week post Levothyroxine initiation review',
          labValues: [
            { testName: 'TSH', result: 5.9, unit: 'mIU/L', referenceLow: 0.4, referenceHigh: 4.0, isAbnormal: true, category: 'thyroid' },
            { testName: 'Free T4', result: 0.95, unit: 'ng/dL', referenceLow: 0.8, referenceHigh: 1.8, isAbnormal: false, category: 'thyroid' },
            { testName: 'Free T3', result: 2.25, unit: 'pg/mL', referenceLow: 2.0, referenceHigh: 4.4, isAbnormal: false, category: 'thyroid' },
            { testName: 'Anti-TPO', result: 120.0, unit: 'IU/mL', referenceLow: 0, referenceHigh: 34, isAbnormal: true, category: 'thyroid' },
            { testName: 'Total Cholesterol', result: 208.0, unit: 'mg/dL', referenceLow: 125, referenceHigh: 200, isAbnormal: true, category: 'lipid' },
          ],
        },
        {
          reportDate: d(60),
          reportType: 'thyroid_panel',
          status: 'verified',
          notes: 'Dose titrated to 75mcg review',
          labValues: [
            { testName: 'TSH', result: 3.6, unit: 'mIU/L', referenceLow: 0.4, referenceHigh: 4.0, isAbnormal: false, category: 'thyroid' },
            { testName: 'Free T4', result: 1.25, unit: 'ng/dL', referenceLow: 0.8, referenceHigh: 1.8, isAbnormal: false, category: 'thyroid' },
            { testName: 'Free T3', result: 2.95, unit: 'pg/mL', referenceLow: 2.0, referenceHigh: 4.4, isAbnormal: false, category: 'thyroid' },
            { testName: 'Anti-TPO', result: 78.0, unit: 'IU/mL', referenceLow: 0, referenceHigh: 34, isAbnormal: true, category: 'thyroid' },
            { testName: 'Total Cholesterol', result: 192.0, unit: 'mg/dL', referenceLow: 125, referenceHigh: 200, isAbnormal: false, category: 'lipid' },
          ],
        },
        {
          reportDate: d(0),
          reportType: 'thyroid_panel',
          status: 'verified',
          notes: 'Target euthyroid steady state reached',
          labValues: [
            { testName: 'TSH', result: 2.15, unit: 'mIU/L', referenceLow: 0.4, referenceHigh: 4.0, isAbnormal: false, category: 'thyroid' },
            { testName: 'Free T4', result: 1.38, unit: 'ng/dL', referenceLow: 0.8, referenceHigh: 1.8, isAbnormal: false, category: 'thyroid' },
            { testName: 'Free T3', result: 3.20, unit: 'pg/mL', referenceLow: 2.0, referenceHigh: 4.4, isAbnormal: false, category: 'thyroid' },
            { testName: 'Anti-TPO', result: 42.0, unit: 'IU/mL', referenceLow: 0, referenceHigh: 34, isAbnormal: true, category: 'thyroid' },
            { testName: 'Total Cholesterol', result: 180.0, unit: 'mg/dL', referenceLow: 125, referenceHigh: 200, isAbnormal: false, category: 'lipid' },
          ],
        },
      ],
    },
    {
      patient: {
        name: 'Priya Sharma',
        age: 26,
        gender: 'Female',
        phoneNumber: '+1 (555) 876-5432',
        email: 'priya.sharma@medmail.com',
        medicalHistory: 'Oligomenorrhea since menarche. Polycystic ovarian morphology on pelvic ultrasound.',
        notes: 'Under evaluation for fertility planning and hirsutism. Started on Inositol & Metformin 500mg.',
        weight: 69.5,
        height: 158.0,
        bmi: 27.8,
        bloodPressureSystolic: 122,
        bloodPressureDiastolic: 78,
        fastingBloodSugar: 108.0,
        menstrualCycleLength: 48,
        menstrualRegularity: 'irregular',
        hairGrowthPattern: 'moderate_hirsutism',
        skinDarkening: 'moderate_acanthosis',
        follicleCount: 19,
        insulinResistance: 'moderate',
      },
      symptoms: [
        { symptomName: 'Irregular Menstrual Cycles', severity: 'severe', category: 'menstrual', notes: 'Cycles every 45-60 days' },
        { symptomName: 'Hirsutism (Facial/Chin)', severity: 'moderate', category: 'dermatological', notes: 'Coarse terminal hair' },
        { symptomName: 'Cystic Acne', severity: 'moderate', category: 'dermatological', notes: 'Jawline flares' },
        { symptomName: 'Acanthosis Nigricans', severity: 'moderate', category: 'dermatological', notes: 'Velvety nape darkening' },
        { symptomName: 'Postprandial Sugar Cravings', severity: 'moderate', category: 'energy', notes: 'Afternoon energy drops' },
      ],
      reports: [
        {
          reportDate: d(150),
          reportType: 'pcos_panel',
          status: 'verified',
          notes: 'Initial Rotterdam Criteria Endocrinology Panel',
          labValues: [
            { testName: 'Total Testosterone', result: 84.0, unit: 'ng/dL', referenceLow: 15, referenceHigh: 70, isAbnormal: true, category: 'hormone' },
            { testName: 'LH', result: 17.2, unit: 'mIU/mL', referenceLow: 2.0, referenceHigh: 12.0, isAbnormal: true, category: 'hormone' },
            { testName: 'FSH', result: 4.9, unit: 'mIU/mL', referenceLow: 3.5, referenceHigh: 12.5, isAbnormal: false, category: 'hormone' },
            { testName: 'DHEAS', result: 415.0, unit: 'µg/dL', referenceLow: 65, referenceHigh: 380, isAbnormal: true, category: 'hormone' },
            { testName: 'Fasting Insulin', result: 29.4, unit: 'µIU/mL', referenceLow: 2.6, referenceHigh: 24.9, isAbnormal: true, category: 'metabolic' },
            { testName: 'Fasting Blood Sugar', result: 114.0, unit: 'mg/dL', referenceLow: 70, referenceHigh: 99, isAbnormal: true, category: 'metabolic' },
            { testName: 'HbA1c', result: 5.9, unit: '%', referenceLow: 4.0, referenceHigh: 5.6, isAbnormal: true, category: 'metabolic' },
          ],
        },
        {
          reportDate: d(75),
          reportType: 'pcos_panel',
          status: 'verified',
          notes: '10-week lifestyle and insulin sensitizer check',
          labValues: [
            { testName: 'Total Testosterone', result: 64.0, unit: 'ng/dL', referenceLow: 15, referenceHigh: 70, isAbnormal: false, category: 'hormone' },
            { testName: 'LH', result: 11.8, unit: 'mIU/mL', referenceLow: 2.0, referenceHigh: 12.0, isAbnormal: false, category: 'hormone' },
            { testName: 'FSH', result: 5.2, unit: 'mIU/mL', referenceLow: 3.5, referenceHigh: 12.5, isAbnormal: false, category: 'hormone' },
            { testName: 'DHEAS', result: 340.0, unit: 'µg/dL', referenceLow: 65, referenceHigh: 380, isAbnormal: false, category: 'hormone' },
            { testName: 'Fasting Insulin', result: 18.6, unit: 'µIU/mL', referenceLow: 2.6, referenceHigh: 24.9, isAbnormal: false, category: 'metabolic' },
            { testName: 'Fasting Blood Sugar', result: 98.0, unit: 'mg/dL', referenceLow: 70, referenceHigh: 99, isAbnormal: false, category: 'metabolic' },
          ],
        },
        {
          reportDate: d(0),
          reportType: 'pcos_panel',
          status: 'verified',
          notes: 'Maintenance hormonal balance check - Cycle normalized to 32 days',
          labValues: [
            { testName: 'Total Testosterone', result: 46.0, unit: 'ng/dL', referenceLow: 15, referenceHigh: 70, isAbnormal: false, category: 'hormone' },
            { testName: 'LH', result: 8.1, unit: 'mIU/mL', referenceLow: 2.0, referenceHigh: 12.0, isAbnormal: false, category: 'hormone' },
            { testName: 'FSH', result: 5.6, unit: 'mIU/mL', referenceLow: 3.5, referenceHigh: 12.5, isAbnormal: false, category: 'hormone' },
            { testName: 'DHEAS', result: 275.0, unit: 'µg/dL', referenceLow: 65, referenceHigh: 380, isAbnormal: false, category: 'hormone' },
            { testName: 'Fasting Insulin', result: 11.5, unit: 'µIU/mL', referenceLow: 2.6, referenceHigh: 24.9, isAbnormal: false, category: 'metabolic' },
            { testName: 'Fasting Blood Sugar', result: 88.0, unit: 'mg/dL', referenceLow: 70, referenceHigh: 99, isAbnormal: false, category: 'metabolic' },
            { testName: 'HbA1c', result: 5.3, unit: '%', referenceLow: 4.0, referenceHigh: 5.6, isAbnormal: false, category: 'metabolic' },
          ],
        },
      ],
    },
    {
      patient: {
        name: 'Sarah Jenkins',
        age: 41,
        gender: 'Female',
        phoneNumber: '+1 (555) 345-9012',
        email: 's.jenkins@patientcare.net',
        medicalHistory: 'Dual endocrine pathology: Longstanding PCOS with secondary autoimmune thyroiditis.',
        notes: 'Co-occurrence of subclinical thyroid failure and metabolic syndrome with insulin resistance.',
        weight: 83.5,
        height: 165.0,
        bmi: 30.7,
        bloodPressureSystolic: 136,
        bloodPressureDiastolic: 86,
        fastingBloodSugar: 116.0,
        menstrualCycleLength: 44,
        menstrualRegularity: 'irregular',
        hairGrowthPattern: 'mild_hirsutism',
        skinDarkening: 'mild_acanthosis',
        follicleCount: 15,
        insulinResistance: 'moderate',
      },
      symptoms: [
        { symptomName: 'Chronic Exhaustion', severity: 'severe', category: 'energy', notes: 'Severe daytime somnolence' },
        { symptomName: 'Rapid Weight Gain', severity: 'severe', category: 'weight', notes: 'Central adiposity increase' },
        { symptomName: 'Irregular Menses', severity: 'moderate', category: 'menstrual', notes: 'Oligomenorrhea' },
        { symptomName: 'Cold Sensitivity', severity: 'moderate', category: 'temperature', notes: 'Requires warm clothing in summer' },
        { symptomName: 'Joint & Muscle Stiffness', severity: 'moderate', category: 'musculoskeletal', notes: 'Morning hand stiffness' },
        { symptomName: 'Diffuse Alopecia', severity: 'mild', category: 'dermatological', notes: 'Crown thinning' },
      ],
      reports: [
        {
          reportDate: d(140),
          reportType: 'complete',
          status: 'verified',
          notes: 'Combined Thyroid + Metabolic Endocrine Comprehensive Panel',
          labValues: [
            { testName: 'TSH', result: 7.45, unit: 'mIU/L', referenceLow: 0.4, referenceHigh: 4.0, isAbnormal: true, category: 'thyroid' },
            { testName: 'Free T4', result: 0.76, unit: 'ng/dL', referenceLow: 0.8, referenceHigh: 1.8, isAbnormal: true, category: 'thyroid' },
            { testName: 'Anti-TPO', result: 185.0, unit: 'IU/mL', referenceLow: 0, referenceHigh: 34, isAbnormal: true, category: 'thyroid' },
            { testName: 'Total Testosterone', result: 76.0, unit: 'ng/dL', referenceLow: 15, referenceHigh: 70, isAbnormal: true, category: 'hormone' },
            { testName: 'LH', result: 13.5, unit: 'mIU/mL', referenceLow: 2.0, referenceHigh: 12.0, isAbnormal: true, category: 'hormone' },
            { testName: 'FSH', result: 5.1, unit: 'mIU/mL', referenceLow: 3.5, referenceHigh: 12.5, isAbnormal: false, category: 'hormone' },
            { testName: 'Fasting Insulin', result: 26.8, unit: 'µIU/mL', referenceLow: 2.6, referenceHigh: 24.9, isAbnormal: true, category: 'metabolic' },
            { testName: 'Fasting Blood Sugar', result: 118.0, unit: 'mg/dL', referenceLow: 70, referenceHigh: 99, isAbnormal: true, category: 'metabolic' },
            { testName: 'HbA1c', result: 6.2, unit: '%', referenceLow: 4.0, referenceHigh: 5.6, isAbnormal: true, category: 'metabolic' },
            { testName: 'Triglycerides', result: 195.0, unit: 'mg/dL', referenceLow: 50, referenceHigh: 150, isAbnormal: true, category: 'lipid' },
          ],
        },
        {
          reportDate: d(70),
          reportType: 'complete',
          status: 'verified',
          notes: 'Combined therapy evaluation (Levothyroxine + Metformin)',
          labValues: [
            { testName: 'TSH', result: 4.2, unit: 'mIU/L', referenceLow: 0.4, referenceHigh: 4.0, isAbnormal: true, category: 'thyroid' },
            { testName: 'Free T4', result: 1.10, unit: 'ng/dL', referenceLow: 0.8, referenceHigh: 1.8, isAbnormal: false, category: 'thyroid' },
            { testName: 'Anti-TPO', result: 130.0, unit: 'IU/mL', referenceLow: 0, referenceHigh: 34, isAbnormal: true, category: 'thyroid' },
            { testName: 'Total Testosterone', result: 58.0, unit: 'ng/dL', referenceLow: 15, referenceHigh: 70, isAbnormal: false, category: 'hormone' },
            { testName: 'Fasting Insulin', result: 17.4, unit: 'µIU/mL', referenceLow: 2.6, referenceHigh: 24.9, isAbnormal: false, category: 'metabolic' },
            { testName: 'Fasting Blood Sugar', result: 102.0, unit: 'mg/dL', referenceLow: 70, referenceHigh: 99, isAbnormal: true, category: 'metabolic' },
            { testName: 'Triglycerides', result: 165.0, unit: 'mg/dL', referenceLow: 50, referenceHigh: 150, isAbnormal: true, category: 'lipid' },
          ],
        },
        {
          reportDate: d(0),
          reportType: 'complete',
          status: 'verified',
          notes: 'Follow-up - Significant improvement in metabolic and thyroid markers',
          labValues: [
            { testName: 'TSH', result: 2.4, unit: 'mIU/L', referenceLow: 0.4, referenceHigh: 4.0, isAbnormal: false, category: 'thyroid' },
            { testName: 'Free T4', result: 1.35, unit: 'ng/dL', referenceLow: 0.8, referenceHigh: 1.8, isAbnormal: false, category: 'thyroid' },
            { testName: 'Anti-TPO', result: 64.0, unit: 'IU/mL', referenceLow: 0, referenceHigh: 34, isAbnormal: true, category: 'thyroid' },
            { testName: 'Total Testosterone', result: 42.0, unit: 'ng/dL', referenceLow: 15, referenceHigh: 70, isAbnormal: false, category: 'hormone' },
            { testName: 'Fasting Insulin', result: 12.1, unit: 'µIU/mL', referenceLow: 2.6, referenceHigh: 24.9, isAbnormal: false, category: 'metabolic' },
            { testName: 'Fasting Blood Sugar', result: 92.0, unit: 'mg/dL', referenceLow: 70, referenceHigh: 99, isAbnormal: false, category: 'metabolic' },
            { testName: 'HbA1c', result: 5.5, unit: '%', referenceLow: 4.0, referenceHigh: 5.6, isAbnormal: false, category: 'metabolic' },
            { testName: 'Triglycerides', result: 135.0, unit: 'mg/dL', referenceLow: 50, referenceHigh: 150, isAbnormal: false, category: 'lipid' },
          ],
        },
      ],
    },
    {
      patient: {
        name: 'Marcus Vance',
        age: 29,
        gender: 'Male',
        phoneNumber: '+1 (555) 456-7890',
        email: 'marcus.vance@techcorp.io',
        medicalHistory: 'New-onset thyrotoxicosis / Graves disease. Resting tachycardia and fine resting hand tremor.',
        notes: 'Prescribed Methimazole 15mg daily and Propranolol for autonomic symptom control.',
        weight: 61.2,
        height: 179.0,
        bmi: 19.1,
        bloodPressureSystolic: 144,
        bloodPressureDiastolic: 90,
        fastingBloodSugar: 92.0,
        menstrualCycleLength: null,
        menstrualRegularity: null,
        hairGrowthPattern: 'normal',
        skinDarkening: 'none',
        follicleCount: null,
        insulinResistance: 'none',
      },
      symptoms: [
        { symptomName: 'Resting Tachycardia & Palpitations', severity: 'severe', category: 'cardiovascular', notes: 'Resting heart rate 110-120 bpm' },
        { symptomName: 'Fine Tremors', severity: 'severe', category: 'neurological', notes: 'Postural hand tremor' },
        { symptomName: 'Heat Intolerance & Hyperhidrosis', severity: 'severe', category: 'temperature', notes: 'Excessive sweating' },
        { symptomName: 'Rapid Unexplained Weight Loss', severity: 'severe', category: 'weight', notes: 'Lost 7kg over 8 weeks' },
        { symptomName: 'Insomnia & Agitation', severity: 'moderate', category: 'psychological', notes: 'Difficulty sleeping past 4 hours' },
      ],
      reports: [
        {
          reportDate: d(120),
          reportType: 'thyroid_panel',
          status: 'verified',
          notes: 'Acute Thyrotoxic Crisis / Graves Disease Presentation',
          labValues: [
            { testName: 'TSH', result: 0.01, unit: 'mIU/L', referenceLow: 0.4, referenceHigh: 4.0, isAbnormal: true, category: 'thyroid' },
            { testName: 'Free T4', result: 3.65, unit: 'ng/dL', referenceLow: 0.8, referenceHigh: 1.8, isAbnormal: true, category: 'thyroid' },
            { testName: 'Free T3', result: 8.20, unit: 'pg/mL', referenceLow: 2.0, referenceHigh: 4.4, isAbnormal: true, category: 'thyroid' },
            { testName: 'Anti-TPO', result: 18.0, unit: 'IU/mL', referenceLow: 0, referenceHigh: 34, isAbnormal: false, category: 'thyroid' },
          ],
        },
        {
          reportDate: d(60),
          reportType: 'thyroid_panel',
          status: 'verified',
          notes: '6-week antithyroid drug therapy assessment',
          labValues: [
            { testName: 'TSH', result: 0.18, unit: 'mIU/L', referenceLow: 0.4, referenceHigh: 4.0, isAbnormal: true, category: 'thyroid' },
            { testName: 'Free T4', result: 2.10, unit: 'ng/dL', referenceLow: 0.8, referenceHigh: 1.8, isAbnormal: true, category: 'thyroid' },
            { testName: 'Free T3', result: 4.80, unit: 'pg/mL', referenceLow: 2.0, referenceHigh: 4.4, isAbnormal: true, category: 'thyroid' },
          ],
        },
        {
          reportDate: d(0),
          reportType: 'thyroid_panel',
          status: 'verified',
          notes: 'Euthyroid recovery maintenance',
          labValues: [
            { testName: 'TSH', result: 1.15, unit: 'mIU/L', referenceLow: 0.4, referenceHigh: 4.0, isAbnormal: false, category: 'thyroid' },
            { testName: 'Free T4', result: 1.35, unit: 'ng/dL', referenceLow: 0.8, referenceHigh: 1.8, isAbnormal: false, category: 'thyroid' },
            { testName: 'Free T3', result: 3.10, unit: 'pg/mL', referenceLow: 2.0, referenceHigh: 4.4, isAbnormal: false, category: 'thyroid' },
          ],
        },
      ],
    },
    {
      patient: {
        name: 'Amina Al-Mansoor',
        age: 31,
        gender: 'Female',
        phoneNumber: '+1 (555) 678-9012',
        email: 'amina.m@globalwellness.com',
        medicalHistory: 'No chronic conditions. Regular annual wellness evaluation.',
        notes: 'Asymptomatic. Healthy baseline control screening.',
        weight: 58.0,
        height: 166.0,
        bmi: 21.0,
        bloodPressureSystolic: 114,
        bloodPressureDiastolic: 74,
        fastingBloodSugar: 84.0,
        menstrualCycleLength: 28,
        menstrualRegularity: 'regular',
        hairGrowthPattern: 'normal',
        skinDarkening: 'none',
        follicleCount: 7,
        insulinResistance: 'none',
      },
      symptoms: [
        { symptomName: 'General Wellness / No Acute Symptoms', severity: 'none', category: 'energy', notes: 'Normal energy level' },
      ],
      reports: [
        {
          reportDate: d(180),
          reportType: 'complete',
          status: 'verified',
          notes: 'Annual Routine Health Checkup (Normal Panel)',
          labValues: [
            { testName: 'TSH', result: 1.75, unit: 'mIU/L', referenceLow: 0.4, referenceHigh: 4.0, isAbnormal: false, category: 'thyroid' },
            { testName: 'Free T4', result: 1.28, unit: 'ng/dL', referenceLow: 0.8, referenceHigh: 1.8, isAbnormal: false, category: 'thyroid' },
            { testName: 'Free T3', result: 3.15, unit: 'pg/mL', referenceLow: 2.0, referenceHigh: 4.4, isAbnormal: false, category: 'thyroid' },
            { testName: 'Anti-TPO', result: 6.0, unit: 'IU/mL', referenceLow: 0, referenceHigh: 34, isAbnormal: false, category: 'thyroid' },
            { testName: 'Total Testosterone', result: 26.0, unit: 'ng/dL', referenceLow: 15, referenceHigh: 70, isAbnormal: false, category: 'hormone' },
            { testName: 'LH', result: 5.4, unit: 'mIU/mL', referenceLow: 2.0, referenceHigh: 12.0, isAbnormal: false, category: 'hormone' },
            { testName: 'FSH', result: 5.9, unit: 'mIU/mL', referenceLow: 3.5, referenceHigh: 12.5, isAbnormal: false, category: 'hormone' },
            { testName: 'Fasting Blood Sugar', result: 84.0, unit: 'mg/dL', referenceLow: 70, referenceHigh: 99, isAbnormal: false, category: 'metabolic' },
            { testName: 'Total Cholesterol', result: 165.0, unit: 'mg/dL', referenceLow: 125, referenceHigh: 200, isAbnormal: false, category: 'lipid' },
            { testName: 'HDL Cholesterol', result: 58.0, unit: 'mg/dL', referenceLow: 40, referenceHigh: 60, isAbnormal: false, category: 'lipid' },
            { testName: 'LDL Cholesterol', result: 92.0, unit: 'mg/dL', referenceLow: 0, referenceHigh: 100, isAbnormal: false, category: 'lipid' },
          ],
        },
        {
          reportDate: d(0),
          reportType: 'complete',
          status: 'verified',
          notes: 'Follow-up Routine Preventive Checkup',
          labValues: [
            { testName: 'TSH', result: 1.82, unit: 'mIU/L', referenceLow: 0.4, referenceHigh: 4.0, isAbnormal: false, category: 'thyroid' },
            { testName: 'Free T4', result: 1.30, unit: 'ng/dL', referenceLow: 0.8, referenceHigh: 1.8, isAbnormal: false, category: 'thyroid' },
            { testName: 'Free T3', result: 3.22, unit: 'pg/mL', referenceLow: 2.0, referenceHigh: 4.4, isAbnormal: false, category: 'thyroid' },
            { testName: 'Anti-TPO', result: 7.0, unit: 'IU/mL', referenceLow: 0, referenceHigh: 34, isAbnormal: false, category: 'thyroid' },
            { testName: 'Total Testosterone', result: 24.0, unit: 'ng/dL', referenceLow: 15, referenceHigh: 70, isAbnormal: false, category: 'hormone' },
            { testName: 'Fasting Blood Sugar', result: 82.0, unit: 'mg/dL', referenceLow: 70, referenceHigh: 99, isAbnormal: false, category: 'metabolic' },
          ],
        },
      ],
    },
    {
      patient: {
        name: 'David Chen',
        age: 52,
        gender: 'Male',
        phoneNumber: '+1 (555) 789-0123',
        email: 'david.chen@enterprise.com',
        medicalHistory: 'Subclinical hypothyroidism with mixed hyperlipidemia and elevated BMI.',
        notes: 'Mild fatigue, borderline TSH elevation with preserved free hormone concentrations.',
        weight: 87.0,
        height: 173.0,
        bmi: 29.1,
        bloodPressureSystolic: 138,
        bloodPressureDiastolic: 88,
        fastingBloodSugar: 104.0,
        menstrualCycleLength: null,
        menstrualRegularity: null,
        hairGrowthPattern: 'normal',
        skinDarkening: 'none',
        follicleCount: null,
        insulinResistance: 'mild',
      },
      symptoms: [
        { symptomName: 'Mild Daytime Fatigue', severity: 'mild', category: 'energy', notes: 'Midday slump' },
        { symptomName: 'Mild Muscle Stiffness', severity: 'mild', category: 'musculoskeletal', notes: 'Post-exercise soreness' },
      ],
      reports: [
        {
          reportDate: d(160),
          reportType: 'metabolic_panel',
          status: 'verified',
          notes: 'Cardiometabolic & Thyroid Initial Screen',
          labValues: [
            { testName: 'TSH', result: 5.65, unit: 'mIU/L', referenceLow: 0.4, referenceHigh: 4.0, isAbnormal: true, category: 'thyroid' },
            { testName: 'Free T4', result: 1.05, unit: 'ng/dL', referenceLow: 0.8, referenceHigh: 1.8, isAbnormal: false, category: 'thyroid' },
            { testName: 'Total Cholesterol', result: 242.0, unit: 'mg/dL', referenceLow: 125, referenceHigh: 200, isAbnormal: true, category: 'lipid' },
            { testName: 'LDL Cholesterol', result: 158.0, unit: 'mg/dL', referenceLow: 0, referenceHigh: 100, isAbnormal: true, category: 'lipid' },
            { testName: 'Triglycerides', result: 215.0, unit: 'mg/dL', referenceLow: 50, referenceHigh: 150, isAbnormal: true, category: 'lipid' },
            { testName: 'Fasting Blood Sugar', result: 106.0, unit: 'mg/dL', referenceLow: 70, referenceHigh: 99, isAbnormal: true, category: 'metabolic' },
          ],
        },
        {
          reportDate: d(80),
          reportType: 'metabolic_panel',
          status: 'verified',
          notes: 'Dietary modification & Statin therapy response',
          labValues: [
            { testName: 'TSH', result: 4.60, unit: 'mIU/L', referenceLow: 0.4, referenceHigh: 4.0, isAbnormal: true, category: 'thyroid' },
            { testName: 'Free T4', result: 1.15, unit: 'ng/dL', referenceLow: 0.8, referenceHigh: 1.8, isAbnormal: false, category: 'thyroid' },
            { testName: 'Total Cholesterol', result: 212.0, unit: 'mg/dL', referenceLow: 125, referenceHigh: 200, isAbnormal: true, category: 'lipid' },
            { testName: 'LDL Cholesterol', result: 132.0, unit: 'mg/dL', referenceLow: 0, referenceHigh: 100, isAbnormal: true, category: 'lipid' },
            { testName: 'Triglycerides', result: 175.0, unit: 'mg/dL', referenceLow: 50, referenceHigh: 150, isAbnormal: true, category: 'lipid' },
          ],
        },
        {
          reportDate: d(0),
          reportType: 'metabolic_panel',
          status: 'verified',
          notes: '6-month comprehensive metabolic follow-up',
          labValues: [
            { testName: 'TSH', result: 3.45, unit: 'mIU/L', referenceLow: 0.4, referenceHigh: 4.0, isAbnormal: false, category: 'thyroid' },
            { testName: 'Free T4', result: 1.24, unit: 'ng/dL', referenceLow: 0.8, referenceHigh: 1.8, isAbnormal: false, category: 'thyroid' },
            { testName: 'Total Cholesterol', result: 182.0, unit: 'mg/dL', referenceLow: 125, referenceHigh: 200, isAbnormal: false, category: 'lipid' },
            { testName: 'LDL Cholesterol', result: 108.0, unit: 'mg/dL', referenceLow: 0, referenceHigh: 100, isAbnormal: true, category: 'lipid' },
            { testName: 'Triglycerides', result: 138.0, unit: 'mg/dL', referenceLow: 50, referenceHigh: 150, isAbnormal: false, category: 'lipid' },
            { testName: 'Fasting Blood Sugar', result: 94.0, unit: 'mg/dL', referenceLow: 70, referenceHigh: 99, isAbnormal: false, category: 'metabolic' },
          ],
        },
      ],
    },
  ];

  for (const item of dataset) {
    let patient = await prisma.patient.findFirst({
      where: { name: item.patient.name },
    });

    if (!patient) {
      patient = await prisma.patient.create({
        data: item.patient,
      });
      console.log(`Created patient: ${patient.name}`);
    } else {
      console.log(`Found existing patient: ${patient.name}`);
    }

    // Add symptoms
    for (const sym of item.symptoms) {
      await prisma.symptomEntry.create({
        data: {
          patientId: patient.id,
          symptomName: sym.symptomName,
          severity: sym.severity,
          category: sym.category,
          notes: sym.notes,
        },
      });
    }

    // Add medical reports and lab values
    for (const rep of item.reports) {
      await prisma.medicalReport.create({
        data: {
          patientId: patient.id,
          reportDate: rep.reportDate,
          reportType: rep.reportType,
          status: rep.status,
          notes: rep.notes,
          labValues: {
            create: rep.labValues.map((lv) => ({
              testName: lv.testName,
              result: lv.result,
              unit: lv.unit,
              referenceLow: lv.referenceLow,
              referenceHigh: lv.referenceHigh,
              isAbnormal: lv.isAbnormal,
              category: lv.category,
            })),
          },
        },
      });
    }

    // Run clinical screenings
    const allLabValues = await prisma.labValue.findMany({
      where: { report: { patientId: patient.id } },
    });
    const allSymptoms = await prisma.symptomEntry.findMany({
      where: { patientId: patient.id },
    });

    const mappedLabValues = allLabValues.map((lv) => ({
      ...lv,
      result: lv.result ?? undefined,
      resultText: lv.resultText ?? undefined,
      unit: lv.unit ?? undefined,
      referenceLow: lv.referenceLow ?? undefined,
      referenceHigh: lv.referenceHigh ?? undefined,
      referenceText: lv.referenceText ?? undefined,
      confidence: lv.confidence ?? undefined,
      category: lv.category ?? undefined,
      notes: lv.notes ?? undefined,
      createdAt: lv.createdAt.toISOString(),
    })) as LabValue[];

    const mappedSymptoms = allSymptoms.map((s) => ({
      ...s,
      severity: s.severity as any,
      dateReported: s.dateReported.toISOString(),
      notes: s.notes ?? undefined,
      category: s.category ?? undefined,
      createdAt: s.createdAt.toISOString(),
      updatedAt: s.updatedAt.toISOString(),
    })) as SymptomEntry[];

    const thyroidScreening = screenThyroid(mappedLabValues, mappedSymptoms);
    const pcosScreening = screenPCOS(mappedLabValues, mappedSymptoms);
    const combinedScreening = screenCombined(thyroidScreening, pcosScreening);

    for (const scr of [thyroidScreening, pcosScreening, combinedScreening]) {
      await prisma.screeningResult.create({
        data: {
          patientId: patient.id,
          condition: scr.condition,
          riskLevel: scr.riskLevel,
          riskScore: scr.riskScore,
          confidence: scr.confidence,
          factors: JSON.stringify(scr.factors),
          summary: scr.summary,
          dataQuality: scr.dataQuality,
          missingData: JSON.stringify(scr.missingData),
        },
      });
    }

    console.log(`Seeded complete clinical records & screenings for ${patient.name}`);
  }

  console.log('Finished seeding all dataset reports and patient profiles!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
