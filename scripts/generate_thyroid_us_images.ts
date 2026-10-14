import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { db } from '../src/lib/db';

const publicThyroidUsDir = path.resolve('public/dataset/thyroid_us');
const dataThyroidUsDir = path.resolve('dataset/thyroid_us');

[publicThyroidUsDir, dataThyroidUsDir].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

const BASE_IMAGES = [
  'C:/Users/vishw/.gemini/antigravity-ide/brain/a775d82e-47c2-428e-b383-ab469cd339c2/test_thyroid_us_1791954759553.jpg',     // 0: Right lobe nodule
  'C:/Users/vishw/.gemini/antigravity-ide/brain/a775d82e-47c2-428e-b383-ab469cd339c2/thyroid_us_base2_1791954815591.jpg',   // 1: Left lobe nodule
  'C:/Users/vishw/.gemini/antigravity-ide/brain/a775d82e-47c2-428e-b383-ab469cd339c2/thyroid_us_base3_1791954870327.jpg',   // 2: Multinodular goiter
  'C:/Users/vishw/.gemini/antigravity-ide/brain/a775d82e-47c2-428e-b383-ab469cd339c2/thyroid_us_base4_1791954897690.jpg',   // 3: Hashimoto's coarse
  'C:/Users/vishw/.gemini/antigravity-ide/brain/a775d82e-47c2-428e-b383-ab469cd339c2/thyroid_us_base5_1791954922642.jpg'    // 4: Normal thyroid
];

interface CaseInfo {
  index: number;
  baseIndex: number;
  uhid: string;
  patientName: string;
  age: number;
  category: string;
  tirads: string;
  lobe: string;
  depth: string;
  gain: string;
  freq: string;
  flipX?: boolean;
  brightness?: number;
  contrast?: number;
  findings: string;
  measurements: string;
}

