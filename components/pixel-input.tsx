"use client"

import { cn } from "@/lib/utils"
import type { TextareaHTMLAttributes } from "react"

interface PixelInputProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  className?: string
}

export function PixelInput({ className, ...props }: PixelInputProps) {
  return (
    <textarea
      className={cn(
        "border-2 border-white bg-black p-4 font-mono text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black",
        className,
      )}
      {...props}
    />
  )
}
