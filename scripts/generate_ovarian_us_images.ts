import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { db } from '../src/lib/db';

const publicOvarianUsDir = path.resolve('public/dataset/ovarian_us');
const dataOvarianUsDir = path.resolve('dataset/ovarian_us');

[publicOvarianUsDir, dataOvarianUsDir].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

const BASE_IMAGES = [
  'C:/Users/vishw/.gemini/antigravity-ide/brain/a775d82e-47c2-428e-b383-ab469cd339c2/.user_uploaded/media_1791955466803.jpg', // 0: User reference dual panel
  'C:/Users/vishw/.gemini/antigravity-ide/brain/a775d82e-47c2-428e-b383-ab469cd339c2/ovarian_us_base1_1791955605115.jpg',   // 1: Classic bilateral PCOM
  'C:/Users/vishw/.gemini/antigravity-ide/brain/a775d82e-47c2-428e-b383-ab469cd339c2/ovarian_us_base2_1791955634050.jpg',   // 2: Right dominant follicle + stroma
  'C:/Users/vishw/.gemini/antigravity-ide/brain/a775d82e-47c2-428e-b383-ab469cd339c2/ovarian_us_base3_1791955719272.jpg',   // 3: Multi-follicular string of pearls
  'C:/Users/vishw/.gemini/antigravity-ide/brain/a775d82e-47c2-428e-b383-ab469cd339c2/ovarian_us_base4_1791955749749.jpg',   // 4: Left dominant follicle + Right PCOM
  'C:/Users/vishw/.gemini/antigravity-ide/brain/a775d82e-47c2-428e-b383-ab469cd339c2/ovarian_us_base5_1791955773559.jpg'    // 5: Baseline physiological count
];

interface OvarianCaseInfo {
  index: number;
  baseIndex: number;
  uhid: string;
  patientName: string;
  age: number;
  category: string;
  rotterdamCriteria: string; // Positive, Borderline, Negative
  follicleCountRt: number;
  follicleCountLt: number;
  ovarianVolumeRt: string; // e.g. "11.8 mL"
  ovarianVolumeLt: string; // e.g. "12.2 mL"
  stromalEchogenicity: string;
  scanner: string;
  probe: string;
  freq: string;
  depth: string;
  gain: string;
  brightness?: number;
  contrast?: number;
  flipX?: boolean;
  findings: string;
  measurements: string;
}

