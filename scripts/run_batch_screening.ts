import { db } from '../src/lib/db';
import { screenThyroid, screenPCOS, screenCombined } from '../src/lib/screening-engine';
import type { LabValue, SymptomEntry } from '../src/lib/types';

async function batchScreen() {
  console.log('Running batch screening on all patients...');
  const patients = await db.patient.findMany({
    include: {
      reports: {
        include: { labValues: true }
      },
      symptoms: true,
      screeningResults: true
    }
  });

  let screened = 0;
  for (const patient of patients) {
    if (patient.screeningResults.length > 0) continue; // Already screened

    const allLabValues: LabValue[] = patient.reports.flatMap(r =>
      r.labValues.map(lv => ({
        id: lv.id,
        reportId: lv.reportId,
        testName: lv.testName,
        result: lv.result ?? undefined,
        unit: lv.unit ?? undefined,
        referenceLow: lv.referenceLow ?? undefined,
        referenceHigh: lv.referenceHigh ?? undefined,
        isAbnormal: lv.isAbnormal,
        isVerified: lv.isVerified,
        createdAt: lv.createdAt.toISOString()
      }))
    );

    const symptoms: SymptomEntry[] = patient.symptoms.map(s => ({
      id: s.id,
      patientId: s.patientId,
      symptomName: s.symptomName,
      severity: s.severity as SymptomEntry['severity'],
      dateReported: s.dateReported.toISOString(),
      createdAt: s.createdAt.toISOString(),
      updatedAt: s.updatedAt.toISOString()
    }));

    if (allLabValues.length === 0 && symptoms.length === 0) continue;

    const tRes = screenThyroid(allLabValues, symptoms);
    const pRes = screenPCOS(allLabValues, symptoms);
    const cRes = screenCombined(tRes, pRes);

    await db.screeningResult.createMany({
      data: [
        {
          patientId: patient.id,
          condition: 'thyroid',
          riskLevel: tRes.riskLevel,
          riskScore: tRes.riskScore,
          confidence: tRes.confidence,
          factors: JSON.stringify(tRes.factors),
          summary: tRes.summary,
          dataQuality: tRes.dataQuality,
          missingData: JSON.stringify(tRes.missingData)
        },
        {
          patientId: patient.id,
          condition: 'pcos',
          riskLevel: pRes.riskLevel,
          riskScore: pRes.riskScore,
          confidence: pRes.confidence,
          factors: JSON.stringify(pRes.factors),
          summary: pRes.summary,
          dataQuality: pRes.dataQuality,
          missingData: JSON.stringify(pRes.missingData)
        },
        {
          patientId: patient.id,
          condition: 'combined',
          riskLevel: cRes.riskLevel,
          riskScore: cRes.riskScore,
          confidence: cRes.confidence,
          factors: JSON.stringify(cRes.factors),
          summary: cRes.summary,
          dataQuality: cRes.dataQuality,
          missingData: JSON.stringify(cRes.missingData)
        }
      ]
    });

    screened++;
  }

  console.log(`Successfully generated screening results for ${screened} patients!`);
}

batchScreen().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
