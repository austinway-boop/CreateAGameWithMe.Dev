import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-sans',
})

export const metadata: Metadata = {
  title: 'Artify — CREATE',
  description: 'A minimal ideation wizard for game developers',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased min-h-screen bg-gradient-to-b from-background to-muted/20`}>
        <main className="min-h-screen flex flex-col">
          {children}
        </main>
      </body>
    </html>
  )
}