const CASES: OvarianCaseInfo[] = [
  {
    index: 1, baseIndex: 3, uhid: 'PCOS-US-001', patientName: 'Ananya Deshmukh', age: 26,
    category: 'Classic Rotterdam PCOM (Bilateral String-of-Pearls)',
    rotterdamCriteria: 'Rotterdam PCOM Positive (FNPO > 12)',
    follicleCountRt: 16, follicleCountLt: 18,
    ovarianVolumeRt: '11.8 mL', ovarianVolumeLt: '12.2 mL',
    stromalEchogenicity: 'Increased Central Hyperechogenicity',
    scanner: 'GE VOLUSON E10 EXPERT', probe: 'RIC5-9-D ENDOCAVITY', freq: '7.5 MHz', depth: '8 cm', gain: '84 dB',
    findings: 'Bilateral enlarged ovaries displaying classic peripheral arrangement of >15 subcentimeter anechoic follicles (2-8 mm) encircling an expanded echogenic central stroma.',
    measurements: 'Rt: 38×24×23 mm (11.8 mL) | Lt: 39×25×24 mm (12.2 mL)'
  },
  {
    index: 2, baseIndex: 4, uhid: 'PCOS-US-002', patientName: 'Priya Sharma', age: 28,
    category: 'Dominant Ovulatory Follicle with Contralateral PCOM',
    rotterdamCriteria: 'Rotterdam PCOM Positive (Unilateral Persistence)',
    follicleCountRt: 14, follicleCountLt: 8,
    ovarianVolumeRt: '10.9 mL', ovarianVolumeLt: '12.8 mL',
    stromalEchogenicity: 'Mildly Increased Central Stroma',
    scanner: 'PHILIPS EPIQ 7G', probe: 'C10-3v ENDOVAGINAL', freq: '8.0 MHz', depth: '8 cm', gain: '82 dB',
    findings: 'Left ovary demonstrates a solitary leading dominant Graafian follicle measuring 19.2 mm. Right ovary preserves classic multi-follicular peripheral ring pattern of polycystic morphology.',
    measurements: 'Rt: 36×23×22 mm (10.9 mL) | Lt Follicle: 19.2 mm (Total Vol: 12.8 mL)'
  },
  {
    index: 3, baseIndex: 1, uhid: 'PCOS-US-003', patientName: 'Sneha Reddy', age: 24,
    category: 'Severe Polycystic Morphology with High Stromal Volume',
    rotterdamCriteria: 'Rotterdam PCOM Positive (Severe Phenotype)',
    follicleCountRt: 19, follicleCountLt: 21,
    ovarianVolumeRt: '13.5 mL', ovarianVolumeLt: '14.1 mL',
    stromalEchogenicity: 'Marked Hyperechoic Stromal Hyperplasia',
    scanner: 'GE VOLUSON E10 EXPERT', probe: 'RIC5-9-D ENDOCAVITY', freq: '7.5 MHz', depth: '8 cm', gain: '86 dB', brightness: 1.02,
    findings: 'Bilateral globular ovarian enlargement exceeding 13 mL with dense stromal core and over 18 peripheral follicles arrested at 2-6 mm. Stromal area exceeds 40% of ovarian cross-section.',
    measurements: 'Rt: 41×26×24 mm (13.5 mL) | Lt: 42×27×25 mm (14.1 mL)'
  },
  {
    index: 4, baseIndex: 0, uhid: 'PCOS-US-004', patientName: 'Kavya Nair', age: 31,
    category: 'Asymmetric Polycystic Morphology (Right Predominant)',
    rotterdamCriteria: 'Rotterdam PCOM Positive (Asymmetric)',
    follicleCountRt: 16, follicleCountLt: 9,
    ovarianVolumeRt: '12.4 mL', ovarianVolumeLt: '8.6 mL',
    stromalEchogenicity: 'Asymmetric (Right > Left)',
    scanner: 'CANON APLIO i800', probe: 'PVT-781VT TRANSVAGINAL', freq: '8.5 MHz', depth: '8 cm', gain: '80 dB',
    findings: 'Marked asymmetry between ovaries. Right ovary exhibits prominent polycystic phenotype with 16 peripheral microcysts, while left ovary displays normal stromal architecture with 9 antral follicles.',
    measurements: 'Rt: 39×25×23 mm (12.4 mL) | Lt: 32×21×19 mm (8.6 mL)'
  },
  {
    index: 5, baseIndex: 1, uhid: 'PCOS-US-005', patientName: 'Meera Patel', age: 22,
    category: 'Adolescent PCOS Phenotype (Enlarged Globular Ovaries)',
    rotterdamCriteria: 'Rotterdam PCOM Positive (Adolescent)',
    follicleCountRt: 22, follicleCountLt: 20,
    ovarianVolumeRt: '14.2 mL', ovarianVolumeLt: '13.9 mL',
    stromalEchogenicity: 'Dense Central Core',
    scanner: 'GE VOLUSON E10 EXPERT', probe: 'RIC5-9-D ENDOCAVITY', freq: '7.5 MHz', depth: '8 cm', gain: '85 dB', brightness: 1.04,
    findings: 'Substantial bilateral ovarian enlargement (>13 mL) with prominent subcapsular ring of arrested antral follicles (>20 per plane). Typical presentation of adolescent hyperandrogenic anovulation.',
    measurements: 'Rt: 42×28×23 mm (14.2 mL) | Lt: 41×27×24 mm (13.9 mL)'
  },
  {
    index: 6, baseIndex: 5, uhid: 'PCOS-US-006', patientName: 'Divya Iyer', age: 29,
    category: 'Normal Physiological Baseline Ovaries (Control)',
    rotterdamCriteria: 'Rotterdam PCOM Negative (Normal)',
    follicleCountRt: 6, follicleCountLt: 5,
    ovarianVolumeRt: '6.2 mL', ovarianVolumeLt: '5.8 mL',
    stromalEchogenicity: 'Normal Homogeneous Stroma',
    scanner: 'PHILIPS EPIQ 7G', probe: 'C10-3v ENDOVAGINAL', freq: '8.0 MHz', depth: '8 cm', gain: '78 dB',
    findings: 'Completely normal pelvic ultrasound. Normal ovarian volumes (<7 mL), smooth capsular contours, 5-6 normal antral follicles per ovary, normal central stromal echogenicity.',
    measurements: 'Rt: 30×19×17 mm (6.2 mL) | Lt: 29×18×16 mm (5.8 mL)'
  },
  {
    index: 7, baseIndex: 3, uhid: 'PCOS-US-007', patientName: 'Radhika Rao', age: 33,
    category: 'Polycystic Ovary with Central & Peripheral Follicular Distribution',
    rotterdamCriteria: 'Rotterdam PCOM Positive (Dispersed Pattern)',
    follicleCountRt: 15, follicleCountLt: 16,
    ovarianVolumeRt: '11.5 mL', ovarianVolumeLt: '11.9 mL',
    stromalEchogenicity: 'Stromal-to-Total Area Ratio > 0.35',
    scanner: 'GE VOLUSON E10 EXPERT', probe: 'RIC5-9-D ENDOCAVITY', freq: '7.5 MHz', depth: '8 cm', gain: '83 dB', contrast: 1.05,
    findings: 'Follicles distributed both along the peripheral cortex and interspersed through the deep ovarian stroma. Both ovarian volumes exceed the 10 mL diagnostic threshold.',
    measurements: 'Rt: 37×24×22 mm (11.5 mL) | Lt: 38×24×23 mm (11.9 mL)'
  },
  {
    index: 8, baseIndex: 1, uhid: 'PCOS-US-008', patientName: 'Pooja Hegde', age: 27,
    category: 'Bilateral Follicular Arrest with Thickened Tunica Albuginea',
    rotterdamCriteria: 'Rotterdam PCOM Positive',
    follicleCountRt: 14, follicleCountLt: 15,
    ovarianVolumeRt: '12.1 mL', ovarianVolumeLt: '12.5 mL',
    stromalEchogenicity: 'Thickened Echogenic Outer Capsule',
    scanner: 'CANON APLIO i800', probe: 'PVT-781VT TRANSVAGINAL', freq: '8.5 MHz', depth: '8 cm', gain: '82 dB', brightness: 0.96,
    findings: 'Prominent echogenic capsule surrounding both ovaries with complete follicular growth arrest below 7 mm. Typical features of chronic anovulation.',
    measurements: 'Rt: 38×25×23 mm (12.1 mL) | Lt: 39×25×24 mm (12.5 mL)'
  },
  {
    index: 9, baseIndex: 2, uhid: 'PCOS-US-009', patientName: 'Tanvi Verma', age: 25,
    category: 'Dominant Right Ovarian Follicle (Late Follicular Phase)',
    rotterdamCriteria: 'Rotterdam PCOM Borderline (Single Dominant)',
    follicleCountRt: 7, follicleCountLt: 12,
    ovarianVolumeRt: '12.6 mL', ovarianVolumeLt: '10.2 mL',
    stromalEchogenicity: 'Moderate Stromal Density',
    scanner: 'PHILIPS EPIQ 7G', probe: 'C10-3v ENDOVAGINAL', freq: '8.0 MHz', depth: '8 cm', gain: '81 dB',
    findings: 'Right ovary shows an 18.8 mm mature follicle with thin regular margins. Left ovary maintains multiple 3-6 mm follicles with increased central stroma.',
    measurements: 'Rt Follicle: 18.8 mm (Vol: 12.6 mL) | Lt: 35×23×21 mm (10.2 mL)'
  },
  {
    index: 10, baseIndex: 4, uhid: 'PCOS-US-010', patientName: 'Harini Aggarwal', age: 30,
    category: 'Resolving Corpus Luteum with Contralateral PCOM',
    rotterdamCriteria: 'Rotterdam PCOM Positive (Luteal Phase)',
    follicleCountRt: 15, follicleCountLt: 8,
    ovarianVolumeRt: '11.2 mL', ovarianVolumeLt: '13.6 mL',
    stromalEchogenicity: 'Hypervascular Stroma',
    scanner: 'GE VOLUSON E10 EXPERT', probe: 'RIC5-9-D ENDOCAVITY', freq: '7.5 MHz', depth: '8 cm', gain: '84 dB', contrast: 1.02,
    findings: 'Thick-walled cystic corpus luteum measuring 18.5 mm observed in left ovary with peripheral ring-of-fire vascularity. Right ovary exhibits textbook polycystic string-of-pearls.',
    measurements: 'Rt: 37×24×22 mm (11.2 mL) | Lt Corpus Luteum: 18.5 mm (Vol: 13.6 mL)'
  },
  {
    index: 11, baseIndex: 3, uhid: 'PCOS-US-011', patientName: 'Malini Banerjee', age: 23,
    category: 'Monofollicular Emergence in Polycystic Ovary',
    rotterdamCriteria: 'Rotterdam PCOM Positive (Ovulatory Emergence)',
    follicleCountRt: 13, follicleCountLt: 9,
    ovarianVolumeRt: '10.6 mL', ovarianVolumeLt: '12.1 mL',
    stromalEchogenicity: 'Increased Central Core',
    scanner: 'SIEMENS ACUSON SEQUOIA', probe: '9EV3 ENDOVAGINAL', freq: '7.5 MHz', depth: '8 cm', gain: '83 dB', brightness: 0.98,
    findings: 'Early dominant follicle measuring 16.8 mm emerging in left ovary against background of bilateral stromal volume expansion (>10 mL).',
    measurements: 'Rt: 36×23×22 mm (10.6 mL) | Lt Follicle: 16.8 mm (Vol: 12.1 mL)'
  },
  {
    index: 12, baseIndex: 1, uhid: 'PCOS-US-012', patientName: 'Gayathri Gupta', age: 32,
    category: 'Insulin-Resistant PCOS Phenotype with Stromal Hyperplasia',
    rotterdamCriteria: 'Rotterdam PCOM Positive (Metabolic Variant)',
    follicleCountRt: 18, follicleCountLt: 19,
    ovarianVolumeRt: '14.8 mL', ovarianVolumeLt: '15.2 mL',
    stromalEchogenicity: 'Marked Hyperechogenicity, S/A > 0.42',
    scanner: 'GE VOLUSON E10 EXPERT', probe: 'RIC5-9-D ENDOCAVITY', freq: '7.5 MHz', depth: '8 cm', gain: '87 dB', brightness: 1.05,
    findings: 'Extensive bilateral ovarian enlargement approaching 15 mL each. Hypertrophied echogenic central stroma compressing small 2-5 mm follicles outward against capsule.',
    measurements: 'Rt: 43×29×25 mm (14.8 mL) | Lt: 44×30×26 mm (15.2 mL)'
  },
  {
    index: 13, baseIndex: 0, uhid: 'PCOS-US-013', patientName: 'Shreya Joshi', age: 28,
    category: 'Classic "String-of-Pearls" Configuration (Symmetric Bilateral)',
    rotterdamCriteria: 'Rotterdam PCOM Positive',
    follicleCountRt: 15, follicleCountLt: 15,
    ovarianVolumeRt: '11.4 mL', ovarianVolumeLt: '11.6 mL',
    stromalEchogenicity: 'Classic Peripheral Follicles with Dense Core',
    scanner: 'PHILIPS EPIQ 7G', probe: 'C10-3v ENDOVAGINAL', freq: '8.0 MHz', depth: '8 cm', gain: '82 dB',
    findings: 'Textbook symmetric manifestation of PCOM. Precisely 15 peripheral anechoic follicles arrayed like a necklace around central core in both ovaries.',
    measurements: 'Rt: 37×24×23 mm (11.4 mL) | Lt: 37×24×24 mm (11.6 mL)'
  },
  {
    index: 14, baseIndex: 5, uhid: 'PCOS-US-014', patientName: 'Aishwarya Singh', age: 26,
    category: 'Multi-Follicular Ovaries with Normal Total Volume',
    rotterdamCriteria: 'Rotterdam PCOM Borderline (MFO Variant)',
    follicleCountRt: 10, follicleCountLt: 11,
    ovarianVolumeRt: '7.8 mL', ovarianVolumeLt: '8.2 mL',
    stromalEchogenicity: 'Normal Central Stroma',
    scanner: 'CANON APLIO i800', probe: 'PVT-781VT TRANSVAGINAL', freq: '8.5 MHz', depth: '8 cm', gain: '79 dB', brightness: 1.01,
    findings: 'Multi-follicular appearance with 10-11 follicles per ovary, but preserved normal ovarian volume (<10 mL) and non-echogenic central stroma. Often secondary to hypothalamic influence.',
    measurements: 'Rt: 32×21×19 mm (7.8 mL) | Lt: 33×22×20 mm (8.2 mL)'
  },
  {
    index: 15, baseIndex: 3, uhid: 'PCOS-US-015', patientName: 'Keerthi Mishra', age: 35,
    category: 'Longstanding Anovulatory PCOS with Fibrous Stroma',
    rotterdamCriteria: 'Rotterdam PCOM Positive (Chronic)',
    follicleCountRt: 13, follicleCountLt: 14,
    ovarianVolumeRt: '12.0 mL', ovarianVolumeLt: '12.3 mL',
    stromalEchogenicity: 'Coarse Hyperechoic Fibrotic Texture',
    scanner: 'GE VOLUSON E10 EXPERT', probe: 'RIC5-9-D ENDOCAVITY', freq: '7.5 MHz', depth: '8 cm', gain: '84 dB', contrast: 1.04,
    findings: 'Chronic anovulatory picture with increased stromal echogenicity and fibrous appearance. Subcapsular follicles measuring 3-7 mm without dominant follicle.',
    measurements: 'Rt: 38×25×23 mm (12.0 mL) | Lt: 39×25×24 mm (12.3 mL)'
  },
  {
    index: 16, baseIndex: 1, uhid: 'PCOS-US-016', patientName: 'Deepika Kulkarni', age: 27,
    category: 'High Microfollicular Density (>20 Follicles 2-5 mm)',
    rotterdamCriteria: 'Rotterdam PCOM Positive (High Follicle Load)',
    follicleCountRt: 21, follicleCountLt: 23,
    ovarianVolumeRt: '13.8 mL', ovarianVolumeLt: '14.0 mL',
    stromalEchogenicity: 'Prominent Central Stroma',
    scanner: 'PHILIPS EPIQ 7G', probe: 'C10-3v ENDOVAGINAL', freq: '8.0 MHz', depth: '8 cm', gain: '85 dB', brightness: 0.95,
    findings: 'Exceptionally dense peripheral microfollicular ring with >20 follicles under 5 mm per ovary. Strong correlation with anti-Müllerian hormone (AMH) elevations.',
    measurements: 'Rt: 41×27×24 mm (13.8 mL) | Lt: 42×27×25 mm (14.0 mL)'
  },
  {
    index: 17, baseIndex: 2, uhid: 'PCOS-US-017', patientName: 'Lavanya Bhat', age: 29,
    category: 'Coexisting Simple Functional Follicular Cyst in PCOM',
    rotterdamCriteria: 'Rotterdam PCOM Positive + Follicular Cyst',
    follicleCountRt: 8, follicleCountLt: 15,
    ovarianVolumeRt: '15.4 mL', ovarianVolumeLt: '11.8 mL',
    stromalEchogenicity: 'Increased Left Central Stroma',
    scanner: 'CANON APLIO i800', probe: 'PVT-781VT TRANSVAGINAL', freq: '8.5 MHz', depth: '8 cm', gain: '80 dB', brightness: 1.02,
    findings: 'Right ovary shows a benign unilocular thin-walled follicular cyst measuring 21.5 mm. Left ovary shows classic polycystic configuration with 15 peripheral follicles.',
    measurements: 'Rt Cyst: 21.5 mm (Total Vol: 15.4 mL) | Lt: 38×24×23 mm (11.8 mL)'
  },
  {
    index: 18, baseIndex: 0, uhid: 'PCOS-US-018', patientName: 'Ritu Chawla', age: 24,
    category: 'Polycystic Ovaries with Normal Total Volume (<10 mL)',
    rotterdamCriteria: 'Rotterdam PCOM Positive (FNPO Criteria Met)',
    follicleCountRt: 13, follicleCountLt: 14,
    ovarianVolumeRt: '8.9 mL', ovarianVolumeLt: '9.2 mL',
    stromalEchogenicity: 'Mild Stromal Increase',
    scanner: 'GE VOLUSON E10 EXPERT', probe: 'RIC5-9-D ENDOCAVITY', freq: '7.5 MHz', depth: '8 cm', gain: '81 dB',
    findings: 'Meets 2018/2023 international PCOS guideline criteria by Follicle Number Per Ovary (FNPO ≥ 12) despite overall ovarian volume remaining under 10 mL.',
    measurements: 'Rt: 34×22×20 mm (8.9 mL) | Lt: 35×23×21 mm (9.2 mL)'
  },
  {
    index: 19, baseIndex: 3, uhid: 'PCOS-US-019', patientName: 'Swati Mukherjee', age: 31,
    category: 'Asymmetric Stromal Hypertrophy (Right > Left)',
    rotterdamCriteria: 'Rotterdam PCOM Positive',
    follicleCountRt: 17, follicleCountLt: 11,
    ovarianVolumeRt: '13.6 mL', ovarianVolumeLt: '9.8 mL',
    stromalEchogenicity: 'Prominent Right Stromal Core',
    scanner: 'PHILIPS EPIQ 7G', probe: 'C10-3v ENDOVAGINAL', freq: '8.0 MHz', depth: '8 cm', gain: '83 dB', contrast: 1.06,
    findings: 'Marked stromal hypertrophy in right ovary (13.6 mL) with peripheral displacement of 17 follicles. Left ovary is moderately involved with 11 follicles and volume of 9.8 mL.',
    measurements: 'Rt: 40×26×24 mm (13.6 mL) | Lt: 34×23×21 mm (9.8 mL)'
  },
  {
    index: 20, baseIndex: 5, uhid: 'PCOS-US-020', patientName: 'Nandini Saxena', age: 22,
    category: 'Baseline Normal Pelvic Sonogram (Ovulatory Phase Control)',
    rotterdamCriteria: 'Rotterdam PCOM Negative (Normal Physiological)',
    follicleCountRt: 5, follicleCountLt: 6,
    ovarianVolumeRt: '6.5 mL', ovarianVolumeLt: '6.1 mL',
    stromalEchogenicity: 'Normal Preserved Parenchyma',
    scanner: 'SIEMENS ACUSON SEQUOIA', probe: '9EV3 ENDOVAGINAL', freq: '7.5 MHz', depth: '8 cm', gain: '78 dB', brightness: 1.0,
    findings: 'Healthy normal young female pelvic sonogram. Ovaries exhibit physiologic follicle counts (5-6), normal volumes (6.1-6.5 mL), and normal stromal-parenchymal ratio.',
    measurements: 'Rt: 31×19×17 mm (6.5 mL) | Lt: 30×19×16 mm (6.1 mL)'
  }
];

