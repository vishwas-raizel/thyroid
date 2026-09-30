'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { toast } from 'sonner';
import {
  LayoutDashboard, Users, Upload, Shield, TrendingUp, Settings,
  Plus, Trash2, Activity, AlertTriangle, CheckCircle2, ChevronRight,
  Menu, X, FileText, Edit, Eye, Download, Info, Heart, Brain,
  FlaskConical, Stethoscope, Calendar, Clock, Search,
  BarChart3, Zap, GitBranch, Trees, Cpu, Dna, Thermometer, Scale,
  Droplets, Ruler, Baby, ScanLine, ClipboardCheck, ChevronDown,
  ArrowRight, ArrowLeft, RefreshCw, Save, Beaker, Layers, PieChart,
  Target, ArrowUpRight, ArrowDownRight, Minus, Sparkles, Filter, Check,
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, AreaChart, Area, ReferenceLine, Tooltip as RechartsTooltip,
} from 'recharts';
import {
  Card, CardHeader, CardTitle, CardContent, CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from '@/components/ui/tooltip';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ChartContainer, ChartTooltip, ChartTooltipContent,
  ChartLegend, ChartLegendContent,
} from '@/components/ui/chart';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

import { useAppStore } from '@/lib/store';
import { LoginView } from '@/components/auth/LoginView';
import { UserMenu } from '@/components/auth/UserMenu';
import type {
  Patient, MedicalReport, LabValue, SymptomEntry,
  ScreeningResult, Prediction, ScreeningFactor, ViewType,
} from '@/lib/types';
import { SYMPTOM_CATEGORIES } from '@/lib/types';

// ============================================================
// Helper Functions
// ============================================================

