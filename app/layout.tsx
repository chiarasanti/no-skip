import type React from "react"
import "./globals.css"
import type { Metadata } from "next"
import { WorkoutProvider } from "@/lib/workout-context"
import { Jersey_10 } from 'next/font/google'

const jersey = Jersey_10({ 
  weight: '400',
  subsets: ['latin'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: "Pixel Art Workout App",
  description: "A workout challenge app for Cherry and Peus",
  generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={jersey.className}>
        <WorkoutProvider>{children}</WorkoutProvider>
      </body>
    </html>
  )
}
