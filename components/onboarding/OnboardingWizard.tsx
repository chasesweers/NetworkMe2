'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useDispatch } from 'react-redux'
import { completeOnboarding } from '@/stores/uiSlice'

const STEPS = [
  {
    title: 'Welcome to NetworkMe',
    body: 'NetworkMe helps you visualize and navigate your professional network. See who you know, how they connect, and discover relationship paths.',
    cta: 'Next',
  },
  {
    title: 'Your data, your control',
    body: 'Import your LinkedIn connections via CSV export. Everything is stored locally in your browser — no account required to get started.',
    cta: 'Next',
  },
  {
    title: 'Import your connections',
    body: 'Go to LinkedIn → Settings → Data Privacy → Get a copy of your data. Export "Connections" and come back here to upload the CSV.',
    cta: 'Next',
  },
  {
    title: "You're all set",
    body: 'Head to Import to upload your connections, or explore the graph with demo data.',
    cta: 'Get started',
  },
]

export function OnboardingWizard() {
  const [step, setStep] = useState(0)
  const router = useRouter()
  const dispatch = useDispatch()

  const current = STEPS[step]
  const isLast = step === STEPS.length - 1

  function advance() {
    if (isLast) {
      dispatch(completeOnboarding())
      router.push('/import')
    } else {
      setStep((s) => s + 1)
    }
  }

  function skip() {
    dispatch(completeOnboarding())
    router.push('/import')
  }

  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center gap-2 mb-8">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-2 rounded-full transition-all ${
                i === step
                  ? 'w-6 bg-indigo-600 dark:bg-indigo-400'
                  : i < step
                  ? 'w-2 bg-indigo-300 dark:bg-indigo-700'
                  : 'w-2 bg-gray-200 dark:bg-gray-700'
              }`}
            />
          ))}
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-8 text-center">
          <h1 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
            {current.title}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-8">
            {current.body}
          </p>

          <button
            onClick={advance}
            className="w-full py-3 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-colors"
          >
            {current.cta}
          </button>

          {!isLast && (
            <button
              onClick={skip}
              className="mt-3 text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              Skip setup
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
