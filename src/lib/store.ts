import { create } from "zustand";
import type { Patient, MedicalReport, LabValue, SymptomEntry, ScreeningResult, Prediction, ViewType, AuthUser } from "./types";

interface AppState {
  // Auth State
  currentUser: AuthUser | null;
  isAuthenticated: boolean;
  isAuthHydrated: boolean;
  login: (user: AuthUser, remember?: boolean) => void;
  logout: () => void;
  initAuth: () => void;

  // Navigation
  currentView: ViewType;
  selectedPatientId: string | null;
  setCurrentView: (view: ViewType) => void;
  selectPatient: (id: string | null) => void;

  // Data
  patients: Patient[];
  selectedPatient: Patient | null;
  currentReports: MedicalReport[];
  currentLabValues: LabValue[];
  currentSymptoms: SymptomEntry[];
  currentScreeningResults: ScreeningResult[];
  currentPredictions: Prediction[];

  // UI State
  isLoading: boolean;
  sidebarOpen: boolean;
  detailTab: string;
  setLoading: (loading: boolean) => void;
  setSidebarOpen: (open: boolean) => void;
  setDetailTab: (tab: string) => void;

  // Actions
  setPatients: (patients: Patient[]) => void;
  setSelectedPatient: (patient: Patient | null) => void;
  setCurrentReports: (reports: MedicalReport[]) => void;
  setCurrentLabValues: (values: LabValue[]) => void;
  setCurrentSymptoms: (symptoms: SymptomEntry[]) => void;
  setCurrentScreeningResults: (results: ScreeningResult[]) => void;
  setCurrentPredictions: (predictions: Prediction[]) => void;
  addPatient: (patient: Patient) => void;
  addReport: (report: MedicalReport) => void;
  addLabValue: (value: LabValue) => void;
  addSymptom: (symptom: SymptomEntry) => void;
  addScreeningResult: (result: ScreeningResult) => void;
  addPrediction: (prediction: Prediction) => void;
  updateLabValue: (id: string, data: Partial<LabValue>) => void;
  removePatient: (id: string) => void;
  removeReport: (id: string) => void;
  removeSymptom: (id: string) => void;

  // Refresh
  refreshPatientData: () => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({
  // Auth State
  currentUser: null,
  isAuthenticated: false,
  isAuthHydrated: false,
  login: (user: AuthUser, remember = true) => {
    if (typeof window !== "undefined" && remember) {
      try {
        localStorage.setItem("thyroid_ai_auth_user", JSON.stringify(user));
      } catch (e) {
        console.error("Failed to persist user session", e);
      }
    }
    set({ currentUser: user, isAuthenticated: true });
  },
  logout: () => {
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem("thyroid_ai_auth_user");
      } catch (e) {
        console.error("Failed to clear user session", e);
      }
    }
    set({ currentUser: null, isAuthenticated: false });
  },
  initAuth: () => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("thyroid_ai_auth_user");
        if (stored) {
          const user = JSON.parse(stored) as AuthUser;
          set({ currentUser: user, isAuthenticated: true, isAuthHydrated: true });
          return;
        }
      } catch (e) {
        console.error("Failed to load user session", e);
      }
    }
    set({ isAuthHydrated: true });
  },

  // Navigation
  currentView: "dashboard",
  selectedPatientId: null,
  setCurrentView: (view) => set({ currentView: view }),
  selectPatient: (id) => set({ selectedPatientId: id }),

  // Data
  patients: [],
  selectedPatient: null,
  currentReports: [],
  currentLabValues: [],
  currentSymptoms: [],
  currentScreeningResults: [],
  currentPredictions: [],

  // UI State
  isLoading: false,
  sidebarOpen: true,
  detailTab: "overview",
  setLoading: (loading) => set({ isLoading: loading }),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setDetailTab: (tab) => set({ detailTab: tab }),

  // Actions
  setPatients: (patients) => set({ patients }),
  setSelectedPatient: (patient) => set({ selectedPatient: patient }),
  setCurrentReports: (reports) => set({ currentReports: reports }),
  setCurrentLabValues: (values) => set({ currentLabValues: values }),
  setCurrentSymptoms: (symptoms) => set({ currentSymptoms: symptoms }),
  setCurrentScreeningResults: (results) => set({ currentScreeningResults: results }),
  setCurrentPredictions: (predictions) => set({ currentPredictions: predictions }),
  addPatient: (patient) => set((state) => ({ patients: [...state.patients, patient] })),
  addReport: (report) => set((state) => ({ currentReports: [...state.currentReports, report] })),
  addLabValue: (value) => set((state) => ({ currentLabValues: [...state.currentLabValues, value] })),
  addSymptom: (symptom) => set((state) => ({ currentSymptoms: [...state.currentSymptoms, symptom] })),
  addScreeningResult: (result) =>
    set((state) => ({ currentScreeningResults: [...state.currentScreeningResults, result] })),
  addPrediction: (prediction) =>
    set((state) => ({ currentPredictions: [...state.currentPredictions, prediction] })),
  updateLabValue: (id, data) =>
    set((state) => ({
      currentLabValues: state.currentLabValues.map((v) =>
        v.id === id ? { ...v, ...data } : v
      ),
    })),
  removePatient: (id) =>
    set((state) => ({
      patients: state.patients.filter((p) => p.id !== id),
      selectedPatient: state.selectedPatient?.id === id ? null : state.selectedPatient,
    })),
  removeReport: (id) =>
    set((state) => ({
      currentReports: state.currentReports.filter((r) => r.id !== id),
    })),
  removeSymptom: (id) =>
    set((state) => ({
      currentSymptoms: state.currentSymptoms.filter((s) => s.id !== id),
    })),

  refreshPatientData: async () => {
    const { selectedPatientId } = get();
    if (!selectedPatientId) return;

    try {
      set({ isLoading: true });
      const [reportsRes, symptomsRes, screeningRes, predictionsRes] = await Promise.all([
        fetch(`/api/reports?patientId=${selectedPatientId}`),
        fetch(`/api/symptoms?patientId=${selectedPatientId}`),
        fetch(`/api/screening?patientId=${selectedPatientId}`),
        fetch(`/api/predictions?patientId=${selectedPatientId}`),
      ]);

      if (reportsRes.ok) {
        const reports = await reportsRes.json();
        const allLabValues = reports.flatMap((r: MedicalReport) => r.labValues || []);
        set({ currentReports: reports, currentLabValues: allLabValues });
      }
      if (symptomsRes.ok) {
        const symptoms = await symptomsRes.json();
        set({ currentSymptoms: symptoms });
      }
      if (screeningRes.ok) {
        const results = await screeningRes.json();
        set({ currentScreeningResults: results });
      }
      if (predictionsRes.ok) {
        const predictions = await predictionsRes.json();
        set({ currentPredictions: predictions });
      }
    } catch (error) {
      console.error("Failed to refresh patient data:", error);
    } finally {
      set({ isLoading: false });
    }
  },
}));
