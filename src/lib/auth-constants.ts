import type { AuthUser } from "./types";

export interface DemoUser extends AuthUser {
  passwordHint: string;
  badge: string;
}

export const DEMO_USERS: DemoUser[] = [
  {
    id: "usr_chen",
    name: "Dr. Sarah Chen, MD",
    email: "dr.chen@thyroidscreen.ai",
    role: "Chief Endocrinologist",
    department: "Division of Endocrinology & Metabolism",
    hospital: "St. Jude Metropolitan Health System",
    licenseNumber: "MD-END-88421",
    avatar: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=200",
    badge: "Lead Specialist",
    passwordHint: "clinic2026",
  },
  {
    id: "usr_vance",
    name: "Dr. Marcus Vance, MD, FACP",
    email: "dr.vance@thyroidscreen.ai",
    role: "Diagnostic Pathologist",
    department: "Biochemical & Hormonal Pathology",
    hospital: "Apex Diagnostic & Thyroid Institute",
    licenseNumber: "MD-PTH-40912",
    avatar: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=200",
    badge: "Lab Director",
    passwordHint: "clinic2026",
  },
  {
    id: "usr_patel",
    name: "Dr. Priya Patel, MBBS, DNB",
    email: "dr.patel@thyroidscreen.ai",
    role: "Reproductive Endocrinologist",
    department: "PCOS & Women's Hormonal Health",
    hospital: "Apollo Women's Endocrinology Center",
    licenseNumber: "MD-REP-77341",
    avatar: "https://images.unsplash.com/photo-1594824813626-d98c607ecbb9?auto=format&fit=crop&q=80&w=200",
    badge: "PCOS Lead",
    passwordHint: "clinic2026",
  },
];

export const CLINICAL_ROLES = [
  "Chief Endocrinologist",
  "Endocrinology Specialist",
  "Diagnostic Pathologist",
  "Reproductive Endocrinologist (PCOS)",
  "Consultant Gynecologist",
  "Clinical Biochemist",
  "General Physician",
  "Research Fellow",
];
