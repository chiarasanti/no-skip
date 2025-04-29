"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

interface UserAvatarProps {
  src: string;
  alt: string;
  size?: "sm" | "lg";
  className?: string;
}

export function UserAvatar({
  src,
  alt,
  size = "lg",
  className,
}: UserAvatarProps) {
  const sizeClasses = {
    sm: "w-[3.5rem] h-[3.5rem]",
    lg: "w-[165px] h-[200px]",
  };

  return (
    <div
      className={cn("relative overflow-hidden", sizeClasses[size], className)}
    >
      <Image
        src={src || "/placeholder.svg"}
        alt={alt}
        fill
        className="object-contain"
      />
    </div>
  );
}