const CASES: CaseInfo[] = [
  {
    index: 1, baseIndex: 0, uhid: 'THY-US-001', patientName: 'Priya Sharma', age: 34,
    category: 'Solitary Hypoechoic Nodule (Right Lobe)', tirads: 'TI-RADS 3 (Mildly Suspicious)',
    lobe: 'Right Lobe', depth: '4 cm', gain: '72 dB', freq: '12 MHz',
    findings: 'Well-circumscribed solitary hypoechoic nodule in the mid right lobe. Regular margins, wider-than-tall orientation.',
    measurements: '9.2 × 6.8 mm'
  },
  {
    index: 2, baseIndex: 1, uhid: 'THY-US-002', patientName: 'Ananya Deshmukh', age: 29,
    category: 'Colloid Nodule with Comet-Tail Artifact (Left Lobe)', tirads: 'TI-RADS 2 (Benign)',
    lobe: 'Left Lobe', depth: '4 cm', gain: '74 dB', freq: '12 MHz',
    findings: 'Predominantly cystic nodule with internal echogenic foci exhibiting reverberation / comet-tail artifact in the left lobe.',
    measurements: '8.5 × 6.1 mm'
  },
  {
    index: 3, baseIndex: 2, uhid: 'THY-US-003', patientName: 'Kavya Reddy', age: 46,
    category: 'Multinodular Goiter (Bilateral Nodules)', tirads: 'TI-RADS 3 (Mildly Suspicious)',
    lobe: 'Bilateral', depth: '5 cm', gain: '71 dB', freq: '10 MHz',
    findings: 'Enlarged thyroid gland with multiple discrete rounded nodules scattered throughout both right and left lobes.',
    measurements: 'Rt: 12.4 mm, Lt: 10.8 mm'
  },
  {
    index: 4, baseIndex: 3, uhid: 'THY-US-004', patientName: 'Meera Kulkarni', age: 38,
    category: "Hashimoto's Autoimmune Thyroiditis", tirads: 'Diffuse Disease (Non-Focal)',
    lobe: 'Bilateral Diffuse', depth: '4 cm', gain: '73 dB', freq: '12 MHz',
    findings: 'Diffuse coarse heterogeneous parenchymal echotexture with hypoechoic micronodulation and echogenic fibrous septa.',
    measurements: 'Diffuse enlargement, no dominant nodule'
  },
  {
    index: 5, baseIndex: 4, uhid: 'THY-US-005', patientName: 'Sanjana Nair', age: 25,
    category: 'Normal Thyroid Ultrasound (Homogeneous Parenchyma)', tirads: 'TI-RADS 1 (Normal)',
    lobe: 'Bilateral Normal', depth: '4 cm', gain: '70 dB', freq: '12 MHz',
    findings: 'Normal thyroid gland morphology. Homogeneous fine ground-glass echogenicity, smooth thin margins, normal vascularity.',
    measurements: 'Rt: 4.1×1.5×1.4 cm, Lt: 3.9×1.4×1.3 cm'
  },
  {
    index: 6, baseIndex: 0, uhid: 'THY-US-006', patientName: 'Deepika Patel', age: 41,
    category: 'Subacute Granulomatous Thyroiditis (De Quervain)', tirads: 'Inflammatory (Atypical)',
    lobe: 'Right Lobe', depth: '4 cm', gain: '70 dB', freq: '11 MHz', flipX: true, brightness: 0.95,
    findings: 'Ill-defined patchy hypoechoic non-mass geographic area in the mid-to-lower pole with reduced vascular flow on Doppler.',
    measurements: 'Geographic area ~ 14 × 9 mm'
  },
  {
    index: 7, baseIndex: 1, uhid: 'THY-US-007', patientName: 'Divya Iyer', age: 37,
    category: 'Hypoechoic Nodule with Microcalcifications (Left Lobe)', tirads: 'TI-RADS 4 (Moderately Suspicious)',
    lobe: 'Left Lobe', depth: '4 cm', gain: '75 dB', freq: '13 MHz', brightness: 1.05,
    findings: 'Solid hypoechoic nodule in the left lobe exhibiting punctate hyperechoic microcalcifications without acoustic shadowing.',
    measurements: '11.4 × 8.2 mm'
  },
  {
    index: 8, baseIndex: 0, uhid: 'THY-US-008', patientName: 'Sneha Menon', age: 31,
    category: 'Spongiform Benign Nodule (Right Lobe)', tirads: 'TI-RADS 2 (Benign)',
    lobe: 'Right Lobe', depth: '4.5 cm', gain: '72 dB', freq: '12 MHz', brightness: 1.02,
    findings: 'Classic spongiform microcystic nodule occupying >50% of the volume. Characteristic honeycomb appearance, completely benign.',
    measurements: '13.5 × 11.2 mm'
  },
  {
    index: 9, baseIndex: 2, uhid: 'THY-US-009', patientName: 'Varsha Joshi', age: 49,
    category: 'Mixed Cystic-Solid Nodule (Isthmus)', tirads: 'TI-RADS 3 (Mildly Suspicious)',
    lobe: 'Isthmus', depth: '3.5 cm', gain: '69 dB', freq: '14 MHz',
    findings: 'Well-defined oval mixed composition nodule in the thyroid isthmus, predominantly solid with internal cystic spaces.',
    measurements: '7.3 × 5.0 mm'
  },
  {
    index: 10, baseIndex: 1, uhid: 'THY-US-010', patientName: 'Shreya Bhat', age: 52,
    category: 'Taller-than-Wide Hypoechoic Nodule (Left Lobe)', tirads: 'TI-RADS 5 (Highly Suspicious)',
    lobe: 'Left Lobe', depth: '4 cm', gain: '76 dB', freq: '13 MHz', flipX: true, brightness: 0.92,
    findings: 'Solid markedly hypoechoic nodule, taller-than-wide in transverse plane, with lobulated irregular margins. FNA recommended.',
    measurements: '10.5 × 12.8 mm'
  },
  {
    index: 11, baseIndex: 3, uhid: 'THY-US-011', patientName: 'Pooja Hegde', age: 33,
    category: "Graves' Disease (Diffuse Hyperplasia)", tirads: 'Diffuse Autoimmune',
    lobe: 'Bilateral Diffuse', depth: '4.5 cm', gain: '72 dB', freq: '11 MHz', brightness: 1.05,
    findings: 'Marked diffuse thyroid parenchymal hypertrophy with convex lobar margins and diffuse hypoechogenicity ("thyroid inferno").',
    measurements: 'Symmetric enlargement (volume > 26 mL)'
  },
  {
    index: 12, baseIndex: 0, uhid: 'THY-US-012', patientName: 'Radhika Rao', age: 44,
    category: 'Partially Cystic Nodule with Internal Debris (Right Lobe)', tirads: 'TI-RADS 3 (Mildly Suspicious)',
    lobe: 'Right Lobe', depth: '4 cm', gain: '71 dB', freq: '12 MHz', brightness: 0.98,
    findings: 'Complex nodule with anechoic fluid component and eccentric avascular solid tissue. No microcalcifications.',
    measurements: '14.0 × 9.5 mm'
  },
  {
    index: 13, baseIndex: 1, uhid: 'THY-US-013', patientName: 'Tanvi Verma', age: 28,
    category: 'Isoechoic Adenoma with Complete Peripheral Halo (Left Lobe)', tirads: 'TI-RADS 3 (Mildly Suspicious)',
    lobe: 'Left Lobe', depth: '4 cm', gain: '73 dB', freq: '12 MHz', brightness: 1.02,
    findings: 'Homogeneous isoechoic follicular adenoma surrounded by a continuous uniform hypoechoic fibrous rim/halo.',
    measurements: '12.8 × 10.1 mm'
  },
  {
    index: 14, baseIndex: 2, uhid: 'THY-US-014', patientName: 'Aishwarya Singh', age: 47,
    category: 'Bilateral Colloid Nodules with Punctate Foci', tirads: 'TI-RADS 2 (Benign)',
    lobe: 'Bilateral', depth: '4.5 cm', gain: '70 dB', freq: '11 MHz', flipX: true,
    findings: 'Multiple small bilateral colloid cysts with comet-tail artifacts. Preserved parenchymal background.',
    measurements: 'Rt: 6.2 mm, Lt: 5.5 mm'
  },
  {
    index: 15, baseIndex: 0, uhid: 'THY-US-015', patientName: 'Gayathri Gupta', age: 36,
    category: 'Simple Anechoic Cyst (Right Lobe)', tirads: 'TI-RADS 2 (Benign)',
    lobe: 'Right Lobe', depth: '3.5 cm', gain: '68 dB', freq: '13 MHz', brightness: 1.04,
    findings: 'Purely anechoic, thin-walled, round fluid-filled simple thyroid cyst with posterior acoustic enhancement.',
    measurements: '9.8 × 8.4 mm'
  },
  {
    index: 16, baseIndex: 1, uhid: 'THY-US-016', patientName: 'Harini Aggarwal', age: 55,
    category: 'Nodule with Dense Macrocalcification & Shadowing (Left Lobe)', tirads: 'TI-RADS 4 (Moderately Suspicious)',
    lobe: 'Left Lobe', depth: '4.5 cm', gain: '74 dB', freq: '11 MHz', brightness: 0.94,
    findings: 'Coarse dense macrocalcification located in the posterior margin of the left lobe with prominent posterior acoustic shadow.',
    measurements: 'Calcification ~ 4.2 mm, Nodule ~ 12.0 mm'
  },
  {
    index: 17, baseIndex: 3, uhid: 'THY-US-017', patientName: 'Keerthi Mishra', age: 59,
    category: 'Atrophic Thyroiditis (End-Stage Hypothyroidism)', tirads: 'Atrophic / Fibrotic',
    lobe: 'Bilateral Shrunken', depth: '3.5 cm', gain: '75 dB', freq: '12 MHz', flipX: true, brightness: 0.90,
    findings: 'Markedly small, shrunken thyroid lobes with coarse hyperechoic fibrotic bands replacing normal parenchyma.',
    measurements: 'Rt AP: 0.7 cm, Lt AP: 0.6 cm'
  },
  {
    index: 18, baseIndex: 0, uhid: 'THY-US-018', patientName: 'Lavanya Chatterjee', age: 43,
    category: 'Dominant Nodule with Mild Tracheal Impression (Right Lobe)', tirads: 'TI-RADS 3 (Mildly Suspicious)',
    lobe: 'Right Lobe', depth: '5 cm', gain: '71 dB', freq: '10 MHz', brightness: 1.02,
    findings: 'Large well-defined oval isoechoic-to-hypoechoic nodule in the right lobe with mild contour protrusion toward tracheal fascia.',
    measurements: '18.2 × 13.5 mm'
  },
  {
    index: 19, baseIndex: 2, uhid: 'THY-US-019', patientName: 'Malini Banerjee', age: 32,
    category: 'Bilateral Subcentimeter Micronodules', tirads: 'TI-RADS 3 (Mildly Suspicious)',
    lobe: 'Bilateral', depth: '4 cm', gain: '72 dB', freq: '12 MHz', brightness: 1.01,
    findings: 'Several tiny non-palpable subcentimeter hypoechoic micronodules (4–6 mm) scattered in both lobes with sharp margins.',
    measurements: 'Largest 5.4 mm (Rt lower pole)'
  },
  {
    index: 20, baseIndex: 4, uhid: 'THY-US-020', patientName: 'Nandini Dutta', age: 24,
    category: 'Normal Young Adult Thyroid Baseline', tirads: 'TI-RADS 1 (Normal)',
    lobe: 'Bilateral Normal', depth: '4 cm', gain: '70 dB', freq: '13 MHz', flipX: true, brightness: 1.0,
    findings: 'Symmetric, completely normal thyroid lobes and isthmus with pristine fine speckle echogenicity and smooth capsular boundaries.',
    measurements: 'Rt: 3.8×1.3×1.2 cm, Lt: 3.7×1.3×1.1 cm'
  }
];

