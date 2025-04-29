"use client"

import { useState } from "react"
import { useWorkout } from "@/lib/workout-context"
import { UserAvatar } from "@/components/user-avatar"
import { PixelButton } from "@/components/pixel-button"
import { PixelInput } from "@/components/pixel-input"
import { formatDate, textSizes } from "@/lib/utils"

export function OffDay() {
  const { currentUser, todayDate, savePlan, hasPlannedWorkout } = useWorkout()

  const [planText, setPlanText] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!currentUser) return null

  const hasPlanned = hasPlannedWorkout(currentUser.id)

  const handleSavePlan = async () => {
    if (!planText.trim() || !currentUser) return

    setIsSubmitting(true)
    await savePlan(planText)
    setPlanText("")
    setIsSubmitting(false)
  }

  return (
    <div className="flex flex-col gap-6 p-4">
      <p className={`${textSizes.lg} text-center text-white`}>
        {formatDate(todayDate)}
      </p>

      <p className={`${textSizes.xl} text-center text-white`}>
        off day
      </p>

      <div className="flex justify-center py-6">
        <UserAvatar src={currentUser.avatar_url} alt={currentUser.name} />
      </div>

      <PixelInput
        className="h-32 w-full resize-none"
        placeholder="What workout will you do next time?"
        value={planText}
        onChange={(e) => setPlanText(e.target.value)}
        disabled={hasPlanned || isSubmitting}
      />

      <div className="mt-auto">
        <PixelButton
          className="w-full"
          onClick={handleSavePlan}
          disabled={!planText.trim() || hasPlanned || isSubmitting}
        >
          {hasPlanned ? "- CONFIRMED -" : isSubmitting ? "- SAVING -" : "- CONFIRM -"}
        </PixelButton>
      </div>
    </div>
  )
}
