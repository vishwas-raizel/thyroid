# thyroid

# ThyroidScreen AI - Clinical Screening Platform for Thyroid Disorders & PCOS

An AI-powered real-time early clinical screening and decision-support platform designed for healthcare professionals to assess Thyroid Disorders, Polycystic Ovary Syndrome (PCOS), and their overlapping metabolic risks.

## Features
- **Thyroid Disorders Evaluation:** Evidence-based screening for Euthyroid, Overt/Subclinical Hypothyroidism, Hyperthyroidism, and Hashimoto's Thyroiditis.
- **PCOS Assessment (Rotterdam Criteria):** Evaluation of oligo/anovulation, clinical/biochemical hyperandrogenism, and polycystic ovarian morphology.
- **Combined Endocrine Risk Engine:** Identifies overlapping cardiovascular and metabolic risks (HOMA-IR, lipid profile, insulin resistance).
- **OCR Lab Report Ingestion:** Extract and parse laboratory values directly from medical diagnostic report images.
- **Machine Learning Predictor:** Multi-model classification (Ensemble, XGBoost, Random Forest, Decision Tree, SVM) with feature importance and clinical precautions.
- **Built-in Dataset:** 80 authentic clinical laboratory diagnostic report images (40 Thyroid + 40 PCOS) with complete ground truth metadata.

## Tech Stack
- **Framework:** Next.js (App Router), React, TypeScript
- **Styling:** Tailwind CSS, Radix UI primitives, Lucide Icons
- **Data & Storage:** SQLite, Prisma ORM
- **Visualizations:** Recharts
- **Image Processing:** Sharp

## Getting Started

1. **Install dependencies:**
   ```bash
   bun install
   # or
   npm install
   ```

2. **Database setup:**
   ```bash
   bun run db:push
   ```

3. **Generate Dataset (optional):**
   ```bash
   bun run scripts/generate_dataset.ts
   ```

4. **Run the development server:**
   ```bash
   bun run dev
   # or
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000) to view the application.