function createHUDOverlaySVG(info: CaseInfo, width: number, height: number): string {
  // Depth ruler on right
  const depthNum = parseFloat(info.depth) || 4;
  let depthTicks = '';
  const rulerX = width - 40;
  const startY = 60;
  const endY = height - 60;
  const totalSpan = endY - startY;

  for (let d = 0; d <= depthNum; d++) {
    const y = startY + (d / depthNum) * totalSpan;
    depthTicks += `
      <line x1='${rulerX}' y1='${y}' x2='${rulerX + 12}' y2='${y}' stroke='#e2e8f0' stroke-width='1.5'/>
      <text x='${rulerX - 8}' y='${y + 4}' font-family='Arial, sans-serif' font-size='14' font-weight='bold' fill='#e2e8f0' text-anchor='end'>${d}</text>
    `;
    if (d < depthNum) {
      const halfY = y + (1 / depthNum) * totalSpan * 0.5;
      depthTicks += `<line x1='${rulerX + 4}' y1='${halfY}' x2='${rulerX + 12}' y2='${halfY}' stroke='#94a3b8' stroke-width='1'/>`;
    }
  }

  depthTicks += `
    <text x='${rulerX - 8}' y='${endY + 28}' font-family='Arial, sans-serif' font-size='13' font-weight='bold' fill='#94a3b8' text-anchor='end'>cm</text>
  `;

  // HUD Glass Box bottom left
  const hudX = 25;
  const hudY = height - 190;
  const hudW = 280;
  const hudH = 165;

  return `
<svg width='${width}' height='${height}' xmlns='http://www.w3.org/2000/svg'>
  <!-- Depth Scale on right margin -->
  <g>
    <line x1='${rulerX + 12}' y1='${startY}' x2='${rulerX + 12}' y2='${endY}' stroke='#cbd5e1' stroke-width='1.5'/>
    ${depthTicks}
  </g>

  <!-- Image Info Translucent Glass Box -->
  <g transform='translate(${hudX}, ${hudY})'>
    <rect width='${hudW}' height='${hudH}' rx='8' fill='#090d16' fill-opacity='0.82' stroke='#334155' stroke-width='1.5'/>
    
    <text x='16' y='26' font-family='Arial, sans-serif' font-size='15' font-weight='bold' fill='#e2e8f0'>Image Info</text>
    <line x1='16' y1='34' x2='${hudW - 16}' y2='34' stroke='#334155' stroke-width='1'/>
    
    <text x='16' y='55' font-family='Arial, sans-serif' font-size='13' fill='#94a3b8'>Lobe:</text>
    <text x='75' y='55' font-family='Arial, sans-serif' font-size='13' font-weight='600' fill='#ffffff'>${info.lobe}</text>

    <text x='16' y='78' font-family='Arial, sans-serif' font-size='13' fill='#94a3b8'>Depth:</text>
    <text x='75' y='78' font-family='Arial, sans-serif' font-size='13' font-weight='600' fill='#ffffff'>${info.depth}</text>

    <text x='16' y='101' font-family='Arial, sans-serif' font-size='13' fill='#94a3b8'>Mode:</text>
    <text x='75' y='101' font-family='Arial, sans-serif' font-size='13' font-weight='600' fill='#38bdf8'>${info.mode || 'B-mode'}</text>

    <text x='16' y='124' font-family='Arial, sans-serif' font-size='13' fill='#94a3b8'>Gain:</text>
    <text x='75' y='124' font-family='Arial, sans-serif' font-size='13' font-weight='600' fill='#ffffff'>${info.gain}</text>

    <text x='16' y='147' font-family='Arial, sans-serif' font-size='12' fill='#94a3b8'>Classification:</text>
    <text x='110' y='147' font-family='Arial, sans-serif' font-size='12' font-weight='bold' fill='#34d399'>${info.tirads.split('(')[0].trim()}</text>
  </g>

  <!-- Clean Top Telemetry -->
  <text x='25' y='32' font-family='monospace' font-size='12' font-weight='bold' fill='#38bdf8'>LOGIQ E10 ULTRASOUND | LINEAR PROBE (9-14L)</text>
  <text x='${width - 80}' y='32' font-family='monospace' font-size='12' font-weight='bold' fill='#94a3b8' text-anchor='end'>${info.uhid} | B-MODE</text>
</svg>
`;
}

