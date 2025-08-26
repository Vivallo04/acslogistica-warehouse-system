import type React from "react"
import type { Metadata } from "next"
import ClientRootLayout from "./clientLayout"

export const metadata: Metadata = {
  title: "Warehouse Management System - ACS Logística",
  description: "Dashboard de gestión para ACS Logística",
  generator: 'Lambda Costa Rica',
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/favicon.ico',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <ClientRootLayout>{children}</ClientRootLayout>
}


import './globals.css'