import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Providers } from '@/components/Providers'
import { PageWrapper } from '@/components/PageWrapper'
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
      <body className={`${inter.variable} font-sans antialiased min-h-screen bg-gray-50`}>
        <Providers>
          <main className="min-h-screen flex flex-col">
            <PageWrapper>
              {children}
            </PageWrapper>
          </main>
        </Providers>
      </body>
    </html>
  )
}
