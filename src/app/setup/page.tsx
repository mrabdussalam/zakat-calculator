'use client'

import { useState } from "react"
import { useRouter } from "next/navigation"
import { PreferencesForm } from "@/components/setup/PreferencesForm"
import { AssetSelection } from "@/components/setup/AssetSelection"
import { NisabFetcher } from "@/components/setup/NisabFetcher"
import { cn } from "@/lib/utils"

type SetupStep = 'preferences' | 'assets' | 'nisab'

interface Preferences {
  language: string
  currency: string
}

export default function SetupPage() {
  const router = useRouter()
  const [step, setStep] = useState<SetupStep>('preferences')
  const [preferences, setPreferences] = useState<Preferences>()
  const [selectedAssets, setSelectedAssets] = useState<string[]>()
  const [nisabThreshold, setNisabThreshold] = useState<number>()

  const handlePreferencesSubmit = (prefs: Preferences) => {
    setPreferences(prefs)
    setStep('assets')
  }

  const handleAssetSelect = (assets: string[]) => {
    setSelectedAssets(assets)
    // Save setup data and redirect to dashboard without nisab calculation
    localStorage.setItem('zakatSetup', JSON.stringify({
      ...preferences,
      selectedAssets,
      setupCompleted: true
    }))
    router.push('/dashboard')
  }

  const handleNisabSelect = (threshold: number) => {
    setNisabThreshold(threshold)
    // Save setup data and redirect to dashboard
    localStorage.setItem('zakatSetup', JSON.stringify({
      ...preferences,
      selectedAssets,
      nisabThreshold,
      setupCompleted: true
    }))
    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="mx-auto max-w-xl space-y-6 px-4">
        {/* Progress Steps */}
        <div className="flex justify-center gap-2">
          {['preferences', 'assets'].map((s) => (
            <div
              key={s}
              className={cn(
                "w-2 h-2 rounded-full transition-colors",
                step === s
                  ? "bg-gray-900"
                  : step === 'assets'
                  ? "bg-gray-900"
                  : "bg-gray-200"
              )}
            />
          ))}
        </div>

        <div className="rounded-xl bg-white p-6 shadow-xs">
          {step === 'preferences' && (
            <PreferencesForm onSubmit={handlePreferencesSubmit} />
          )}

          {step === 'assets' && preferences && (
            <AssetSelection 
              onSubmit={handleAssetSelect}
              currency={preferences.currency}
            />
          )}

          {step === 'nisab' && preferences && (
            <NisabFetcher
              currency={preferences.currency}
              onSelect={handleNisabSelect}
            />
          )}
        </div>
      </div>
    </div>
  )
} 