function createOvarianHUDOverlaySVG(info: OvarianCaseInfo, width: number, height: number): string {
  // Pill banner styling at bottom matching reference image
  const bannerY = height - 76;
  const bannerH = 58;
  const leftBannerX = 24;
  const leftBannerW = (width / 2) - 40;
  const rightBannerX = (width / 2) + 16;
  const rightBannerW = (width / 2) - 40;

  // Center text coordinates
  const leftTextX = leftBannerX + (leftBannerW / 2);
  const rightTextX = rightBannerX + (rightBannerW / 2);
  const textY = bannerY + 38;

  // Depth rulers on the right side of each panel (0 to 8 cm)
  const leftRulerX = leftBannerX + leftBannerW - 8;
  const rightRulerX = rightBannerX + rightBannerW - 8;
  const startY = 60;
  const endY = bannerY - 30;
  const span = endY - startY;

  let leftTicks = '';
  let rightTicks = '';
  for (let d = 0; d <= 8; d += 2) {
    const y = startY + (d / 8) * span;
    leftTicks += `
      <line x1="${leftRulerX}" y1="${y}" x2="${leftRulerX + 10}" y2="${y}" stroke="#e2e8f0" stroke-width="1.5"/>
      <text x="${leftRulerX - 6}" y="${y + 4}" font-family="Arial, sans-serif" font-size="13" font-weight="bold" fill="#e2e8f0" text-anchor="end">-${d}</text>
    `;
    rightTicks += `
      <line x1="${rightRulerX}" y1="${y}" x2="${rightRulerX + 10}" y2="${y}" stroke="#e2e8f0" stroke-width="1.5"/>
      <text x="${rightRulerX - 6}" y="${y + 4}" font-family="Arial, sans-serif" font-size="13" font-weight="bold" fill="#e2e8f0" text-anchor="end">-${d}</text>
    `;
  }

  return `
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <!-- Top Professional Telemetry Bar -->
  <rect x="0" y="0" width="${width}" height="36" fill="#000000" fill-opacity="0.90"/>
  <text x="24" y="23" font-family="monospace, sans-serif" font-size="12" font-weight="bold" fill="#38bdf8">${info.scanner} | ${info.probe}</text>
  <text x="${width / 2}" y="23" font-family="monospace, sans-serif" font-size="12" font-weight="bold" fill="#e2e8f0" text-anchor="middle">TRANSVAGINAL PELVIC US | B-MODE DUAL SCREEN</text>
  <text x="${width - 24}" y="23" font-family="monospace, sans-serif" font-size="12" font-weight="bold" fill="#34d399" text-anchor="end">${info.uhid} | ${info.patientName.toUpperCase()} (${info.age}Y)</text>
  <line x1="20" y1="36" x2="${width - 20}" y2="36" stroke="#1e293b" stroke-width="1"/>

  <!-- Left Panel Depth Scale -->
  <g>
    <line x1="${leftRulerX + 10}" y1="${startY}" x2="${leftRulerX + 10}" y2="${endY}" stroke="#64748b" stroke-width="1"/>
    ${leftTicks}
  </g>

  <!-- Right Panel Depth Scale -->
  <g>
    <line x1="${rightRulerX + 10}" y1="${startY}" x2="${rightRulerX + 10}" y2="${endY}" stroke="#64748b" stroke-width="1"/>
    ${rightTicks}
  </g>

  <!-- Bottom Dark Blue Pill Banner: Right Ovary -->
  <rect x="${leftBannerX}" y="${bannerY}" width="${leftBannerW}" height="${bannerH}" rx="12" fill="#093a72" stroke="#144d8f" stroke-width="1"/>
  <text x="${leftTextX}" y="${textY}" font-family="Arial, Helvetica, sans-serif" font-size="24" font-weight="bold" fill="#ffffff" text-anchor="middle" letter-spacing="0.5">Right Ovary</text>

  <!-- Bottom Dark Blue Pill Banner: Left Ovary -->
  <rect x="${rightBannerX}" y="${bannerY}" width="${rightBannerW}" height="${bannerH}" rx="12" fill="#093a72" stroke="#144d8f" stroke-width="1"/>
  <text x="${rightTextX}" y="${textY}" font-family="Arial, Helvetica, sans-serif" font-size="24" font-weight="bold" fill="#ffffff" text-anchor="middle" letter-spacing="0.5">Left Ovary</text>

  <!-- Completely Clean: NO BOUNDING BOXES -->
</svg>
`;
}

