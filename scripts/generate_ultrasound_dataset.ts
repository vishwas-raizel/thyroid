import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { db } from '../src/lib/db';

// Ensure directories exist
const publicThyroidUsDir = path.resolve('public/dataset/thyroid_us');
const publicOvarianUsDir = path.resolve('public/dataset/ovarian_us');
const dataThyroidUsDir = path.resolve('dataset/thyroid_us');
const dataOvarianUsDir = path.resolve('dataset/ovarian_us');

[publicThyroidUsDir, publicOvarianUsDir, dataThyroidUsDir, dataOvarianUsDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

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

function escapeXml(unsafe: string | number | undefined | null): string {
  if (unsafe == null) return '';
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

const FIRST_NAMES = [
  'Kavya', 'Sanjana', 'Ananya', 'Pooja', 'Deepika', 'Divya', 'Harini', 'Lavanya',
  'Meera', 'Neha', 'Priya', 'Radhika', 'Shreya', 'Sneha', 'Tanvi', 'Varsha',
  'Aditi', 'Bhavana', 'Geetha', 'Indira', 'Janaki', 'Kalyani', 'Nandini', 'Yamini'
];

const LAST_NAMES = [
  'Iyer', 'Menon', 'Reddy', 'Patel', 'Sharma', 'Verma', 'Kulkarni', 'Joshi',
  'Bhat', 'Hegde', 'Shetty', 'Kumar', 'Singh', 'Gupta', 'Deshmukh', 'Rao'
];

const IMAGING_CENTERS = [
  { name: 'APEX ADVANCED RADIODIAGNOSIS & ULTRASOUND', sub: 'Comprehensive High-Resolution Imaging Suite' },
  { name: 'METROPOLIS WOMEN’S & ENDOCRINE ULTRASOUND', sub: 'Department of Specialized Ultrasound & Color Doppler' },
  { name: 'HORIZON ULTRASONOGRAPHY & DIAGNOSTIC CENTER', sub: 'State-of-the-art 3D/4D Sonography Unit' },
  { name: 'NOVA MEDICAL IMAGING & FOETAL MEDICINE', sub: 'Advanced Pelvic & Small Parts Imaging Division' }
];

const RADIOLOGISTS = [
  'Dr. Shalini Mukherjee, MBBS, MD, DNB (Radiodiagnosis)',
  'Dr. K. S. Mehra, MBBS, DMRD (Consultant Radiologist)',
  'Dr. Arvind Venkatesh, MD, FICR (Senior Radiologist)',
  'Dr. Suniti Deshpande, MBBS, MD (Chief Sonologist)'
];

interface UltrasoundReportData {
  id: string;
  index: number;
  type: 'thyroid_us' | 'ovarian_us';
  title: string;
  patientName: string;
  patientAge: number;
  patientGender: string;
  uhid: string;
  scanId: string;
  doctor: string;
  scanDate: string;
  centerInfo: { name: string; sub: string };
  categoryLabel: string;
  indication: string;
  findings: {
    measurements: { label: string; value: string }[];
    observations: string[];
    tiradsOrRotterdam: string;
    doppler: string;
  };
  impression: string;
  recommendation: string;
  sonogramData: {
    probe: string;
    freq: string;
    depth: string;
    gain: string;
    type: 'thyroid' | 'ovary';
    variant: string;
    follicleCount?: number;
    noduleSize?: string;
  };
}

// -------------------------------------------------------------
// Ultrasound B-Mode Sonogram Simulation Graphic (SVG)
// -------------------------------------------------------------
function generateSonogramSVG(data: UltrasoundReportData): string {
  const isThyroid = data.type === 'thyroid_us';
  const width = 720;
  const height = 280;

  let visualGraphic = '';

  if (isThyroid) {
    // Generate simulated Thyroid Ultrasound
    const isNormal = data.categoryLabel.includes('Normal');
    const isHashimoto = data.categoryLabel.includes('Hashimoto') || data.categoryLabel.includes('Thyroiditis');
    const isNodule = data.categoryLabel.includes('Nodule') || data.categoryLabel.includes('TI-RADS');

    // Background ultrasound field
    let noduleSvg = '';
    if (isNodule) {
      noduleSvg = `
        <!-- Simulated Thyroid Nodule -->
        <ellipse cx='380' cy='140' rx='45' ry='36' fill='#111827' stroke='#64748b' stroke-width='1.5' stroke-dasharray='2,2'/>
        <circle cx='360' cy='130' r='1.5' fill='#f8fafc'/>
        <circle cx='395' cy='148' r='1.5' fill='#f8fafc'/>
        <circle cx='375' cy='155' r='1.2' fill='#f8fafc'/>
        <!-- Caliper markers -->
        <path d='M 335 140 h 10 M 335 135 v 10 M 425 140 h 10 M 425 135 v 10' stroke='#38bdf8' stroke-width='1.5'/>
        <line x1='335' y1='140' x2='425' y2='140' stroke='#38bdf8' stroke-width='1' stroke-dasharray='3,3'/>
        <text x='380' y='130' font-family='monospace' font-size='10' font-weight='bold' fill='#38bdf8' text-anchor='middle'>D1: ${escapeXml(data.sonogramData.noduleSize || '18.4 mm')}</text>
      `;
    } else if (isHashimoto) {
      noduleSvg = `
        <!-- Coarse heterogeneous parenchyma texture -->
        <g opacity='0.4'>
          <ellipse cx='340' cy='135' rx='30' ry='22' fill='#1e293b'/>
          <ellipse cx='410' cy='145' rx='28' ry='20' fill='#1e293b'/>
          <ellipse cx='360' cy='170' rx='25' ry='16' fill='#1e293b'/>
          <circle cx='325' cy='125' r='2' fill='#94a3b8'/>
          <circle cx='420' cy='130' r='2' fill='#94a3b8'/>
        </g>
        <text x='380' y='145' font-family='monospace' font-size='10' fill='#f59e0b' text-anchor='middle'>[ Coarse Heterogeneous Texture ]</text>
      `;
    }

    visualGraphic = `
      <!-- Neck strap muscles & tissue planes -->
      <path d='M 120 70 Q 360 95 600 70' stroke='#334155' stroke-width='8' fill='none'/>
      <path d='M 140 85 Q 360 110 580 85' stroke='#475569' stroke-width='3' fill='none'/>
      
      <!-- Right & Left Thyroid Lobe outline -->
      <ellipse cx='280' cy='145' rx='75' ry='50' fill='#1e293b' stroke='#475569' stroke-width='1.5'/>
      <ellipse cx='480' cy='145' rx='75' ry='50' fill='#1e293b' stroke='#475569' stroke-width='1.5'/>
      
      <!-- Isthmus bridging across trachea -->
      <rect x='330' y='125' width='100' height='20' rx='8' fill='#1e293b' stroke='#475569' stroke-width='1'/>
      
      <!-- Trachea (anterior acoustic shadow) -->
      <circle cx='380' cy='195' r='38' fill='#090d16' stroke='#64748b' stroke-width='2'/>
      <text x='380' y='198' font-family='monospace' font-size='9' fill='#64748b' text-anchor='middle'>TRACHEA</text>
      
      <!-- Carotid Arteries (anechoic vascular circles) -->
      <circle cx='180' cy='155' r='22' fill='#020617' stroke='#38bdf8' stroke-width='1.5'/>
      <text x='180' y='159' font-family='monospace' font-size='8' fill='#38bdf8' text-anchor='middle'>R-CCA</text>

      <circle cx='580' cy='155' r='22' fill='#020617' stroke='#38bdf8' stroke-width='1.5'/>
      <text x='580' y='159' font-family='monospace' font-size='8' fill='#38bdf8' text-anchor='middle'>L-CCA</text>
      
      <!-- Internal jugular veins -->
      <ellipse cx='140' cy='160' rx='14' ry='24' fill='#020617' stroke='#2563eb' stroke-width='1'/>
      <ellipse cx='620' cy='160' rx='14' ry='24' fill='#020617' stroke='#2563eb' stroke-width='1'/>

      ${noduleSvg}
    `;
  } else {
    // Generate simulated Ovarian Ultrasound (PCOS string-of-pearls vs Normal)
    const count = data.sonogramData.follicleCount || 16;
    const isPCOM = count >= 12;

    let folliclesSvg = '';
    if (isPCOM) {
      // Classic string of pearls arrangement in ellipse periphery
      const cx = 380;
      const cy = 145;
      const rx = 110;
      const ry = 65;
      for (let i = 0; i < count; i++) {
        const angle = (i / count) * 2 * Math.PI;
        const fx = cx + (rx - 16) * Math.cos(angle);
        const fy = cy + (ry - 12) * Math.sin(angle);
        const fr = rand(3.5, 6.5);
        folliclesSvg += `
          <circle cx='${fx.toFixed(1)}' cy='${fy.toFixed(1)}' r='${fr.toFixed(1)}' fill='#020617' stroke='#64748b' stroke-width='1'/>
        `;
      }
      // Add caliper on one follicle
      folliclesSvg += `
        <path d='M 450 145 h 6 M 450 142 v 6 M 464 145 h 6 M 464 142 v 6' stroke='#f43f5e' stroke-width='1.5'/>
        <text x='455' y='136' font-family='monospace' font-size='8' fill='#f43f5e'>5.8mm</text>
      `;
    } else {
      // Normal ovary: few random developing follicles
      folliclesSvg = `
        <circle cx='340' cy='140' r='10' fill='#020617' stroke='#64748b' stroke-width='1'/>
        <circle cx='410' cy='135' r='14' fill='#020617' stroke='#64748b' stroke-width='1.2'/>
        <circle cx='375' cy='165' r='8' fill='#020617' stroke='#64748b' stroke-width='1'/>
        <text x='410' y='138' font-family='monospace' font-size='8' fill='#38bdf8' text-anchor='middle'>14mm</text>
      `;
    }

    visualGraphic = `
      <!-- Endovaginal probe acoustic fan lines -->
      <path d='M 240 40 L 160 260 M 520 40 L 600 260' stroke='#1e293b' stroke-width='1' stroke-dasharray='4,4'/>
      
      <!-- Ovary Contour -->
      <ellipse cx='380' cy='145' rx='120' ry='75' fill='#111827' stroke='#475569' stroke-width='2'/>
      
      <!-- Hyperechoic Central Stroma -->
      <ellipse cx='380' cy='145' rx='60' ry='35' fill='#334155' opacity='0.7' stroke='#64748b' stroke-width='1'/>
      <text x='380' y='148' font-family='monospace' font-size='9' font-weight='bold' fill='#cbd5e1' text-anchor='middle'>
        ${isPCOM ? 'HYPERECHOIC STROMA' : 'OVARIAN STROMA'}
      </text>

      <!-- Peripheral Antral Follicles -->
      ${folliclesSvg}

      <!-- Ovarian Dimension Calipers -->
      <line x1='260' y1='145' x2='500' y2='145' stroke='#38bdf8' stroke-width='1' stroke-dasharray='3,3'/>
      <path d='M 260 140 v 10 M 500 140 v 10' stroke='#38bdf8' stroke-width='1.5'/>
      <text x='380' y='215' font-family='monospace' font-size='10' font-weight='bold' fill='#38bdf8' text-anchor='middle'>
        RT OVARY VOL: ${escapeXml(data.findings.measurements.find(m => m.label.includes('Volume'))?.value || '13.8 mL')}
      </text>
    `;
  }

  // Sonography display HUD overlay
  return `
    <g transform='translate(40, 260)'>
      <!-- Dark Monitor Screen -->
      <rect width='${width}' height='${height}' rx='6' fill='#050811' stroke='#1e293b' stroke-width='1.5'/>
      
      <!-- Telemetry Info Header -->
      <text x='15' y='22' font-family='monospace' font-size='11' font-weight='bold' fill='#38bdf8'>LOGIQ E10s CLINICAL ULTRASOUND</text>
      <text x='15' y='36' font-family='monospace' font-size='9' fill='#94a3b8'>PRB: ${data.sonogramData.probe} | FRQ: ${data.sonogramData.freq} | GN: ${data.sonogramData.gain} | DR: 65dB</text>
      <text x='15' y='50' font-family='monospace' font-size='9' fill='#94a3b8'>TIS: 0.4 TIB: 0.4 MI: 0.9 | FPS: 42Hz</text>

      <text x='${width - 15}' y='22' font-family='monospace' font-size='10' font-weight='bold' fill='#e2e8f0' text-anchor='end'>UHID: ${escapeXml(data.uhid)}</text>
      <text x='${width - 15}' y='36' font-family='monospace' font-size='9' fill='#94a3b8' text-anchor='end'>SCAN DATE: ${escapeXml(data.scanDate)}</text>
      <text x='${width - 15}' y='50' font-family='monospace' font-size='9' fill='#10b981' text-anchor='end'>[ LIVE CAPTURE - B-MODE ]</text>

      <!-- Depth Scale Bar on Left -->
      <line x1='35' y1='70' x2='35' y2='250' stroke='#475569' stroke-width='1'/>
      ${[0, 1, 2, 3, 4, 5].map((d, i) => `
        <line x1='30' y1='${70 + i * 36}' x2='35' y2='${70 + i * 36}' stroke='#94a3b8' stroke-width='1.5'/>
        <text x='24' y='${74 + i * 36}' font-family='monospace' font-size='8' fill='#94a3b8' text-anchor='end'>${d}</text>
      `).join('')}

      <!-- Render the simulated visual organ anatomy -->
      ${visualGraphic}

      <!-- Bottom HUD status -->
      <text x='15' y='${height - 10}' font-family='monospace' font-size='9' fill='#64748b'>
        IMAGE MODE: HIGH DENSITY HARMONIC | ACOUSTIC COUPLING: EXCELLENT | ARCHIVE ID: ${escapeXml(data.scanId)}
      </text>
      <text x='${width - 15}' y='${height - 10}' font-family='monospace' font-size='9' font-weight='bold' fill='#f59e0b' text-anchor='end'>
        ${data.type === 'thyroid_us' ? 'MODALITY: THYROID US' : 'MODALITY: OVARIAN US'}
      </text>
    </g>
  `;
}

function createUltrasoundReportSVG(data: UltrasoundReportData): string {
  const isThyroid = data.type === 'thyroid_us';
  const primaryTheme = isThyroid ? '#0f766e' : '#831843'; // Deep Teal for Thyroid US, Deep Berry/Magenta for Ovarian US
  const primaryLight = isThyroid ? '#f0fdfa' : '#fdf2f8';
  const primaryBorder = isThyroid ? '#99f6e4' : '#fbcfe8';
  const badgeBg = isThyroid ? '#ccfbf1' : '#fce7f3';
  const badgeText = isThyroid ? '#115e59' : '#9d174d';

  // Measurements Table Rows
  let measurementsRows = '';
  data.findings.measurements.forEach((m, idx) => {
    const isEven = idx % 2 === 0;
    const bg = isEven ? '#ffffff' : '#f8fafc';
    measurementsRows += `
      <rect x='40' y='${565 + idx * 24}' width='350' height='24' fill='${bg}' stroke='#e2e8f0' stroke-width='0.5'/>
      <text x='50' y='${581 + idx * 24}' font-family='Arial, sans-serif' font-size='10.5' font-weight='600' fill='#334155'>${escapeXml(m.label)}</text>
      <text x='260' y='${581 + idx * 24}' font-family='monospace' font-size='11' font-weight='bold' fill='#0f172a'>${escapeXml(m.value)}</text>
    `;
  });

  // Observations bullet points
  let obsY = 565;
  let obsItems = '';
  data.findings.observations.forEach(obs => {
    obsItems += `
      <circle cx='415' cy='${obsY + 8}' r='2.5' fill='${primaryTheme}'/>
      <text x='425' y='${obsY + 12}' font-family='Arial, sans-serif' font-size='10' fill='#1e293b'>${escapeXml(obs)}</text>
    `;
    obsY += 20;
  });

  return `
<svg width='800' height='1140' xmlns='http://www.w3.org/2000/svg'>
  <!-- Background Sheet -->
  <rect width='800' height='1140' fill='#ffffff'/>
  <rect x='15' y='15' width='770' height='1110' rx='8' fill='#ffffff' stroke='#cbd5e1' stroke-width='1.5'/>

  <!-- Header Banner -->
  <rect x='25' y='25' width='750' height='80' rx='6' fill='${primaryLight}' stroke='${primaryBorder}' stroke-width='1'/>
  
  <circle cx='65' cy='65' r='24' fill='${primaryTheme}'/>
  <path d='M53 65 A 12 12 0 0 1 77 65 M50 60 A 18 18 0 0 1 80 60 M47 55 A 24 24 0 0 1 83 55' stroke='#ffffff' stroke-width='2.5' fill='none' stroke-linecap='round'/>
  
  <text x='105' y='55' font-family='Arial, sans-serif' font-size='16' font-weight='bold' fill='${primaryTheme}'>${escapeXml(data.centerInfo.name)}</text>
  <text x='105' y='73' font-family='Arial, sans-serif' font-size='10' font-weight='500' fill='#64748b'>${escapeXml(data.centerInfo.sub)} | AERB Certified Radiodiagnosis Facility</text>
  <text x='105' y='88' font-family='Arial, sans-serif' font-size='9' fill='#94a3b8'>High-Resolution B-Mode, Color &amp; Spectral Doppler | AI Screening Interface Integrated</text>

  <!-- Modality Pill -->
  <rect x='520' y='42' width='235' height='32' rx='6' fill='${badgeBg}' stroke='${primaryBorder}' stroke-width='1'/>
  <text x='637' y='63' font-family='Arial, sans-serif' font-size='11' font-weight='bold' fill='${badgeText}' text-anchor='middle'>${escapeXml(data.categoryLabel)}</text>

  <!-- Patient Demographics Card -->
  <rect x='40' y='115' width='720' height='100' rx='6' fill='#f8fafc' stroke='#e2e8f0' stroke-width='1'/>
  
  <text x='55' y='136' font-family='Arial, sans-serif' font-size='10' font-weight='bold' fill='#64748b'>PATIENT NAME:</text>
  <text x='155' y='136' font-family='Arial, sans-serif' font-size='12' font-weight='bold' fill='#0f172a'>${escapeXml(data.patientName)}</text>

  <text x='350' y='136' font-family='Arial, sans-serif' font-size='10' font-weight='bold' fill='#64748b'>AGE / GENDER:</text>
  <text x='440' y='136' font-family='Arial, sans-serif' font-size='11' font-weight='bold' fill='#0f172a'>${data.patientAge} Y / ${data.patientGender}</text>

  <text x='55' y='160' font-family='Arial, sans-serif' font-size='10' font-weight='bold' fill='#64748b'>UHID / SCAN ID:</text>
  <text x='155' y='160' font-family='monospace' font-size='11' font-weight='600' fill='${primaryTheme}'>${escapeXml(data.uhid)}</text>

  <text x='350' y='160' font-family='Arial, sans-serif' font-size='10' font-weight='bold' fill='#64748b'>MODALITY:</text>
  <text x='440' y='160' font-family='monospace' font-size='11' font-weight='bold' fill='#0f172a'>${isThyroid ? 'THYROID US' : 'OVARIAN US'}</text>

  <text x='55' y='184' font-family='Arial, sans-serif' font-size='10' font-weight='bold' fill='#64748b'>REFERRED BY:</text>
  <text x='155' y='184' font-family='Arial, sans-serif' font-size='10.5' fill='#334155'>${escapeXml(data.doctor)}</text>

  <text x='350' y='184' font-family='Arial, sans-serif' font-size='10' font-weight='bold' fill='#64748b'>SCAN DATE:</text>
  <text x='440' y='184' font-family='Arial, sans-serif' font-size='10.5' fill='#334155'>${escapeXml(data.scanDate)} (FINAL)</text>

  <text x='55' y='204' font-family='Arial, sans-serif' font-size='9.5' font-weight='bold' fill='#64748b'>CLINICAL INDICATION:</text>
  <text x='185' y='204' font-family='Arial, sans-serif' font-size='10' fill='#0f172a'>${escapeXml(data.indication)}</text>

  <!-- Section Title: Real-time Sonogram -->
  <text x='40' y='245' font-family='Arial, sans-serif' font-size='12' font-weight='bold' fill='${primaryTheme}'>HIGH-RESOLUTION B-MODE ULTRASOUND ACQUISITION</text>
  <line x1='40' y1='250' x2='760' y2='250' stroke='${primaryTheme}' stroke-width='1.5'/>

  <!-- Render The Visual Sonogram -->
  ${generateSonogramSVG(data)}

  <!-- Section Title: Diagnostic Findings & Organ Measurements -->
  <text x='40' y='558' font-family='Arial, sans-serif' font-size='12' font-weight='bold' fill='${primaryTheme}'>SONOGRAPHIC MEASUREMENTS &amp; DETAILED OBSERVATIONS</text>
  <line x1='40' y1='562' x2='760' y2='562' stroke='${primaryTheme}' stroke-width='1.5'/>

  <!-- Measurements Table (Left Column) -->
  ${measurementsRows}

  <!-- Diagnostic Observations (Right Column) -->
  <rect x='400' y='565' width='360' height='145' rx='4' fill='#f8fafc' stroke='#e2e8f0' stroke-width='1'/>
  <text x='415' y='582' font-family='Arial, sans-serif' font-size='10.5' font-weight='bold' fill='${primaryTheme}'>SONOGRAPHIC DESCRIPTIVE FINDINGS:</text>
  <g transform='translate(0, 15)'>
    ${obsItems}
  </g>

  <!-- Classification Highlight Box (TI-RADS or Rotterdam Criteria) -->
  <rect x='40' y='720' width='720' height='42' rx='6' fill='${badgeBg}' stroke='${primaryBorder}' stroke-width='1.2'/>
  <text x='55' y='746' font-family='Arial, sans-serif' font-size='11' font-weight='bold' fill='${badgeText}'>
    ${isThyroid ? 'ACR TI-RADS CLASSIFICATION:' : 'ROTTERDAM ULTRASOUND CRITERIA EVALUATION:'}
  </text>
  <text x='350' y='746' font-family='monospace' font-size='12' font-weight='bold' fill='${badgeText}'>
    ${escapeXml(data.findings.tiradsOrRotterdam)}
  </text>

  <!-- Radiologist Impression Box -->
  <rect x='40' y='775' width='720' height='175' rx='6' fill='${primaryLight}' stroke='${primaryBorder}' stroke-width='1.2'/>
  <text x='55' y='798' font-family='Arial, sans-serif' font-size='11' font-weight='bold' fill='${primaryTheme}'>RADIOLOGIST CONCLUSION &amp; CLINICAL IMPRESSION:</text>
  
  <text x='55' y='824' font-family='Arial, sans-serif' font-size='11' font-weight='bold' fill='#0f172a'>
    ${escapeXml(data.impression)}
  </text>
  
  <text x='55' y='850' font-family='Arial, sans-serif' font-size='10' font-weight='600' fill='#475569'>
    RECOMMENDATION / NEXT STEPS:
  </text>
  <text x='55' y='868' font-family='Arial, sans-serif' font-size='10' fill='#334155'>
    ${escapeXml(data.recommendation)}
  </text>

  <text x='55' y='895' font-family='Arial, sans-serif' font-size='9' fill='#64748b'>
    Color Doppler Evaluation: ${escapeXml(data.findings.doppler)}
  </text>
  <text x='55' y='915' font-family='Arial, sans-serif' font-size='9' font-style='italic' fill='#94a3b8'>
    Note: Ultrasound findings should be correlated with clinical hormonal parameters (TSH, FT4 / LH, FSH, Testosterone) and clinical symptoms.
  </text>

  <!-- Signatures Footer -->
  <line x1='40' y1='965' x2='760' y2='965' stroke='#e2e8f0' stroke-width='1'/>
  
  <g transform='translate(60, 980)'>
    <path d='M10 18 Q 30 2 60 16 T 110 12' stroke='${primaryTheme}' stroke-width='2' fill='none'/>
    <text x='0' y='32' font-family='Arial, sans-serif' font-size='10' font-weight='bold' fill='#1e293b'>Dr. Shalini Mukherjee, MD</text>
    <text x='0' y='44' font-family='Arial, sans-serif' font-size='9' fill='#64748b'>Consultant Radiologist &amp; Sonologist</text>
  </g>

  <g transform='translate(540, 980)'>
    <circle cx='95' cy='18' r='18' fill='none' stroke='#b91c1c' stroke-width='1.5' stroke-dasharray='3 2'/>
    <text x='95' y='21' font-family='Arial, sans-serif' font-size='7.5' font-weight='bold' fill='#b91c1c' text-anchor='middle'>VERIFIED</text>
    <text x='0' y='32' font-family='Arial, sans-serif' font-size='10' font-weight='bold' fill='#1e293b'>Dr. Arvind Venkatesh, MD, FICR</text>
    <text x='0' y='44' font-family='Arial, sans-serif' font-size='9' fill='#64748b'>Head of Diagnostic Radiology</text>
  </g>

  <rect x='25' y='1105' width='750' height='20' fill='#f1f5f9'/>
  <text x='400' y='1118' font-family='Arial, sans-serif' font-size='8' fill='#94a3b8' text-anchor='middle'>
    *** END OF ULTRASOUND REPORT — RADIOLOGY ACCREDITED SUITE — CASE ID: ${data.uhid} ***
  </text>
</svg>
`;
}

// -------------------------------------------------------------
// Generate 20 Distinct Thyroid US Cases
// -------------------------------------------------------------
function generateThyroidUSDataset(): UltrasoundReportData[] {
  const reports: UltrasoundReportData[] = [];

  for (let i = 1; i <= 20; i++) {
    const pName = `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`;
    const age = randInt(22, 62);
    const uhid = `US-THY-${String(i).padStart(3, '0')}`;
    const scanId = `IMG-TUS-${randInt(10000, 99999)}`;
    const center = IMAGING_CENTERS[(i - 1) % IMAGING_CENTERS.length];
    const doc = RADIOLOGISTS[(i - 1) % RADIOLOGISTS.length];
    const date = new Date(2026, randInt(0, 9), randInt(1, 28)).toISOString().split('T')[0];

    let category = '';
    let indication = '';
    let measurements: { label: string; value: string }[] = [];
    let observations: string[] = [];
    let tirads = '';
    let doppler = '';
    let impression = '';
    let recommendation = '';
    let sonogramData: UltrasoundReportData['sonogramData'] = {
      probe: 'ML6-15-D Linear',
      freq: '12.0 MHz',
      depth: '4.0 cm',
      gain: '52 dB',
      type: 'thyroid',
      variant: 'normal'
    };

    if (i <= 4) {
      category = 'Thyroid US - Normal Sonogram';
      indication = 'Routine endocrine wellness screening; mild cervical discomfort.';
      measurements = [
        { label: 'Right Lobe (L × W × AP)', value: '4.2 × 1.6 × 1.4 cm' },
        { label: 'Right Lobe Volume', value: '4.9 mL (Normal: 4-8 mL)' },
        { label: 'Left Lobe (L × W × AP)', value: '4.0 × 1.5 × 1.3 cm' },
        { label: 'Left Lobe Volume', value: '4.1 mL (Normal: 4-8 mL)' },
        { label: 'Isthmus Thickness', value: '2.8 mm (Normal < 4 mm)' },
        { label: 'Total Thyroid Volume', value: '9.0 mL (Normal)' }
      ];
      observations = [
        'Normal bilateral thyroid lobe size and contours.',
        'Homogeneous, fine-grained parenchymal echotexture.',
        'No focal solid, cystic or calcified nodules identified.',
        'No cervical lymphadenopathy or tracheal compression.'
      ];
      tirads = 'ACR TI-RADS 1 (Benign / Normal Examination)';
      doppler = 'Normal symmetric vascular flow without hypervascularity.';
      impression = 'Normal thyroid ultrasound. Bilateral lobes and isthmus demonstrate normal volume, contour, and homogeneous echotexture.';
      recommendation = 'Routine annual clinical follow-up; no radiological intervention required.';
      sonogramData.variant = 'normal';
    } else if (i <= 8) {
      category = 'Thyroid US - Autoimmune / Hashimoto’s Pattern';
      indication = 'Elevated serum TSH and Anti-TPO antibodies; suspected chronic thyroiditis.';
      const rVol = rand(6.8, 12.5, 1);
      const lVol = rand(6.2, 11.8, 1);
      measurements = [
        { label: 'Right Lobe (L × W × AP)', value: `4.8 × 2.1 × 1.9 cm` },
        { label: 'Right Lobe Volume', value: `${rVol} mL (Mildly enlarged)` },
        { label: 'Left Lobe (L × W × AP)', value: `4.6 × 2.0 × 1.8 cm` },
        { label: 'Left Lobe Volume', value: `${lVol} mL (Mildly enlarged)` },
        { label: 'Isthmus Thickness', value: '4.8 mm (Thickened)' },
        { label: 'Total Thyroid Volume', value: `${(rVol + lVol).toFixed(1)} mL (Enlarged)` }
      ];
      observations = [
        'Diffuse parenchymal heterogeneity with coarse echotexture.',
        'Widespread ill-defined hypoechoic micronodules (1-3 mm).',
        'Fine echogenic fibrous bands coursing through the gland.',
        'Prominent subcentimeter reactive level II-III cervical nodes.'
      ];
      tirads = 'ACR TI-RADS 2 (Diffuse Autoimmune Thyroiditis / Benign)';
      doppler = 'Color Doppler demonstrates diffuse parenchymal hypervascularity ("Thyroid Inferno" sign).';
      impression = 'Findings classic for Chronic Autoimmune (Hashimoto’s) Thyroiditis with diffuse parenchymal heterogeneity and reactive lymphadenopathy.';
      recommendation = 'Correlate with thyroid hormone panel (TSH, FT4, Anti-TPO); medical endocrine management.';
      sonogramData.variant = 'hashimoto';
    } else if (i <= 12) {
      category = 'Thyroid US - Benign Colloid Cystic Nodule';
      indication = 'Palpable fullness right lower neck; asymptomatic.';
      const noduleSize = `${rand(12, 18, 1)} × ${rand(10, 14, 1)} mm`;
      measurements = [
        { label: 'Right Lobe (L × W × AP)', value: '4.9 × 2.3 × 1.9 cm' },
        { label: 'Right Lobe Volume', value: '11.2 mL' },
        { label: 'Left Lobe (L × W × AP)', value: '4.1 × 1.6 × 1.4 cm' },
        { label: 'Left Lobe Volume', value: '4.8 mL' },
        { label: 'Dominant Nodule Size', value: `${noduleSize} (Right Mid-Lobe)` },
        { label: 'Nodule Composition', value: 'Spongiform / Mixed Cystic' }
      ];
      observations = [
        `Well-circumscribed mixed cystic-solid nodule in right mid-lobe (${noduleSize}).`,
        'Spongiform architecture (>50% microcystic spaces) with comet-tail artifacts.',
        'Anechoic cystic areas with thin hyperechoic septations.',
        'Wider-than-tall orientation; smooth continuous margins without calcification.'
      ];
      tirads = 'ACR TI-RADS 2 (Benign Nodule, 0 points)';
      doppler = 'Peripheral vascularity with absence of internal aberrant flow.';
      impression = `Benign-appearing spongiform colloid nodule in right thyroid lobe (${noduleSize}). Low risk of malignancy (< 2%).`;
      recommendation = 'Periodic ultrasound surveillance at 12–24 months. Biopsy (FNAC) not indicated.';
      sonogramData.variant = 'colloid_nodule';
      sonogramData.noduleSize = noduleSize;
    } else if (i <= 16) {
      category = 'Thyroid US - Suspicious Solid Nodule (TI-RADS 4)';
      indication = 'Firm solitary nodule palpated in right thyroid lobe on routine physical exam.';
      const noduleSize = `${rand(16, 24, 1)} × ${rand(12, 18, 1)} mm`;
      measurements = [
        { label: 'Right Lobe (L × W × AP)', value: '5.2 × 2.4 × 2.1 cm' },
        { label: 'Right Lobe Volume', value: '13.6 mL (Enlarged)' },
        { label: 'Left Lobe (L × W × AP)', value: '4.2 × 1.7 × 1.4 cm' },
        { label: 'Left Lobe Volume', value: '5.2 mL' },
        { label: 'Suspicious Nodule Size', value: `${noduleSize} (Right Lobe)` },
        { label: 'Nodule Features', value: 'Solid, Hypoechoic, Microcalcifications' }
      ];
      observations = [
        `Solitary solid distinctly hypoechoic nodule (${noduleSize}) in right mid-to-lower pole.`,
        'Irregular / microlobulated margins with focal disruption of thin halo.',
        'Presence of internal punctate echogenic foci (suspicious microcalcifications).',
        'Taller-than-wide dimension on transverse axis (ratio > 1.0).'
      ];
      tirads = 'ACR TI-RADS 4 (Moderately Suspicious - 6 Points)';
      doppler = 'Chaotic internal and central neo-vascularization on Power Doppler.';
      impression = `Suspicious solid hypoechoic solitary thyroid nodule (${noduleSize}) classified as ACR TI-RADS 4. Estimated malignancy risk: 15–20%.`;
      recommendation = 'Fine Needle Aspiration Cytology (FNAC) recommended for histopathological confirmation.';
      sonogramData.variant = 'tirads4_nodule';
      sonogramData.noduleSize = noduleSize;
    } else {
      category = 'Thyroid US - Multinodular Goiter (MNG)';
      indication = 'Progressive neck swelling, sensation of tightness during swallowing.';
      measurements = [
        { label: 'Right Lobe (L × W × AP)', value: '5.8 × 2.8 × 2.6 cm' },
        { label: 'Right Lobe Volume', value: '22.0 mL (Significantly enlarged)' },
        { label: 'Left Lobe (L × W × AP)', value: '5.4 × 2.6 × 2.3 cm' },
        { label: 'Left Lobe Volume', value: '16.8 mL (Enlarged)' },
        { label: 'Isthmus Thickness', value: '5.6 mm (Enlarged)' },
        { label: 'Total Thyroid Volume', value: '38.8 mL (Thyromegaly / Goiter)' }
      ];
      observations = [
        'Bilateral asymmetric thyroid enlargement with multinodular distortion.',
        'Right lobe displays 3 distinct nodules: dominant 2.2 cm isoechoic nodule with peripheral halo.',
        'Left lobe displays multiple subcentimeter colloid cysts and mixed nodules.',
        'No evidence of retrosternal extension or tracheal lumen stenosis.'
      ];
      tirads = 'ACR TI-RADS 3 (Multinodular Goiter - Mildly Suspicious)';
      doppler = 'Bilateral moderate parenchymal vascularity with normal arterial spectral velocities.';
      impression = 'Multinodular Goiter (MNG) with significant thyromegaly. Dominant right lobe nodule shows benign sonographic characteristics.';
      recommendation = 'Follow-up ultrasound in 12 months. Correlate with TSH to exclude toxic multinodular goiter.';
      sonogramData.variant = 'multinodular';
      sonogramData.noduleSize = '22.4 mm';
    }

    reports.push({
      id: uhid,
      index: i,
      type: 'thyroid_us',
      title: `Thyroid Ultrasound Examination Report #${i}`,
      patientName: pName,
      patientAge: age,
      patientGender: 'Female',
      uhid,
      scanId,
      doctor: doc,
      scanDate: date,
      centerInfo: center,
      categoryLabel: category,
      indication,
      findings: {
        measurements,
        observations,
        tiradsOrRotterdam: tirads,
        doppler
      },
      impression,
      recommendation,
      sonogramData
    });
  }

  return reports;
}

// -------------------------------------------------------------
// Generate 20 Distinct Ovarian US Cases
// -------------------------------------------------------------
function generateOvarianUSDataset(): UltrasoundReportData[] {
  const reports: UltrasoundReportData[] = [];

  for (let i = 1; i <= 20; i++) {
    const pName = `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`;
    const age = randInt(18, 36);
    const uhid = `US-OVA-${String(i).padStart(3, '0')}`;
    const scanId = `IMG-OUS-${randInt(10000, 99999)}`;
    const center = IMAGING_CENTERS[(i - 1) % IMAGING_CENTERS.length];
    const doc = RADIOLOGISTS[(i - 1) % RADIOLOGISTS.length];
    const date = new Date(2026, randInt(0, 9), randInt(1, 28)).toISOString().split('T')[0];

    let category = '';
    let indication = '';
    let measurements: { label: string; value: string }[] = [];
    let observations: string[] = [];
    let rotterdam = '';
    let doppler = '';
    let impression = '';
    let recommendation = '';
    let sonogramData: UltrasoundReportData['sonogramData'] = {
      probe: 'IC5-9-D Endovaginal',
      freq: '7.5 MHz',
      depth: '7.0 cm',
      gain: '54 dB',
      type: 'ovary',
      variant: 'pcom',
      follicleCount: 22
    };

    if (i <= 4) {
      category = 'Ovarian US - Normal Pelvic Sonogram';
      indication = 'Pelvic pain workup; regular 28-day menstrual cycles.';
      measurements = [
        { label: 'Uterus (L × AP × W)', value: '7.2 × 3.8 × 4.4 cm (Anteverted)' },
        { label: 'Endometrial Thickness', value: '7.2 mm (Proliferative phase)' },
        { label: 'Right Ovary (L × W × AP)', value: '3.1 × 2.0 × 1.8 cm' },
        { label: 'Right Ovary Volume', value: '5.8 mL (Normal: < 10 mL)' },
        { label: 'Left Ovary (L × W × AP)', value: '2.9 × 1.9 × 1.7 cm' },
        { label: 'Left Ovary Volume', value: '4.9 mL (Normal: < 10 mL)' },
        { label: 'Antral Follicle Count', value: 'Right: 6 | Left: 5 follicles (Normal)' }
      ];
      observations = [
        'Normal uterine contour and myometrial echogenicity without focal fibroids.',
        'Normal bilateral ovarian morphology with physiological follicle development.',
        'Dominant follicle observed in right ovary measuring 14.2 mm.',
        'No peripheral follicular crowding; normal central stromal echogenicity.',
        'Free fluid in Pouch of Douglas (POD): Absent.'
      ];
      rotterdam = 'Rotterdam Ultrasound Criteria: NEGATIVE for PCOM';
      doppler = 'Normal low-resistance ovarian stromal vascular flow with normal Resistive Index (RI: 0.62).';
      impression = 'Normal pelvic and ovarian ultrasound. Bilateral ovaries demonstrate physiological follicular maturation without polycystic morphology.';
      recommendation = 'Routine gynecological care. Reassure patient regarding normal ovarian reserve and architecture.';
      sonogramData.variant = 'normal';
      sonogramData.follicleCount = 6;
    } else if (i <= 10) {
      category = 'Ovarian US - Classic Polycystic Ovaries (PCOM)';
      indication = 'Oligomenorrhea (cycles 45-75 days), facial hirsutism, infertility evaluation.';
      const rVol = rand(13.2, 17.8, 1);
      const lVol = rand(12.4, 16.5, 1);
      const rAfc = randInt(22, 28);
      const lAfc = randInt(20, 26);

      measurements = [
        { label: 'Uterus (L × AP × W)', value: '6.8 × 3.4 × 4.0 cm (Anteverted)' },
        { label: 'Endometrial Thickness', value: '8.4 mm' },
        { label: 'Right Ovary (L × W × AP)', value: '4.4 × 3.1 × 2.5 cm' },
        { label: 'Right Ovary Volume', value: `${rVol} mL (Significantly enlarged > 10mL)` },
        { label: 'Left Ovary (L × W × AP)', value: '4.1 × 2.9 × 2.4 cm' },
        { label: 'Left Ovary Volume', value: `${lVol} mL (Enlarged > 10mL)` },
        { label: 'Antral Follicle Count', value: `Right: ${rAfc} | Left: ${lAfc} (Markedly elevated)` }
      ];
      observations = [
        `Bilateral ovarian enlargement with dense central hyperechoic stroma (Stroma/Area > 0.38).`,
        `Multiple subcentimeter microcysts (2-8 mm) arranged around the periphery in a classic "necklace / string of pearls" sign.`,
        `Right ovary demonstrates ${rAfc} peripheral follicles; Left ovary demonstrates ${lAfc} follicles.`,
        'Total absence of a dominant follicle (>10 mm), consistent with chronic anovulation.',
        'No ovarian cyst > 20 mm, endometrioma, or adnexal mass identified.'
      ];
      rotterdam = 'Rotterdam Ultrasound Criteria: POSITIVE for PCOM (Bilateral)';
      doppler = 'Color Doppler reveals prominent central stromal hypervascularity with low impedance flow.';
      impression = `Classic Bilateral Polycystic Ovarian Morphology (PCOM) meeting Rotterdam International Consensus Criteria. Significant bilateral ovarian enlargement (Vol: ${rVol} mL / ${lVol} mL) and dense stromal hyperplasia.`;
      recommendation = 'Correlate with hormonal panel (LH/FSH ratio, Total & Free Testosterone, DHEAS) and metabolic screening (fasting insulin, glucose).';
      sonogramData.variant = 'pcom_classic';
      sonogramData.follicleCount = rAfc;
    } else if (i <= 14) {
      category = 'Ovarian US - Moderate Polycystic Morphology';
      indication = 'Irregular cycles, acne, weight gain; suspected mild PCOS.';
      const rVol = rand(10.5, 12.8, 1);
      const lVol = rand(9.8, 11.5, 1);
      const rAfc = randInt(14, 18);
      const lAfc = randInt(13, 17);

      measurements = [
        { label: 'Uterus (L × AP × W)', value: '6.9 × 3.5 × 4.1 cm' },
        { label: 'Endometrial Thickness', value: '6.5 mm' },
        { label: 'Right Ovary (L × W × AP)', value: '3.8 × 2.6 × 2.2 cm' },
        { label: 'Right Ovary Volume', value: `${rVol} mL (Upper limit / Enlarged)` },
        { label: 'Left Ovary (L × W × AP)', value: '3.6 × 2.4 × 2.1 cm' },
        { label: 'Left Ovary Volume', value: `${lVol} mL (Borderline)` },
        { label: 'Antral Follicle Count', value: `Right: ${rAfc} | Left: ${lAfc} follicles` }
      ];
      observations = [
        'Moderate bilateral ovarian enlargement with increased stromal echogenicity.',
        'Peripherally distributed follicles measuring 3-7 mm without dominant follicle.',
        'Right ovary displays 16 follicles; left ovary displays 14 follicles.',
        'Endometrium is regular with uniform echotexture; POD is clear.'
      ];
      rotterdam = 'Rotterdam Ultrasound Criteria: POSITIVE for PCOM';
      doppler = 'Moderate stromal Doppler signals with normal spectral resistance.';
      impression = `Moderate Polycystic Ovarian Morphology (PCOM) on transvaginal sonography. Ovarian volumes and follicular counts align with Rotterdam diagnostic threshold.`;
      recommendation = 'Lifestyle modification, dietary counseling, and clinical correlation with endocrine markers.';
      sonogramData.variant = 'pcom_moderate';
      sonogramData.follicleCount = rAfc;
    } else if (i <= 17) {
      category = 'Ovarian US - Asymmetric PCOM with Normal Contralateral Ovary';
      indication = 'Menstrual irregularities; secondary amenorrhea for 3 months.';
      measurements = [
        { label: 'Uterus (L × AP × W)', value: '7.0 × 3.6 × 4.2 cm' },
        { label: 'Endometrial Thickness', value: '5.8 mm' },
        { label: 'Right Ovary (L × W × AP)', value: '4.2 × 2.9 × 2.3 cm' },
        { label: 'Right Ovary Volume', value: '14.6 mL (Enlarged > 10 mL)' },
        { label: 'Left Ovary (L × W × AP)', value: '3.0 × 2.1 × 1.8 cm' },
        { label: 'Left Ovary Volume', value: '5.9 mL (Normal size)' },
        { label: 'Antral Follicle Count', value: 'Right: 21 follicles (PCOM) | Left: 8 follicles (Normal)' }
      ];
      observations = [
        'Asymmetric ovarian findings: Right ovary significantly enlarged (14.6 mL) with peripheral follicular ring (21 follicles).',
        'Left ovary exhibits normal size and volume (5.9 mL) with normal follicular distribution.',
        'Dense hyperechoic central stroma restricted primarily to right ovary.',
        'No ovarian torsion or adnexal mass.'
      ];
      rotterdam = 'Rotterdam Ultrasound Criteria: POSITIVE for PCOM (Unilateral Right Ovary)';
      doppler = 'Right ovarian stromal hypervascularity; normal arterial resistive indices bilaterally.';
      impression = 'Unilateral Right Polycystic Ovarian Morphology. Meets Rotterdam criteria based on single-ovary criterion (>20 follicles, volume >10 mL).';
      recommendation = 'Endocrine workup including serum androgens and repeat ultrasound in 6 months.';
      sonogramData.variant = 'pcom_unilateral';
      sonogramData.follicleCount = 21;
    } else {
      category = 'Ovarian US - PCOM with Co-existing Dominant / Functional Follicle';
      indication = 'Irregular spotting, mid-cycle pelvic discomfort.';
      measurements = [
        { label: 'Uterus (L × AP × W)', value: '7.4 × 3.9 × 4.5 cm' },
        { label: 'Endometrial Thickness', value: '9.2 mm (Late proliferative)' },
        { label: 'Right Ovary (L × W × AP)', value: '4.3 × 3.0 × 2.4 cm' },
        { label: 'Right Ovary Volume', value: '16.1 mL (Enlarged)' },
        { label: 'Left Ovary (L × W × AP)', value: '3.9 × 2.7 × 2.2 cm' },
        { label: 'Left Ovary Volume', value: '12.1 mL (Enlarged)' },
        { label: 'Dominant Follicle', value: '19.5 mm in Right Ovary' },
        { label: 'Background Follicles', value: 'Right: 18 | Left: 19 peripheral microcysts' }
      ];
      observations = [
        'Underlying bilateral polycystic ovarian morphology with prominent central stroma.',
        'Right ovary demonstrates a co-existing single dominant mature follicle measuring 19.5 mm.',
        'Surrounding background shows 18 small subcentimeter follicles in string-of-pearls formation.',
        'Left ovary shows 19 follicles with typical PCOM pattern.',
        'Minimal physiological fluid in Pouch of Douglas.'
      ];
      rotterdam = 'Rotterdam Ultrasound Criteria: POSITIVE for PCOM (with Active Ovulation)';
      doppler = 'Ring of fire vascularity around dominant follicle; elevated background stromal vascularity.';
      impression = 'Polycystic Ovarian Morphology with evidence of spontaneous follicular maturation/ovulation (19.5 mm mature follicle). Corresponds to Ovulatory PCOS (Phenotype C).';
      recommendation = 'Monitor cycle completion. Follow-up ultrasound post-menstruation if cyst persists.';
      sonogramData.variant = 'pcom_ovulatory';
      sonogramData.follicleCount = 18;
    }

    reports.push({
      id: uhid,
      index: i,
      type: 'ovarian_us',
      title: `Ovarian Pelvic Ultrasound Report #${i}`,
      patientName: pName,
      patientAge: age,
      patientGender: 'Female',
      uhid,
      scanId,
      doctor: doc,
      scanDate: date,
      centerInfo: center,
      categoryLabel: category,
      indication,
      findings: {
        measurements,
        observations,
        tiradsOrRotterdam: rotterdam,
        doppler
      },
      impression,
      recommendation,
      sonogramData
    });
  }

  return reports;
}

// -------------------------------------------------------------
// Execution: Render All 40 Ultrasound Reports & Sync to DB
// -------------------------------------------------------------
async function run() {
  console.log('Generating 20 Thyroid US and 20 Ovarian US report images...');
  
  const thyroidUsReports = generateThyroidUSDataset();
  const ovarianUsReports = generateOvarianUSDataset();
  const allUsReports = [...thyroidUsReports, ...ovarianUsReports];

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
    measurements: Record<string, string>;
    clinicalImpression: string;
  }> = [];

  let count = 0;

  for (const report of allUsReports) {
    const isThyroid = report.type === 'thyroid_us';
    const folderSub = isThyroid ? 'thyroid_us' : 'ovarian_us';
    const fileName = `${report.type}_${String(report.index).padStart(2, '0')}.png`;

    const svgContent = createUltrasoundReportSVG(report);
    const pngBuffer = await sharp(Buffer.from(svgContent), { density: 150 })
      .png({ quality: 95 })
      .toBuffer();

    const pubPath = path.resolve(`public/dataset/${folderSub}/${fileName}`);
    const dataPath = path.resolve(`dataset/${folderSub}/${fileName}`);

    fs.writeFileSync(pubPath, pngBuffer);
    fs.writeFileSync(dataPath, pngBuffer);

    const measMap: Record<string, string> = {};
    report.findings.measurements.forEach(m => { measMap[m.label] = m.value; });

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
      measurements: measMap,
      clinicalImpression: report.impression
    });

    count++;
    if (count % 10 === 0) {
      console.log(`Rendered ${count}/40 ultrasound report images...`);
    }
  }

  // Update master dataset index
  let existingManifest: any[] = [];
  try {
    if (fs.existsSync('dataset/dataset_index.json')) {
      existingManifest = JSON.parse(fs.readFileSync('dataset/dataset_index.json', 'utf8'));
    }
  } catch (e) {
    existingManifest = [];
  }

  // Merge avoiding duplicates
  const mergedManifest = [
    ...existingManifest.filter((item: any) => !item.type.includes('_us')),
    ...datasetManifest
  ];

  fs.writeFileSync('dataset/dataset_index.json', JSON.stringify(mergedManifest, null, 2));
  fs.writeFileSync('public/dataset/dataset_index.json', JSON.stringify(mergedManifest, null, 2));
  console.log(`Updated dataset_index.json with ${mergedManifest.length} total dataset records!`);

  // Insert all 40 ultrasound patients & reports into database custom.db
  console.log('Syncing all 40 ultrasound patients & reports into database custom.db...');

  for (const r of allUsReports) {
    const isThyroid = r.type === 'thyroid_us';
    const folderSub = isThyroid ? 'thyroid_us' : 'ovarian_us';
    const pubImg = `/dataset/${folderSub}/${r.type}_${String(r.index).padStart(2, '0')}.png`;

    // Extract follicle count or thyroid volume if present
    const follicleCount = r.sonogramData.follicleCount;

    // Create Patient record
    const patient = await db.patient.create({
      data: {
        name: r.patientName,
        age: r.patientAge,
        gender: r.patientGender,
        medicalHistory: `Ultrasound examination for ${r.categoryLabel}. Indication: ${r.indication}`,
        notes: `Ultrasound patient. Assigned Scan UHID ${r.uhid}. ${r.findings.tiradsOrRotterdam}`,
        follicleCount: follicleCount,
        menstrualRegularity: isThyroid ? 'regular' : (follicleCount && follicleCount > 12 ? 'irregular' : 'regular'),
        hairGrowthPattern: isThyroid ? 'normal' : (follicleCount && follicleCount > 15 ? 'moderate_hirsutism' : 'normal'),
      }
    });

    // Create MedicalReport record
    const report = await db.medicalReport.create({
      data: {
        patientId: patient.id,
        reportType: isThyroid ? 'thyroid_ultrasound' : 'ovarian_ultrasound',
        fileName: `${r.type}_${String(r.index).padStart(2, '0')}.png`,
        fileType: 'image/png',
        fileData: pubImg,
        status: 'verified',
        ocrConfidence: 0.99,
        notes: `${r.impression} | ${r.findings.tiradsOrRotterdam}`,
        ocrExtracted: JSON.stringify(r.findings)
      }
    });

    // Insert measurements as LabValues for quantitative tracking
    for (const m of r.findings.measurements) {
      const numMatch = m.value.match(/([\d.]+)/);
      const numResult = numMatch ? parseFloat(numMatch[1]) : null;

      await db.labValue.create({
        data: {
          reportId: report.id,
          testName: m.label,
          result: numResult,
          resultText: m.value,
          unit: m.value.includes('mL') ? 'mL' : m.value.includes('mm') ? 'mm' : m.value.includes('cm') ? 'cm' : '',
          isAbnormal: m.value.toLowerCase().includes('enlarged') || m.value.toLowerCase().includes('suspicious') || (follicleCount != null && follicleCount > 12 && m.label.includes('Count')),
          isVerified: true,
          category: isThyroid ? 'thyroid' : 'hormone',
          notes: r.findings.tiradsOrRotterdam
        }
      });
    }
  }

  console.log('Database sync complete! 40 ultrasound patients, reports, and sonographic measurements added.');
}

run()
  .then(() => {
    console.log('ALL 20 THYROID US AND 20 OVARIAN US REPORT IMAGES SUCCESSFULLY GENERATED!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Error generating ultrasound dataset:', err);
    process.exit(1);
  });
