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
  Target,
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
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

          <div className="p-4 border-t border-gray-100">
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <Activity className="h-3.5 w-3.5" />
              <span>System Active</span>
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
      const patientAny = p as Record<string, unknown>;
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
                      {report.fileData && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs text-teal-700 border-teal-200 hover:bg-teal-50 flex items-center gap-1.5"
                          onClick={() => window.open(report.fileData, '_blank')}
                        >
                          <Eye className="w-3.5 h-3.5" /> View Image
                        </Button>
                      )}
                      <Badge variant="outline" className={report.status === 'completed' || report.status === 'verified' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}>{report.status}</Badge>
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
          {currentPredictions.length === 0 ? (
            <Card className="p-8 text-center">
              <ScanLine className="w-12 h-12 mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500">No ML predictions yet.</p>
              <Button className="mt-4 bg-teal-600 hover:bg-teal-700 text-white" onClick={() => useAppStore.setState({ currentView: 'prediction' as ViewType })}>Run Prediction</Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {currentPredictions.map((pred) => (
                <Card key={pred.id} className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <Badge variant="outline" className="text-xs bg-teal-50 text-teal-700 border-teal-200">{pred.modelUsed}</Badge>
                    <span className="text-xs text-gray-400">{formatDateShort(pred.createdAt)}</span>
                  </div>
                  <div className="space-y-3">
                    <div className="p-3 rounded-lg bg-gray-50">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-gray-500">Thyroid</span>
                        <span className={`text-xs font-semibold ${pred.thyroidPrediction === 'Positive' ? 'text-red-600' : 'text-emerald-600'}`}>{pred.thyroidPrediction}</span>
                      </div>
                      <Progress value={pred.thyroidProbability * 100} className="h-1.5" />
                      <p className="text-[10px] text-gray-400 mt-0.5">{(pred.thyroidProbability * 100).toFixed(1)}%</p>
                    </div>
                    <div className="p-3 rounded-lg bg-gray-50">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-gray-500">PCOS</span>
                        <span className={`text-xs font-semibold ${pred.pcosPrediction === 'Positive' ? 'text-red-600' : 'text-emerald-600'}`}>{pred.pcosPrediction}</span>
                      </div>
                      <Progress value={pred.pcosProbability * 100} className="h-1.5" />
                      <p className="text-[10px] text-gray-400 mt-0.5">{(pred.pcosProbability * 100).toFixed(1)}%</p>
                    </div>
                  </div>
                  {pred.modelAccuracy != null && (
                    <p className="text-xs text-gray-400 mt-2">Accuracy: {(pred.modelAccuracy * 100).toFixed(1)}%</p>
                  )}
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Trends Tab */}
        <TabsContent value="trends" className="space-y-4 mt-4">
          {tshTrendData.length > 0 && (
            <Card className="p-4">
              <h4 className="text-sm font-medium text-gray-700 mb-3">TSH Trend</h4>
              <ChartContainer config={{ value: { label: 'TSH', color: '#0d9488' } }} className="h-48 w-full">
                <LineChart data={tshTrendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line type="monotone" dataKey="value" stroke="var(--color-value, #0d9488)" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ChartContainer>
            </Card>
          )}
          {currentLabValues.length === 0 && (
            <Card className="p-8 text-center"><TrendingUp className="w-12 h-12 mx-auto text-gray-300 mb-3" /><p className="text-gray-500">No lab data for trends.</p></Card>
          )}
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
  const [modality, setModality] = useState<'thyroid_us' | 'ovarian_us'>('thyroid_us');
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
            <Select
              value={reportType}
              onValueChange={(val) => {
                setReportType(val);
                if (val === 'thyroid_ultrasound') setModality('thyroid_us');
                if (val === 'ovarian_ultrasound') setModality('ovarian_us');
              }}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="thyroid_panel">Thyroid Panel (Blood / Lab)</SelectItem>
                <SelectItem value="pcos_panel">PCOS Panel (Blood / Lab)</SelectItem>
                <SelectItem value="thyroid_ultrasound">Thyroid Ultrasound (Thyroid US)</SelectItem>
                <SelectItem value="ovarian_ultrasound">Ovarian Ultrasound (Ovarian US)</SelectItem>
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

      {/* Image Upload & Preview Card matching user's exact screenshot and workflow */}
      <Card className="p-5 border-cyan-100 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-cyan-800 font-semibold text-base">
          <Upload className="w-5 h-5 text-cyan-600" />
          <span>Image Upload &amp; Preview</span>
        </div>

        <div className="flex items-center gap-3 pt-1">
          <span className="text-sm font-medium text-gray-700">Modality:</span>
          <button
            type="button"
            onClick={() => {
              setModality('thyroid_us');
              setReportType('thyroid_ultrasound');
            }}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              modality === 'thyroid_us'
                ? 'bg-teal-600 text-white shadow-sm'
                : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            Thyroid US
          </button>
          <button
            type="button"
            onClick={() => {
              setModality('ovarian_us');
              setReportType('ovarian_ultrasound');
            }}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              modality === 'ovarian_us'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'bg-white text-purple-700 border border-purple-200 hover:bg-purple-50'
            }`}
          >
            <Baby className="w-3.5 h-3.5" />
            Ovarian US
          </button>
        </div>

        {/* Upload Box matching screenshot */}
        <div
          className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer ${
            isDragging ? 'border-cyan-500 bg-cyan-50/50' : 'border-cyan-300 hover:border-cyan-400 bg-cyan-50/20'
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
        >
          <input ref={fileInputRef} type="file" className="hidden" accept="image/*,.pdf,.webp" onChange={handleFileInput} />
          {ocrProcessing ? (
            <div className="flex flex-col items-center gap-2">
              <RefreshCw className="w-8 h-8 text-cyan-600 animate-spin" />
              <p className="text-sm text-gray-700 font-medium">Extracting Diagnostic Features &amp; Measurements...</p>
            </div>
          ) : uploadFile ? (
            <div className="flex flex-col items-center gap-2">
              <FileText className="w-8 h-8 text-cyan-600" />
              <p className="text-sm font-medium text-gray-800">{uploadFile.name}</p>
              <p className="text-xs text-gray-400">Click or drag another image to replace</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <Upload className="w-7 h-7 text-gray-400" />
              <p className="text-sm font-medium text-gray-700">
                Upload {modality === 'thyroid_us' ? 'Thyroid' : 'Ovarian'} Ultrasound Image
              </p>
              <p className="text-xs text-gray-400">PNG, JPEG, or WebP — max 10MB</p>
              <p className="text-[11px] text-gray-400 italic mt-1">Click or drag to select</p>
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
// Prediction View (NEW - ML Prediction Module)
// ============================================================

function PredictionView() {
  const { patients, setPatients, selectPatient, setCurrentView } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [running, setRunning] = useState(false);
  const [predictions, setPredictions] = useState<Prediction[]>([]);

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

  const handleRunPrediction = useCallback(async () => {
    if (!selectedPatientId) { toast.error('Please select a patient'); return; }
    setRunning(true);
    setPredictions([]);
    try {
      const res = await fetch('/api/predictions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId: selectedPatientId }),
      });
      if (res.ok) {
        const data = await res.json();
        // API returns { success, predictions: [...] } for POST
        const preds = Array.isArray(data.predictions) ? data.predictions : (Array.isArray(data) ? data : []);
        setPredictions(preds);
        toast.success('ML predictions completed');
      } else {
        const err = await res.json();
        toast.error(err.error || 'Prediction failed');
      }
    } catch { toast.error('Network error'); }
    finally { setRunning(false); }
  }, [selectedPatientId]);

  const ensemblePrediction = useMemo(() => predictions.find((p) => p.modelUsed === 'Ensemble') || predictions[0], [predictions]);
  const topFeatures = useMemo(() => parseJsonSafe<{ name: string; importance: number }[]>(ensemblePrediction?.topFeatures, []), [ensemblePrediction]);
  const precautions = useMemo(() => parseJsonSafe<{ category: string; item: string; priority: string }[]>(ensemblePrediction?.suggestedPrecautions, []), [ensemblePrediction]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">ML Prediction</h2>
        <p className="text-sm text-gray-500 mt-1">Run machine learning models for thyroid and PCOS prediction</p>
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
          <Button className="bg-teal-600 hover:bg-teal-700 text-white" disabled={running || !selectedPatientId} onClick={handleRunPrediction}>
            {running ? <><RefreshCw className="w-4 h-4 mr-1.5 animate-spin" /> Running Models...</> : <><Cpu className="w-4 h-4 mr-1.5" /> Run ML Prediction</>}
          </Button>
        </div>
      </Card>

      {running && (
        <Card className="p-8 text-center">
          <Cpu className="w-10 h-10 mx-auto text-teal-500 animate-pulse mb-3" />
          <p className="text-sm text-gray-600">Running ML models (Decision Tree, Random Forest, SVM, XGBoost, Ensemble)...</p>
          <p className="text-xs text-gray-400 mt-1">This may take a few seconds.</p>
        </Card>
      )}

      {predictions.length > 0 && (
        <>
          {/* Prediction Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card className={`p-4 border-l-4 ${ensemblePrediction?.thyroidPrediction === 'Positive' ? 'border-l-red-500' : 'border-l-emerald-500'}`}>
              <div className="flex items-center gap-3 mb-3">
                <Heart className={`w-6 h-6 ${ensemblePrediction?.thyroidPrediction === 'Positive' ? 'text-red-500' : 'text-emerald-500'}`} />
                <div>
                  <p className="text-sm font-medium text-gray-700">Thyroid Prediction</p>
                  <p className={`text-lg font-bold ${ensemblePrediction?.thyroidPrediction === 'Positive' ? 'text-red-600' : 'text-emerald-600'}`}>
                    {ensemblePrediction?.thyroidPrediction ?? 'N/A'}
                  </p>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Probability</span>
                  <span>{((ensemblePrediction?.thyroidProbability ?? 0) * 100).toFixed(1)}%</span>
                </div>
                <Progress value={(ensemblePrediction?.thyroidProbability ?? 0) * 100} className="h-2" />
              </div>
            </Card>
            <Card className={`p-4 border-l-4 ${ensemblePrediction?.pcosPrediction === 'Positive' ? 'border-l-red-500' : 'border-l-emerald-500'}`}>
              <div className="flex items-center gap-3 mb-3">
                <Brain className={`w-6 h-6 ${ensemblePrediction?.pcosPrediction === 'Positive' ? 'text-red-500' : 'text-emerald-500'}`} />
                <div>
                  <p className="text-sm font-medium text-gray-700">PCOS Prediction</p>
                  <p className={`text-lg font-bold ${ensemblePrediction?.pcosPrediction === 'Positive' ? 'text-red-600' : 'text-emerald-600'}`}>
                    {ensemblePrediction?.pcosPrediction ?? 'N/A'}
                  </p>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Probability</span>
                  <span>{((ensemblePrediction?.pcosProbability ?? 0) * 100).toFixed(1)}%</span>
                </div>
                <Progress value={(ensemblePrediction?.pcosProbability ?? 0) * 100} className="h-2" />
              </div>
            </Card>
          </div>

          {/* Model Comparison Table */}
          <Card className="p-4">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Model Comparison</h3>
            <div className="max-h-96 overflow-y-auto">
              <Table>
                <TableHeader><TableRow>
                  <TableHead className="text-xs">Model</TableHead>
                  <TableHead className="text-xs">Thyroid Pred</TableHead>
                  <TableHead className="text-xs">Thyroid Prob</TableHead>
                  <TableHead className="text-xs">PCOS Pred</TableHead>
                  <TableHead className="text-xs">PCOS Prob</TableHead>
                  <TableHead className="text-xs">Accuracy</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {predictions.map((pred) => (
                    <TableRow key={pred.id}>
                      <TableCell className="text-xs font-medium">
                        <div className="flex items-center gap-1.5">
                          {pred.modelUsed === 'Ensemble' && <Zap className="w-3.5 h-3.5 text-amber-500" />}
                          {pred.modelUsed}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-[10px] ${pred.thyroidPrediction === 'Positive' ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
                          {pred.thyroidPrediction}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs">{(pred.thyroidProbability * 100).toFixed(1)}%</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-[10px] ${pred.pcosPrediction === 'Positive' ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
                          {pred.pcosPrediction}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs">{(pred.pcosProbability * 100).toFixed(1)}%</TableCell>
                      <TableCell className="text-xs font-medium">{pred.modelAccuracy != null ? `${(pred.modelAccuracy * 100).toFixed(1)}%` : 'N/A'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>

          {/* Feature Importance & Data Quality */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Feature Importance */}
            <Card className="p-4">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Feature Importance</h3>
              {topFeatures.length > 0 ? (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {topFeatures.map((feat, i) => {
                    const maxImportance = Math.max(...topFeatures.map((f) => f.importance), 1);
                    const barWidth = (feat.importance / maxImportance) * 100;
                    return (
                      <div key={i}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-gray-700 truncate max-w-[70%]">{feat.name}</span>
                          <span className="text-gray-500 font-medium">{(feat.importance * 100).toFixed(1)}%</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-teal-500 rounded-full transition-all" style={{ width: `${barWidth}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-gray-400">No feature importance data available.</p>
              )}
            </Card>

            {/* Data Quality Panel */}
            <Card className="p-4">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Data Quality</h3>
              {ensemblePrediction?.dataQualityScore != null ? (
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>Quality Score</span>
                      <span className="font-medium">{(ensemblePrediction.dataQualityScore * 100).toFixed(0)}%</span>
                    </div>
                    <Progress value={ensemblePrediction.dataQualityScore * 100} className="h-2" />
                  </div>
                  {ensemblePrediction.preprocessingLog && (
                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-1">Preprocessing Steps</p>
                      <div className="space-y-1 max-h-40 overflow-y-auto">
                        {parseJsonSafe<string[]>(ensemblePrediction.preprocessingLog, []).map((step, i) => (
                          <div key={i} className="flex items-center gap-2 text-xs text-gray-600">
                            <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                            <span>{step}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-400">No data quality information available.</p>
              )}
            </Card>
          </div>

          {/* Precautions Panel */}
          {precautions.length > 0 && (
            <Card className="p-4">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Suggested Precautions</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {precautions.map((prec, i) => (
                  <div key={i} className="flex items-start gap-3 p-2.5 rounded-lg bg-gray-50">
                    <Badge variant="outline" className={`shrink-0 text-[10px] ${
                      prec.priority === 'high' ? 'bg-red-50 text-red-600 border-red-200' :
                      prec.priority === 'medium' ? 'bg-amber-50 text-amber-600 border-amber-200' :
                      'bg-gray-50 text-gray-500 border-gray-200'
                    }`}>
                      {prec.priority}
                    </Badge>
                    <div className="flex-1">
                      <p className="text-sm text-gray-700">{prec.item}</p>
                      {prec.category && <p className="text-xs text-gray-400 mt-0.5">{prec.category}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Full Report */}
          {ensemblePrediction?.detailedReport && (
            <Card className="p-4">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Detailed Report</h3>
              <ScrollArea className="max-h-96">
                <div className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">{ensemblePrediction.detailedReport}</div>
              </ScrollArea>
            </Card>
          )}

          {selectedPatientId && (
            <div className="flex justify-end">
              <Button size="sm" variant="outline" className="text-teal-600" onClick={() => { selectPatient(selectedPatientId); setCurrentView('patient-detail'); }}>
                View Patient Details <ChevronRight className="w-3 h-3 ml-1" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ============================================================
// Trends View
// ============================================================

function TrendsView() {
  const { patients, setPatients } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [labData, setLabData] = useState<LabValue[]>([]);

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

  useEffect(() => {
    async function loadLabData() {
      if (!selectedPatientId) { setLabData([]); return; }
      try {
        const res = await fetch(`/api/reports?patientId=${selectedPatientId}`);
        if (res.ok) {
          const reports = await res.json();
          const allValues = (Array.isArray(reports) ? reports : []).flatMap((r: MedicalReport) => r.labValues || []);
          setLabData(allValues);
        }
      } catch { toast.error('Failed to load lab data'); }
    }
    loadLabData();
  }, [selectedPatientId]);

  const testNames = useMemo(() => {
    const names = new Set<string>();
    labData.forEach((v) => { if (v.testName) names.add(v.testName); });
    return Array.from(names).sort();
  }, [labData]);

  const [selectedTest, setSelectedTest] = useState('');

  useEffect(() => {
    if (testNames.length > 0 && !selectedTest) setSelectedTest(testNames[0]);
  }, [testNames, selectedTest]);

  const chartData = useMemo(() => {
    if (!selectedTest) return [];
    return labData
      .filter((v) => v.testName === selectedTest && v.result != null)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      .map((v) => ({ date: formatDateShort(v.createdAt), value: v.result }));
  }, [labData, selectedTest]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Trends</h2>
        <p className="text-sm text-gray-500 mt-1">Visualize lab value trends over time</p>
      </div>

      <Card className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Select Patient</Label>
            <Select value={selectedPatientId} onValueChange={(v) => { setSelectedPatientId(v); setSelectedTest(''); }}>
              <SelectTrigger><SelectValue placeholder={loading ? 'Loading...' : 'Select patient'} /></SelectTrigger>
              <SelectContent>
                {(Array.isArray(patients) ? patients : []).map((p: Patient) => (
                  <SelectItem key={p.id} value={p.id}>{p.name} ({p.age}y, {p.gender})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Lab Test</Label>
            <Select value={selectedTest} onValueChange={setSelectedTest}>
              <SelectTrigger><SelectValue placeholder="Select test" /></SelectTrigger>
              <SelectContent>
                {testNames.map((name) => <SelectItem key={name} value={name}>{name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {selectedPatientId && chartData.length > 0 && (
        <Card className="p-4">
          <h3 className="text-sm font-medium text-gray-700 mb-3">{selectedTest} Trend</h3>
          <ChartContainer config={{ value: { label: selectedTest, color: '#0d9488' } }} className="h-72 w-full">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line type="monotone" dataKey="value" stroke="var(--color-value, #0d9488)" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ChartContainer>
        </Card>
      )}

      {selectedPatientId && chartData.length === 0 && labData.length === 0 && (
        <Card className="p-8 text-center">
          <TrendingUp className="w-12 h-12 mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500">No lab data available for this patient.</p>
        </Card>
      )}

      {!selectedPatientId && !loading && (
        <Card className="p-8 text-center">
          <BarChart3 className="w-12 h-12 mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500">Select a patient to view trends.</p>
        </Card>
      )}
    </div>
  );
}

// ============================================================
// Admin View
// ============================================================

function AdminView() {
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
  const { currentView, sidebarOpen, setSidebarOpen, setCurrentView } = useAppStore();

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

  return (
    <TooltipProvider>
      <div className="min-h-screen flex flex-col bg-gray-50/50">
        <div className="flex flex-1">
          <Sidebar />
          <main className="flex-1 min-w-0">
            {/* Top Bar */}
            <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-sm border-b border-gray-100 px-4 py-3 flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden h-8 w-8"
                onClick={() => setSidebarOpen(!sidebarOpen)}
              >
                {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
              </Button>
              <div className="flex-1" />
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <Activity className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Clinical Screening Platform</span>
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
