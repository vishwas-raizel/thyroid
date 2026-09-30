'use client';

import React from 'react';
import {
  LogOut, Shield, User, Building2, BadgeCheck, Stethoscope, ChevronDown
} from 'lucide-react';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAppStore } from '@/lib/store';

interface UserMenuProps {
  compact?: boolean;
}

export function UserMenu({ compact = false }: UserMenuProps) {
  const { currentUser, logout } = useAppStore();

  if (!currentUser) return null;

  const initials = currentUser.name
    .replace('Dr. ', '')
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'DR';

  const handleSignOut = () => {
    logout();
    toast.info('Session Terminated', {
      description: 'You have been signed out. Clinical workstation locked.',
    });
  };

  if (compact) {
    return (
      <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200">
        <div className="flex items-center gap-2.5 min-w-0">
          <Avatar className="h-8 w-8 border border-teal-500/30">
            {currentUser.avatar && <AvatarImage src={currentUser.avatar} alt={currentUser.name} />}
            <AvatarFallback className="bg-teal-600 text-white text-xs font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-slate-800 truncate leading-tight">
              {currentUser.name}
            </p>
            <p className="text-[10px] text-slate-500 truncate leading-tight mt-0.5">
              {currentUser.role}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleSignOut}
          title="Sign Out / Lock Session"
          className="h-7 w-7 text-slate-400 hover:text-red-600 hover:bg-red-50 ml-1 shrink-0"
        >
          <LogOut className="h-3.5 w-3.5" />
        </Button>
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-2.5 p-1.5 pr-2.5 rounded-full hover:bg-slate-100 transition-colors border border-transparent hover:border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
        >
          <div className="relative">
            <Avatar className="h-8 w-8 border-2 border-teal-500/40">
              {currentUser.avatar && <AvatarImage src={currentUser.avatar} alt={currentUser.name} />}
              <AvatarFallback className="bg-teal-600 text-white text-xs font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-white" />
          </div>
          <div className="hidden md:flex flex-col text-left">
            <span className="text-xs font-semibold text-slate-800 leading-tight">
              {currentUser.name}
            </span>
            <span className="text-[10px] text-teal-600 font-medium leading-tight">
              {currentUser.role}
            </span>
          </div>
          <ChevronDown className="h-3.5 w-3.5 text-slate-400 hidden sm:inline" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-64 p-2 bg-white shadow-xl border-slate-200">
        <DropdownMenuLabel className="font-normal p-2">
          <div className="flex flex-col space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900">{currentUser.name}</span>
              <Badge variant="outline" className="text-[10px] bg-teal-50 text-teal-700 border-teal-200 py-0">
                Active Session
              </Badge>
            </div>
            <span className="text-[11px] text-slate-500 font-mono truncate">{currentUser.email}</span>
            <div className="pt-1.5 flex flex-col gap-1 text-[11px] text-slate-600">
              <div className="flex items-center gap-1.5 truncate">
                <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                <span className="truncate">{currentUser.hospital}</span>
              </div>
              {currentUser.licenseNumber && (
                <div className="flex items-center gap-1.5 font-mono text-[10px] text-slate-500">
                  <BadgeCheck className="w-3 h-3 text-teal-500 shrink-0" />
                  <span>{currentUser.licenseNumber}</span>
                </div>
              )}
            </div>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator className="my-1" />

        <div className="px-2 py-1.5 text-[10px] text-slate-400 flex items-center justify-between">
          <span className="flex items-center gap-1">
            <Shield className="w-3 h-3 text-emerald-500" />
            256-Bit Encrypted
          </span>
          <span>HIPAA Mode</span>
        </div>

        <DropdownMenuSeparator className="my-1" />

        <DropdownMenuItem
          onClick={handleSignOut}
          className="text-xs text-red-600 focus:bg-red-50 focus:text-red-700 cursor-pointer rounded-md p-2 flex items-center gap-2"
        >
          <LogOut className="w-4 h-4 text-red-500" />
          <span>Lock Session / Sign Out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