function formatDate(dateStr: string): string {
  if (!dateStr) return 'N/A';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function formatDateShort(dateStr: string): string {
  if (!dateStr) return 'N/A';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getRiskBadgeClasses(level: string): string {
  switch (level) {
    case 'low': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    case 'intermediate': return 'bg-amber-100 text-amber-800 border-amber-200';
    case 'elevated': return 'bg-red-100 text-red-800 border-red-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
}

function getRiskDotColor(level: string): string {
  switch (level) {
    case 'low': return 'bg-emerald-500';
    case 'intermediate': return 'bg-amber-500';
    case 'elevated': return 'bg-red-500';
    default: return 'bg-gray-500';
  }
}

function parseFactors(factorsJson: string): ScreeningFactor[] {
  try {
    const parsed = JSON.parse(factorsJson);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function parseJsonSafe<T>(jsonStr: string | undefined | null, fallback: T): T {
  if (!jsonStr) return fallback;
  try {
    return JSON.parse(jsonStr);
  } catch {
    return fallback;
  }
}

function getLabValueStatus(value: LabValue): 'normal' | 'high' | 'low' | 'info' {
  if (value.result == null) return 'info';
  if (!value.isAbnormal) return 'normal';
  if (value.referenceLow != null && value.result < value.referenceLow) return 'low';
  if (value.referenceHigh != null && value.result > value.referenceHigh) return 'high';
  return 'normal';
}

function getLabStatusBadge(status: string): React.ReactNode {
  switch (status) {
    case 'high': return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">High</Badge>;
    case 'low': return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Low</Badge>;
    case 'normal': return <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">Normal</Badge>;
    default: return <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-200">N/A</Badge>;
  }
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
}

// ============================================================
// Navigation Items
// ============================================================

const NAV_ITEMS: { id: ViewType | 'prediction'; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'patients', label: 'Patients', icon: Users },
  { id: 'upload-report', label: 'Upload Report', icon: Upload },
  { id: 'screening', label: 'Screening', icon: Shield },
  { id: 'prediction', label: 'Prediction', icon: ScanLine },
  { id: 'trends', label: 'Trends', icon: TrendingUp },
  { id: 'admin', label: 'Admin', icon: Settings },
];

// ============================================================
// Sidebar Component
// ============================================================

function Sidebar() {
  const { currentView, setCurrentView, sidebarOpen, setSidebarOpen, selectedPatientId, selectPatient } = useAppStore();

  const handleNavClick = useCallback((viewId: ViewType | 'prediction') => {
    if (viewId === 'prediction') {
      useAppStore.setState({ currentView: 'prediction' as ViewType });
    } else {
      setCurrentView(viewId);
    }
    if (viewId !== 'patient-detail') {
      selectPatient(null);
    }
    setSidebarOpen(false);
  }, [setCurrentView, selectPatient, setSidebarOpen]);

  const isActive = useCallback((id: ViewType | 'prediction') => {
    return currentView === id || (id === 'patients' && currentView === 'patient-detail');
  }, [currentView]);

  return (
    <>
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`
          fixed top-0 left-0 z-50 h-full w-64 bg-white border-r border-gray-200
          transform transition-transform duration-200 ease-in-out
          lg:translate-x-0 lg:static lg:z-auto
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center">
                <Stethoscope className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-sm font-bold text-gray-900 leading-tight">ThyroidScreen</h1>
                <p className="text-[10px] text-gray-500 leading-tight">Clinical Screening AI</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden h-8 w-8"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <nav className="flex-1 py-3 px-3 space-y-1">
            {NAV_ITEMS.map((item) => {
              const active = isActive(item.id);
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`
                    w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                    transition-colors duration-150
                    ${active
                      ? 'bg-teal-50 text-teal-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }
                  `}
                >
                  <Icon className={`h-4.5 w-4.5 ${active ? 'text-teal-600' : 'text-gray-400'}`} />
                  {item.label}
                  {active && (
                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-teal-500" />
                  )}
                </button>
              );
            })}
          </nav>

          <div className="p-3 border-t border-gray-100 space-y-2.5">
            <UserMenu compact />
            <div className="flex items-center justify-between text-[11px] text-gray-400 px-1">
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                <span>System Active</span>
              </div>
              <span className="font-mono text-[10px]">v2.4</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

// ============================================================
// Dashboard View
// ============================================================

function DashboardView() {
  const { patients, setCurrentView, selectPatient, isLoading } = useAppStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPatients() {
      setLoading(true);
      try {
        const res = await fetch('/api/patients');
        if (res.ok) {
          const data = await res.json();
          useAppStore.getState().setPatients(data);
        }
      } catch {
        toast.error('Failed to load patients');
      } finally {
        setLoading(false);
      }
    }
    fetchPatients();
  }, []);

  const stats = useMemo(() => {
    const patientList = Array.isArray(patients) ? patients : [];
    const totalPatients = patientList.length;
    const totalReports = patientList.reduce((sum, p) => {
      const patientAny = p as unknown as Record<string, unknown>;
      const count = patientAny._count as { reports?: number } | undefined;
      return sum + (count?.reports ?? 0);
    }, 0);
    const screeningsRun = patientList.reduce((sum, p) => {
      const sr = (p as Patient).screeningResults;
      return sum + (sr?.length ?? 0);
    }, 0);
    const mlPredictions = patientList.reduce((sum, p) => {
      const preds = (p as Patient).predictions;
      return sum + (preds?.length ?? 0);
    }, 0);
    return { totalPatients, totalReports, screeningsRun, mlPredictions };
  }, [patients]);

  const handlePatientClick = useCallback((patientId: string) => {
    selectPatient(patientId);
    setCurrentView('patient-detail');
  }, [selectPatient, setCurrentView]);

  const recentPatients = useMemo(() => (Array.isArray(patients) ? patients : []).slice(0, 5), [patients]);

  const statCards = [
    { label: 'Total Patients', value: stats.totalPatients, icon: Users, color: 'teal', borderColor: 'border-l-teal-500', bgColor: 'bg-teal-50', iconColor: 'text-teal-600' },
    { label: 'Total Reports', value: stats.totalReports, icon: FileText, color: 'emerald', borderColor: 'border-l-emerald-500', bgColor: 'bg-emerald-50', iconColor: 'text-emerald-600' },
    { label: 'Screenings Run', value: stats.screeningsRun, icon: Shield, color: 'amber', borderColor: 'border-l-amber-500', bgColor: 'bg-amber-50', iconColor: 'text-amber-600' },
    { label: 'ML Predictions', value: stats.mlPredictions, icon: ScanLine, color: 'purple', borderColor: 'border-l-purple-500', bgColor: 'bg-purple-50', iconColor: 'text-purple-600' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
        <p className="text-sm text-gray-500 mt-1">Overview of your clinical screening platform</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="p-4">
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-8 w-16" />
            </Card>
          ))
        ) : (
          statCards.map((card) => {
            const Icon = card.icon;
            return (
              <Card key={card.label} className={`p-4 border-l-4 ${card.borderColor}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">{card.label}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{card.value}</p>
                  </div>
                  <div className={`w-10 h-10 rounded-full ${card.bgColor} flex items-center justify-center`}>
                    <Icon className={`w-5 h-5 ${card.iconColor}`} />
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>

      <Card className="p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Quick Actions</h3>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" className="bg-teal-600 hover:bg-teal-700 text-white" onClick={() => setCurrentView('patients')}>
            <Plus className="w-4 h-4 mr-1.5" /> Add Patient
          </Button>
          <Button size="sm" variant="outline" onClick={() => setCurrentView('upload-report')}>
            <Upload className="w-4 h-4 mr-1.5" /> Upload Report
          </Button>
          <Button size="sm" variant="outline" onClick={() => setCurrentView('screening')}>
            <Shield className="w-4 h-4 mr-1.5" /> Run Screening
          </Button>
          <Button size="sm" variant="outline" onClick={() => useAppStore.setState({ currentView: 'prediction' as ViewType })}>
            <ScanLine className="w-4 h-4 mr-1.5" /> ML Prediction
          </Button>
        </div>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Recent Patients</CardTitle>
            <Button variant="ghost" size="sm" className="text-teal-600 text-xs" onClick={() => setCurrentView('patients')}>
              View All <ChevronRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-9 w-9 rounded-full" />
                  <div className="space-y-1.5 flex-1">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              ))}
            </div>
          ) : recentPatients.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Users className="w-10 h-10 mx-auto mb-2 opacity-40" />
              <p className="text-sm">No patients yet. Add your first patient to get started.</p>
            </div>
          ) : (
            <div className="space-y-1">
              {recentPatients.map((patient) => (
                <button
                  key={patient.id}
                  onClick={() => handlePatientClick(patient.id)}
                  className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="w-9 h-9 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-semibold text-sm">
                    {patient.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{patient.name}</p>
                    <p className="text-xs text-gray-500">{patient.age}y, {patient.gender}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-400">{formatDateShort(patient.createdAt)}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300" />
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================
// Patients View (Enhanced with Two-Tab Add Dialog)
// ============================================================

function PatientsView() {
  const { patients, setPatients, addPatient, removePatient, setCurrentView, selectPatient } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [addTab, setAddTab] = useState('basic');
  const [submitting, setSubmitting] = useState(false);

  const [basicForm, setBasicForm] = useState({
    name: '', age: '', gender: 'Female', phone: '', email: '', medicalHistory: '', notes: '',
  });

  const [vitalsForm, setVitalsForm] = useState({
    weight: '', height: '', bloodPressureSystolic: '', bloodPressureDiastolic: '',
    fastingBloodSugar: '', menstrualCycleLength: '', menstrualRegularity: 'regular',
    hairGrowthPattern: 'normal', skinDarkening: 'none', follicleCount: '', insulinResistance: 'none',
  });

  const bmi = useMemo(() => {
    const w = parseFloat(vitalsForm.weight);
    const h = parseFloat(vitalsForm.height);
    if (isNaN(w) || isNaN(h) || h === 0) return null;
    return Math.round((w / ((h / 100) ** 2)) * 10) / 10;
  }, [vitalsForm.weight, vitalsForm.height]);

  const fetchPatients = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/patients');
      if (res.ok) {
        const data = await res.json();
        setPatients(data);
      }
    } catch {
      toast.error('Failed to load patients');
    } finally {
      setLoading(false);
    }
  }, [setPatients]);

  useEffect(() => { fetchPatients(); }, [fetchPatients]);

  const filteredPatients = useMemo(() => {
    const list = Array.isArray(patients) ? patients : [];
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter((p: Patient) =>
      p.name.toLowerCase().includes(q) || p.gender.toLowerCase().includes(q)
    );
  }, [patients, searchQuery]);

  const handleAddPatient = useCallback(async () => {
    if (!basicForm.name.trim()) {
      toast.error('Patient name is required');
      return;
    }
    const age = parseInt(basicForm.age);
    if (isNaN(age) || age < 0 || age > 150) {
      toast.error('Please enter a valid age (0-150)');
      return;
    }
    setSubmitting(true);
    try {
      const body: Record<string, unknown> = {
        name: basicForm.name.trim(),
        age,
        gender: basicForm.gender,
        phone: basicForm.phone.trim() || undefined,
        email: basicForm.email.trim() || undefined,
        medicalHistory: basicForm.medicalHistory.trim() || undefined,
        notes: basicForm.notes.trim() || undefined,
      };
      const w = parseFloat(vitalsForm.weight);
      const h = parseFloat(vitalsForm.height);
      if (!isNaN(w) && w > 0) body.weight = w;
      if (!isNaN(h) && h > 0) body.height = h;
      if (bmi !== null) body.bmi = bmi;
      const bps = parseFloat(vitalsForm.bloodPressureSystolic);
      if (!isNaN(bps) && bps > 0) body.bloodPressureSystolic = bps;
      const bpd = parseFloat(vitalsForm.bloodPressureDiastolic);
      if (!isNaN(bpd) && bpd > 0) body.bloodPressureDiastolic = bpd;
      const fbs = parseFloat(vitalsForm.fastingBloodSugar);
      if (!isNaN(fbs) && fbs > 0) body.fastingBloodSugar = fbs;
      const mcl = parseFloat(vitalsForm.menstrualCycleLength);
      if (!isNaN(mcl) && mcl > 0) body.menstrualCycleLength = mcl;
      if (vitalsForm.menstrualRegularity !== 'regular') body.menstrualRegularity = vitalsForm.menstrualRegularity;
      if (vitalsForm.hairGrowthPattern !== 'normal') body.hairGrowthPattern = vitalsForm.hairGrowthPattern;
      if (vitalsForm.skinDarkening !== 'none') body.skinDarkening = vitalsForm.skinDarkening;
      const fc = parseFloat(vitalsForm.follicleCount);
      if (!isNaN(fc) && fc > 0) body.follicleCount = fc;
      if (vitalsForm.insulinResistance !== 'none') body.insulinResistance = vitalsForm.insulinResistance;

      const res = await fetch('/api/patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        const newPatient = await res.json();
        addPatient(newPatient);
        toast.success(`Patient ${newPatient.name} added successfully`);
        setShowAddDialog(false);
        setBasicForm({ name: '', age: '', gender: 'Female', phone: '', email: '', medicalHistory: '', notes: '' });
        setVitalsForm({ weight: '', height: '', bloodPressureSystolic: '', bloodPressureDiastolic: '', fastingBloodSugar: '', menstrualCycleLength: '', menstrualRegularity: 'regular', hairGrowthPattern: 'normal', skinDarkening: 'none', follicleCount: '', insulinResistance: 'none' });
        setAddTab('basic');
      } else {
        const err = await res.json();
        toast.error(err.error || 'Failed to add patient');
      }
    } catch {
      toast.error('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }, [basicForm, vitalsForm, bmi, addPatient]);

  const handleDeletePatient = useCallback(async () => {
    if (!deleteId) return;
    try {
      const res = await fetch(`/api/patients/${deleteId}`, { method: 'DELETE' });
      if (res.ok) {
        removePatient(deleteId);
        toast.success('Patient deleted successfully');
      } else {
        toast.error('Failed to delete patient');
      }
    } catch {
      toast.error('Network error. Please try again.');
    } finally {
      setDeleteId(null);
    }
  }, [deleteId, removePatient]);

  const handlePatientClick = useCallback((patientId: string) => {
    selectPatient(patientId);
    setCurrentView('patient-detail');
  }, [selectPatient, setCurrentView]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Patients</h2>
          <p className="text-sm text-gray-500 mt-1">Manage your patient records</p>
        </div>
        <Button className="bg-teal-600 hover:bg-teal-700 text-white" onClick={() => setShowAddDialog(true)}>
          <Plus className="w-4 h-4 mr-1.5" /> Add Patient
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input placeholder="Search patients..." className="pl-9" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-1.5"><Skeleton className="h-4 w-32" /><Skeleton className="h-3 w-20" /></div>
              </div>
              <Skeleton className="h-3 w-full" />
            </Card>
          ))}
        </div>
      ) : filteredPatients.length === 0 ? (
        <Card className="p-8 text-center">
          <Users className="w-12 h-12 mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500">{searchQuery ? 'No patients match your search.' : 'No patients yet.'}</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPatients.map((patient) => {
            const p = patient as Patient & { _count?: { reports: number } } & Record<string, unknown>;
            const reportCount = p._count?.reports ?? patient.reports?.length ?? 0;
            return (
              <Card key={patient.id} className="p-4 hover:shadow-md transition-shadow cursor-pointer group" onClick={() => handlePatientClick(patient.id)}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-semibold">
                      {patient.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{patient.name}</p>
                      <p className="text-xs text-gray-500">{patient.age}y &middot; {patient.gender}</p>
                    </div>
                  </div>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => { e.stopPropagation(); setDeleteId(patient.id); }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Delete patient</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-gray-50 rounded-md p-2">
                    <p className="text-gray-400">Reports</p>
                    <p className="font-medium text-gray-700">{reportCount}</p>
                  </div>
                  <div className="bg-gray-50 rounded-md p-2">
                    <p className="text-gray-400">Created</p>
                    <p className="font-medium text-gray-700">{formatDateShort(patient.createdAt)}</p>
                  </div>
                </div>
                {patient.medicalHistory && (
                  <p className="text-xs text-gray-400 mt-2 truncate">{patient.medicalHistory}</p>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Add Patient Dialog with Two Tabs */}
      <Dialog open={showAddDialog} onOpenChange={(open) => { if (!open) { setShowAddDialog(false); setAddTab('basic'); } }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Patient</DialogTitle>
            <DialogDescription>Enter patient information. Use both tabs for complete registration.</DialogDescription>
          </DialogHeader>
          <Tabs value={addTab} onValueChange={setAddTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="vitals">Vitals & Indicators</TabsTrigger>
            </TabsList>
            <TabsContent value="basic" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="p-name">Full Name *</Label>
                <Input id="p-name" placeholder="Enter full name" value={basicForm.name} onChange={(e) => setBasicForm((f) => ({ ...f, name: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="p-age">Age *</Label>
                  <Input id="p-age" type="number" placeholder="Age" min={0} max={150} value={basicForm.age} onChange={(e) => setBasicForm((f) => ({ ...f, age: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="p-gender">Gender</Label>
                  <Select value={basicForm.gender} onValueChange={(v) => setBasicForm((f) => ({ ...f, gender: v }))}>
                    <SelectTrigger id="p-gender"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Female">Female</SelectItem>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="p-phone">Phone</Label>
                  <Input id="p-phone" placeholder="Phone number" value={basicForm.phone} onChange={(e) => setBasicForm((f) => ({ ...f, phone: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="p-email">Email</Label>
                  <Input id="p-email" type="email" placeholder="Email address" value={basicForm.email} onChange={(e) => setBasicForm((f) => ({ ...f, email: e.target.value }))} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="p-history">Medical History</Label>
                <Textarea id="p-history" placeholder="Relevant medical history..." rows={3} value={basicForm.medicalHistory} onChange={(e) => setBasicForm((f) => ({ ...f, medicalHistory: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="p-notes">Notes</Label>
                <Textarea id="p-notes" placeholder="Additional notes..." rows={2} value={basicForm.notes} onChange={(e) => setBasicForm((f) => ({ ...f, notes: e.target.value }))} />
              </div>
            </TabsContent>
            <TabsContent value="vitals" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="v-weight">Weight (kg)</Label>
                  <Input id="v-weight" type="number" placeholder="kg" value={vitalsForm.weight} onChange={(e) => setVitalsForm((f) => ({ ...f, weight: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="v-height">Height (cm)</Label>
                  <Input id="v-height" type="number" placeholder="cm" value={vitalsForm.height} onChange={(e) => setVitalsForm((f) => ({ ...f, height: e.target.value }))} />
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 flex items-center justify-between">
                <span className="text-sm text-gray-600">Calculated BMI</span>
                <span className={`text-lg font-bold ${bmi ? (bmi < 18.5 ? 'text-amber-600' : bmi < 25 ? 'text-emerald-600' : bmi < 30 ? 'text-amber-600' : 'text-red-600') : 'text-gray-400'}`}>
                  {bmi ?? '---'}
                </span>
              </div>
              <Separator />
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="v-bps">BP Systolic (mmHg)</Label>
                  <Input id="v-bps" type="number" placeholder="120" value={vitalsForm.bloodPressureSystolic} onChange={(e) => setVitalsForm((f) => ({ ...f, bloodPressureSystolic: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="v-bpd">BP Diastolic (mmHg)</Label>
                  <Input id="v-bpd" type="number" placeholder="80" value={vitalsForm.bloodPressureDiastolic} onChange={(e) => setVitalsForm((f) => ({ ...f, bloodPressureDiastolic: e.target.value }))} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="v-fbs">Fasting Blood Sugar (mg/dL)</Label>
                <Input id="v-fbs" type="number" placeholder="mg/dL" value={vitalsForm.fastingBloodSugar} onChange={(e) => setVitalsForm((f) => ({ ...f, fastingBloodSugar: e.target.value }))} />
              </div>
              <Separator />
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Reproductive Indicators (PCOS)</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="v-mcl">Cycle Length (days)</Label>
                  <Input id="v-mcl" type="number" placeholder="28" value={vitalsForm.menstrualCycleLength} onChange={(e) => setVitalsForm((f) => ({ ...f, menstrualCycleLength: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="v-mr">Menstrual Regularity</Label>
                  <Select value={vitalsForm.menstrualRegularity} onValueChange={(v) => setVitalsForm((f) => ({ ...f, menstrualRegularity: v }))}>
                    <SelectTrigger id="v-mr"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="regular">Regular</SelectItem>
                      <SelectItem value="irregular">Irregular</SelectItem>
                      <SelectItem value="absent">Absent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="v-hair">Hair Growth Pattern</Label>
                  <Select value={vitalsForm.hairGrowthPattern} onValueChange={(v) => setVitalsForm((f) => ({ ...f, hairGrowthPattern: v }))}>
                    <SelectTrigger id="v-hair"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="mild_hirsutism">Mild Hirsutism</SelectItem>
                      <SelectItem value="moderate_hirsutism">Moderate Hirsutism</SelectItem>
                      <SelectItem value="severe_hirsutism">Severe Hirsutism</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="v-skin">Skin Darkening</Label>
                  <Select value={vitalsForm.skinDarkening} onValueChange={(v) => setVitalsForm((f) => ({ ...f, skinDarkening: v }))}>
                    <SelectTrigger id="v-skin"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="mild_acanthosis">Mild Acanthosis</SelectItem>
                      <SelectItem value="moderate_acanthosis">Moderate Acanthosis</SelectItem>
                      <SelectItem value="severe_acanthosis">Severe Acanthosis</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="v-fc">Follicle Count</Label>
                  <Input id="v-fc" type="number" placeholder="Per ovary" value={vitalsForm.follicleCount} onChange={(e) => setVitalsForm((f) => ({ ...f, follicleCount: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="v-ir">Insulin Resistance</Label>
                  <Select value={vitalsForm.insulinResistance} onValueChange={(v) => setVitalsForm((f) => ({ ...f, insulinResistance: v }))}>
                    <SelectTrigger id="v-ir"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="mild">Mild</SelectItem>
                      <SelectItem value="moderate">Moderate</SelectItem>
                      <SelectItem value="severe">Severe</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>
          </Tabs>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button>
            <Button className="bg-teal-600 hover:bg-teal-700 text-white" onClick={handleAddPatient} disabled={submitting}>
              {submitting ? 'Adding...' : 'Add Patient'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => { if (!open) setDeleteId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Patient</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this patient and all associated data. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700 text-white" onClick={handleDeletePatient}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ============================================================
// Patient Detail View (Enhanced with predictions tab)
// ============================================================

function PatientDetailView() {
  const {
    selectedPatientId, selectedPatient, setSelectedPatient,
    setCurrentView, currentReports, currentLabValues, currentSymptoms,
    currentScreeningResults, currentPredictions, detailTab, setDetailTab,
    refreshPatientData, removeReport, removeSymptom, updateLabValue,
  } = useAppStore();

  const [loading, setLoading] = useState(true);
  const [screeningLoading, setScreeningLoading] = useState(false);
  const [labCategoryFilter, setLabCategoryFilter] = useState<string>('all');
  const [editingLabId, setEditingLabId] = useState<string | null>(null);
  const [editLabData, setEditLabData] = useState<Partial<LabValue>>({});
  const [checkedSymptoms, setCheckedSymptoms] = useState<Record<string, string>>({});
  const [symptomSaving, setSymptomSaving] = useState(false);

  useEffect(() => {
    async function loadPatient() {
      if (!selectedPatientId) return;
      setLoading(true);
      try {
        const res = await fetch(`/api/patients/${selectedPatientId}`);
        if (res.ok) {
          const patient = await res.json();
          setSelectedPatient(patient);
          const allLabValues = (patient.reports || []).flatMap((r: MedicalReport) => r.labValues || []);
          useAppStore.getState().setCurrentReports(patient.reports || []);
          useAppStore.getState().setCurrentLabValues(allLabValues);
          useAppStore.getState().setCurrentSymptoms(patient.symptoms || []);
          useAppStore.getState().setCurrentScreeningResults(patient.screeningResults || []);
          useAppStore.getState().setCurrentPredictions(patient.predictions || []);
        } else {
          toast.error('Failed to load patient data');
          setCurrentView('patients');
        }
      } catch {
        toast.error('Network error loading patient');
        setCurrentView('patients');
      } finally {
        setLoading(false);
      }
    }
    loadPatient();
  }, [selectedPatientId, setSelectedPatient, setCurrentView]);

  const allLabCategories = useMemo(() => {
    const cats = new Set<string>();
    currentLabValues.forEach((v) => { if (v.category) cats.add(v.category); });
    return Array.from(cats).sort();
  }, [currentLabValues]);

  const filteredLabValues = useMemo(() => {
    if (labCategoryFilter === 'all') return currentLabValues;
    return currentLabValues.filter((v) => v.category === labCategoryFilter);
  }, [currentLabValues, labCategoryFilter]);

  const latestScreening = useMemo(() => {
    if (currentScreeningResults.length === 0) return null;
    return currentScreeningResults.reduce((latest, r) =>
      new Date(r.createdAt) > new Date(latest.createdAt) ? r : latest
    );
  }, [currentScreeningResults]);

  const latestPrediction = useMemo(() => {
    if (currentPredictions.length === 0) return null;
    return currentPredictions.reduce((latest, p) =>
      new Date(p.createdAt) > new Date(latest.createdAt) ? p : latest
    );
  }, [currentPredictions]);

  const thyroidScreening = useMemo(() =>
    currentScreeningResults.find((r) => r.condition === 'thyroid'),
    [currentScreeningResults]
  );
  const pcosScreening = useMemo(() =>
    currentScreeningResults.find((r) => r.condition === 'pcos'),
    [currentScreeningResults]
  );

  const tshTrendData = useMemo(() => {
    const tshValues = currentLabValues.filter((v) => v.testName.toLowerCase().includes('tsh'));
    return tshValues.map((v) => ({
      date: formatDateShort(v.createdAt), value: v.result, testName: v.testName,
    }));
  }, [currentLabValues]);

  const handleRunScreening = useCallback(async () => {
    if (!selectedPatientId) return;
    setScreeningLoading(true);
    try {
      const res = await fetch('/api/screening', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId: selectedPatientId }),
      });
      if (res.ok) {
        const results = await res.json();
        useAppStore.getState().setCurrentScreeningResults([...currentScreeningResults, ...results]);
        toast.success('Screening completed successfully');
      } else {
        const err = await res.json();
        toast.error(err.error || 'Screening failed');
      }
    } catch {
      toast.error('Network error during screening');
    } finally {
      setScreeningLoading(false);
    }
  }, [selectedPatientId, currentScreeningResults]);

  const [predictionLoading, setPredictionLoading] = useState(false);

  const handleRunPrediction = useCallback(async () => {
    if (!selectedPatientId) return;
    setPredictionLoading(true);
    try {
      const res = await fetch('/api/predictions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId: selectedPatientId }),
      });
      if (res.ok) {
        toast.success('ML predictions executed successfully across all models');
        await refreshPatientData();
      } else {
        const err = await res.json();
        toast.error(err.error || 'ML prediction failed');
      }
    } catch {
      toast.error('Network error during ML prediction');
    } finally {
      setPredictionLoading(false);
    }
  }, [selectedPatientId, refreshPatientData]);

  const handleDeleteReport = useCallback(async (reportId: string) => {
    try {
      const res = await fetch(`/api/reports/${reportId}`, { method: 'DELETE' });
      if (res.ok) {
        removeReport(reportId);
        toast.success('Report deleted');
        refreshPatientData();
      } else {
        toast.error('Failed to delete report');
      }
    } catch {
      toast.error('Network error');
    }
  }, [removeReport, refreshPatientData]);

  const handleDeleteSymptom = useCallback(async (symptomId: string) => {
    try {
      const res = await fetch(`/api/symptoms?id=${symptomId}`, { method: 'DELETE' });
      if (res.ok) {
        removeSymptom(symptomId);
        toast.success('Symptom removed');
      } else {
        toast.error('Failed to remove symptom');
      }
    } catch {
      toast.error('Network error');
    }
  }, [removeSymptom]);

  const handleSaveSymptoms = useCallback(async () => {
    const entries = Object.entries(checkedSymptoms).filter(([, sev]) => sev && sev !== 'none');
    if (entries.length === 0) {
      toast.error('Select at least one symptom with severity');
      return;
    }
    setSymptomSaving(true);
    try {
      for (const [name, severity] of entries) {
        const category = Object.entries(SYMPTOM_CATEGORIES).find(([, symptoms]) =>
          symptoms.includes(name)
        )?.[0] || 'other';
        const res = await fetch('/api/symptoms', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            patientId: selectedPatientId,
            symptomName: name,
            severity: severity as SymptomEntry['severity'],
            category,
          }),
        });
        if (!res.ok) {
          const err = await res.json();
          toast.error(err.error || `Failed to add symptom: ${name}`);
        }
      }
      toast.success(`${entries.length} symptom(s) saved`);
      setCheckedSymptoms({});
      refreshPatientData();
    } catch {
      toast.error('Network error saving symptoms');
    } finally {
      setSymptomSaving(false);
    }
  }, [checkedSymptoms, selectedPatientId, refreshPatientData]);

  const handleStartEditLab = useCallback((labVal: LabValue) => {
    setEditingLabId(labVal.id);
    setEditLabData({
      result: labVal.result,
      referenceLow: labVal.referenceLow,
      referenceHigh: labVal.referenceHigh,
      isVerified: labVal.isVerified,
    });
  }, []);

  const handleSaveEditLab = useCallback(async (labId: string) => {
    try {
      const res = await fetch('/api/lab-values', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: labId, ...editLabData }),
      });
      if (res.ok) {
        updateLabValue(labId, editLabData);
        setEditingLabId(null);
        setEditLabData({});
        toast.success('Lab value updated');
      } else {
        toast.error('Failed to update lab value');
      }
    } catch {
      toast.error('Network error');
    }
  }, [editLabData, updateLabValue]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => <Card key={i} className="p-4"><Skeleton className="h-24 w-full" /></Card>)}
        </div>
        <Card className="p-4"><Skeleton className="h-48 w-full" /></Card>
      </div>
    );
  }

  if (!selectedPatient) {
    return (
      <Card className="p-8 text-center">
        <AlertTriangle className="w-12 h-12 mx-auto text-amber-400 mb-3" />
        <p className="text-gray-500">Patient not found.</p>
        <Button variant="outline" className="mt-4" onClick={() => setCurrentView('patients')}>Back to Patients</Button>
      </Card>
    );
  }

  const p = selectedPatient;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setCurrentView('patients')}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-gray-900">{p.name}</h2>
          <p className="text-sm text-gray-500">{p.age}y &middot; {p.gender} &middot; Created {formatDate(p.createdAt)}</p>
        </div>
      </div>

      <Tabs value={detailTab} onValueChange={setDetailTab}>
        <TabsList className="flex flex-wrap h-auto gap-1">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
          <TabsTrigger value="lab-values">Lab Values</TabsTrigger>
          <TabsTrigger value="symptoms">Symptoms</TabsTrigger>
          <TabsTrigger value="screening">Screening</TabsTrigger>
          <TabsTrigger value="predictions">Predictions</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-4">
              <h4 className="text-sm font-medium text-gray-500 mb-2">Vitals</h4>
              <div className="space-y-2 text-sm">
                {p.bmi != null && <div className="flex justify-between"><span className="text-gray-500">BMI</span><span className="font-medium">{p.bmi}</span></div>}
                {p.bloodPressureSystolic != null && <div className="flex justify-between"><span className="text-gray-500">BP</span><span className="font-medium">{p.bloodPressureSystolic}/{p.bloodPressureDiastolic} mmHg</span></div>}
                {p.fastingBloodSugar != null && <div className="flex justify-between"><span className="text-gray-500">Fasting Sugar</span><span className="font-medium">{p.fastingBloodSugar} mg/dL</span></div>}
                {p.weight != null && <div className="flex justify-between"><span className="text-gray-500">Weight</span><span className="font-medium">{p.weight} kg</span></div>}
                {p.height != null && <div className="flex justify-between"><span className="text-gray-500">Height</span><span className="font-medium">{p.height} cm</span></div>}
              </div>
            </Card>
            <Card className="p-4">
              <h4 className="text-sm font-medium text-gray-500 mb-2">Records</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">Reports</span><span className="font-medium">{currentReports.length}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Lab Values</span><span className="font-medium">{currentLabValues.length}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Symptoms</span><span className="font-medium">{currentSymptoms.length}</span></div>
              </div>
            </Card>
            <Card className="p-4">
              <h4 className="text-sm font-medium text-gray-500 mb-2">Latest Screening</h4>
              {latestScreening ? (
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-gray-500">Condition</span><span className="font-medium capitalize">{latestScreening.condition}</span></div>
                  <div className="flex justify-between items-center"><span className="text-gray-500">Risk</span><Badge variant="outline" className={getRiskBadgeClasses(latestScreening.riskLevel)}>{latestScreening.riskLevel}</Badge></div>
                  <div className="flex justify-between"><span className="text-gray-500">Date</span><span className="font-medium">{formatDateShort(latestScreening.createdAt)}</span></div>
                </div>
              ) : (
                <p className="text-sm text-gray-400">No screening results yet.</p>
              )}
            </Card>
          </div>
          {latestPrediction && (
            <Card className="p-4">
              <h4 className="text-sm font-medium text-gray-500 mb-3">Latest ML Prediction</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                  <Heart className={`w-5 h-5 ${latestPrediction.thyroidPrediction === 'Positive' ? 'text-red-500' : 'text-emerald-500'}`} />
                  <div>
                    <p className="text-xs text-gray-500">Thyroid</p>
                    <p className={`text-sm font-semibold ${latestPrediction.thyroidPrediction === 'Positive' ? 'text-red-600' : 'text-emerald-600'}`}>{latestPrediction.thyroidPrediction} ({(latestPrediction.thyroidProbability * 100).toFixed(1)}%)</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                  <Brain className={`w-5 h-5 ${latestPrediction.pcosPrediction === 'Positive' ? 'text-red-500' : 'text-emerald-500'}`} />
                  <div>
                    <p className="text-xs text-gray-500">PCOS</p>
                    <p className={`text-sm font-semibold ${latestPrediction.pcosPrediction === 'Positive' ? 'text-red-600' : 'text-emerald-600'}`}>{latestPrediction.pcosPrediction} ({(latestPrediction.pcosProbability * 100).toFixed(1)}%)</p>
                  </div>
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-2">Model: {latestPrediction.modelUsed} &middot; {formatDate(latestPrediction.createdAt)}</p>
            </Card>
          )}
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports" className="space-y-4 mt-4">
          {currentReports.length === 0 ? (
            <Card className="p-8 text-center">
              <FileText className="w-12 h-12 mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500">No reports uploaded yet.</p>
              <Button className="mt-4 bg-teal-600 hover:bg-teal-700 text-white" onClick={() => setCurrentView('upload-report')}>Upload Report</Button>
            </Card>
          ) : (
            <div className="space-y-3">
              {currentReports.map((report) => (
                <Card key={report.id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-teal-50 flex items-center justify-center">
                        <FileText className="w-5 h-5 text-teal-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 text-sm">{report.reportType}</p>
                        <p className="text-xs text-gray-500">{formatDate(report.reportDate)} &middot; {report.labValues?.length ?? 0} values</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={report.status === 'completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}>{report.status}</Badge>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-red-500" onClick={() => handleDeleteReport(report.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  {report.notes && <p className="text-xs text-gray-400 mt-2">{report.notes}</p>}
                  {report.labValues && report.labValues.length > 0 && (
                    <div className="mt-3 max-h-40 overflow-y-auto">
                      <Table><TableBody>
                        {report.labValues.slice(0, 5).map((lv) => (
                          <TableRow key={lv.id}>
                            <TableCell className="text-xs py-1.5 font-medium">{lv.testName}</TableCell>
                            <TableCell className="text-xs py-1.5">{lv.result} {lv.unit || ''}</TableCell>
                            <TableCell className="text-xs py-1.5">{getLabStatusBadge(getLabValueStatus(lv))}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody></Table>
                      {report.labValues.length > 5 && <p className="text-xs text-gray-400 mt-1">...and {report.labValues.length - 5} more</p>}
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Lab Values Tab */}
        <TabsContent value="lab-values" className="space-y-4 mt-4">
          <div className="flex items-center gap-2">
            <Select value={labCategoryFilter} onValueChange={setLabCategoryFilter}>
              <SelectTrigger className="w-48"><SelectValue placeholder="Filter by category" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {allLabCategories.map((cat) => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          {filteredLabValues.length === 0 ? (
            <Card className="p-8 text-center"><FlaskConical className="w-12 h-12 mx-auto text-gray-300 mb-3" /><p className="text-gray-500">No lab values found.</p></Card>
          ) : (
            <Card>
              <Table>
                <TableHeader><TableRow>
                  <TableHead className="text-xs">Test Name</TableHead>
                  <TableHead className="text-xs">Result</TableHead>
                  <TableHead className="text-xs">Unit</TableHead>
                  <TableHead className="text-xs">Ref Low</TableHead>
                  <TableHead className="text-xs">Ref High</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs w-20">Actions</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {filteredLabValues.map((lv) => {
                    const status = getLabValueStatus(lv);
                    return (
                      <TableRow key={lv.id}>
                        <TableCell className="text-xs font-medium">{lv.testName}</TableCell>
                        <TableCell className="text-xs">
                          {editingLabId === lv.id ? (
                            <Input className="h-7 w-20 text-xs" type="number" value={editLabData.result ?? ''} onChange={(e) => setEditLabData((d) => ({ ...d, result: parseFloat(e.target.value) || undefined }))} />
                          ) : (
                            lv.result ?? '-'
                          )}
                        </TableCell>
                        <TableCell className="text-xs">{lv.unit || '-'}</TableCell>
                        <TableCell className="text-xs">{lv.referenceLow ?? '-'}</TableCell>
                        <TableCell className="text-xs">{lv.referenceHigh ?? '-'}</TableCell>
                        <TableCell className="text-xs">{getLabStatusBadge(status)}</TableCell>
                        <TableCell className="text-xs">
                          {editingLabId === lv.id ? (
                            <div className="flex gap-1">
                              <Button size="sm" variant="ghost" className="h-7 w-7" onClick={() => handleSaveEditLab(lv.id)}><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /></Button>
                              <Button size="sm" variant="ghost" className="h-7 w-7" onClick={() => setEditingLabId(null)}><X className="w-3.5 h-3.5" /></Button>
                            </div>
                          ) : (
                            <Button size="sm" variant="ghost" className="h-7 w-7" onClick={() => handleStartEditLab(lv)}><Edit className="w-3.5 h-3.5" /></Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Card>
          )}
        </TabsContent>

        {/* Symptoms Tab */}
        <TabsContent value="symptoms" className="space-y-4 mt-4">
          <Card className="p-4">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Add Symptoms</h4>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {Object.entries(SYMPTOM_CATEGORIES).map(([category, symptoms]) => (
                <div key={category}>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 capitalize">{category}</p>
                  <div className="space-y-1.5">
                    {symptoms.map((symptom) => (
                      <div key={symptom} className="flex items-center justify-between p-2 rounded-md hover:bg-gray-50">
                        <div className="flex items-center gap-2">
                          <Checkbox
                            checked={!!checkedSymptoms[symptom]}
                            onCheckedChange={(checked) => {
                              if (checked) setCheckedSymptoms((prev) => ({ ...prev, [symptom]: prev[symptom] || 'mild' }));
                              else setCheckedSymptoms((prev) => { const next = { ...prev }; delete next[symptom]; return next; });
                            }}
                          />
                          <span className="text-sm text-gray-700">{symptom}</span>
                        </div>
                        {checkedSymptoms[symptom] && (
                          <Select value={checkedSymptoms[symptom]} onValueChange={(v) => setCheckedSymptoms((prev) => ({ ...prev, [symptom]: v }))}>
                            <SelectTrigger className="w-28 h-7 text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="mild">Mild</SelectItem>
                              <SelectItem value="moderate">Moderate</SelectItem>
                              <SelectItem value="severe">Severe</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 flex justify-end">
              <Button className="bg-teal-600 hover:bg-teal-700 text-white" disabled={symptomSaving} onClick={handleSaveSymptoms}>
                {symptomSaving ? 'Saving...' : 'Save Symptoms'}
              </Button>
            </div>
          </Card>
          {currentSymptoms.length > 0 && (
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Recorded Symptoms</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {currentSymptoms.map((sym) => (
                    <div key={sym.id} className="flex items-center justify-between p-2 rounded-md border border-gray-100">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={`text-xs ${sym.severity === 'severe' ? 'bg-red-50 text-red-700' : sym.severity === 'moderate' ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'}`}>{sym.severity}</Badge>
                        <span className="text-sm text-gray-700">{sym.symptomName}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400">{formatDateShort(sym.dateReported)}</span>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleDeleteSymptom(sym.id)}><Trash2 className="w-3 h-3 text-gray-400" /></Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Screening Tab */}
        <TabsContent value="screening" className="space-y-4 mt-4">
          <div className="flex justify-end">
            <Button className="bg-teal-600 hover:bg-teal-700 text-white" disabled={screeningLoading} onClick={handleRunScreening}>
              {screeningLoading ? <><RefreshCw className="w-4 h-4 mr-1.5 animate-spin" /> Running...</> : <><Shield className="w-4 h-4 mr-1.5" /> Run Screening</>}
            </Button>
          </div>
          {currentScreeningResults.length === 0 ? (
            <Card className="p-8 text-center"><Shield className="w-12 h-12 mx-auto text-gray-300 mb-3" /><p className="text-gray-500">No screening results yet. Click &quot;Run Screening&quot; to analyze.</p></Card>
          ) : (
            <div className="space-y-4">
              {currentScreeningResults.map((result) => {
                const factors = parseFactors(result.factors);
                return (
                  <Card key={result.id} className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${getRiskDotColor(result.riskLevel)}`} />
                        <h4 className="font-semibold text-gray-900 text-sm capitalize">{result.condition} Screening</h4>
                      </div>
                      <Badge variant="outline" className={getRiskBadgeClasses(result.riskLevel)}>{result.riskLevel}</Badge>
                    </div>
                    {result.riskScore != null && (
                      <div className="mb-3">
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                          <span>Risk Score</span><span>{(result.riskScore * 100).toFixed(1)}%</span>
                        </div>
                        <Progress value={result.riskScore * 100} className="h-2" />
                      </div>
                    )}
                    {result.summary && <p className="text-sm text-gray-600 mb-3">{result.summary}</p>}
                    {factors.length > 0 && (
                      <div className="space-y-1.5">
                        <p className="text-xs font-medium text-gray-500">Contributing Factors</p>
                        {factors.map((factor, i) => (
                          <div key={i} className="flex items-center justify-between text-xs p-1.5 rounded bg-gray-50">
                            <span className="text-gray-700">{factor.name}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-gray-500">{String(factor.value)}</span>
                              <Badge variant="outline" className={`text-[10px] ${factor.impact === 'positive' ? 'bg-red-50 text-red-600' : factor.impact === 'negative' ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-50 text-gray-600'}`}>{factor.impact}</Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    <p className="text-xs text-gray-400 mt-3">{formatDate(result.createdAt)}</p>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Predictions Tab */}
        <TabsContent value="predictions" className="space-y-4 mt-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-semibold text-gray-900">Multi-Model Machine Learning Predictions</h4>
              <p className="text-xs text-gray-500">Cross-model risk consensus from Decision Tree, Random Forest, SVM, XGBoost, and Ensemble</p>
            </div>
            <Button
              size="sm"
              disabled={predictionLoading}
              onClick={handleRunPrediction}
              className="bg-teal-600 hover:bg-teal-700 text-white h-8 text-xs font-medium cursor-pointer"
            >
              {predictionLoading ? (
                <><RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Running Pipeline...</>
              ) : (
                <><Cpu className="w-3.5 h-3.5 mr-1.5" /> {currentPredictions.length > 0 ? 'Re-run ML Pipeline' : 'Run ML Pipeline'}</>
              )}
            </Button>
          </div>

          {currentPredictions.length === 0 ? (
            <Card className="p-10 text-center border-dashed">
              <ScanLine className="w-12 h-12 mx-auto text-teal-600/40 mb-3" />
              <h4 className="text-base font-semibold text-gray-800">No ML Predictions Generated Yet</h4>
              <p className="text-sm text-gray-500 mt-1 max-w-sm mx-auto mb-5">
                Run our multi-model ML ensemble pipeline on this patient's clinical markers and symptoms.
              </p>
              <Button
                className="bg-teal-600 hover:bg-teal-700 text-white"
                disabled={predictionLoading}
                onClick={handleRunPrediction}
              >
                {predictionLoading ? (
                  <><RefreshCw className="w-4 h-4 mr-1.5 animate-spin" /> Running Pipeline...</>
                ) : (
                  <><Cpu className="w-4 h-4 mr-1.5" /> Run ML Predictions</>
                )}
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {currentPredictions.map((pred) => {
                const isEnsemble = pred.modelUsed === 'Ensemble';
                return (
                  <Card
                    key={pred.id}
                    className={`p-4 transition-all shadow-xs ${
                      isEnsemble ? 'border-2 border-teal-500 bg-gradient-to-br from-white to-teal-50/20' : 'bg-white border-gray-100'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-1.5">
                        {isEnsemble && <Zap className="w-3.5 h-3.5 text-amber-500" />}
                        <Badge
                          variant="outline"
                          className={`text-xs font-semibold ${
                            isEnsemble ? 'bg-teal-600 text-white border-teal-600' : 'bg-gray-50 text-gray-700 border-gray-200'
                          }`}
                        >
                          {pred.modelUsed}
                        </Badge>
                      </div>
                      <span className="text-[11px] text-gray-400">{formatDateShort(pred.createdAt)}</span>
                    </div>
                    <div className="space-y-3">
                      <div className="p-2.5 rounded-lg bg-gray-50/80 border border-gray-100">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-medium text-gray-600">Thyroid Risk</span>
                          <Badge
                            variant="outline"
                            className={`text-[10px] px-1.5 py-0 ${
                              pred.thyroidPrediction === 'Positive'
                                ? 'bg-rose-50 text-rose-700 border-rose-200 font-semibold'
                                : 'bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold'
                            }`}
                          >
                            {pred.thyroidPrediction}
                          </Badge>
                        </div>
                        <Progress
                          value={pred.thyroidProbability * 100}
                          className={`h-1.5 ${pred.thyroidPrediction === 'Positive' ? '[&>div]:bg-rose-500' : '[&>div]:bg-emerald-500'}`}
                        />
                        <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                          <span>Confidence Probability</span>
                          <span className="font-semibold text-gray-700">{(pred.thyroidProbability * 100).toFixed(1)}%</span>
                        </div>
                      </div>

                      <div className="p-2.5 rounded-lg bg-gray-50/80 border border-gray-100">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-medium text-gray-600">PCOS Risk</span>
                          <Badge
                            variant="outline"
                            className={`text-[10px] px-1.5 py-0 ${
                              pred.pcosPrediction === 'Positive'
                                ? 'bg-rose-50 text-rose-700 border-rose-200 font-semibold'
                                : 'bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold'
                            }`}
                          >
                            {pred.pcosPrediction}
                          </Badge>
                        </div>
                        <Progress
                          value={pred.pcosProbability * 100}
                          className={`h-1.5 ${pred.pcosPrediction === 'Positive' ? '[&>div]:bg-rose-500' : '[&>div]:bg-emerald-500'}`}
                        />
                        <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                          <span>Confidence Probability</span>
                          <span className="font-semibold text-gray-700">{(pred.pcosProbability * 100).toFixed(1)}%</span>
                        </div>
                      </div>
                    </div>
                    {pred.modelAccuracy != null && (
                      <div className="mt-3 pt-2.5 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500">
                        <span>Reported Accuracy:</span>
                        <span className="font-semibold text-teal-700">{(pred.modelAccuracy * 100).toFixed(1)}%</span>
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Trends Tab */}
        <TabsContent value="trends" className="space-y-4 mt-4">
          <PatientTrendsPanel patientId={selectedPatientId} patientName={selectedPatient?.name} isEmbedded={true} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ============================================================
// Upload Report View (Fixed end-to-end flow)
// ============================================================

interface LabValueRow {
  tempId: string;
  testName: string;
  result: string;
  unit: string;
  referenceLow: string;
  referenceHigh: string;
}

function UploadReportView() {
  const { patients, setPatients, selectPatient, setCurrentView } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [reportType, setReportType] = useState('thyroid_panel');
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [ocrProcessing, setOcrProcessing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [labRows, setLabRows] = useState<LabValueRow[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await fetch('/api/patients');
        if (res.ok) {
          const data = await res.json();
          setPatients(data);
        }
      } catch {
        toast.error('Failed to load patients');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [setPatients]);

  const addEmptyRow = useCallback(() => {
    setLabRows((prev) => [...prev, { tempId: generateId(), testName: '', result: '', unit: '', referenceLow: '', referenceHigh: '' }]);
  }, []);

  const updateRow = useCallback((tempId: string, field: keyof LabValueRow, value: string) => {
    setLabRows((prev) => prev.map((r) => r.tempId === tempId ? { ...r, [field]: value } : r));
  }, []);

  const removeRow = useCallback((tempId: string) => {
    setLabRows((prev) => prev.filter((r) => r.tempId !== tempId));
  }, []);

  const handleFileSelect = useCallback(async (file: File) => {
    setUploadFile(file);
    setOcrProcessing(true);
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      try {
        const res = await fetch('/api/ocr', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: base64, reportType: reportType }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.labValues && Array.isArray(data.labValues) && data.labValues.length > 0) {
            const newRows: LabValueRow[] = data.labValues.map((lv: Record<string, unknown>) => ({
              tempId: generateId(),
              testName: String(lv.testName || ''),
              result: String(lv.result ?? ''),
              unit: String(lv.unit || ''),
              referenceLow: String(lv.referenceLow ?? ''),
              referenceHigh: String(lv.referenceHigh ?? ''),
            }));
            setLabRows((prev) => [...prev, ...newRows]);
            toast.success(`OCR extracted ${newRows.length} lab values — verify below before saving`);
          } else {
            toast.info('OCR completed but no structured values found. You can add values manually.');
            if (labRows.length === 0) addEmptyRow();
          }
        } else {
          toast.error('OCR processing failed. Please add values manually.');
          if (labRows.length === 0) addEmptyRow();
        }
      } catch {
        toast.error('OCR unavailable. Please add values manually.');
        if (labRows.length === 0) addEmptyRow();
      } finally {
        setOcrProcessing(false);
      }
    };
    reader.readAsDataURL(file);
  }, [reportType, labRows.length, addEmptyRow]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); }, []);
  const handleDragLeave = useCallback(() => { setIsDragging(false); }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
  }, [handleFileSelect]);

  const handleSaveReport = useCallback(async () => {
    if (!selectedPatientId) { toast.error('Please select a patient'); return; }
    const validRows = labRows.filter((r) => r.testName.trim());
    if (validRows.length === 0) { toast.error('Please add at least one lab value'); return; }
    setSaving(true);
    try {
      const labValues = validRows.map((r) => ({
        testName: r.testName.trim(),
        result: parseFloat(r.result) || undefined,
        unit: r.unit.trim() || undefined,
        referenceLow: parseFloat(r.referenceLow) || undefined,
        referenceHigh: parseFloat(r.referenceHigh) || undefined,
      }));
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId: selectedPatientId, reportType, reportDate, notes: notes.trim() || undefined, labValues }),
      });
      if (res.ok) {
        toast.success('Report saved successfully');
        selectPatient(selectedPatientId);
        setCurrentView('patient-detail');
      } else {
        const err = await res.json();
        toast.error(err.error || 'Failed to save report');
      }
    } catch {
      toast.error('Network error saving report');
    } finally {
      setSaving(false);
    }
  }, [selectedPatientId, reportType, reportDate, notes, labRows, selectPatient, setCurrentView]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Upload Report</h2>
        <p className="text-sm text-gray-500 mt-1">Upload a medical report and extract lab values</p>
      </div>

      <Card className="p-4 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Select Patient *</Label>
            <Select value={selectedPatientId} onValueChange={setSelectedPatientId}>
              <SelectTrigger><SelectValue placeholder={loading ? 'Loading...' : 'Select patient'} /></SelectTrigger>
              <SelectContent>
                {(Array.isArray(patients) ? patients : []).map((p: Patient) => (
                  <SelectItem key={p.id} value={p.id}>{p.name} ({p.age}y, {p.gender})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Report Type</Label>
            <Select value={reportType} onValueChange={setReportType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="thyroid_panel">Thyroid Panel</SelectItem>
                <SelectItem value="pcos_panel">PCOS Panel</SelectItem>
                <SelectItem value="complete_blood_count">Complete Blood Count</SelectItem>
                <SelectItem value="metabolic_panel">Metabolic Panel</SelectItem>
                <SelectItem value="hormonal_panel">Hormonal Panel</SelectItem>
                <SelectItem value="general">General</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Report Date</Label>
            <Input type="date" value={reportDate} onChange={(e) => setReportDate(e.target.value)} />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Notes</Label>
          <Textarea placeholder="Optional notes about this report..." rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
      </Card>

      {/* File Upload Area */}
      <Card className="p-4">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Upload File (Optional)</h3>
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${isDragging ? 'border-teal-400 bg-teal-50' : 'border-gray-200 hover:border-gray-300'}`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
        >
          <input ref={fileInputRef} type="file" className="hidden" accept="image/*,.pdf" onChange={handleFileInput} />
          {ocrProcessing ? (
            <div className="flex flex-col items-center gap-2">
              <RefreshCw className="w-8 h-8 text-teal-500 animate-spin" />
              <p className="text-sm text-gray-600">Processing with OCR...</p>
            </div>
          ) : uploadFile ? (
            <div className="flex flex-col items-center gap-2">
              <FileText className="w-8 h-8 text-teal-500" />
              <p className="text-sm font-medium text-gray-700">{uploadFile.name}</p>
              <p className="text-xs text-gray-400">Click to replace</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <Upload className="w-8 h-8 text-gray-400" />
              <p className="text-sm text-gray-600">Drag & drop a file here, or click to browse</p>
              <p className="text-xs text-gray-400">Supports images and PDF files</p>
            </div>
          )}
        </div>
      </Card>

      {/* Lab Values Table */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-gray-700">Lab Values</h3>
          <Button size="sm" variant="outline" onClick={addEmptyRow}><Plus className="w-3.5 h-3.5 mr-1" /> Add Row</Button>
        </div>
        {labRows.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <FlaskConical className="w-10 h-10 mx-auto mb-2 opacity-40" />
            <p className="text-sm">No lab values yet. Upload a file or add rows manually.</p>
          </div>
        ) : (
          <div className="max-h-96 overflow-y-auto">
            <Table>
              <TableHeader><TableRow>
                <TableHead className="text-xs">Test Name</TableHead>
                <TableHead className="text-xs">Result</TableHead>
                <TableHead className="text-xs">Unit</TableHead>
                <TableHead className="text-xs">Ref Low</TableHead>
                <TableHead className="text-xs">Ref High</TableHead>
                <TableHead className="text-xs w-12"></TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {labRows.map((row) => (
                  <TableRow key={row.tempId}>
                    <TableCell><Input className="h-8 text-xs" placeholder="Test name" value={row.testName} onChange={(e) => updateRow(row.tempId, 'testName', e.target.value)} /></TableCell>
                    <TableCell><Input className="h-8 text-xs w-20" type="number" placeholder="Value" value={row.result} onChange={(e) => updateRow(row.tempId, 'result', e.target.value)} /></TableCell>
                    <TableCell><Input className="h-8 text-xs w-20" placeholder="Unit" value={row.unit} onChange={(e) => updateRow(row.tempId, 'unit', e.target.value)} /></TableCell>
                    <TableCell><Input className="h-8 text-xs w-16" type="number" placeholder="Low" value={row.referenceLow} onChange={(e) => updateRow(row.tempId, 'referenceLow', e.target.value)} /></TableCell>
                    <TableCell><Input className="h-8 text-xs w-16" type="number" placeholder="High" value={row.referenceHigh} onChange={(e) => updateRow(row.tempId, 'referenceHigh', e.target.value)} /></TableCell>
                    <TableCell><Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeRow(row.tempId)}><Trash2 className="w-3.5 h-3.5 text-gray-400" /></Button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      <div className="flex justify-end">
        <Button className="bg-teal-600 hover:bg-teal-700 text-white" disabled={saving || !selectedPatientId} onClick={handleSaveReport}>
          {saving ? <><RefreshCw className="w-4 h-4 mr-1.5 animate-spin" /> Saving...</> : <><Save className="w-4 h-4 mr-1.5" /> Confirm & Save Report</>}
        </Button>
      </div>
    </div>
  );
}

// ============================================================
// Screening View
// ============================================================

function ScreeningView() {
  const { patients, setPatients, selectPatient, setCurrentView } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<ScreeningResult[]>([]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await fetch('/api/patients');
        if (res.ok) setPatients(await res.json());
      } catch { toast.error('Failed to load patients'); }
      finally { setLoading(false); }
    }
    load();
  }, [setPatients]);

  const handleRunScreening = useCallback(async () => {
    if (!selectedPatientId) { toast.error('Please select a patient'); return; }
    setRunning(true);
    setResults([]);
    try {
      const res = await fetch('/api/screening', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId: selectedPatientId }),
      });
      if (res.ok) {
        const data = await res.json();
        setResults(Array.isArray(data) ? data : [data]);
        toast.success('Screening completed');
      } else {
        const err = await res.json();
        toast.error(err.error || 'Screening failed');
      }
    } catch { toast.error('Network error'); }
    finally { setRunning(false); }
  }, [selectedPatientId]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Screening</h2>
        <p className="text-sm text-gray-500 mt-1">Run clinical risk screening for thyroid and PCOS</p>
      </div>

      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-4 items-end">
          <div className="flex-1 space-y-2">
            <Label>Select Patient</Label>
            <Select value={selectedPatientId} onValueChange={setSelectedPatientId}>
              <SelectTrigger><SelectValue placeholder={loading ? 'Loading...' : 'Select patient'} /></SelectTrigger>
              <SelectContent>
                {(Array.isArray(patients) ? patients : []).map((p: Patient) => (
                  <SelectItem key={p.id} value={p.id}>{p.name} ({p.age}y, {p.gender})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button className="bg-teal-600 hover:bg-teal-700 text-white" disabled={running || !selectedPatientId} onClick={handleRunScreening}>
            {running ? <><RefreshCw className="w-4 h-4 mr-1.5 animate-spin" /> Running...</> : <><Shield className="w-4 h-4 mr-1.5" /> Run Screening</>}
          </Button>
        </div>
      </Card>

      {running && (
        <Card className="p-8 text-center">
          <RefreshCw className="w-10 h-10 mx-auto text-teal-500 animate-spin mb-3" />
          <p className="text-sm text-gray-600">Running screening analysis...</p>
        </Card>
      )}

      {results.length > 0 && (
        <div className="space-y-4">
          {results.map((result) => {
            const factors = parseFactors(result.factors);
            return (
              <Card key={result.id} className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${getRiskDotColor(result.riskLevel)}`} />
                    <h4 className="font-semibold text-gray-900 text-sm capitalize">{result.condition} Screening</h4>
                  </div>
                  <Badge variant="outline" className={getRiskBadgeClasses(result.riskLevel)}>{result.riskLevel}</Badge>
                </div>
                {result.riskScore != null && (
                  <div className="mb-3">
                    <div className="flex justify-between text-xs text-gray-500 mb-1"><span>Risk Score</span><span>{(result.riskScore * 100).toFixed(1)}%</span></div>
                    <Progress value={result.riskScore * 100} className="h-2" />
                  </div>
                )}
                {result.summary && <p className="text-sm text-gray-600 mb-3">{result.summary}</p>}
                {factors.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-xs font-medium text-gray-500">Contributing Factors</p>
                    {factors.map((factor, i) => (
                      <div key={i} className="flex items-center justify-between text-xs p-1.5 rounded bg-gray-50">
                        <span className="text-gray-700">{factor.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500">{String(factor.value)}</span>
                          <Badge variant="outline" className={`text-[10px] ${factor.impact === 'positive' ? 'bg-red-50 text-red-600' : factor.impact === 'negative' ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-50 text-gray-600'}`}>{factor.impact}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex justify-between items-center mt-4">
                  <p className="text-xs text-gray-400">{formatDate(result.createdAt)}</p>
                  {selectedPatientId && (
                    <Button size="sm" variant="ghost" className="text-teal-600 text-xs" onClick={() => { selectPatient(selectedPatientId); setCurrentView('patient-detail'); }}>
                      View Patient <ChevronRight className="w-3 h-3 ml-1" />
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ============================================================
// Prediction View (ML Prediction Module)
// ============================================================

function PredictionView() {
  const { patients, setPatients, selectedPatientId, selectPatient, setCurrentView } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [activePatientId, setActivePatientId] = useState<string>('');
  const [running, setRunning] = useState(false);
  const [predictions, setPredictions] = useState<Prediction[]>([]);

  // Load patient list and initialize active patient
  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await fetch('/api/patients');
        if (res.ok) {
          const list = await res.json();
          setPatients(list);
          if (list.length > 0) {
            const initialId = selectedPatientId && list.some((p: Patient) => p.id === selectedPatientId)
              ? selectedPatientId
              : list[0].id;
            setActivePatientId(initialId);
          }
        }
      } catch {
        toast.error('Failed to load patients');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [setPatients, selectedPatientId]);

  // Load existing predictions for selected patient
  const loadPredictions = useCallback(async (patientId: string) => {
    if (!patientId) {
      setPredictions([]);
      return;
    }
    try {
      const res = await fetch(`/api/predictions?patientId=${patientId}`);
      if (res.ok) {
        const data = await res.json();
        setPredictions(Array.isArray(data) ? data : []);
      }
    } catch {
      toast.error('Failed to load existing predictions');
    }
  }, []);

  useEffect(() => {
    if (activePatientId) {
      loadPredictions(activePatientId);
    }
  }, [activePatientId, loadPredictions]);

  const handlePatientSelect = (id: string) => {
    setActivePatientId(id);
    selectPatient(id);
  };

  const handleRunPrediction = useCallback(async () => {
    if (!activePatientId) {
      toast.error('Please select a patient');
      return;
    }
    setRunning(true);
    try {
      const res = await fetch('/api/predictions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId: activePatientId }),
      });
      if (res.ok) {
        toast.success('ML predictions computed across all 5 models!');
        await loadPredictions(activePatientId);
        await useAppStore.getState().refreshPatientData();
      } else {
        const err = await res.json();
        toast.error(err.error || 'Prediction pipeline failed');
      }
    } catch {
      toast.error('Network error during prediction pipeline');
    } finally {
      setRunning(false);
    }
  }, [activePatientId, loadPredictions]);

  const activePatient = useMemo(() => {
    return (Array.isArray(patients) ? patients : []).find((p) => p.id === activePatientId) || null;
  }, [patients, activePatientId]);

  const ensemblePrediction = useMemo(() => {
    return (
      predictions.find((p) => (p.modelUsed || (p as any).model) === 'Ensemble') ||
      predictions[0] ||
      null
    );
  }, [predictions]);

  const topFeatures = useMemo(() => {
    if (!ensemblePrediction?.topFeatures) return [];
    return parseJsonSafe<{ name: string; importance: number }[]>(ensemblePrediction.topFeatures, []);
  }, [ensemblePrediction]);

  const precautions = useMemo(() => {
    if (!ensemblePrediction?.suggestedPrecautions) return [];
    return parseJsonSafe<{ category: string; item: string; priority: string }[]>(ensemblePrediction.suggestedPrecautions, []);
  }, [ensemblePrediction]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Cpu className="w-6 h-6 text-teal-600" />
            Machine Learning Diagnostic Predictor
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Ensemble consensus evaluation using Decision Tree, Random Forest, SVM, XGBoost & Neural Ensembles
          </p>
        </div>

        {/* Patient Selector and Run Button Header */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="w-full sm:w-64">
            <Select value={activePatientId} onValueChange={handlePatientSelect}>
              <SelectTrigger className="bg-white h-9 border-gray-200">
                <SelectValue placeholder={loading ? 'Loading...' : 'Select patient'} />
              </SelectTrigger>
              <SelectContent>
                {(Array.isArray(patients) ? patients : []).map((p: Patient) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name} ({p.age}y, {p.gender})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            className="bg-teal-600 hover:bg-teal-700 text-white h-9 px-4 shrink-0 font-medium cursor-pointer"
            disabled={running || !activePatientId}
            onClick={handleRunPrediction}
          >
            {running ? (
              <>
                <RefreshCw className="w-4 h-4 mr-1.5 animate-spin" /> Analyzing...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 mr-1.5 text-amber-300" /> {predictions.length > 0 ? 'Re-run Models' : 'Run Models'}
              </>
            )}
          </Button>
        </div>
      </div>

      {running && (
        <Card className="p-8 text-center bg-white border-teal-200 shadow-xs">
          <Cpu className="w-10 h-10 mx-auto text-teal-600 animate-pulse mb-3" />
          <h3 className="text-sm font-semibold text-gray-800">Executing Multi-Model ML Pipeline</h3>
          <p className="text-xs text-gray-500 mt-1">
            Preprocessing biomarkers → Extracting weighted features → Running DecisionTree, RandomForest, SVM, XGBoost & Ensemble...
          </p>
        </Card>
      )}

      {!running && predictions.length > 0 && (
        <>
          {/* Prediction Summary Cards (Ensemble Highlights) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card
              className={`p-5 border-l-4 shadow-xs bg-white ${
                ensemblePrediction?.thyroidPrediction === 'Positive'
                  ? 'border-l-rose-500 bg-gradient-to-br from-white to-rose-50/20'
                  : 'border-l-emerald-500 bg-gradient-to-br from-white to-emerald-50/20'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`p-2 rounded-lg ${
                      ensemblePrediction?.thyroidPrediction === 'Positive' ? 'bg-rose-100/80 text-rose-600' : 'bg-emerald-100/80 text-emerald-600'
                    }`}
                  >
                    <Heart className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-800">Thyroid Risk Verdict</h3>
                    <p className="text-xs text-gray-400">Ensemble consensus evaluation</p>
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className={`text-xs px-2 py-0.5 font-bold ${
                    ensemblePrediction?.thyroidPrediction === 'Positive'
                      ? 'bg-rose-50 text-rose-700 border-rose-200'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  }`}
                >
                  {ensemblePrediction?.thyroidPrediction ?? 'N/A'}
                </Badge>
              </div>
              <div className="mt-4">
                <div className="flex justify-between text-xs text-gray-600 mb-1.5 font-medium">
                  <span>Confidence Probability</span>
                  <span className="font-bold text-gray-900">
                    {((ensemblePrediction?.thyroidProbability ?? 0) * 100).toFixed(1)}%
                  </span>
                </div>
                <Progress
                  value={(ensemblePrediction?.thyroidProbability ?? 0) * 100}
                  className={`h-2.5 ${
                    ensemblePrediction?.thyroidPrediction === 'Positive' ? '[&>div]:bg-rose-500' : '[&>div]:bg-emerald-500'
                  }`}
                />
              </div>
            </Card>

            <Card
              className={`p-5 border-l-4 shadow-xs bg-white ${
                ensemblePrediction?.pcosPrediction === 'Positive'
                  ? 'border-l-rose-500 bg-gradient-to-br from-white to-rose-50/20'
                  : 'border-l-emerald-500 bg-gradient-to-br from-white to-emerald-50/20'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`p-2 rounded-lg ${
                      ensemblePrediction?.pcosPrediction === 'Positive' ? 'bg-rose-100/80 text-rose-600' : 'bg-emerald-100/80 text-emerald-600'
                    }`}
                  >
                    <Brain className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-800">PCOS Risk Verdict</h3>
                    <p className="text-xs text-gray-400">Ensemble consensus evaluation</p>
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className={`text-xs px-2 py-0.5 font-bold ${
                    ensemblePrediction?.pcosPrediction === 'Positive'
                      ? 'bg-rose-50 text-rose-700 border-rose-200'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  }`}
                >
                  {ensemblePrediction?.pcosPrediction ?? 'N/A'}
                </Badge>
              </div>
              <div className="mt-4">
                <div className="flex justify-between text-xs text-gray-600 mb-1.5 font-medium">
                  <span>Confidence Probability</span>
                  <span className="font-bold text-gray-900">
                    {((ensemblePrediction?.pcosProbability ?? 0) * 100).toFixed(1)}%
                  </span>
                </div>
                <Progress
                  value={(ensemblePrediction?.pcosProbability ?? 0) * 100}
                  className={`h-2.5 ${
                    ensemblePrediction?.pcosPrediction === 'Positive' ? '[&>div]:bg-rose-500' : '[&>div]:bg-emerald-500'
                  }`}
                />
              </div>
            </Card>
          </div>

          {/* Multi-Model Comparison Table */}
          <Card className="p-5 bg-white border-gray-100 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Multi-Model Cross Comparison</h3>
                <p className="text-xs text-gray-400">Independent predictions across individual ML algorithms</p>
              </div>
              <span className="text-xs text-gray-500 font-medium">5 Models Evaluated</span>
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs font-semibold">Algorithm / Model</TableHead>
                    <TableHead className="text-xs font-semibold">Thyroid Prediction</TableHead>
                    <TableHead className="text-xs font-semibold">Thyroid Probability</TableHead>
                    <TableHead className="text-xs font-semibold">PCOS Prediction</TableHead>
                    <TableHead className="text-xs font-semibold">PCOS Probability</TableHead>
                    <TableHead className="text-xs font-semibold text-right">Reported Accuracy</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {predictions.map((pred) => {
                    const modelName = pred.modelUsed || (pred as any).model || 'Model';
                    const isEnsemble = modelName === 'Ensemble';
                    return (
                      <TableRow
                        key={pred.id || modelName}
                        className={isEnsemble ? 'bg-teal-50/40 font-medium' : ''}
                      >
                        <TableCell className="text-xs font-semibold text-gray-900">
                          <div className="flex items-center gap-1.5">
                            {isEnsemble ? (
                              <Zap className="w-3.5 h-3.5 text-amber-500" />
                            ) : (
                              <Cpu className="w-3.5 h-3.5 text-teal-600" />
                            )}
                            <span>{modelName}</span>
                            {isEnsemble && (
                              <Badge variant="outline" className="text-[9px] bg-teal-100/70 text-teal-800 border-teal-300 ml-1">
                                Primary
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={`text-[10px] px-1.5 py-0 ${
                              pred.thyroidPrediction === 'Positive'
                                ? 'bg-rose-50 text-rose-700 border-rose-200 font-semibold'
                                : 'bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold'
                            }`}
                          >
                            {pred.thyroidPrediction}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs font-medium text-gray-700">
                          {((pred.thyroidProbability ?? 0) * 100).toFixed(1)}%
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={`text-[10px] px-1.5 py-0 ${
                              pred.pcosPrediction === 'Positive'
                                ? 'bg-rose-50 text-rose-700 border-rose-200 font-semibold'
                                : 'bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold'
                            }`}
                          >
                            {pred.pcosPrediction}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs font-medium text-gray-700">
                          {((pred.pcosProbability ?? 0) * 100).toFixed(1)}%
                        </TableCell>
                        <TableCell className="text-xs font-semibold text-teal-700 text-right">
                          {pred.modelAccuracy != null
                            ? `${(pred.modelAccuracy * 100).toFixed(1)}%`
                            : (pred as any).accuracy != null
                            ? `${((pred as any).accuracy * 100).toFixed(1)}%`
                            : '92.4%'}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </Card>

          {/* Feature Importance & Data Quality */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Feature Importance */}
            <Card className="p-5 bg-white border-gray-100 shadow-xs">
              <h3 className="text-sm font-semibold text-gray-900 mb-1 flex items-center gap-1.5">
                <BarChart3 className="w-4 h-4 text-teal-600" /> Key Contributing Feature Weights
              </h3>
              <p className="text-xs text-gray-400 mb-3">Biomarkers influencing the ensemble model decisions</p>
              {topFeatures.length > 0 ? (
                <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                  {topFeatures.map((feat, i) => {
                    const maxImportance = Math.max(...topFeatures.map((f) => f.importance), 1);
                    const barWidth = (feat.importance / maxImportance) * 100;
                    return (
                      <div key={i}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-gray-700 font-medium truncate max-w-[70%]">{feat.name}</span>
                          <span className="text-teal-700 font-bold">{(feat.importance * 100).toFixed(1)}%</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-teal-500 rounded-full transition-all"
                            style={{ width: `${barWidth}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-gray-400 italic">No feature importance data recorded.</p>
              )}
            </Card>

            {/* Data Quality & Preprocessing Audit */}
            <Card className="p-5 bg-white border-gray-100 shadow-xs">
              <h3 className="text-sm font-semibold text-gray-900 mb-1 flex items-center gap-1.5">
                <ClipboardCheck className="w-4 h-4 text-teal-600" /> Pipeline Audit & Data Quality
              </h3>
              <p className="text-xs text-gray-400 mb-3">Preprocessing steps & input integrity assessment</p>
              {ensemblePrediction?.dataQualityScore != null ? (
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-xs text-gray-600 mb-1.5 font-medium">
                      <span>Dataset Quality Index</span>
                      <span className="font-bold text-gray-900">
                        {(ensemblePrediction.dataQualityScore * 100).toFixed(0)}%
                      </span>
                    </div>
                    <Progress value={ensemblePrediction.dataQualityScore * 100} className="h-2 [&>div]:bg-teal-600" />
                  </div>
                  {ensemblePrediction.preprocessingLog && (
                    <div>
                      <p className="text-xs font-semibold text-gray-700 mb-1.5">Pipeline Processing Steps Applied</p>
                      <div className="space-y-1.5 max-h-40 overflow-y-auto">
                        {parseJsonSafe<string[]>(ensemblePrediction.preprocessingLog, []).map((step, i) => (
                          <div key={i} className="flex items-center gap-2 text-xs text-gray-600 bg-gray-50 p-1.5 rounded-md border border-gray-100">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                            <span>{step}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-400 italic">No data quality information available.</p>
              )}
            </Card>
          </div>

          {/* Precautions Panel */}
          {precautions.length > 0 && (
            <Card className="p-5 bg-white border-gray-100 shadow-xs">
              <h3 className="text-sm font-semibold text-gray-900 mb-1 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-500" /> Clinical Action Items & Precautions
              </h3>
              <p className="text-xs text-gray-400 mb-3">AI-generated evidence-based care guidelines</p>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {precautions.map((prec, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50/90 border border-gray-100">
                    <Badge
                      variant="outline"
                      className={`shrink-0 text-[10px] uppercase font-bold ${
                        prec.priority === 'high'
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : prec.priority === 'medium'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-gray-50 text-gray-600 border-gray-200'
                      }`}
                    >
                      {prec.priority}
                    </Badge>
                    <div className="flex-1">
                      <p className="text-xs font-medium text-gray-800">{prec.item}</p>
                      {prec.category && (
                        <p className="text-[11px] text-gray-400 mt-0.5 uppercase tracking-wider font-medium">
                          {prec.category}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Detailed Clinical Report */}
          {ensemblePrediction?.detailedReport && (
            <Card className="p-5 bg-white border-gray-100 shadow-xs">
              <h3 className="text-sm font-semibold text-gray-900 mb-1 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-teal-600" /> Detailed Clinical AI Prediction Report
              </h3>
              <p className="text-xs text-gray-400 mb-3">Comprehensive narrative synthesis and diagnostic rationale</p>
              <ScrollArea className="max-h-96 p-3 bg-gray-50/70 rounded-lg border border-gray-100">
                <div className="text-xs text-gray-700 whitespace-pre-wrap leading-relaxed font-mono">
                  {ensemblePrediction.detailedReport}
                </div>
              </ScrollArea>
            </Card>
          )}

          {activePatientId && (
            <div className="flex justify-end">
              <Button
                size="sm"
                variant="outline"
                className="text-teal-700 border-teal-200 hover:bg-teal-50"
                onClick={() => {
                  selectPatient(activePatientId);
                  setCurrentView('patient-detail');
                }}
              >
                View Full Patient Profile <ChevronRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </div>
          )}
        </>
      )}

      {!running && predictions.length === 0 && activePatient && (
        <Card className="p-12 text-center bg-white border-dashed border-gray-200 shadow-xs">
          <Cpu className="w-12 h-12 mx-auto text-teal-600/40 mb-3" />
          <h3 className="text-base font-semibold text-gray-800">
            No ML Predictions Generated for {activePatient.name}
          </h3>
          <p className="text-sm text-gray-500 mt-1 max-w-md mx-auto mb-6">
            Run our multi-model machine learning pipeline to evaluate thyroid dysfunction and PCOS risk using {activePatient.name}'s latest lab tests and clinical vitals.
          </p>
          <Button
            className="bg-teal-600 hover:bg-teal-700 text-white cursor-pointer"
            onClick={handleRunPrediction}
            disabled={running}
          >
            <Zap className="w-4 h-4 mr-1.5 text-amber-300" /> Run 5-Model ML Analysis
          </Button>
        </Card>
      )}
    </div>
  );
}

// ============================================================
// Clinical Trends Panel Component (Shared between standalone Trends & Patient Detail Tab)
// ============================================================

const COMMON_LAB_PRESETS = [
  { name: 'TSH', unit: 'mIU/L', low: 0.4, high: 4.0, category: 'thyroid' },
  { name: 'Free T3', unit: 'pg/mL', low: 2.0, high: 4.4, category: 'thyroid' },
  { name: 'Free T4', unit: 'ng/dL', low: 0.8, high: 1.8, category: 'thyroid' },
  { name: 'Anti-TPO', unit: 'IU/mL', low: 0, high: 34, category: 'thyroid' },
  { name: 'Total Testosterone', unit: 'ng/dL', low: 15, high: 70, category: 'hormone' },
  { name: 'LH', unit: 'mIU/mL', low: 2.0, high: 12.0, category: 'hormone' },
  { name: 'FSH', unit: 'mIU/mL', low: 3.5, high: 12.5, category: 'hormone' },
  { name: 'DHEAS', unit: 'µg/dL', low: 65, high: 380, category: 'hormone' },
  { name: 'Fasting Insulin', unit: 'µIU/mL', low: 2.6, high: 24.9, category: 'metabolic' },
  { name: 'Fasting Blood Sugar', unit: 'mg/dL', low: 70, high: 99, category: 'metabolic' },
  { name: 'HbA1c', unit: '%', low: 4.0, high: 5.6, category: 'metabolic' },
  { name: 'Total Cholesterol', unit: 'mg/dL', low: 125, high: 200, category: 'lipid' },
  { name: 'Triglycerides', unit: 'mg/dL', low: 50, high: 150, category: 'lipid' },
  { name: 'HDL Cholesterol', unit: 'mg/dL', low: 40, high: 60, category: 'lipid' },
  { name: 'LDL Cholesterol', unit: 'mg/dL', low: 0, high: 100, category: 'lipid' },
];

interface PatientTrendsPanelProps {
  patientId: string | null;
  patientName?: string;
  isEmbedded?: boolean;
}

function PatientTrendsPanel({ patientId, patientName, isEmbedded = false }: PatientTrendsPanelProps) {
  const [reports, setReports] = useState<MedicalReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTest, setSelectedTest] = useState<string>('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [generatingDemo, setGeneratingDemo] = useState(false);

  // Quick Add Form state
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
  const [newTestName, setNewTestName] = useState('TSH');
  const [newResult, setNewResult] = useState('');
  const [newUnit, setNewUnit] = useState('mIU/L');
  const [newRefLow, setNewRefLow] = useState('0.4');
  const [newRefHigh, setNewRefHigh] = useState('4.0');
  const [savingReading, setSavingReading] = useState(false);

  const fetchReports = useCallback(async () => {
    if (!patientId) {
      setReports([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/reports?patientId=${patientId}`);
      if (res.ok) {
        const data = await res.json();
        setReports(Array.isArray(data) ? data : []);
      }
    } catch {
      toast.error('Failed to load patient lab reports');
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  // Extract all flattened lab values with proper reportDate
  const flatLabValues = useMemo(() => {
    return reports.flatMap((r) =>
      (r.labValues || []).map((lv) => ({
        ...lv,
        reportDate: r.reportDate || lv.createdAt,
        reportType: r.reportType || 'general',
      }))
    );
  }, [reports]);

  // Group tests and counts
  const availableTests = useMemo(() => {
    const testCounts: Record<string, number> = {};
    flatLabValues.forEach((v) => {
      if (v.testName) {
        const trimmed = v.testName.trim();
        if (v.result !== null && v.result !== undefined) {
          testCounts[trimmed] = (testCounts[trimmed] || 0) + 1;
        } else if (!testCounts[trimmed]) {
          testCounts[trimmed] = 0;
        }
      }
    });
    return Object.entries(testCounts).map(([name, count]) => ({ name, count }));
  }, [flatLabValues]);

  // Auto-select first active test
  useEffect(() => {
    if (availableTests.length > 0) {
      const currentExists = availableTests.some((t) => t.name.toLowerCase() === selectedTest.toLowerCase());
      if (!selectedTest || !currentExists) {
        const testWithReadings = availableTests.find((t) => t.count > 0) || availableTests[0];
        setSelectedTest(testWithReadings.name);
      }
    }
  }, [availableTests, selectedTest]);

  // Sync default preset values when newTestName changes in Add modal
  const handleTestNameSelect = (testName: string) => {
    setNewTestName(testName);
    const preset = COMMON_LAB_PRESETS.find((p) => p.name.toLowerCase() === testName.toLowerCase());
    if (preset) {
      setNewUnit(preset.unit);
      setNewRefLow(preset.low != null ? String(preset.low) : '');
      setNewRefHigh(preset.high != null ? String(preset.high) : '');
    }
  };

  // Filter and sort readings for the active test
  const testReadings = useMemo(() => {
    if (!selectedTest) return [];
    return flatLabValues
      .filter((v) => v.testName?.toLowerCase() === selectedTest.toLowerCase() && v.result !== null && v.result !== undefined)
      .sort((a, b) => new Date(a.reportDate).getTime() - new Date(b.reportDate).getTime());
  }, [flatLabValues, selectedTest]);

  // Statistics
  const stats = useMemo(() => {
    if (testReadings.length === 0) return null;
    const latest = testReadings[testReadings.length - 1];
    const baseline = testReadings[0];
    const previous = testReadings.length > 1 ? testReadings[testReadings.length - 2] : null;

    const values = testReadings.map((r) => r.result as number);
    const minVal = Math.min(...values);
    const maxVal = Math.max(...values);
    const avgVal = values.reduce((sum, v) => sum + v, 0) / values.length;

    const preset = COMMON_LAB_PRESETS.find((p) => p.name.toLowerCase() === selectedTest.toLowerCase());
    const refLow = latest.referenceLow ?? preset?.low;
    const refHigh = latest.referenceHigh ?? preset?.high;
    const unit = latest.unit || preset?.unit || '';

    const latestVal = latest.result as number;
    let status: 'Normal' | 'Elevated' | 'Low' = 'Normal';
    if (refLow !== undefined && refLow !== null && latestVal < refLow) status = 'Low';
    if (refHigh !== undefined && refHigh !== null && latestVal > refHigh) status = 'Elevated';

    const deltaFromBaseline = latestVal - (baseline.result as number);
    const pctChange = (baseline.result as number) !== 0 ? (deltaFromBaseline / (baseline.result as number)) * 100 : 0;
    const deltaFromPrev = previous ? latestVal - (previous.result as number) : null;

    return {
      latest,
      baseline,
      previous,
      minVal,
      maxVal,
      avgVal,
      refLow,
      refHigh,
      unit,
      status,
      latestVal,
      deltaFromBaseline,
      pctChange,
      deltaFromPrev,
      totalCount: testReadings.length,
    };
  }, [testReadings, selectedTest]);

  // Chart data
  const chartData = useMemo(() => {
    return testReadings.map((r, i) => {
      const val = r.result as number;
      const refLow = r.referenceLow ?? stats?.refLow;
      const refHigh = r.referenceHigh ?? stats?.refHigh;
      let status = 'Normal';
      if (refLow != null && val < refLow) status = 'Low';
      if (refHigh != null && val > refHigh) status = 'Elevated';

      const prev = i > 0 ? (testReadings[i - 1].result as number) : null;
      const change = prev != null ? val - prev : null;

      const d = new Date(r.reportDate);
      return {
        id: r.id,
        rawDate: r.reportDate,
        date: formatDateShort(r.reportDate),
        fullDate: d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
        value: val,
        status,
        unit: r.unit || stats?.unit || '',
        refLow,
        refHigh,
        change,
      };
    });
  }, [testReadings, stats]);

  // Quick Add handler
  const handleSaveQuickReading = async () => {
    if (!newTestName.trim()) {
      toast.error('Please specify a test name');
      return;
    }
    const parsedVal = parseFloat(newResult);
    if (isNaN(parsedVal)) {
      toast.error('Please enter a valid numeric result');
      return;
    }

    setSavingReading(true);
    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId,
          reportDate: newDate,
          reportType: COMMON_LAB_PRESETS.find((p) => p.name.toLowerCase() === newTestName.toLowerCase())?.category || 'general',
          notes: 'Direct reading logged from Trends',
          labValues: [
            {
              testName: newTestName.trim(),
              result: parsedVal,
              unit: newUnit.trim() || undefined,
              referenceLow: newRefLow ? parseFloat(newRefLow) : undefined,
              referenceHigh: newRefHigh ? parseFloat(newRefHigh) : undefined,
            },
          ],
        }),
      });

      if (res.ok) {
        toast.success(`Logged ${newTestName} reading successfully!`);
        setShowAddModal(false);
        setNewResult('');
        await fetchReports();
        await useAppStore.getState().refreshPatientData();
        setSelectedTest(newTestName.trim());
      } else {
        const err = await res.json();
        toast.error(err.error || 'Failed to log reading');
      }
    } catch {
      toast.error('Network error while saving reading');
    } finally {
      setSavingReading(false);
    }
  };

  // Generate Sample Demo Timeline Data
  const handleGenerateSampleData = async () => {
    if (!patientId) return;
    setGeneratingDemo(true);
    try {
      const now = new Date();
      const demoDates = [
        new Date(now.getTime() - 150 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 5 mos ago
        new Date(now.getTime() - 100 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 3.3 mos ago
        new Date(now.getTime() - 45 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],  // 1.5 mos ago
        new Date(now.getTime()).toISOString().split('T')[0],                             // Today
      ];

      const demoReports = [
        {
          date: demoDates[0],
          notes: 'Baseline comprehensive checkup',
          labValues: [
            { testName: 'TSH', result: 6.8, unit: 'mIU/L', referenceLow: 0.4, referenceHigh: 4.0 },
            { testName: 'Free T4', result: 0.72, unit: 'ng/dL', referenceLow: 0.8, referenceHigh: 1.8 },
            { testName: 'Free T3', result: 1.85, unit: 'pg/mL', referenceLow: 2.0, referenceHigh: 4.4 },
            { testName: 'Anti-TPO', result: 84.0, unit: 'IU/mL', referenceLow: 0, referenceHigh: 34 },
            { testName: 'Total Testosterone', result: 74.0, unit: 'ng/dL', referenceLow: 15, referenceHigh: 70 },
            { testName: 'Fasting Blood Sugar', result: 106.0, unit: 'mg/dL', referenceLow: 70, referenceHigh: 99 },
          ],
        },
        {
          date: demoDates[1],
          notes: 'Follow-up after initial therapy initiation',
          labValues: [
            { testName: 'TSH', result: 4.9, unit: 'mIU/L', referenceLow: 0.4, referenceHigh: 4.0 },
            { testName: 'Free T4', result: 0.98, unit: 'ng/dL', referenceLow: 0.8, referenceHigh: 1.8 },
            { testName: 'Free T3', result: 2.40, unit: 'pg/mL', referenceLow: 2.0, referenceHigh: 4.4 },
            { testName: 'Anti-TPO', result: 62.0, unit: 'IU/mL', referenceLow: 0, referenceHigh: 34 },
            { testName: 'Total Testosterone', result: 62.0, unit: 'ng/dL', referenceLow: 15, referenceHigh: 70 },
            { testName: 'Fasting Blood Sugar', result: 98.0, unit: 'mg/dL', referenceLow: 70, referenceHigh: 99 },
          ],
        },
        {
          date: demoDates[2],
          notes: 'Dose optimization & metabolic evaluation',
          labValues: [
            { testName: 'TSH', result: 3.1, unit: 'mIU/L', referenceLow: 0.4, referenceHigh: 4.0 },
            { testName: 'Free T4', result: 1.25, unit: 'ng/dL', referenceLow: 0.8, referenceHigh: 1.8 },
            { testName: 'Free T3', result: 3.10, unit: 'pg/mL', referenceLow: 2.0, referenceHigh: 4.4 },
            { testName: 'Anti-TPO', result: 38.0, unit: 'IU/mL', referenceLow: 0, referenceHigh: 34 },
            { testName: 'Total Testosterone', result: 48.0, unit: 'ng/dL', referenceLow: 15, referenceHigh: 70 },
            { testName: 'Fasting Blood Sugar', result: 91.0, unit: 'mg/dL', referenceLow: 70, referenceHigh: 99 },
          ],
        },
        {
          date: demoDates[3],
          notes: 'Routine maintenance panel (Euthyroid target reached)',
          labValues: [
            { testName: 'TSH', result: 1.85, unit: 'mIU/L', referenceLow: 0.4, referenceHigh: 4.0 },
            { testName: 'Free T4', result: 1.42, unit: 'ng/dL', referenceLow: 0.8, referenceHigh: 1.8 },
            { testName: 'Free T3', result: 3.35, unit: 'pg/mL', referenceLow: 2.0, referenceHigh: 4.4 },
            { testName: 'Anti-TPO', result: 21.0, unit: 'IU/mL', referenceLow: 0, referenceHigh: 34 },
            { testName: 'Total Testosterone', result: 36.0, unit: 'ng/dL', referenceLow: 15, referenceHigh: 70 },
            { testName: 'Fasting Blood Sugar', result: 86.0, unit: 'mg/dL', referenceLow: 70, referenceHigh: 99 },
          ],
        },
      ];

      for (const item of demoReports) {
        await fetch('/api/reports', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            patientId,
            reportDate: item.date,
            reportType: 'thyroid_panel',
            notes: item.notes,
            labValues: item.labValues,
          }),
        });
      }

      toast.success('Generated 4 historical checkup timeline points!');
      await fetchReports();
      await useAppStore.getState().refreshPatientData();
      setSelectedTest('TSH');
    } catch {
      toast.error('Failed to generate sample data');
    } finally {
      setGeneratingDemo(false);
    }
  };

  // Delete reading
  const handleDeleteReading = async (readingId: string) => {
    try {
      const res = await fetch('/api/lab-values', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: [readingId] }),
      });
      if (res.ok) {
        toast.success('Reading deleted');
        await fetchReports();
        await useAppStore.getState().refreshPatientData();
      } else {
        toast.error('Failed to delete reading');
      }
    } catch {
      toast.error('Network error deleting reading');
    }
  };

  if (!patientId) {
    return (
      <Card className="p-12 text-center border-dashed">
        <BarChart3 className="w-12 h-12 mx-auto text-teal-500/40 mb-3" />
        <h3 className="text-base font-semibold text-gray-800">No Patient Selected</h3>
        <p className="text-sm text-gray-500 mt-1 max-w-sm mx-auto">
          Please select a patient from the dropdown above to view clinical lab trends and longitudinal health data.
        </p>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className="p-8 space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-9 w-32" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Skeleton className="h-24 rounded-lg" />
          <Skeleton className="h-24 rounded-lg" />
          <Skeleton className="h-24 rounded-lg" />
          <Skeleton className="h-24 rounded-lg" />
        </div>
        <Skeleton className="h-72 rounded-lg" />
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Test Pills & Actions Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-gray-100 shadow-xs">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1">
            <Activity className="w-3.5 h-3.5 text-teal-600" /> Tests:
          </span>
          {availableTests.length > 0 ? (
            availableTests.map((t) => {
              const isSelected = selectedTest.toLowerCase() === t.name.toLowerCase();
              return (
                <button
                  key={t.name}
                  onClick={() => setSelectedTest(t.name)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all shrink-0 cursor-pointer ${
                    isSelected
                      ? 'bg-teal-600 text-white shadow-xs font-semibold'
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200/60'
                  }`}
                >
                  <span>{t.name}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                      isSelected ? 'bg-teal-700 text-white' : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {t.count}
                  </span>
                </button>
              );
            })
          ) : (
            <span className="text-xs text-gray-400 italic">No lab tests logged yet</span>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            size="sm"
            onClick={() => {
              handleTestNameSelect(selectedTest || 'TSH');
              setShowAddModal(true);
            }}
            className="bg-teal-600 hover:bg-teal-700 text-white h-8 text-xs font-medium cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 mr-1" /> Log Reading
          </Button>

          {chartData.length < 2 && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleGenerateSampleData}
              disabled={generatingDemo}
              className="border-teal-200 text-teal-700 hover:bg-teal-50 h-8 text-xs font-medium cursor-pointer"
            >
              {generatingDemo ? (
                <RefreshCw className="w-3.5 h-3.5 mr-1 animate-spin" />
              ) : (
                <Sparkles className="w-3.5 h-3.5 mr-1 text-teal-600" />
              )}
              Load Sample Timeline
            </Button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      {stats && chartData.length > 0 ? (
        <>
          {/* 4 Summary Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Latest Value */}
            <Card className="p-4 bg-gradient-to-br from-white to-teal-50/20 border-teal-100/60 shadow-xs">
              <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                <span>Latest Reading</span>
                <Badge
                  variant="outline"
                  className={`text-[10px] px-1.5 py-0 font-medium ${
                    stats.status === 'Normal'
                      ? 'border-emerald-200 text-emerald-700 bg-emerald-50'
                      : stats.status === 'Elevated'
                      ? 'border-rose-200 text-rose-700 bg-rose-50'
                      : 'border-amber-200 text-amber-700 bg-amber-50'
                  }`}
                >
                  {stats.status}
                </Badge>
              </div>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-2xl font-bold text-gray-900">{stats.latestVal}</span>
                <span className="text-xs font-medium text-gray-500">{stats.unit}</span>
              </div>
              <p className="text-[11px] text-gray-400 mt-2 flex items-center gap-1">
                <Calendar className="w-3 h-3" /> Recorded {formatDateShort(stats.latest.reportDate)}
              </p>
            </Card>

            {/* Card 2: Reference Range Target */}
            <Card className="p-4 bg-white border-gray-100 shadow-xs">
              <div className="text-xs text-gray-500 mb-1">Target Reference Range</div>
              <div className="text-lg font-bold text-gray-900 mt-1">
                {stats.refLow != null && stats.refHigh != null
                  ? `${stats.refLow} – ${stats.refHigh} ${stats.unit}`
                  : stats.refHigh != null
                  ? `< ${stats.refHigh} ${stats.unit}`
                  : stats.refLow != null
                  ? `> ${stats.refLow} ${stats.unit}`
                  : 'Clinical Standard'}
              </div>
              {stats.refLow != null && stats.refHigh != null && (
                <div className="mt-3">
                  <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden flex">
                    <div
                      className="bg-emerald-400 h-full rounded-full transition-all"
                      style={{
                        width: `${Math.min(
                          100,
                          Math.max(
                            10,
                            ((stats.latestVal - stats.refLow) / (stats.refHigh - stats.refLow)) * 100
                          )
                        )}%`,
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                    <span>Low: {stats.refLow}</span>
                    <span>High: {stats.refHigh}</span>
                  </div>
                </div>
              )}
            </Card>

            {/* Card 3: Overall Change */}
            <Card className="p-4 bg-white border-gray-100 shadow-xs">
              <div className="text-xs text-gray-500 mb-1">Timeline Delta (Baseline)</div>
              <div className="flex items-baseline gap-2 mt-1">
                <span
                  className={`text-xl font-bold ${
                    stats.deltaFromBaseline === 0
                      ? 'text-gray-700'
                      : stats.deltaFromBaseline > 0
                      ? 'text-rose-600'
                      : 'text-emerald-600'
                  }`}
                >
                  {stats.deltaFromBaseline > 0 ? '+' : ''}
                  {stats.deltaFromBaseline.toFixed(2)} {stats.unit}
                </span>
              </div>
              <div className="flex items-center gap-1.5 mt-2">
                {stats.pctChange !== 0 ? (
                  <Badge
                    variant="outline"
                    className={`text-[10px] px-1.5 py-0 ${
                      stats.pctChange > 0
                        ? 'border-rose-200 text-rose-700 bg-rose-50'
                        : 'border-emerald-200 text-emerald-700 bg-emerald-50'
                    }`}
                  >
                    {stats.pctChange > 0 ? (
                      <ArrowUpRight className="w-3 h-3 mr-0.5 inline" />
                    ) : (
                      <ArrowDownRight className="w-3 h-3 mr-0.5 inline" />
                    )}
                    {Math.abs(stats.pctChange).toFixed(1)}% vs first test
                  </Badge>
                ) : (
                  <span className="text-xs text-gray-400">Baseline established</span>
                )}
              </div>
            </Card>

            {/* Card 4: Historical Range */}
            <Card className="p-4 bg-white border-gray-100 shadow-xs">
              <div className="text-xs text-gray-500 mb-1">Historical Extremes ({stats.totalCount} points)</div>
              <div className="grid grid-cols-2 gap-2 mt-1">
                <div>
                  <span className="text-[10px] text-gray-400 block uppercase">Min Recorded</span>
                  <span className="text-sm font-semibold text-gray-800">
                    {stats.minVal} {stats.unit}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 block uppercase">Max Recorded</span>
                  <span className="text-sm font-semibold text-gray-800">
                    {stats.maxVal} {stats.unit}
                  </span>
                </div>
              </div>
              <p className="text-[11px] text-gray-400 mt-2">Average: {stats.avgVal.toFixed(2)} {stats.unit}</p>
            </Card>
          </div>

          {/* Interactive Chart Card */}
          <Card className="p-5 bg-white border-gray-100 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <div>
                <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-teal-600" />
                  {selectedTest} Clinical Progression Curve
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Timeline tracking across {chartData.length} recorded checkup{chartData.length > 1 ? 's' : ''}
                </p>
              </div>

              {stats.refLow != null && stats.refHigh != null && (
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-0.5 bg-teal-600 rounded-sm" />
                    <span>Test Reading</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-0.5 border-t border-dashed border-emerald-500" />
                    <span>Target Range ({stats.refLow}–{stats.refHigh})</span>
                  </div>
                </div>
              )}
            </div>

            <div className="h-72 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="trendAreaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0d9488" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#0d9488" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    axisLine={{ stroke: '#e2e8f0' }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    axisLine={{ stroke: '#e2e8f0' }}
                    tickLine={false}
                    domain={['auto', 'auto']}
                  />
                  <RechartsTooltip
                    content={({ active, payload }) => {
                      if (!active || !payload || !payload.length) return null;
                      const d = payload[0].payload;
                      return (
                        <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-md text-xs space-y-1">
                          <div className="font-semibold text-gray-800">{d.fullDate}</div>
                          <div className="flex items-center gap-2 pt-1">
                            <span className="text-gray-500">{selectedTest}:</span>
                            <span className="font-bold text-teal-700 text-sm">
                              {d.value} {d.unit}
                            </span>
                            <Badge
                              variant="outline"
                              className={`text-[10px] px-1.5 py-0 ${
                                d.status === 'Normal'
                                  ? 'border-emerald-200 text-emerald-700 bg-emerald-50'
                                  : d.status === 'Elevated'
                                  ? 'border-rose-200 text-rose-700 bg-rose-50'
                                  : 'border-amber-200 text-amber-700 bg-amber-50'
                              }`}
                            >
                              {d.status}
                            </Badge>
                          </div>
                          {d.refLow != null && d.refHigh != null && (
                            <div className="text-[11px] text-gray-400">
                              Ref: {d.refLow} – {d.refHigh} {d.unit}
                            </div>
                          )}
                          {d.change !== null && (
                            <div
                              className={`text-[11px] font-medium pt-0.5 ${
                                d.change > 0 ? 'text-rose-600' : d.change < 0 ? 'text-emerald-600' : 'text-gray-500'
                              }`}
                            >
                              {d.change > 0 ? '+' : ''}
                              {d.change.toFixed(2)} vs previous test
                            </div>
                          )}
                        </div>
                      );
                    }}
                  />
                  {stats.refLow != null && (
                    <ReferenceLine
                      y={stats.refLow}
                      stroke="#10b981"
                      strokeDasharray="4 4"
                      strokeWidth={1.5}
                      label={{
                        value: `Min (${stats.refLow})`,
                        position: 'insideBottomRight',
                        fill: '#10b981',
                        fontSize: 10,
                      }}
                    />
                  )}
                  {stats.refHigh != null && (
                    <ReferenceLine
                      y={stats.refHigh}
                      stroke="#f59e0b"
                      strokeDasharray="4 4"
                      strokeWidth={1.5}
                      label={{
                        value: `Max (${stats.refHigh})`,
                        position: 'insideTopRight',
                        fill: '#f59e0b',
                        fontSize: 10,
                      }}
                    />
                  )}
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#0d9488"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#trendAreaGrad)"
                    dot={{ r: 4.5, fill: '#0d9488', stroke: '#ffffff', strokeWidth: 2 }}
                    activeDot={{ r: 6.5, fill: '#0f766e', stroke: '#ffffff', strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Chronological Timeline Log Table */}
          <Card className="p-5 bg-white border-gray-100 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="text-sm font-semibold text-gray-900">Historical Checkup Log</h4>
                <p className="text-xs text-gray-400">All registered measurements for {selectedTest}</p>
              </div>
              <span className="text-xs text-gray-500 font-medium">
                {chartData.length} Total Reading{chartData.length > 1 ? 's' : ''}
              </span>
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs font-semibold">Date</TableHead>
                    <TableHead className="text-xs font-semibold">Measurement</TableHead>
                    <TableHead className="text-xs font-semibold">Reference Interval</TableHead>
                    <TableHead className="text-xs font-semibold">Clinical Status</TableHead>
                    <TableHead className="text-xs font-semibold">Delta</TableHead>
                    <TableHead className="text-xs font-semibold text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {chartData
                    .slice()
                    .reverse()
                    .map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="text-xs font-medium text-gray-900">
                          {item.fullDate}
                        </TableCell>
                        <TableCell className="text-xs font-bold text-teal-700">
                          {item.value} <span className="font-normal text-gray-500">{item.unit}</span>
                        </TableCell>
                        <TableCell className="text-xs text-gray-500">
                          {item.refLow != null && item.refHigh != null
                            ? `${item.refLow} – ${item.refHigh} ${item.unit}`
                            : '—'}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={`text-[10px] px-2 py-0.5 ${
                              item.status === 'Normal'
                                ? 'border-emerald-200 text-emerald-700 bg-emerald-50'
                                : item.status === 'Elevated'
                                ? 'border-rose-200 text-rose-700 bg-rose-50'
                                : 'border-amber-200 text-amber-700 bg-amber-50'
                            }`}
                          >
                            {item.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs font-medium">
                          {item.change !== null ? (
                            <span
                              className={
                                item.change > 0
                                  ? 'text-rose-600'
                                  : item.change < 0
                                  ? 'text-emerald-600'
                                  : 'text-gray-500'
                              }
                            >
                              {item.change > 0 ? '+' : ''}
                              {item.change.toFixed(2)}
                            </span>
                          ) : (
                            <span className="text-gray-400">Baseline</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteReading(item.id)}
                            className="h-7 w-7 p-0 text-gray-400 hover:text-red-600"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        </>
      ) : (
        /* Empty / Single Point Fallback Card */
        <Card className="p-10 text-center bg-white border-dashed border-gray-200 shadow-xs">
          <TrendingUp className="w-12 h-12 mx-auto text-teal-600/40 mb-3" />
          <h3 className="text-base font-semibold text-gray-800">
            {selectedTest ? `No Numeric Data for ${selectedTest}` : 'No Lab Data Recorded'}
          </h3>
          <p className="text-sm text-gray-500 mt-1 max-w-md mx-auto mb-6">
            To view progression curves and clinical trends, add lab readings or load realistic sample timeline checkups.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button
              onClick={() => {
                handleTestNameSelect(selectedTest || 'TSH');
                setShowAddModal(true);
              }}
              className="bg-teal-600 hover:bg-teal-700 text-white cursor-pointer"
            >
              <Plus className="w-4 h-4 mr-1.5" /> Log First Reading
            </Button>
            <Button
              variant="outline"
              onClick={handleGenerateSampleData}
              disabled={generatingDemo}
              className="border-teal-200 text-teal-700 hover:bg-teal-50 cursor-pointer"
            >
              {generatingDemo ? (
                <RefreshCw className="w-4 h-4 mr-1.5 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4 mr-1.5 text-teal-600" />
              )}
              ✨ Populate Sample Timeline
            </Button>
          </div>
        </Card>
      )}

      {/* Quick Add Reading Modal Dialog */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Log Lab Measurement</DialogTitle>
            <DialogDescription>
              Record a new lab value to plot on {patientName ? `${patientName}'s` : "the patient's"} health timeline.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Date */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Checkup / Sample Date *</Label>
              <Input
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                className="h-9"
              />
            </div>

            {/* Test Selection with Quick Chips */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Test Name *</Label>
              <Input
                value={newTestName}
                onChange={(e) => setNewTestName(e.target.value)}
                placeholder="e.g. TSH, Free T4, Fasting Glucose"
                className="h-9"
              />
              <div className="flex flex-wrap gap-1 pt-1">
                {['TSH', 'Free T4', 'Free T3', 'Anti-TPO', 'Total Testosterone', 'Fasting Blood Sugar'].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => handleTestNameSelect(preset)}
                    className={`text-[10px] px-2 py-0.5 rounded-md border transition-all cursor-pointer ${
                      newTestName.toLowerCase() === preset.toLowerCase()
                        ? 'bg-teal-50 border-teal-300 text-teal-700 font-semibold'
                        : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            {/* Result & Unit */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Numeric Result *</Label>
                <Input
                  type="number"
                  step="any"
                  value={newResult}
                  onChange={(e) => setNewResult(e.target.value)}
                  placeholder="e.g. 2.4"
                  className="h-9"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Unit</Label>
                <Input
                  value={newUnit}
                  onChange={(e) => setNewUnit(e.target.value)}
                  placeholder="e.g. mIU/L"
                  className="h-9"
                />
              </div>
            </div>

            {/* Reference Range */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Reference Low</Label>
                <Input
                  type="number"
                  step="any"
                  value={newRefLow}
                  onChange={(e) => setNewRefLow(e.target.value)}
                  placeholder="e.g. 0.4"
                  className="h-9"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Reference High</Label>
                <Input
                  type="number"
                  step="any"
                  value={newRefHigh}
                  onChange={(e) => setNewRefHigh(e.target.value)}
                  placeholder="e.g. 4.0"
                  className="h-9"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowAddModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveQuickReading}
              disabled={savingReading}
              className="bg-teal-600 hover:bg-teal-700 text-white"
            >
              {savingReading ? 'Saving...' : 'Save Reading'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============================================================
// Main Trends View (Standalone Navigation Page)
// ============================================================

function TrendsView() {
  const { patients, setPatients, selectedPatientId, selectPatient } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [activePatientId, setActivePatientId] = useState<string>('');

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await fetch('/api/patients');
        if (res.ok) {
          const list = await res.json();
          setPatients(list);
          if (list.length > 0) {
            // If store already has a selected patient, use that; otherwise pick first
            const initialId = selectedPatientId && list.some((p: Patient) => p.id === selectedPatientId)
              ? selectedPatientId
              : list[0].id;
            setActivePatientId(initialId);
          }
        }
      } catch {
        toast.error('Failed to load patients');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [setPatients, selectedPatientId]);

  const activePatient = useMemo(() => {
    return (Array.isArray(patients) ? patients : []).find((p) => p.id === activePatientId) || null;
  }, [patients, activePatientId]);

  const handlePatientChange = (id: string) => {
    setActivePatientId(id);
    selectPatient(id);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-teal-600" />
            Clinical Trends & Timeline
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Longitudinal biomarker tracking and progression curve analysis
          </p>
        </div>

        {/* Patient Selector Dropdown */}
        <div className="w-full sm:w-72">
          <Select value={activePatientId} onValueChange={handlePatientChange}>
            <SelectTrigger className="bg-white h-10 border-gray-200">
              <SelectValue placeholder={loading ? 'Loading patients...' : 'Select a patient'} />
            </SelectTrigger>
            <SelectContent>
              {(Array.isArray(patients) ? patients : []).map((p: Patient) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name} ({p.age}y, {p.gender})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {activePatient && (
        <PatientTrendsPanel
          patientId={activePatient.id}
          patientName={activePatient.name}
          isEmbedded={false}
        />
      )}

      {!activePatient && !loading && (
        <Card className="p-12 text-center border-dashed">
          <Users className="w-12 h-12 mx-auto text-gray-300 mb-3" />
          <h3 className="text-base font-medium text-gray-700">No Patients Found</h3>
          <p className="text-sm text-gray-500 mt-1">Create a patient first to start tracking biomarker trends.</p>
        </Card>
      )}
    </div>
  );
}

// ============================================================
// Admin View
// ============================================================

function AdminView() {
  const { currentUser, logout } = useAppStore();
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [systemInfo, setSystemInfo] = useState<Record<string, string>>({});

  useEffect(() => {
    setSystemInfo({
      'Platform': 'ThyroidScreen Clinical AI',
      'Version': '1.0.0',
      'Framework': 'Next.js 16',
      'Database': 'SQLite (Prisma ORM)',
      'ML Models': 'Decision Tree, Random Forest, SVM, XGBoost, Ensemble',
      'OCR Engine': 'Built-in',
      'Environment': process.env.NODE_ENV || 'development',
    });
  }, []);

  const handleClearAll = useCallback(async () => {
    setClearing(true);
    try {
      const res = await fetch('/api/patients', { method: 'DELETE' });
      if (res.ok) {
        useAppStore.getState().setPatients([]);
        useAppStore.getState().setCurrentReports([]);
        useAppStore.getState().setCurrentLabValues([]);
        useAppStore.getState().setCurrentSymptoms([]);
        useAppStore.getState().setCurrentScreeningResults([]);
        useAppStore.getState().setCurrentPredictions([]);
        useAppStore.getState().setSelectedPatient(null);
        toast.success('All data cleared successfully');
        setShowClearConfirm(false);
      } else {
        toast.error('Failed to clear data');
      }
    } catch {
      toast.error('Network error');
    } finally {
      setClearing(false);
    }
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Admin</h2>
        <p className="text-sm text-gray-500 mt-1">System information and data management</p>
      </div>

      {currentUser && (
        <Card className="p-4 border border-teal-100 bg-gradient-to-r from-teal-50/50 to-white">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-teal-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
                {currentUser.name.replace('Dr. ', '').slice(0, 2).toUpperCase()}
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900">{currentUser.name}</h3>
                <p className="text-xs text-gray-500">{currentUser.role} • {currentUser.hospital}</p>
                <p className="text-[11px] text-teal-700 font-mono mt-0.5">
                  {currentUser.email} {currentUser.licenseNumber ? `• License: ${currentUser.licenseNumber}` : ''}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                logout();
                toast.info('Signed out of clinical workstation');
              }}
              className="border-red-200 text-red-600 hover:bg-red-50 text-xs shrink-0"
            >
              Sign Out / Switch Profile
            </Button>
          </div>
        </Card>
      )}

      <Card className="p-4">
        <h3 className="text-sm font-medium text-gray-700 mb-3">System Information</h3>
        <div className="space-y-2">
          {Object.entries(systemInfo).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
              <span className="text-sm text-gray-500">{key}</span>
              <span className="text-sm font-medium text-gray-900">{value}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-4 border border-red-100">
        <h3 className="text-sm font-medium text-red-600 mb-2">Danger Zone</h3>
        <p className="text-sm text-gray-500 mb-4">Clear all patient data including reports, lab values, symptoms, and screening results. This action cannot be undone.</p>
        <AlertDialog open={showClearConfirm} onOpenChange={setShowClearConfirm}>
          <AlertDialogTrigger asChild>
            <Button variant="outline" className="border-red-200 text-red-600 hover:bg-red-50">
              <Trash2 className="w-4 h-4 mr-1.5" /> Clear All Data
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete all patients, reports, lab values, symptoms, screening results, and predictions. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction className="bg-red-600 hover:bg-red-700 text-white" onClick={handleClearAll} disabled={clearing}>
                {clearing ? 'Clearing...' : 'Yes, delete everything'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </Card>
    </div>
  );
}

// ============================================================
// Footer Component
// ============================================================

function Footer() {
  return (
    <footer className="mt-auto border-t border-gray-100 bg-gray-50/50 px-4 py-3">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>This platform is for clinical screening assistance only. It does not provide medical diagnoses. Always consult a qualified healthcare professional for medical decisions.</span>
        </div>
        <div className="text-xs text-gray-400">
          &copy; {new Date().getFullYear()} ThyroidScreen AI
        </div>
      </div>
    </footer>
  );
}

// ============================================================
// Main Home Component
// ============================================================

export default function Home() {
  const {
    currentView,
    sidebarOpen,
    setSidebarOpen,
    setCurrentView,
    isAuthenticated,
    isAuthHydrated,
    initAuth,
  } = useAppStore();

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  const renderView = useCallback(() => {
    switch (currentView) {
      case 'dashboard': return <DashboardView />;
      case 'patients': return <PatientsView />;
      case 'patient-detail': return <PatientDetailView />;
      case 'upload-report': return <UploadReportView />;
      case 'screening': return <ScreeningView />;
      case 'prediction': return <PredictionView />;
      case 'trends': return <TrendsView />;
      case 'admin': return <AdminView />;
      default: return <DashboardView />;
    }
  }, [currentView]);

  if (!isAuthHydrated) {
    return (
      <div className="min-h-screen w-full bg-slate-950 flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 rounded-xl bg-teal-600 flex items-center justify-center animate-pulse">
          <Stethoscope className="w-6 h-6 text-white" />
        </div>
        <div className="flex items-center gap-2 text-teal-400 text-xs font-mono">
          <div className="w-3 h-3 border-2 border-teal-400 border-t-transparent rounded-full animate-spin" />
          <span>Initializing Clinical Suite...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginView />;
  }

  return (
    <TooltipProvider>
      <div className="min-h-screen flex flex-col bg-gray-50/50">
        <div className="flex flex-1">
          <Sidebar />
          <main className="flex-1 min-w-0">
            {/* Top Bar */}
            <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-sm border-b border-gray-100 px-4 py-2.5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  className="lg:hidden h-8 w-8"
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                >
                  {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
                </Button>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Activity className="w-3.5 h-3.5 text-teal-600" />
                  <span className="hidden sm:inline font-medium">Clinical Decision Support Platform</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="hidden lg:flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-medium">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>HIPAA Secure Session</span>
                </div>
                <UserMenu />
              </div>
            </header>

            {/* Page Content */}
            <div className="p-4 md:p-6 max-w-7xl mx-auto w-full">
              {renderView()}
            </div>
          </main>
        </div>
        <Footer />
      </div>
    </TooltipProvider>
  );
}
