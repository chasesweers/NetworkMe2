'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSelector } from 'react-redux'
import { selectOnboardingComplete } from '@/stores/uiSlice'
import { selectConnections } from '@/stores/connectionSlice'

export default function HomePage() {
  const router = useRouter()
  const onboardingComplete = useSelector(selectOnboardingComplete)
  const hasConnections = useSelector(selectConnections).length > 0

  useEffect(() => {
    if (!onboardingComplete) {
      router.replace('/welcome')
    } else if (hasConnections) {
      router.replace('/search')
    } else {
      router.replace('/import')
    }
  }, [onboardingComplete, hasConnections, router])

  return null
}
