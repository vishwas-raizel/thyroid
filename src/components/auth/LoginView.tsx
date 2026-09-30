'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Stethoscope, Lock, Mail, User, Eye, EyeOff, ShieldCheck,
  CheckCircle2, ArrowRight, Sparkles, Building2, BadgeCheck,
  KeyRound, Activity, FileText, AlertCircle, Fingerprint, Heart,
  Cpu, Award, Check
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { useAppStore } from '@/lib/store';
import { DEMO_USERS, CLINICAL_ROLES, DemoUser } from '@/lib/auth-constants';
import type { AuthUser } from '@/lib/types';

export function LoginView() {
  const { login } = useAppStore();

  const [activeTab, setActiveTab] = useState<'signin' | 'register'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDemoUser, setSelectedDemoUser] = useState<DemoUser | null>(null);

  // Register form state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regRole, setRegRole] = useState(CLINICAL_ROLES[0]);
  const [regHospital, setRegHospital] = useState('');
  const [regLicense, setRegLicense] = useState('');

  // Forgot password modal
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [isResetting, setIsResetting] = useState(false);

  // Quick Demo select handler
  const handleSelectDemoUser = (user: DemoUser) => {
    setSelectedDemoUser(user);
    setEmail(user.email);
    setPassword(user.passwordHint);
    toast.info(`Selected ${user.name}`, {
      description: `Role: ${user.role} • Credentials pre-filled.`,
      duration: 3000,
    });
  };

  // Instant 1-Click Login for Demo user
  const handleInstantDemoLogin = (user: DemoUser) => {
    setIsLoading(true);
    setTimeout(() => {
      login(user, rememberMe);
      setIsLoading(false);
      toast.success(`Welcome back, ${user.name}!`, {
        description: `Authenticated as ${user.role} (${user.hospital})`,
      });
    }, 600);
  };

  // Sign In submit
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !email.includes('@')) {
      toast.error('Invalid Email', { description: 'Please enter a valid clinical email address.' });
      return;
    }
    if (!password || password.length < 4) {
      toast.error('Invalid Password', { description: 'Password must be at least 4 characters.' });
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      // Check if matches a demo user
      const matchedDemo = DEMO_USERS.find(
        (u) => u.email.toLowerCase() === email.trim().toLowerCase()
      );

      const authenticatedUser: AuthUser = matchedDemo || {
        id: `usr_${Date.now().toString(36)}`,
        name: email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
        email: email.trim().toLowerCase(),
        role: 'Endocrinology Specialist',
        department: 'Clinical Endocrinology',
        hospital: 'Metropolitan Health Center',
        licenseNumber: 'MD-REG-' + Math.floor(10000 + Math.random() * 90000),
        lastLoginAt: new Date().toISOString(),
      };

      login(authenticatedUser, rememberMe);
      setIsLoading(false);

      toast.success(`Welcome, ${authenticatedUser.name}!`, {
        description: `Access granted to ThyroidScreen AI Clinical Suite.`,
      });
    }, 700);
  };

  // Register submit
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!regName.trim()) {
      toast.error('Name Required', { description: 'Please enter clinician full name with title.' });
      return;
    }
    if (!regEmail || !regEmail.includes('@')) {
      toast.error('Invalid Email', { description: 'Please enter an official institutional email.' });
      return;
    }
    if (!regPassword || regPassword.length < 6) {
      toast.error('Password Too Short', { description: 'Password must be at least 6 characters.' });
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      const newUser: AuthUser = {
        id: `usr_${Date.now().toString(36)}`,
        name: regName.trim().startsWith('Dr.') ? regName.trim() : `Dr. ${regName.trim()}`,
        email: regEmail.trim().toLowerCase(),
        role: regRole,
        department: regHospital ? `${regRole} Unit` : 'Endocrine & Metabolic Health',
        hospital: regHospital.trim() || 'General Medical Center',
        licenseNumber: regLicense.trim() || `MD-${Math.floor(10000 + Math.random() * 90000)}`,
        lastLoginAt: new Date().toISOString(),
      };

      login(newUser, rememberMe);
      setIsLoading(false);

      toast.success(`Account Registered Successfully`, {
        description: `Welcome, ${newUser.name}. Clinical workstation is ready.`,
      });
    }, 800);
  };

  // Handle simulated password reset
  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail || !forgotEmail.includes('@')) {
      toast.error('Invalid Email Address', { description: 'Enter the email linked to your account.' });
      return;
    }

    setIsResetting(true);
    setTimeout(() => {
      setIsResetting(false);
      setForgotPasswordOpen(false);
      toast.success('Reset Instructions Dispatched', {
        description: `A secure single-use recovery token was sent to ${forgotEmail}`,
      });
      setForgotEmail('');
    }, 1000);
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-50 relative flex items-center justify-center p-4 sm:p-6 lg:p-8 overflow-hidden font-sans">
      {/* Dynamic Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-teal-500/15 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[550px] h-[550px] rounded-full bg-emerald-500/15 blur-[140px] pointer-events-none" />
      <div className="absolute top-[40%] right-[30%] w-[350px] h-[350px] rounded-full bg-cyan-500/10 blur-[100px] pointer-events-none" />

      {/* Subtle grid pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
          backgroundSize: '28px 28px',
        }}
      />

      <div className="w-full max-w-6xl z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left Column: Platform Showcase & Trust Badges */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="lg:col-span-6 flex flex-col justify-center space-y-6 text-left"
        >
          {/* Header Tag */}
          <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-teal-950/80 border border-teal-500/30 text-teal-300 text-xs font-medium w-fit backdrop-blur-md shadow-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500"></span>
            </span>
            <span>Clinical Decision Support Platform • v2.4</span>
          </div>

          {/* Main Title */}
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-teal-600 via-teal-500 to-emerald-400 flex items-center justify-center shadow-lg shadow-teal-500/25 ring-1 ring-white/20">
                <Stethoscope className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
                ThyroidScreen <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-400">AI</span>
              </h1>
            </div>
            <p className="text-slate-300 text-base sm:text-lg leading-relaxed mt-2">
              Advanced Real-Time Early Screening System for Thyroid Disorders & PCOS with Automated Lab OCR & Machine Learning Decision Support.
            </p>
          </div>

          {/* Key Feature Pillars */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md flex items-start gap-3 hover:border-teal-500/40 transition-colors">
              <div className="p-2 rounded-lg bg-teal-500/10 text-teal-400">
                <Activity className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-slate-100">Dual Screening Engine</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">Thyroid (Hypo/Hyper/Hashimoto's) & PCOS Rotterdam protocol.</p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md flex items-start gap-3 hover:border-teal-500/40 transition-colors">
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-slate-100">Multi-Page Lab OCR</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">Automated parsing for TSH, FT4, Anti-TPO, LH/FSH, and vitals.</p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md flex items-start gap-3 hover:border-teal-500/40 transition-colors">
              <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
                <Cpu className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-slate-100">ML Risk Stratification</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">Ensemble algorithms with transparent feature impact scoring.</p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md flex items-start gap-3 hover:border-teal-500/40 transition-colors">
              <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-slate-100">Clinical Data Security</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">HIPAA compliant architecture, AES-256 session encryption.</p>
              </div>
            </div>
          </div>

          {/* Quick Demo Access Bar */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-teal-950/40 to-slate-900/80 border border-teal-500/25 backdrop-blur-md space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-teal-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-teal-400" />
                Quick 1-Click Clinician Demo
              </span>
              <span className="text-[10px] text-slate-400">Click any card to sign in instantly</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {DEMO_USERS.map((user) => {
                const isSelected = selectedDemoUser?.id === user.id;
                return (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => handleInstantDemoLogin(user)}
                    className={`p-2.5 rounded-lg border text-left transition-all duration-200 group flex flex-col justify-between ${
                      isSelected
                        ? 'bg-teal-900/50 border-teal-400/80 ring-1 ring-teal-400/40'
                        : 'bg-slate-900/70 border-slate-800 hover:border-teal-500/50 hover:bg-slate-800/80'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-teal-500/20 text-teal-300 border border-teal-500/30">
                          {user.badge}
                        </span>
                        <ArrowRight className="w-3 h-3 text-slate-500 group-hover:text-teal-400 group-hover:translate-x-0.5 transition-all" />
                      </div>
                      <p className="text-xs font-semibold text-slate-100 truncate">{user.name}</p>
                      <p className="text-[10px] text-slate-400 truncate">{user.role}</p>
                    </div>
                    <p className="text-[9px] text-teal-400/80 mt-1 font-mono">{user.email}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Compliance & Trust Marks */}
          <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-400 pt-1">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>HIPAA Compliant</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>ISO 27001 Secure</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>HL7 / FHIR Standards</span>
            </div>
          </div>
        </motion.div>

        {/* Right Column: Interactive Login / Register Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: 'easeOut' }}
          className="lg:col-span-6"
        >
          <div className="rounded-2xl border border-slate-800/90 bg-slate-900/90 backdrop-blur-2xl p-6 sm:p-8 shadow-2xl shadow-black/80 relative overflow-hidden ring-1 ring-white/10">
            {/* Top decorative gradient bar */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-500 via-emerald-400 to-cyan-500" />

            <Tabs
              value={activeTab}
              onValueChange={(val) => setActiveTab(val as 'signin' | 'register')}
              className="w-full"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-white">
                    {activeTab === 'signin' ? 'Clinician Authentication' : 'Create Practitioner Account'}
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    {activeTab === 'signin'
                      ? 'Secure workstation access for medical staff & researchers'
                      : 'Register your clinical credentials to access screening tools'}
                  </p>
                </div>
                <TabsList className="bg-slate-950/80 border border-slate-800 p-1">
                  <TabsTrigger
                    value="signin"
                    className="text-xs data-[state=active]:bg-teal-600 data-[state=active]:text-white"
                  >
                    Sign In
                  </TabsTrigger>
                  <TabsTrigger
                    value="register"
                    className="text-xs data-[state=active]:bg-teal-600 data-[state=active]:text-white"
                  >
                    Register
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* ================= TAB 1: SIGN IN ================= */}
              <TabsContent value="signin" className="space-y-4 focus-visible:outline-none mt-0">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email" className="text-xs font-medium text-slate-200">
                      Institutional Email / User ID
                    </Label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="doctor@hospital.org"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-9 bg-slate-950/70 border-slate-800 text-slate-100 placeholder:text-slate-500 focus:border-teal-500 focus:ring-teal-500/20 text-sm h-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="login-password" className="text-xs font-medium text-slate-200">
                        Password
                      </Label>
                      <button
                        type="button"
                        onClick={() => {
                          setForgotEmail(email);
                          setForgotPasswordOpen(true);
                        }}
                        className="text-xs text-teal-400 hover:text-teal-300 transition-colors"
                      >
                        Forgot password?
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <Input
                        id="login-password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-9 pr-9 bg-slate-950/70 border-slate-800 text-slate-100 placeholder:text-slate-500 focus:border-teal-500 focus:ring-teal-500/20 text-sm h-10"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3 text-slate-400 hover:text-slate-200"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between py-1">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="remember-me"
                        checked={rememberMe}
                        onCheckedChange={(checked) => setRememberMe(checked === true)}
                        className="data-[state=checked]:bg-teal-600 border-slate-700"
                      />
                      <Label htmlFor="remember-me" className="text-xs text-slate-300 font-normal cursor-pointer">
                        Remember this workstation for 30 days
                      </Label>
                    </div>
                    <span className="text-[11px] text-emerald-400/90 flex items-center gap-1 font-mono">
                      <Fingerprint className="w-3.5 h-3.5" />
                      2FA Enabled
                    </span>
                  </div>

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-semibold h-11 text-sm shadow-lg shadow-teal-700/20 transition-all flex items-center justify-center gap-2 group cursor-pointer"
                  >
                    {isLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Verifying Clinical Credentials...</span>
                      </>
                    ) : (
                      <>
                        <span>Sign In to Clinical Suite</span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </Button>
                </form>

                {/* Pre-filled hint banner */}
                <div className="pt-2 text-center">
                  <p className="text-[11px] text-slate-400">
                    Need instant access? Choose any demo profile above or use{' '}
                    <code className="bg-slate-800 px-1 py-0.5 rounded text-teal-300 font-mono">
                      dr.chen@thyroidscreen.ai
                    </code>
                  </p>
                </div>
              </TabsContent>

              {/* ================= TAB 2: REGISTER ================= */}
              <TabsContent value="register" className="space-y-4 focus-visible:outline-none mt-0">
                <form onSubmit={handleRegister} className="space-y-3.5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="reg-name" className="text-xs font-medium text-slate-200">
                        Full Name & Title *
                      </Label>
                      <div className="relative">
                        <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                        <Input
                          id="reg-name"
                          type="text"
                          placeholder="Dr. Alexander Ross, MD"
                          value={regName}
                          onChange={(e) => setRegName(e.target.value)}
                          className="pl-9 bg-slate-950/70 border-slate-800 text-slate-100 placeholder:text-slate-500 text-xs h-9"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="reg-role" className="text-xs font-medium text-slate-200">
                        Clinical Role / Specialty *
                      </Label>
                      <Select value={regRole} onValueChange={setRegRole}>
                        <SelectTrigger className="bg-slate-950/70 border-slate-800 text-slate-100 text-xs h-9">
                          <SelectValue placeholder="Select specialty" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-900 border-slate-800 text-slate-100">
                          {CLINICAL_ROLES.map((role) => (
                            <SelectItem key={role} value={role} className="text-xs">
                              {role}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="reg-hospital" className="text-xs font-medium text-slate-200">
                        Hospital / Health System
                      </Label>
                      <div className="relative">
                        <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                        <Input
                          id="reg-hospital"
                          type="text"
                          placeholder="e.g. Johns Hopkins Endocrine"
                          value={regHospital}
                          onChange={(e) => setRegHospital(e.target.value)}
                          className="pl-9 bg-slate-950/70 border-slate-800 text-slate-100 placeholder:text-slate-500 text-xs h-9"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="reg-license" className="text-xs font-medium text-slate-200">
                        Medical License / NPI Number
                      </Label>
                      <div className="relative">
                        <BadgeCheck className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                        <Input
                          id="reg-license"
                          type="text"
                          placeholder="e.g. MED-84920"
                          value={regLicense}
                          onChange={(e) => setRegLicense(e.target.value)}
                          className="pl-9 bg-slate-950/70 border-slate-800 text-slate-100 placeholder:text-slate-500 text-xs h-9"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="reg-email" className="text-xs font-medium text-slate-200">
                      Official Institutional Email *
                    </Label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <Input
                        id="reg-email"
                        type="email"
                        placeholder="name@hospital.org"
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        className="pl-9 bg-slate-950/70 border-slate-800 text-slate-100 placeholder:text-slate-500 text-xs h-9"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="reg-pwd" className="text-xs font-medium text-slate-200">
                      Create Password *
                    </Label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <Input
                        id="reg-pwd"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Min 6 characters"
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        className="pl-9 pr-9 bg-slate-950/70 border-slate-800 text-slate-100 placeholder:text-slate-500 text-xs h-9"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3 text-slate-400 hover:text-slate-200"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80 text-[11px] text-slate-400 space-y-1">
                    <p className="flex items-center gap-1.5 text-slate-300 font-medium">
                      <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
                      Clinician Verification Protocol
                    </p>
                    <p>
                      Accounts are initialized in diagnostic decision-support mode with full access to Thyroid & PCOS AI screening modules.
                    </p>
                  </div>

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-semibold h-10 text-xs shadow-lg shadow-teal-700/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isLoading ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Registering Clinician Profile...</span>
                      </>
                    ) : (
                      <>
                        <span>Complete Registration & Launch Suite</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

            {/* Security disclaimer footer */}
            <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-500">
              <span className="flex items-center gap-1">
                <Lock className="w-3 h-3 text-slate-400" />
                TLS 1.3 / AES-256 Bit Encryption
              </span>
              <span>ThyroidScreen AI Clinical Suite v2.4</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Forgot Password Dialog */}
      <Dialog open={forgotPasswordOpen} onOpenChange={setForgotPasswordOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 text-slate-100 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white">
              <KeyRound className="w-5 h-5 text-teal-400" />
              Reset Clinician Password
            </DialogTitle>
            <DialogDescription className="text-slate-400 text-xs">
              Enter your registered clinical email to receive emergency authentication instructions.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleResetPassword} className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="forgot-email" className="text-xs text-slate-200">
                Institutional Email
              </Label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <Input
                  id="forgot-email"
                  type="email"
                  placeholder="doctor@hospital.org"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  className="pl-9 bg-slate-950 border-slate-800 text-slate-100 text-sm"
                  required
                />
              </div>
            </div>

            <div className="p-3 rounded-lg bg-teal-950/40 border border-teal-500/20 text-xs text-teal-300/90">
              <p className="font-semibold mb-1">Demo Quick Recovery:</p>
              <p className="text-[11px] text-slate-300">
                For demo evaluation accounts, default password is <code className="text-teal-300 font-mono">clinic2026</code>.
              </p>
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setForgotPasswordOpen(false)}
                className="border-slate-800 text-slate-300 hover:bg-slate-800 text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isResetting}
                className="bg-teal-600 hover:bg-teal-500 text-white text-xs"
              >
                {isResetting ? 'Sending...' : 'Send Recovery Token'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
