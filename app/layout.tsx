import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Zetseat CMC',
  description: 'Created By Tesfa',
  generator: 'React',
  icons: {
    icon: 'https://zetseat.church/favicon-32x32.png?v=70e0dc0d060db23ae2c5b85c628db934',
    shortcut: 'https://zetseat.church/favicon-32x32.png?v=70e0dc0d060db23ae2c5b85c628db934',
    apple: 'https://zetseat.church/favicon-32x32.png?v=70e0dc0d060db23ae2c5b85c628db934',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
