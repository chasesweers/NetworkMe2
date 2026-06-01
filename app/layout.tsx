import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'
import { StoreProvider } from '@/components/StoreProvider'
import { ThemeProvider } from '@/components/ThemeProvider'
import { Nav } from '@/components/Nav'

const geist = Geist({ subsets: ['latin'], variable: '--font-geist' })

export const metadata: Metadata = {
  title: 'NetworkMe',
  description: 'Visualize and navigate your professional network',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geist.variable} h-full`} suppressHydrationWarning>
      <body className="min-h-full bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 antialiased flex flex-col">
        <StoreProvider>
          <ThemeProvider>
            <Nav />
            <main className="flex-1">{children}</main>
          </ThemeProvider>
        </StoreProvider>
      </body>
    </html>
  )
}
