"use client"

import type React from "react"

import { cn } from "@/lib/utils"
import type { ButtonHTMLAttributes } from "react"

interface PixelButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode
  className?: string
}

export function PixelButton({ children, className, ...props }: PixelButtonProps) {
  return (
    <button
      className={cn(
        "border-2 border-white bg-black px-6 py-3 font-mono text-xl text-white transition-all hover:bg-white hover:text-black focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}
