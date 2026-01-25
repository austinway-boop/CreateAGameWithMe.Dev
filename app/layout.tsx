import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Providers } from '@/components/Providers'
import './globals.css'

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-sans',
})

export const metadata: Metadata = {
  title: 'Create A Game With Me',
  description: 'Turn your ideas into game concepts with AI-powered ideation tools',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased min-h-screen bg-gradient-to-b from-background to-muted/20`}>
        <Providers>
          <main className="min-h-screen flex flex-col">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  )
}
