'use client'

import React, { useState, useEffect } from 'react'
import { Settings, ShieldAlert, Zap, Moon, HardHat, Loader2 } from 'lucide-react'
import { motion } from 'framer-motion'

interface GlobalSettings {
  easter_eggs_enabled: boolean
  maintenance_mode: boolean
  force_dark_mode: boolean
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<GlobalSettings>({
    easter_eggs_enabled: true,
    maintenance_mode: false,
    force_dark_mode: false
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        if (!data.error) setSettings(data)
      })
      .catch(console.error)
      .finally(() => setIsLoading(false))
  }, [])

  const toggleSetting = async (key: keyof GlobalSettings) => {
    setIsUpdating(key)
    const newValue = !settings[key]
    
    // Optimistic update
    setSettings(prev => ({ ...prev, [key]: newValue }))

    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [key]: newValue })
      })

      if (!res.ok) {
        let errMsg = 'Failed to update'
        try {
          const errData = await res.json()
          errMsg = errData.error || errMsg
        } catch(e) {}
        throw new Error(errMsg)
      }
    } catch (err: any) {
      console.error("API Error details:", err)
      alert("Error saving settings: " + err.message)
      // Revert on error
      setSettings(prev => ({ ...prev, [key]: !newValue }))
    } finally {
      setIsUpdating(null)
    }
  }

  // A sleek, standard iOS-style small toggle component
  const SmallToggle = ({ 
    checked, 
    onChange, 
    disabled, 
    activeColor 
  }: { 
    checked: boolean; 
    onChange: () => void; 
    disabled: boolean;
    activeColor: string;
  }) => (
    <button
      onClick={onChange}
      disabled={disabled}
      className={`relative w-11 h-6 rounded-full transition-colors duration-300 ease-in-out ${
        checked ? activeColor : 'bg-zinc-200 dark:bg-zinc-800'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <motion.div
        layout
        initial={false}
        animate={{
          x: checked ? 22 : 2,
        }}
        transition={{
          type: "spring",
          stiffness: 700,
          damping: 40
        }}
        className="absolute top-[2px] w-5 h-5 rounded-full bg-white shadow-sm border border-black/5"
      />
    </button>
  )

  if (isLoading) {
    return (
      <div className="flex-1 p-8 md:p-12 max-w-5xl mx-auto w-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
      </div>
    )
  }

  return (
    <div className="flex-1 p-8 md:p-12 max-w-5xl mx-auto w-full space-y-12">
      
      <header className="space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs font-bold uppercase tracking-widest mb-2">
          <ShieldAlert className="h-3.5 w-3.5" />
          God Mode
        </div>
        <h1 className="text-xl md:text-2xl font-bold text-zinc-800 dark:text-zinc-100 tracking-tight">
          Global Feature Flags
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-2xl leading-relaxed">
          Instantly control the behavior of your live portfolio without deploying code. These changes take effect immediately for all visitors globally.
        </p>
      </header>

      <div className="grid gap-6">
        
        {/* Maintenance Mode */}
        <div className={`relative overflow-hidden rounded-3xl border transition-all duration-500 ${
          settings.maintenance_mode 
            ? 'bg-rose-950/20 border-rose-500/30' 
            : 'bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800/50 hover:border-zinc-700'
        }`}>
          {settings.maintenance_mode && (
            <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/10 blur-[100px] rounded-full pointer-events-none" />
          )}
          
          <div className="p-8 flex flex-col md:flex-row gap-8 items-start md:items-center justify-between relative z-10">
            <div className="flex gap-6 items-start">
              <div className={`p-4 rounded-2xl ${settings.maintenance_mode ? 'bg-rose-500/20 text-rose-500' : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-400'}`}>
                <HardHat className="h-8 w-8" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-zinc-800 dark:text-zinc-100 mb-1">Site Maintenance</h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-md">
                  Enable a global "Under Construction" screen. Public visitors will not be able to see your portfolio, but your admin dashboard and client portals remain accessible.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {isUpdating === 'maintenance_mode' && <Loader2 className="h-4 w-4 animate-spin text-zinc-500" />}
              <SmallToggle 
                checked={settings.maintenance_mode} 
                onChange={() => toggleSetting('maintenance_mode')}
                disabled={isUpdating !== null}
                activeColor="bg-rose-500"
              />
            </div>
          </div>
        </div>

        {/* Easter Eggs */}
        <div className={`relative overflow-hidden rounded-3xl border transition-all duration-500 ${
          settings.easter_eggs_enabled 
            ? 'bg-emerald-950/20 border-emerald-500/30' 
            : 'bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800/50 hover:border-zinc-700'
        }`}>
          {settings.easter_eggs_enabled && (
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-[100px] rounded-full pointer-events-none" />
          )}
          
          <div className="p-8 flex flex-col md:flex-row gap-8 items-start md:items-center justify-between relative z-10">
            <div className="flex gap-6 items-start">
              <div className={`p-4 rounded-2xl ${settings.easter_eggs_enabled ? 'bg-emerald-500/20 text-emerald-500' : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-400'}`}>
                <Zap className="h-8 w-8" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-zinc-800 dark:text-zinc-100 mb-1">Easter Eggs & Gamification</h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-md">
                  Globally enable or disable all gamification features. Disabling this turns off the terminal, Konami code, and Lights Out puzzles for all visitors.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {isUpdating === 'easter_eggs_enabled' && <Loader2 className="h-4 w-4 animate-spin text-zinc-500" />}
              <SmallToggle 
                checked={settings.easter_eggs_enabled} 
                onChange={() => toggleSetting('easter_eggs_enabled')}
                disabled={isUpdating !== null}
                activeColor="bg-emerald-500"
              />
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