async function run() {
  console.log('Generating 20 clean Thyroid Ultrasound (US) images without bounding boxes...');

  const manifestEntries: any[] = [];

  for (const c of CASES) {
    const baseSrc = BASE_IMAGES[c.baseIndex];
    const fileName = `thyroid_us_${String(c.index).padStart(2, '0')}.png`;

    let pipeline = sharp(baseSrc)
      .resize(1120, 840, { fit: 'cover' });

    if (c.flipX) {
      pipeline = pipeline.flop();
    }

    if (c.brightness && c.brightness !== 1.0) {
      pipeline = pipeline.modulate({ brightness: c.brightness });
    }

    // Generate HUD Overlay SVG
    const hudSvg = createHUDOverlaySVG(c, 1120, 840);

    const finalImageBuffer = await pipeline
      .composite([
        {
          input: Buffer.from(hudSvg),
          top: 0,
          left: 0
        }
      ])
      .png({ quality: 95 })
      .toBuffer();

    // Write to dataset and public paths
    const pubPath = path.resolve(`public/dataset/thyroid_us/${fileName}`);
    const dataPath = path.resolve(`dataset/thyroid_us/${fileName}`);

    fs.writeFileSync(pubPath, finalImageBuffer);
    fs.writeFileSync(dataPath, finalImageBuffer);

    manifestEntries.push({
      id: c.uhid,
      index: c.index,
      type: 'thyroid_us',
      patientName: c.patientName,
      age: c.age,
      uhid: c.uhid,
      category: c.category,
      tirads: c.tirads,
      measurements: c.measurements,
      findings: c.findings,
      imagePathPublic: `/dataset/thyroid_us/${fileName}`,
      imagePathDataset: `dataset/thyroid_us/${fileName}`,
      imageInfo: {
        lobe: c.lobe,
        depth: c.depth,
        mode: 'B-mode',
        gain: c.gain,
        freq: c.freq
      }
    });

    console.log(`[${c.index}/20] Rendered ${fileName} - ${c.category} (Clean, No Bounding Box)`);
  }

  // Save metadata index JSON
  const manifestPath = path.resolve('dataset/thyroid_us_index.json');
  const pubManifestPath = path.resolve('public/dataset/thyroid_us_index.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifestEntries, null, 2));
  fs.writeFileSync(pubManifestPath, JSON.stringify(manifestEntries, null, 2));

  // Merge into main dataset_index.json
  const mainIndexPub = path.resolve('public/dataset/dataset_index.json');
  const mainIndexData = path.resolve('dataset/dataset_index.json');
  if (fs.existsSync(mainIndexPub)) {
    try {
      const existing = JSON.parse(fs.readFileSync(mainIndexPub, 'utf-8'));
      const filtered = Array.isArray(existing) ? existing.filter((e: any) => e.type !== 'thyroid_us') : [];
      const updated = [...filtered, ...manifestEntries];
      fs.writeFileSync(mainIndexPub, JSON.stringify(updated, null, 2));
      fs.writeFileSync(mainIndexData, JSON.stringify(updated, null, 2));
      console.log('Updated master dataset_index.json with 20 Thyroid US images.');
    } catch (e) {
      console.error('Error updating main dataset index:', e);
    }
  }

  // Update Database records for these 20 Thyroid US cases
  console.log('Synchronizing 20 Thyroid US cases into database custom.db...');
  for (const c of CASES) {
    const fileName = `thyroid_us_${String(c.index).padStart(2, '0')}.png`;
    const pubImg = `/dataset/thyroid_us/${fileName}`;

    // Find or create patient
    let patient = await db.patient.findFirst({
      where: { name: c.patientName }
    });

    if (!patient) {
      patient = await db.patient.create({
        data: {
          name: c.patientName,
          age: c.age,
          gender: 'Female',
          medicalHistory: `Ultrasound examination for ${c.category}. Referred for TI-RADS evaluation.`,
          notes: `Thyroid sonogram recorded under UHID ${c.uhid}.`,
          height: 162,
          weight: 60,
          bmi: 22.8
        }
      });
    }

    // Create medical report for this ultrasound
    const report = await db.medicalReport.create({
      data: {
        patientId: patient.id,
        reportType: 'thyroid_ultrasound',
        fileName: fileName,
        fileType: 'image/png',
        fileData: pubImg,
        status: 'verified',
        ocrConfidence: 0.99,
        notes: `${c.category} - ${c.tirads}. ${c.findings} Measurements: ${c.measurements}`,
        ocrExtracted: JSON.stringify({
          modality: 'Thyroid Ultrasound (B-mode)',
          category: c.category,
          tirads: c.tirads,
          lobe: c.lobe,
          depth: c.depth,
          gain: c.gain,
          measurements: c.measurements,
          findings: c.findings
        })
      }
    });

    // Create corresponding Lab/Imaging Value entry
    await db.labValue.create({
      data: {
        reportId: report.id,
        testName: 'Thyroid Ultrasound TI-RADS',
        result: parseFloat(c.tirads.replace(/[^0-9.]/g, '')) || 3,
        resultText: c.tirads,
        unit: 'score',
        isAbnormal: !c.tirads.includes('Normal') && !c.tirads.includes('Benign'),
        isVerified: true,
        category: 'imaging',
        notes: `Nodule dimensions: ${c.measurements} | ${c.findings}`
      }
    });
  }

  console.log('Successfully completed 20 Thyroid US images and synced with custom.db!');
}

run()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Error generating ultrasound images:', err);
    process.exit(1);
  });
