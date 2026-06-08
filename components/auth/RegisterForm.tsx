'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useDispatch } from 'react-redux'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { setUser, setToken } from '@/stores/authSlice'
import { setGuest } from '@/stores/uiSlice'
import { store } from '@/stores/index'
import { personKey } from '@/lib/data'

const schema = z.object({
  displayName: z.string().min(1, 'Name is required'),
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})
type FormValues = z.infer<typeof schema>

async function migrateGuestData(token: string) {
  const state = store.getState()
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
  await Promise.allSettled([
    fetch('/api/connections', {
      method: 'POST',
      headers,
      body: JSON.stringify(
        state.connections.connections.map((c) => ({ ...c, personKey: personKey(c) }))
      ),
    }),
    fetch('/api/favorites', {
      method: 'PUT',
      headers,
      body: JSON.stringify(state.connections.favorites),
    }),
    fetch('/api/archives', {
      method: 'PUT',
      headers,
      body: JSON.stringify(state.connections.archived),
    }),
    fetch('/api/relationships', {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        relationships: state.relationships.relationships,
        customTypes: state.relationships.customTypes,
      }),
    }),
    fetch('/api/notes', {
      method: 'PUT',
      headers,
      body: JSON.stringify(state.notes.notes),
    }),
  ])
}

export function RegisterForm() {
  const dispatch = useDispatch()
  const router = useRouter()
  const [serverError, setServerError] = useState<string | null>(null)

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  })

  async function onSubmit(values: FormValues) {
    setServerError(null)
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    })
    const data = await res.json()
    if (!res.ok) {
      setServerError(data.error ?? 'Something went wrong')
      return
    }
    // Push any guest data to the server before dispatching the token so
    // hydrateFromServer retrieves it on the next reload.
    await migrateGuestData(data.token)
    dispatch(setUser(data.user))
    dispatch(setToken(data.token))
    dispatch(setGuest(false))
    await fetch('/api/auth/guest', { method: 'DELETE' })
    router.push('/import')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4">
      <div className="w-full max-w-sm bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm p-8">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-1">Create account</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Get started with NetworkMe</p>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">Name</label>
            <input
              type="text"
              autoComplete="name"
              {...register('displayName')}
              className="w-full text-sm px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-indigo-400"
            />
            {errors.displayName && <p className="text-xs text-red-500 mt-1">{errors.displayName.message}</p>}
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">Email</label>
            <input
              type="email"
              autoComplete="email"
              {...register('email')}
              className="w-full text-sm px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-indigo-400"
            />
            {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">Password</label>
            <input
              type="password"
              autoComplete="new-password"
              {...register('password')}
              className="w-full text-sm px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-indigo-400"
            />
            {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>}
          </div>

          {serverError && (
            <p className="text-xs text-red-500 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2">
              {serverError}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-medium transition-colors"
          >
            {isSubmitting ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <div className="mt-4">
          <button
            type="button"
            onClick={async () => {
              await fetch('/api/auth/guest', { method: 'POST' })
              dispatch(setGuest(true))
              router.push('/import')
            }}
            className="w-full py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            Continue as guest
          </button>
        </div>

        <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-4">
          Already have an account?{' '}
          <Link href="/login" className="text-indigo-600 dark:text-indigo-400 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
