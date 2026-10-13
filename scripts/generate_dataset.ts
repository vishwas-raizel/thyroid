import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { db } from '../src/lib/db';

// Ensure directories exist
const publicThyroidDir = path.resolve('public/dataset/thyroid');
const publicPcosDir = path.resolve('public/dataset/pcos');
const dataThyroidDir = path.resolve('dataset/thyroid');
const dataPcosDir = path.resolve('dataset/pcos');

[publicThyroidDir, publicPcosDir, dataThyroidDir, dataPcosDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Helper for random in range
function rand(min: number, max: number, decimals = 1): number {
  const val = Math.random() * (max - min) + min;
  return parseFloat(val.toFixed(decimals));
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

const FIRST_NAMES = [
  'Aaradhya', 'Ananya', 'Diya', 'Ishita', 'Kavya', 'Meera', 'Neha', 'Pooja', 'Priya', 'Riya',
  'Sanjana', 'Shreya', 'Sneha', 'Tanvi', 'Varsha', 'Aishwarya', 'Deepika', 'Divya', 'Gayathri', 'Harini',
  'Keerthi', 'Lavanya', 'Malini', 'Nandini', 'Pavithra', 'Radhika', 'Saranya', 'Swathi', 'Tejaswini', 'Vidya',
  'Aditi', 'Bhavana', 'Charulata', 'Geetha', 'Hemalatha', 'Indira', 'Janaki', 'Kalyani', 'Madhavi', 'Nalini',
  'Padma', 'Rajeshwari', 'Sujatha', 'Uma', 'Vasantha', 'Yamini', 'Anjali', 'Archana', 'Bhoomi', 'Chhavi'
];

const LAST_NAMES = [
  'Sharma', 'Verma', 'Patel', 'Reddy', 'Rao', 'Nair', 'Iyer', 'Menon', 'Pillai', 'Deshmukh',
  'Kulkarni', 'Joshi', 'Bhat', 'Hegde', 'Shetty', 'Kumar', 'Singh', 'Gupta', 'Aggarwal', 'Mishra',
  'Chatterjee', 'Banerjee', 'Mukherjee', 'Dutta', 'Ghosh', 'Choudhury', 'Das', 'Sen', 'Bose', 'Basu'
];

const LAB_NAMES = [
  { name: 'METROPOLIS ENDOCRINE DIAGNOSTICS', sub: 'Advanced Center for Hormone & Metabolic Studies' },
  { name: 'APEX CLINICAL PATHOLOGY LAB', sub: 'Department of Biochemistry & Immunodiagnostics' },
  { name: 'QUEST CLINICAL SCREENING LABS', sub: 'Center for Specialized Diagnostic Services' },
  { name: 'NOVA PATHOLOGY & WELLNESS LAB', sub: 'Molecular & Endocrine Testing Services' },
  { name: 'HORIZON MEDICAL DIAGNOSTICS', sub: 'Comprehensive Diagnostic & Research Center' }
];

const DOCTORS = [
  'Dr. Rajeshwari Swaminathan, MD (Endocrinology)',
  'Dr. Arvind Natarajan, MD, DM (Endocrinologist)',
  'Dr. Meenakshi Sundaram, MS, DGO (Gynecologist)',
  'Dr. Sunita Kulkarni, MD, DNB (Obstetrics & Gynecology)',
  'Dr. Vikramaditya Sen, MD (Internal Medicine)'
];

interface LabRow {
  test: string;
  result: string;
  unit: string;
  flag: 'NORMAL' | 'HIGH' | 'LOW' | 'CRITICAL';
  ref: string;
  method?: string;
}

interface ReportData {
  id: string;
  index: number;
  type: 'thyroid' | 'pcos';
  title: string;
  patientName: string;
  patientAge: number;
  patientGender: string;
  uhid: string;
  sampleId: string;
  doctor: string;
  collectionDate: string;
  reportDate: string;
  labInfo: { name: string; sub: string };
  categoryLabel: string;
  rows: LabRow[];
  interpretation: string;
  clinicalNotes: string;
  vitals: {
    bmi: number;
    bpSys: number;
    bpDia: number;
    fastingSugar?: number;
    follicleCount?: number;
    cycleLength?: number;
    cycleRegularity?: string;
    hirsutism?: string;
    acanthosis?: string;
    insulinResistance?: string;
  };
  symptoms: { name: string; severity: 'mild' | 'moderate' | 'severe'; category: string }[];
}

function escapeXml(unsafe: string | number | undefined | null): string {
  if (unsafe == null) return '';
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function generateBarcodeSVG(): string {
  let bars = '';
  let x = 0;
  for (let i = 0; i < 40; i++) {
    const w = pick([1, 2, 3, 4]);
    const space = pick([1, 2, 3]);
    bars += `<rect x='${x}' y='0' width='${w}' height='28' fill='#1e293b'/>`;
    x += w + space;
  }
  return `<svg x='580' y='110' width='160' height='30'>${bars}</svg>`;
}

function createReportSVG(data: ReportData): string {
  const isThyroid = data.type === 'thyroid';
  const primaryTheme = isThyroid ? '#0f766e' : '#7c2d12'; // Teal for Thyroid, Warm Bronze/Rose-Amber for PCOS
  const primaryLight = isThyroid ? '#f0fdfa' : '#fff7ed';
  const primaryBorder = isThyroid ? '#99f6e4' : '#fed7aa';
  const badgeBg = isThyroid ? '#ccfbf1' : '#ffedd5';
  const badgeText = isThyroid ? '#115e59' : '#9a3412';

  let tableRowsSvg = '';
  let y = 300;
  data.rows.forEach((row, i) => {
    const isEven = i % 2 === 0;
    const rowBg = isEven ? '#ffffff' : '#f8fafc';
    const isAbnormal = row.flag !== 'NORMAL';
    const resultColor = row.flag === 'HIGH' ? '#b91c1c' : row.flag === 'LOW' ? '#b45309' : '#0f172a';
    const flagBg = row.flag === 'HIGH' ? '#fee2e2' : row.flag === 'LOW' ? '#fef3c7' : '#dcfce7';
    const flagColor = row.flag === 'HIGH' ? '#991b1b' : row.flag === 'LOW' ? '#92400e' : '#166534';

    tableRowsSvg += `
      <rect x='40' y='${y}' width='720' height='28' fill='${rowBg}' stroke='#e2e8f0' stroke-width='0.5'/>
      <text x='55' y='${y + 18}' font-family='Arial, sans-serif' font-size='11' font-weight='600' fill='#1e293b'>${escapeXml(row.test)}</text>
      <text x='320' y='${y + 18}' font-family='Arial, sans-serif' font-size='12' font-weight='${isAbnormal ? 'bold' : 'normal'}' fill='${resultColor}'>${escapeXml(row.result)}</text>
      <text x='425' y='${y + 18}' font-family='Arial, sans-serif' font-size='11' fill='#64748b'>${escapeXml(row.unit)}</text>
      
      <!-- Flag Badge -->
      <rect x='510' y='${y + 4}' width='65' height='20' rx='4' fill='${flagBg}'/>
      <text x='542' y='${y + 18}' font-family='Arial, sans-serif' font-size='9' font-weight='bold' fill='${flagColor}' text-anchor='middle'>${row.flag}</text>
      
      <text x='615' y='${y + 18}' font-family='Arial, sans-serif' font-size='11' fill='#475569'>${escapeXml(row.ref)}</text>
    `;
    y += 28;
  });

  const interpretationY = y + 20;

  return `
<svg width='800' height='1120' xmlns='http://www.w3.org/2000/svg'>
  <!-- Background Sheet -->
  <rect width='800' height='1120' fill='#ffffff'/>
  <rect x='15' y='15' width='770' height='1090' rx='8' fill='#ffffff' stroke='#cbd5e1' stroke-width='1.5'/>

  <!-- Header Banner -->
  <rect x='25' y='25' width='750' height='80' rx='6' fill='${primaryLight}' stroke='${primaryBorder}' stroke-width='1'/>
  
  <!-- Hospital / Lab Icon Graphic -->
  <circle cx='65' cy='65' r='24' fill='${primaryTheme}'/>
  <path d='M65 52 v26 M52 65 h26' stroke='#ffffff' stroke-width='4' stroke-linecap='round'/>
  
  <text x='105' y='55' font-family='Arial, sans-serif' font-size='17' font-weight='bold' fill='${primaryTheme}'>${escapeXml(data.labInfo.name)}</text>
  <text x='105' y='73' font-family='Arial, sans-serif' font-size='10' font-weight='500' fill='#64748b'>${escapeXml(data.labInfo.sub)} | ISO 15189:2022 &amp; NABL Accredited</text>
  <text x='105' y='88' font-family='Arial, sans-serif' font-size='9' fill='#94a3b8'>24/7 Helpline: +91 (80) 4123-8890 | Website: https://thyroiddisordersandpccos.space-z.ai</text>

  <!-- Report Category Title Pill -->
  <rect x='520' y='42' width='235' height='30' rx='6' fill='${badgeBg}' stroke='${primaryBorder}' stroke-width='1'/>
  <text x='637' y='62' font-family='Arial, sans-serif' font-size='11' font-weight='bold' fill='${badgeText}' text-anchor='middle'>${escapeXml(data.categoryLabel)}</text>

  <!-- Patient Demographics Card -->
  <rect x='40' y='115' width='720' height='115' rx='6' fill='#f8fafc' stroke='#e2e8f0' stroke-width='1'/>
  
  <text x='55' y='138' font-family='Arial, sans-serif' font-size='10' font-weight='bold' fill='#64748b'>PATIENT NAME:</text>
  <text x='155' y='138' font-family='Arial, sans-serif' font-size='12' font-weight='bold' fill='#0f172a'>${escapeXml(data.patientName)}</text>

  <text x='350' y='138' font-family='Arial, sans-serif' font-size='10' font-weight='bold' fill='#64748b'>AGE / GENDER:</text>
  <text x='440' y='138' font-family='Arial, sans-serif' font-size='11' font-weight='bold' fill='#0f172a'>${data.patientAge} Y / ${data.patientGender}</text>

  <text x='55' y='163' font-family='Arial, sans-serif' font-size='10' font-weight='bold' fill='#64748b'>PATIENT UHID:</text>
  <text x='155' y='163' font-family='monospace' font-size='11' font-weight='600' fill='#0f766e'>${escapeXml(data.uhid)}</text>

  <text x='350' y='163' font-family='Arial, sans-serif' font-size='10' font-weight='bold' fill='#64748b'>SAMPLE ID:</text>
  <text x='440' y='163' font-family='monospace' font-size='11' fill='#0f172a'>${escapeXml(data.sampleId)}</text>

  <text x='55' y='188' font-family='Arial, sans-serif' font-size='10' font-weight='bold' fill='#64748b'>REFERRED BY:</text>
  <text x='155' y='188' font-family='Arial, sans-serif' font-size='11' fill='#334155'>${escapeXml(data.doctor)}</text>

  <text x='350' y='188' font-family='Arial, sans-serif' font-size='10' font-weight='bold' fill='#64748b'>SAMPLE TYPE:</text>
  <text x='440' y='188' font-family='Arial, sans-serif' font-size='11' fill='#334155'>Serum / Venous Blood</text>

  <text x='55' y='213' font-family='Arial, sans-serif' font-size='10' font-weight='bold' fill='#64748b'>COLLECTION DATE:</text>
  <text x='165' y='213' font-family='Arial, sans-serif' font-size='10' fill='#334155'>${escapeXml(data.collectionDate)}</text>

  <text x='350' y='213' font-family='Arial, sans-serif' font-size='10' font-weight='bold' fill='#64748b'>REPORT DATE:</text>
  <text x='440' y='213' font-family='Arial, sans-serif' font-size='10' fill='#334155'>${escapeXml(data.reportDate)} (FINAL)</text>

  ${generateBarcodeSVG()}

  <!-- Section Divider -->
  <text x='40' y='255' font-family='Arial, sans-serif' font-size='13' font-weight='bold' fill='${primaryTheme}'>DEPARTMENT OF CLINICAL BIOCHEMISTRY &amp; SPECIAL ENDOCRINOLOGY</text>
  <line x1='40' y1='262' x2='760' y2='262' stroke='${primaryTheme}' stroke-width='2'/>

  <!-- Test Results Table Header -->
  <rect x='40' y='270' width='720' height='30' rx='4' fill='${primaryTheme}'/>
  <text x='55' y='290' font-family='Arial, sans-serif' font-size='11' font-weight='bold' fill='#ffffff'>TEST DESCRIPTION</text>
  <text x='320' y='290' font-family='Arial, sans-serif' font-size='11' font-weight='bold' fill='#ffffff'>OBSERVED</text>
  <text x='425' y='290' font-family='Arial, sans-serif' font-size='11' font-weight='bold' fill='#ffffff'>UNIT</text>
  <text x='525' y='290' font-family='Arial, sans-serif' font-size='11' font-weight='bold' fill='#ffffff'>FLAG</text>
  <text x='615' y='290' font-family='Arial, sans-serif' font-size='11' font-weight='bold' fill='#ffffff'>BIOLOGICAL REF.</text>

  <!-- Render Table Rows -->
  ${tableRowsSvg}

  <!-- Clinical Interpretation Box -->
  <rect x='40' y='${interpretationY}' width='720' height='120' rx='6' fill='${primaryLight}' stroke='${primaryBorder}' stroke-width='1.2'/>
  <text x='55' y='${interpretationY + 22}' font-family='Arial, sans-serif' font-size='11' font-weight='bold' fill='${primaryTheme}'>CLINICAL INTERPRETATION &amp; PATHOLOGIST IMPRESSION:</text>
  
  <text x='55' y='${interpretationY + 45}' font-family='Arial, sans-serif' font-size='10.5' fill='#1e293b' font-weight='500'>
    ${escapeXml(data.interpretation)}
  </text>
  <text x='55' y='${interpretationY + 68}' font-family='Arial, sans-serif' font-size='9.5' fill='#475569'>
    Methodology: Fully automated Chemiluminescence Immunoassay (CLIA / ECLIA).
  </text>
  <text x='55' y='${interpretationY + 88}' font-family='Arial, sans-serif' font-size='9.5' fill='#64748b'>
    Note: Diagnostic decisions must correlate with clinical history, symptom evaluation, and pelvic ultrasound (for PCOS).
  </text>
  <text x='55' y='${interpretationY + 105}' font-family='Arial, sans-serif' font-size='9' font-style='italic' fill='#94a3b8'>
    *Biological reference intervals verified per standard CLSI guidelines &amp; manufacturer controls.
  </text>

  <!-- Quality QR Code Simulation -->
  <g transform='translate(660, ${interpretationY + 25})'>
    <rect width='70' height='70' fill='#ffffff' stroke='#cbd5e1'/>
    <rect x='6' y='6' width='18' height='18' fill='#1e293b'/>
    <rect x='10' y='10' width='10' height='10' fill='#ffffff'/>
    <rect x='46' y='6' width='18' height='18' fill='#1e293b'/>
    <rect x='50' y='10' width='10' height='10' fill='#ffffff'/>
    <rect x='6' y='46' width='18' height='18' fill='#1e293b'/>
    <rect x='10' y='50' width='10' height='10' fill='#ffffff'/>
    <rect x='30' y='28' width='12' height='12' fill='#1e293b'/>
    <rect x='46' y='46' width='8' height='8' fill='#1e293b'/>
    <rect x='30' y='46' width='6' height='14' fill='#1e293b'/>
    <text x='35' y='82' font-family='Arial, sans-serif' font-size='7' fill='#64748b' text-anchor='middle'>VERIFIED</text>
  </g>

  <!-- Signatures Footer -->
  <line x1='40' y1='1020' x2='760' y2='1020' stroke='#e2e8f0' stroke-width='1'/>
  
  <g transform='translate(60, 1030)'>
    <path d='M10 20 Q 30 5 60 18 T 110 15' stroke='#0f766e' stroke-width='2' fill='none'/>
    <text x='0' y='35' font-family='Arial, sans-serif' font-size='10' font-weight='bold' fill='#1e293b'>Dr. M. S. Raghavan, MD</text>
    <text x='0' y='47' font-family='Arial, sans-serif' font-size='9' fill='#64748b'>Senior Biochemist &amp; Lab In-Charge</text>
  </g>

  <g transform='translate(540, 1030)'>
    <path d='M10 22 Q 40 2 80 20 T 130 16' stroke='#7c2d12' stroke-width='2' fill='none'/>
    <circle cx='105' cy='18' r='16' fill='none' stroke='#b91c1c' stroke-width='1.5' stroke-dasharray='3 2'/>
    <text x='105' y='21' font-family='Arial, sans-serif' font-size='7' font-weight='bold' fill='#b91c1c' text-anchor='middle'>AUTHORIZED</text>
    <text x='0' y='35' font-family='Arial, sans-serif' font-size='10' font-weight='bold' fill='#1e293b'>Dr. Alok Verma, MD (Path)</text>
    <text x='0' y='47' font-family='Arial, sans-serif' font-size='9' fill='#64748b'>Chief Medical Officer &amp; Pathologist</text>
  </g>

  <rect x='25' y='1085' width='750' height='18' fill='#f1f5f9'/>
  <text x='400' y='1097' font-family='Arial, sans-serif' font-size='8' fill='#94a3b8' text-anchor='middle'>
    *** END OF LABORATORY REPORT — ACCREDITED BY NABL &amp; ISO 15189:2022 — REPORT ID: ${data.uhid} ***
  </text>
</svg>
`;
}

// -------------------------------------------------------------
// Generate 40 Distinct Thyroid Reports
// -------------------------------------------------------------
function generateThyroidDataset(): ReportData[] {
  const reports: ReportData[] = [];

  for (let i = 1; i <= 40; i++) {
    const pName = `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`;
    const age = randInt(20, 58);
    const uhid = `THY-${String(i).padStart(3, '0')}`;
    const sampleId = `SMP-T${randInt(10000, 99999)}`;
    const lab = LAB_NAMES[(i - 1) % LAB_NAMES.length];
    const doc = DOCTORS[(i - 1) % DOCTORS.length];
    const date = new Date(2026, randInt(0, 9), randInt(1, 28)).toISOString().split('T')[0];

    let category = '';
    let rows: LabRow[] = [];
    let interpretation = '';
    let vitals = {
      bmi: rand(19.5, 33.2),
      bpSys: randInt(110, 138),
      bpDia: randInt(70, 88),
      fastingSugar: rand(80, 115)
    };
    let symptoms: { name: string; severity: 'mild' | 'moderate' | 'severe'; category: string }[] = [];

    // Distribution:
    // 1-8: Normal / Euthyroid
    // 9-18: Primary Overt Hypothyroidism
    // 19-26: Subclinical Hypothyroidism
    // 27-32: Hashimoto's Autoimmune Thyroiditis
    // 33-37: Primary Overt Hyperthyroidism
    // 38-40: Subclinical Hyperthyroidism

    if (i <= 8) {
      category = 'Thyroid Panel (Euthyroid / Normal)';
      const tsh = rand(1.1, 3.2, 2);
      const ft4 = rand(1.0, 1.5, 2);
      const ft3 = rand(2.6, 3.8, 2);
      const tt4 = rand(6.5, 10.5, 1);
      const tt3 = rand(100, 175, 1);
      const tpo = rand(4, 18, 1);
      const tg = rand(6, 22, 1);

      rows = [
        { test: 'TSH (Ultrasensitive)', result: tsh.toString(), unit: 'mIU/L', flag: 'NORMAL', ref: '0.40 - 4.00' },
        { test: 'Free Thyroxine (FT4)', result: ft4.toString(), unit: 'ng/dL', flag: 'NORMAL', ref: '0.80 - 1.80' },
        { test: 'Free Triiodothyronine (FT3)', result: ft3.toString(), unit: 'pg/mL', flag: 'NORMAL', ref: '2.30 - 4.20' },
        { test: 'Total Thyroxine (Total T4)', result: tt4.toString(), unit: 'μg/dL', flag: 'NORMAL', ref: '5.0 - 12.0' },
        { test: 'Total Triiodothyronine (Total T3)', result: tt3.toString(), unit: 'ng/dL', flag: 'NORMAL', ref: '80 - 200' },
        { test: 'Anti-TPO Antibodies', result: tpo.toString(), unit: 'IU/mL', flag: 'NORMAL', ref: '< 35.0' },
        { test: 'Anti-Thyroglobulin (Anti-Tg)', result: tg.toString(), unit: 'IU/mL', flag: 'NORMAL', ref: '< 40.0' }
      ];
      interpretation = 'Thyroid profile within physiological normal limits. TSH, Free T4, and Free T3 are balanced without evidence of autoimmune antibody elevation.';
    } else if (i <= 18) {
      category = 'Thyroid Panel (Overt Hypothyroidism)';
      const tsh = rand(8.5, 36.0, 2);
      const ft4 = rand(0.32, 0.68, 2);
      const ft3 = rand(1.6, 2.2, 2);
      const tt4 = rand(2.4, 4.5, 1);
      const tt3 = rand(55, 78, 1);
      const tpo = rand(15, 65, 1);

      rows = [
        { test: 'TSH (Ultrasensitive)', result: tsh.toString(), unit: 'mIU/L', flag: 'HIGH', ref: '0.40 - 4.00' },
        { test: 'Free Thyroxine (FT4)', result: ft4.toString(), unit: 'ng/dL', flag: 'LOW', ref: '0.80 - 1.80' },
        { test: 'Free Triiodothyronine (FT3)', result: ft3.toString(), unit: 'pg/mL', flag: 'LOW', ref: '2.30 - 4.20' },
        { test: 'Total Thyroxine (Total T4)', result: tt4.toString(), unit: 'μg/dL', flag: 'LOW', ref: '5.0 - 12.0' },
        { test: 'Total Triiodothyronine (Total T3)', result: tt3.toString(), unit: 'ng/dL', flag: 'LOW', ref: '80 - 200' },
        { test: 'Anti-TPO Antibodies', result: tpo.toString(), unit: 'IU/mL', flag: tpo > 35 ? 'HIGH' : 'NORMAL', ref: '< 35.0' }
      ];
      interpretation = `Markedly elevated TSH (${tsh} mIU/L) with subnormal Free T4 (${ft4} ng/dL) is characteristic of Primary Overt Hypothyroidism. Clinical correlation with thyroid hormone replacement therapy recommended.`;
      symptoms = [
        { name: 'Fatigue', severity: 'severe', category: 'energy' },
        { name: 'Cold intolerance', severity: 'moderate', category: 'other' },
        { name: 'Weight gain', severity: 'moderate', category: 'weight' },
        { name: 'Dry skin', severity: 'mild', category: 'other' }
      ];
      vitals.bmi = rand(26.5, 34.0);
    } else if (i <= 26) {
      category = 'Thyroid Panel (Subclinical Hypothyroidism)';
      const tsh = rand(4.6, 9.4, 2);
      const ft4 = rand(0.95, 1.35, 2);
      const ft3 = rand(2.4, 3.2, 2);
      const tpo = rand(12, 45, 1);

      rows = [
        { test: 'TSH (Ultrasensitive)', result: tsh.toString(), unit: 'mIU/L', flag: 'HIGH', ref: '0.40 - 4.00' },
        { test: 'Free Thyroxine (FT4)', result: ft4.toString(), unit: 'ng/dL', flag: 'NORMAL', ref: '0.80 - 1.80' },
        { test: 'Free Triiodothyronine (FT3)', result: ft3.toString(), unit: 'pg/mL', flag: 'NORMAL', ref: '2.30 - 4.20' },
        { test: 'Anti-TPO Antibodies', result: tpo.toString(), unit: 'IU/mL', flag: tpo > 35 ? 'HIGH' : 'NORMAL', ref: '< 35.0' }
      ];
      interpretation = `Elevated serum TSH (${tsh} mIU/L) with normal peripheral Free T4 indicates Subclinical Hypothyroidism. Recommend repeat TSH and TPO evaluation in 6-12 weeks.`;
      symptoms = [
        { name: 'Fatigue', severity: 'mild', category: 'energy' },
        { name: 'Mood swings', severity: 'mild', category: 'energy' }
      ];
    } else if (i <= 32) {
      category = "Thyroid Panel (Hashimoto's Autoimmune Thyroiditis)";
      const tsh = rand(6.8, 28.5, 2);
      const ft4 = rand(0.48, 0.95, 2);
      const ft3 = rand(1.9, 2.7, 2);
      const tpo = rand(140, 680, 1);
      const tg = rand(85, 340, 1);

      rows = [
        { test: 'TSH (Ultrasensitive)', result: tsh.toString(), unit: 'mIU/L', flag: 'HIGH', ref: '0.40 - 4.00' },
        { test: 'Free Thyroxine (FT4)', result: ft4.toString(), unit: 'ng/dL', flag: ft4 < 0.8 ? 'LOW' : 'NORMAL', ref: '0.80 - 1.80' },
        { test: 'Free Triiodothyronine (FT3)', result: ft3.toString(), unit: 'pg/mL', flag: ft3 < 2.3 ? 'LOW' : 'NORMAL', ref: '2.30 - 4.20' },
        { test: 'Anti-TPO Antibodies', result: tpo.toString(), unit: 'IU/mL', flag: 'HIGH', ref: '< 35.0' },
        { test: 'Anti-Thyroglobulin (Anti-Tg)', result: tg.toString(), unit: 'IU/mL', flag: 'HIGH', ref: '< 40.0' }
      ];
      interpretation = `Significantly elevated Anti-TPO titers (${tpo} IU/mL) and Anti-Tg (${tg} IU/mL) coupled with high TSH strongly confirm Chronic Autoimmune Hashimoto's Thyroiditis.`;
      symptoms = [
        { name: 'Swollen neck/goiter', severity: 'moderate', category: 'other' },
        { name: 'Fatigue', severity: 'severe', category: 'energy' },
        { name: 'Hair thinning/loss', severity: 'moderate', category: 'dermatological' }
      ];
    } else if (i <= 37) {
      category = 'Thyroid Panel (Primary Overt Hyperthyroidism)';
      const tsh = rand(0.01, 0.04, 2);
      const ft4 = rand(2.25, 4.40, 2);
      const ft3 = rand(5.1, 9.8, 2);
      const tt4 = rand(13.5, 18.2, 1);
      const tt3 = rand(220, 360, 1);

      rows = [
        { test: 'TSH (Ultrasensitive)', result: tsh.toString(), unit: 'mIU/L', flag: 'LOW', ref: '0.40 - 4.00' },
        { test: 'Free Thyroxine (FT4)', result: ft4.toString(), unit: 'ng/dL', flag: 'HIGH', ref: '0.80 - 1.80' },
        { test: 'Free Triiodothyronine (FT3)', result: ft3.toString(), unit: 'pg/mL', flag: 'HIGH', ref: '2.30 - 4.20' },
        { test: 'Total Thyroxine (Total T4)', result: tt4.toString(), unit: 'μg/dL', flag: 'HIGH', ref: '5.0 - 12.0' },
        { test: 'Total Triiodothyronine (Total T3)', result: tt3.toString(), unit: 'ng/dL', flag: 'HIGH', ref: '80 - 200' },
        { test: 'TSH Receptor Antibodies (TRAb)', result: '3.4', unit: 'IU/L', flag: 'HIGH', ref: '< 1.75' }
      ];
      interpretation = `Suppressed TSH (< 0.05 mIU/L) with markedly elevated Free T4 and Free T3 confirms Primary Thyrotoxicosis / Hyperthyroidism (suspected Graves' Disease). Urgent endocrine evaluation required.`;
      symptoms = [
        { name: 'Palpitations', severity: 'severe', category: 'other' },
        { name: 'Heat intolerance', severity: 'severe', category: 'other' },
        { name: 'Tremors', severity: 'moderate', category: 'other' },
        { name: 'Unexplained weight loss', severity: 'moderate', category: 'weight' }
      ];
      vitals.bpSys = randInt(130, 155);
    } else {
      category = 'Thyroid Panel (Subclinical Hyperthyroidism)';
      const tsh = rand(0.08, 0.28, 2);
      const ft4 = rand(1.25, 1.72, 2);
      const ft3 = rand(3.1, 4.0, 2);

      rows = [
        { test: 'TSH (Ultrasensitive)', result: tsh.toString(), unit: 'mIU/L', flag: 'LOW', ref: '0.40 - 4.00' },
        { test: 'Free Thyroxine (FT4)', result: ft4.toString(), unit: 'ng/dL', flag: 'NORMAL', ref: '0.80 - 1.80' },
        { test: 'Free Triiodothyronine (FT3)', result: ft3.toString(), unit: 'pg/mL', flag: 'NORMAL', ref: '2.30 - 4.20' }
      ];
      interpretation = `Suppressed TSH with normal circulating Free T4 and Free T3 is consistent with Subclinical Hyperthyroidism. Monitor cardiac rhythm and bone density.`;
      symptoms = [
        { name: 'Palpitations', severity: 'mild', category: 'other' },
        { name: 'Anxiety', severity: 'mild', category: 'energy' }
      ];
    }

    reports.push({
      id: uhid,
      index: i,
      type: 'thyroid',
      title: `Thyroid Laboratory Report #${i}`,
      patientName: pName,
      patientAge: age,
      patientGender: 'Female',
      uhid,
      sampleId,
      doctor: doc,
      collectionDate: date,
      reportDate: date,
      labInfo: lab,
      categoryLabel: category,
      rows,
      interpretation,
      clinicalNotes: `Comprehensive Thyroid Screen Report - Case ${i}`,
      vitals,
      symptoms
    });
  }

  return reports;
}

// -------------------------------------------------------------
// Generate 40 Distinct PCOS Reports
// -------------------------------------------------------------
function generatePCOSDataset(): ReportData[] {
  const reports: ReportData[] = [];

  for (let i = 1; i <= 40; i++) {
    const pName = `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`;
    const age = randInt(18, 38);
    const uhid = `PCO-${String(i).padStart(3, '0')}`;
    const sampleId = `SMP-P${randInt(10000, 99999)}`;
    const lab = LAB_NAMES[(i - 1) % LAB_NAMES.length];
    const doc = DOCTORS[(i - 1) % DOCTORS.length];
    const date = new Date(2026, randInt(0, 9), randInt(1, 28)).toISOString().split('T')[0];

    let category = '';
    let rows: LabRow[] = [];
    let interpretation = '';
    let vitals = {
      bmi: rand(21.0, 36.5),
      bpSys: randInt(112, 142),
      bpDia: randInt(72, 90),
      fastingSugar: rand(85, 128),
      follicleCount: 16,
      cycleLength: 42,
      cycleRegularity: 'irregular',
      hirsutism: 'moderate_hirsutism',
      acanthosis: 'mild_acanthosis',
      insulinResistance: 'moderate'
    };
    let symptoms: { name: string; severity: 'mild' | 'moderate' | 'severe'; category: string }[] = [];

    // Distribution:
    // 1-10: Classic Rotterdam Phenotype A (Full Triad)
    // 11-18: Phenotype B (Ovulatory Dysfunction + Hyperandrogenism)
    // 19-26: Phenotype C (Ovulatory PCOS)
    // 27-32: Phenotype D (Non-Hyperandrogenic PCOS)
    // 33-40: PCOS with Severe Metabolic Syndrome & Insulin Resistance

    if (i <= 10) {
      category = 'PCOS Comprehensive Panel (Rotterdam Phenotype A)';
      const lh = rand(15.5, 23.5, 1);
      const fsh = rand(4.2, 5.8, 1);
      const ratio = (lh / fsh).toFixed(2);
      const testTot = rand(76, 118, 1);
      const testFree = rand(2.8, 4.4, 2);
      const dheas = rand(410, 640, 1);
      const shbg = rand(12, 22, 1);
      const ins = rand(22, 38, 1);
      const fbs = rand(92, 108, 1);
      const homa = ((ins * fbs) / 405).toFixed(2);

      rows = [
        { test: 'Luteinizing Hormone (LH)', result: lh.toString(), unit: 'mIU/mL', flag: 'HIGH', ref: '1.68 - 15.00' },
        { test: 'Follicle Stimulating Hormone (FSH)', result: fsh.toString(), unit: 'mIU/mL', flag: 'NORMAL', ref: '3.03 - 8.08' },
        { test: 'LH / FSH Ratio', result: ratio, unit: 'ratio', flag: 'HIGH', ref: '0.50 - 2.00' },
        { test: 'Total Testosterone', result: testTot.toString(), unit: 'ng/dL', flag: 'HIGH', ref: '15.0 - 70.0' },
        { test: 'Free Testosterone', result: testFree.toString(), unit: 'pg/mL', flag: 'HIGH', ref: '0.30 - 1.90' },
        { test: 'DHEAS (Dehydroepiandrosterone)', result: dheas.toString(), unit: 'μg/dL', flag: 'HIGH', ref: '35.0 - 430.0' },
        { test: 'SHBG (Sex Hormone Binding Glob.)', result: shbg.toString(), unit: 'nmol/L', flag: 'LOW', ref: '18.0 - 144.0' },
        { test: 'Fasting Insulin', result: ins.toString(), unit: 'μIU/mL', flag: 'HIGH', ref: '2.6 - 24.9' },
        { test: 'HOMA-IR (Insulin Resistance Index)', result: homa, unit: 'score', flag: 'HIGH', ref: '< 2.50' }
      ];
      interpretation = `Elevated LH/FSH ratio (${ratio}:1), hyperandrogenism (Total Testo ${testTot} ng/dL, Free Testo ${testFree} pg/mL), low SHBG, and HOMA-IR of ${homa}. Clinically confirms Rotterdam Phenotype A (Full Classic PCOS).`;
      symptoms = [
        { name: 'Irregular periods', severity: 'severe', category: 'menstrual' },
        { name: 'Facial hair (Hirsutism)', severity: 'severe', category: 'dermatological' },
        { name: 'Acne', severity: 'moderate', category: 'dermatological' },
        { name: 'Weight gain', severity: 'moderate', category: 'weight' }
      ];
      vitals.follicleCount = randInt(18, 28);
      vitals.cycleRegularity = 'irregular';
      vitals.hirsutism = 'severe_hirsutism';
      vitals.acanthosis = 'moderate_acanthosis';
      vitals.insulinResistance = 'severe';
      vitals.bmi = rand(27.5, 35.8);
    } else if (i <= 18) {
      category = 'PCOS Hormonal Panel (Rotterdam Phenotype B)';
      const lh = rand(13.2, 18.5, 1);
      const fsh = rand(4.5, 6.2, 1);
      const ratio = (lh / fsh).toFixed(2);
      const testTot = rand(72, 94, 1);
      const testFree = rand(2.2, 3.4, 2);
      const dheas = rand(360, 480, 1);
      const shbg = rand(19, 28, 1);

      rows = [
        { test: 'Luteinizing Hormone (LH)', result: lh.toString(), unit: 'mIU/mL', flag: 'HIGH', ref: '1.68 - 15.00' },
        { test: 'Follicle Stimulating Hormone (FSH)', result: fsh.toString(), unit: 'mIU/mL', flag: 'NORMAL', ref: '3.03 - 8.08' },
        { test: 'LH / FSH Ratio', result: ratio, unit: 'ratio', flag: 'HIGH', ref: '0.50 - 2.00' },
        { test: 'Total Testosterone', result: testTot.toString(), unit: 'ng/dL', flag: 'HIGH', ref: '15.0 - 70.0' },
        { test: 'Free Testosterone', result: testFree.toString(), unit: 'pg/mL', flag: 'HIGH', ref: '0.30 - 1.90' },
        { test: 'DHEAS', result: dheas.toString(), unit: 'μg/dL', flag: dheas > 430 ? 'HIGH' : 'NORMAL', ref: '35.0 - 430.0' },
        { test: 'SHBG', result: shbg.toString(), unit: 'nmol/L', flag: 'NORMAL', ref: '18.0 - 144.0' }
      ];
      interpretation = `Anovulatory dysfunction with biochemical hyperandrogenemia (LH/FSH ratio ${ratio}, elevated Free Testosterone). Features conform to Rotterdam Phenotype B without polycystic morphology.`;
      symptoms = [
        { name: 'Missed periods', severity: 'moderate', category: 'menstrual' },
        { name: 'Oily skin', severity: 'mild', category: 'dermatological' },
        { name: 'Hair thinning', severity: 'moderate', category: 'dermatological' }
      ];
      vitals.follicleCount = randInt(8, 11);
      vitals.cycleRegularity = 'irregular';
      vitals.hirsutism = 'moderate_hirsutism';
    } else if (i <= 26) {
      category = 'PCOS Ovulatory Panel (Rotterdam Phenotype C)';
      const lh = rand(8.2, 14.5, 1);
      const fsh = rand(4.8, 6.8, 1);
      const ratio = (lh / fsh).toFixed(2);
      const testTot = rand(68, 88, 1);
      const testFree = rand(2.1, 3.1, 2);
      const dheas = rand(390, 520, 1);

      rows = [
        { test: 'Luteinizing Hormone (LH)', result: lh.toString(), unit: 'mIU/mL', flag: 'NORMAL', ref: '1.68 - 15.00' },
        { test: 'Follicle Stimulating Hormone (FSH)', result: fsh.toString(), unit: 'mIU/mL', flag: 'NORMAL', ref: '3.03 - 8.08' },
        { test: 'LH / FSH Ratio', result: ratio, unit: 'ratio', flag: ratio > 2.0 ? 'HIGH' : 'NORMAL', ref: '0.50 - 2.00' },
        { test: 'Total Testosterone', result: testTot.toString(), unit: 'ng/dL', flag: 'HIGH', ref: '15.0 - 70.0' },
        { test: 'Free Testosterone', result: testFree.toString(), unit: 'pg/mL', flag: 'HIGH', ref: '0.30 - 1.90' },
        { test: 'DHEAS', result: dheas.toString(), unit: 'μg/dL', flag: dheas > 430 ? 'HIGH' : 'NORMAL', ref: '35.0 - 430.0' }
      ];
      interpretation = `Ovulatory cycles maintained, but significant biochemical hyperandrogenism observed. Conforms to Rotterdam Phenotype C (Ovulatory PCOS) when supported by ultrasound findings.`;
      symptoms = [
        { name: 'Body hair / Hirsutism', severity: 'moderate', category: 'dermatological' },
        { name: 'Acne', severity: 'moderate', category: 'dermatological' }
      ];
      vitals.follicleCount = randInt(14, 22);
      vitals.cycleRegularity = 'regular';
      vitals.hirsutism = 'mild_hirsutism';
    } else if (i <= 32) {
      category = 'PCOS Non-Androgenic Panel (Rotterdam Phenotype D)';
      const lh = rand(9.5, 15.8, 1);
      const fsh = rand(4.6, 6.5, 1);
      const ratio = (lh / fsh).toFixed(2);
      const testTot = rand(28, 52, 1);
      const testFree = rand(0.7, 1.4, 2);
      const dheas = rand(120, 280, 1);
      const shbg = rand(35, 75, 1);

      rows = [
        { test: 'Luteinizing Hormone (LH)', result: lh.toString(), unit: 'mIU/mL', flag: lh > 15 ? 'HIGH' : 'NORMAL', ref: '1.68 - 15.00' },
        { test: 'Follicle Stimulating Hormone (FSH)', result: fsh.toString(), unit: 'mIU/mL', flag: 'NORMAL', ref: '3.03 - 8.08' },
        { test: 'LH / FSH Ratio', result: ratio, unit: 'ratio', flag: ratio > 2.0 ? 'HIGH' : 'NORMAL', ref: '0.50 - 2.00' },
        { test: 'Total Testosterone', result: testTot.toString(), unit: 'ng/dL', flag: 'NORMAL', ref: '15.0 - 70.0' },
        { test: 'Free Testosterone', result: testFree.toString(), unit: 'pg/mL', flag: 'NORMAL', ref: '0.30 - 1.90' },
        { test: 'DHEAS', result: dheas.toString(), unit: 'μg/dL', flag: 'NORMAL', ref: '35.0 - 430.0' },
        { test: 'SHBG', result: shbg.toString(), unit: 'nmol/L', flag: 'NORMAL', ref: '18.0 - 144.0' }
      ];
      interpretation = `Normal circulating androgens with ovulatory dysfunction and prominent polycystic ovarian morphology. Diagnostic of Rotterdam Phenotype D (Non-Androgenic PCOS).`;
      symptoms = [
        { name: 'Irregular periods', severity: 'moderate', category: 'menstrual' },
        { name: 'Heavy period', severity: 'mild', category: 'menstrual' }
      ];
      vitals.follicleCount = randInt(15, 24);
      vitals.cycleRegularity = 'irregular';
      vitals.hirsutism = 'normal';
    } else {
      category = 'PCOS & Metabolic Syndrome Panel';
      const lh = rand(14.0, 21.0, 1);
      const fsh = rand(4.0, 5.5, 1);
      const ratio = (lh / fsh).toFixed(2);
      const testTot = rand(74, 98, 1);
      const ins = rand(28, 58, 1);
      const fbs = rand(104, 138, 1);
      const homa = ((ins * fbs) / 405).toFixed(2);
      const hba1c = rand(5.7, 6.4, 1);
      const tg = rand(175, 270, 1);
      const hdl = rand(30, 38, 1);

      rows = [
        { test: 'LH / FSH Ratio', result: ratio, unit: 'ratio', flag: 'HIGH', ref: '0.50 - 2.00' },
        { test: 'Total Testosterone', result: testTot.toString(), unit: 'ng/dL', flag: 'HIGH', ref: '15.0 - 70.0' },
        { test: 'Fasting Glucose', result: fbs.toString(), unit: 'mg/dL', flag: 'HIGH', ref: '70 - 100' },
        { test: 'Fasting Insulin', result: ins.toString(), unit: 'μIU/mL', flag: 'HIGH', ref: '2.6 - 24.9' },
        { test: 'HOMA-IR Score', result: homa, unit: 'score', flag: 'HIGH', ref: '< 2.50' },
        { test: 'HbA1c (Glycated Hemoglobin)', result: hba1c.toString(), unit: '%', flag: 'HIGH', ref: '4.0 - 5.6' },
        { test: 'Serum Triglycerides', result: tg.toString(), unit: 'mg/dL', flag: 'HIGH', ref: '< 150.0' },
        { test: 'HDL Cholesterol', result: hdl.toString(), unit: 'mg/dL', flag: 'LOW', ref: '> 40.0' }
      ];
      interpretation = `Complex PCOS presentation accompanied by significant insulin resistance (HOMA-IR ${homa}), prediabetic glycemic index (HbA1c ${hba1c}%), and atherogenic dyslipidemia. Comprehensive cardiometabolic intervention required.`;
      symptoms = [
        { name: 'Irregular periods', severity: 'severe', category: 'menstrual' },
        { name: 'Unexplained weight gain', severity: 'severe', category: 'weight' },
        { name: 'Fatigue', severity: 'moderate', category: 'energy' },
        { name: 'Facial hair (Hirsutism)', severity: 'moderate', category: 'dermatological' }
      ];
      vitals.bmi = rand(30.2, 38.5);
      vitals.follicleCount = randInt(16, 26);
      vitals.cycleRegularity = 'irregular';
      vitals.hirsutism = 'moderate_hirsutism';
      vitals.acanthosis = 'severe_acanthosis';
      vitals.insulinResistance = 'severe';
    }

    reports.push({
      id: uhid,
      index: i,
      type: 'pcos',
      title: `PCOS Diagnostic Laboratory Report #${i}`,
      patientName: pName,
      patientAge: age,
      patientGender: 'Female',
      uhid,
      sampleId,
      doctor: doc,
      collectionDate: date,
      reportDate: date,
      labInfo: lab,
      categoryLabel: category,
      rows,
      interpretation,
      clinicalNotes: `Comprehensive PCOS Screen Report - Case ${i}`,
      vitals,
      symptoms
    });
  }

  return reports;
}

// -------------------------------------------------------------
// Execution: Render All 80 PNG Images & Populate DB
// -------------------------------------------------------------
async function run() {
  console.log('Generating 40 Thyroid reports and 40 PCOS reports...');
  
  const thyroidReports = generateThyroidDataset();
  const pcosReports = generatePCOSDataset();
  const allReports = [...thyroidReports, ...pcosReports];

  const datasetManifest: Array<{
    id: string;
    index: number;
    type: string;
    patientName: string;
    age: number;
    uhid: string;
    category: string;
    imagePathPublic: string;
    imagePathDataset: string;
    keyLabValues: Record<string, string>;
  }> = [];

  let count = 0;

  for (const report of allReports) {
    const isThyroid = report.type === 'thyroid';
    const folderSub = isThyroid ? 'thyroid' : 'pcos';
    const fileName = `${report.type}_report_${String(report.index).padStart(2, '0')}.png`;

    const svgContent = createReportSVG(report);
    const pngBuffer = await sharp(Buffer.from(svgContent), { density: 150 })
      .png({ quality: 95 })
      .toBuffer();

    // Write to both public and dataset folders
    const pubPath = path.resolve(`public/dataset/${folderSub}/${fileName}`);
    const dataPath = path.resolve(`dataset/${folderSub}/${fileName}`);

    fs.writeFileSync(pubPath, pngBuffer);
    fs.writeFileSync(dataPath, pngBuffer);

    // Save key values
    const keyVals: Record<string, string> = {};
    report.rows.forEach(r => { keyVals[r.test] = `${r.result} ${r.unit}`; });

    datasetManifest.push({
      id: report.id,
      index: report.index,
      type: report.type,
      patientName: report.patientName,
      age: report.patientAge,
      uhid: report.uhid,
      category: report.categoryLabel,
      imagePathPublic: `/dataset/${folderSub}/${fileName}`,
      imagePathDataset: `dataset/${folderSub}/${fileName}`,
      keyLabValues: keyVals
    });

    count++;
    if (count % 10 === 0) {
      console.log(`Rendered ${count}/80 report images...`);
    }
  }

  // Save metadata index JSON
  fs.writeFileSync('dataset/dataset_index.json', JSON.stringify(datasetManifest, null, 2));
  fs.writeFileSync('public/dataset/dataset_index.json', JSON.stringify(datasetManifest, null, 2));
  console.log('Successfully saved dataset_index.json with 80 report records!');

  // Populate SQLite database so users can immediately view, analyze and screen in the web app!
  console.log('Syncing all 80 patients & reports into database custom.db...');

  for (const r of allReports) {
    const isThyroid = r.type === 'thyroid';
    const pubImg = `/dataset/${r.type}/${r.type}_report_${String(r.index).padStart(2, '0')}.png`;

    // Create Patient
    const patient = await db.patient.create({
      data: {
        name: r.patientName,
        age: r.patientAge,
        gender: r.patientGender,
        medicalHistory: `${r.categoryLabel} assessment. Re-evaluation under clinical protocol.`,
        notes: `Clinical screening candidate. Assigned UHID ${r.uhid}.`,
        weight: r.vitals.bmi ? Math.round(r.vitals.bmi * (1.6 * 1.6)) : undefined,
        height: 160,
        bmi: r.vitals.bmi,
        bloodPressureSystolic: r.vitals.bpSys,
        bloodPressureDiastolic: r.vitals.bpDia,
        fastingBloodSugar: r.vitals.fastingSugar,
        menstrualCycleLength: r.vitals.cycleLength,
        menstrualRegularity: r.vitals.cycleRegularity,
        hairGrowthPattern: r.vitals.hirsutism,
        skinDarkening: r.vitals.acanthosis,
        follicleCount: r.vitals.follicleCount,
        insulinResistance: r.vitals.insulinResistance,
      }
    });

    // Create MedicalReport
    const report = await db.medicalReport.create({
      data: {
        patientId: patient.id,
        reportType: isThyroid ? 'thyroid_panel' : 'pcos_panel',
        fileName: `${r.type}_report_${String(r.index).padStart(2, '0')}.png`,
        fileType: 'image/png',
        fileData: pubImg,
        status: 'verified',
        ocrConfidence: 0.98,
        notes: r.interpretation,
        ocrExtracted: JSON.stringify(r.rows)
      }
    });

    // Create LabValues
    for (const row of r.rows) {
      const numResult = parseFloat(row.result);
      const isNum = !isNaN(numResult);

      await db.labValue.create({
        data: {
          reportId: report.id,
          testName: row.test.split('(')[0].trim(),
          result: isNum ? numResult : null,
          resultText: isNum ? null : row.result,
          unit: row.unit,
          isAbnormal: row.flag !== 'NORMAL',
          isVerified: true,
          category: isThyroid ? 'thyroid' : 'hormone',
          notes: `Biological Reference: ${row.ref}`
        }
      });
    }

    // Create Symptoms
    for (const sym of r.symptoms) {
      await db.symptomEntry.create({
        data: {
          patientId: patient.id,
          symptomName: sym.name,
          severity: sym.severity,
          category: sym.category
        }
      });
    }
  }

  console.log('Database sync complete! 80 patients, 80 reports, lab values & symptoms inserted.');
}

run()
  .then(() => {
    console.log('ALL 80 REPORT IMAGES & DATASET SUCCESSFULLY CREATED!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Error generating dataset:', err);
    process.exit(1);
  });
