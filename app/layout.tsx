import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { AuthCheck } from "@/components/auth-check"
import { Toaster } from "@/components/ui/toaster"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "VocabMaster",
  description: "Learn vocabulary efficiently with Oxford dictionary format",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthCheck>{children}</AuthCheck>
        <Toaster />
      </body>
    </html>
  )
}



import './globals.css'