async function run() {
  console.log('Generating 20 clean Ovarian Ultrasound (PCOS) images matching user reference without bounding boxes...');

  const manifestEntries: any[] = [];
  const width = 1376;
  const height = 768;

  for (const c of CASES) {
    const baseSrc = BASE_IMAGES[c.baseIndex];
    const fileName = `ovarian_us_${String(c.index).padStart(2, '0')}.png`;

    let pipeline = sharp(baseSrc)
      .resize(width, height, { fit: 'cover' });

    if (c.flipX) {
      pipeline = pipeline.flop();
    }

    if (c.brightness && c.brightness !== 1.0) {
      pipeline = pipeline.modulate({ brightness: c.brightness });
    }

    // Generate HUD Overlay SVG with clean telemetry and bottom pill labels
    const hudSvg = createOvarianHUDOverlaySVG(c, width, height);

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
    const pubPath = path.resolve(`public/dataset/ovarian_us/${fileName}`);
    const dataPath = path.resolve(`dataset/ovarian_us/${fileName}`);

    fs.writeFileSync(pubPath, finalImageBuffer);
    fs.writeFileSync(dataPath, finalImageBuffer);

    manifestEntries.push({
      id: c.uhid,
      index: c.index,
      type: 'ovarian_us',
      patientName: c.patientName,
      age: c.age,
      uhid: c.uhid,
      category: c.category,
      rotterdamCriteria: c.rotterdamCriteria,
      follicleCountRt: c.follicleCountRt,
      follicleCountLt: c.follicleCountLt,
      ovarianVolumeRt: c.ovarianVolumeRt,
      ovarianVolumeLt: c.ovarianVolumeLt,
      stromalEchogenicity: c.stromalEchogenicity,
      measurements: c.measurements,
      findings: c.findings,
      fileName: fileName,
      imagePathPublic: `/dataset/ovarian_us/${fileName}`,
      imagePathDataset: `/dataset/ovarian_us/${fileName}`,
      imageInfo: {
        scanner: c.scanner,
        probe: c.probe,
        freq: c.freq,
        depth: c.depth,
        gain: c.gain,
        mode: 'B-mode Dual Sector',
        leftPanel: 'Right Ovary',
        rightPanel: 'Left Ovary',
        hasBoundingBox: false
      }
    });

    console.log(`Saved [${c.index}/20] ${fileName} - ${c.patientName} (${c.uhid}): ${c.category}`);
  }

  // Write manifests
  const manifestPath = path.resolve('dataset/ovarian_us_index.json');
  const pubManifestPath = path.resolve('public/dataset/ovarian_us_index.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifestEntries, null, 2));
  fs.writeFileSync(pubManifestPath, JSON.stringify(manifestEntries, null, 2));
  console.log('Manifests written to ovarian_us_index.json');

  // Merge into main dataset_index.json
  const mainIndexPub = path.resolve('public/dataset/dataset_index.json');
  const mainIndexData = path.resolve('dataset/dataset_index.json');
  if (fs.existsSync(mainIndexPub)) {
    try {
      const existing = JSON.parse(fs.readFileSync(mainIndexPub, 'utf-8'));
      const filtered = Array.isArray(existing) ? existing.filter((e: any) => e.type !== 'ovarian_us') : [];
      const updated = [...filtered, ...manifestEntries];
      fs.writeFileSync(mainIndexPub, JSON.stringify(updated, null, 2));
      fs.writeFileSync(mainIndexData, JSON.stringify(updated, null, 2));
      console.log('Updated master dataset_index.json with 20 Ovarian US images.');
    } catch (e) {
      console.error('Error updating main dataset index:', e);
    }
  }

  // Update Database records for these 20 Ovarian US cases
  console.log('Synchronizing 20 Ovarian US cases into database custom.db...');
  for (const c of CASES) {
    const fileName = `ovarian_us_${String(c.index).padStart(2, '0')}.png`;
    const pubImg = `/dataset/ovarian_us/${fileName}`;

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
          follicleCount: Math.max(c.follicleCountRt, c.follicleCountLt),
          medicalHistory: `Transvaginal ultrasound examination for ${c.category}. Evaluated for Rotterdam PCOS criteria.`,
          notes: `Pelvic sonogram recorded under UHID ${c.uhid}.`,
          height: 160,
          weight: 62,
          bmi: 24.2,
          menstrualRegularity: c.rotterdamCriteria.includes('Positive') ? 'irregular' : 'regular'
        }
      });
    } else {
      await db.patient.update({
        where: { id: patient.id },
        data: {
          follicleCount: Math.max(c.follicleCountRt, c.follicleCountLt)
        }
      });
    }

    // Create medical report for this ultrasound
    const report = await db.medicalReport.create({
      data: {
        patientId: patient.id,
        reportType: 'ovarian_ultrasound',
        fileName: fileName,
        fileType: 'image/png',
        fileData: pubImg,
        status: 'verified',
        ocrConfidence: 0.99,
        notes: `${c.category} - ${c.rotterdamCriteria}. ${c.findings} Measurements: ${c.measurements}`,
        ocrExtracted: JSON.stringify({
          modality: 'Ovarian Ultrasound (B-mode Dual Panel)',
          category: c.category,
          rotterdamCriteria: c.rotterdamCriteria,
          follicleCountRt: c.follicleCountRt,
          follicleCountLt: c.follicleCountLt,
          ovarianVolumeRt: c.ovarianVolumeRt,
          ovarianVolumeLt: c.ovarianVolumeLt,
          stromalEchogenicity: c.stromalEchogenicity,
          measurements: c.measurements,
          findings: c.findings,
          hasBoundingBox: false
        })
      }
    });

    // Create corresponding Lab/Imaging Value entry
    await db.labValue.create({
      data: {
        reportId: report.id,
        testName: 'Ovarian Follicle Count (Max Antral)',
        result: Math.max(c.follicleCountRt, c.follicleCountLt),
        resultText: `${c.rotterdamCriteria} (Rt: ${c.follicleCountRt}, Lt: ${c.follicleCountLt})`,
        unit: 'follicles',
        isAbnormal: c.rotterdamCriteria.includes('Positive'),
        isVerified: true,
        category: 'imaging',
        notes: `Ovarian Volumes: Rt ${c.ovarianVolumeRt}, Lt ${c.ovarianVolumeLt} | ${c.findings}`
      }
    });
  }

  console.log('Successfully completed 20 Ovarian US images and synced with custom.db!');
}

run()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Error generating ovarian ultrasound images:', err);
    process.exit(1);
  });
