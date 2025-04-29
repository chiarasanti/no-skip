"use client"

import { useWorkout } from "@/lib/workout-context"
import { textSizes } from "@/lib/utils"

export function ShameAlert() {
  const { users, missedWorkouts } = useWorkout()

  if (missedWorkouts.length === 0) return null

  const missedUser = users.find((user) => user.id === missedWorkouts[0].user_id)

  if (!missedUser) return null

  return (
    <div className="w-full bg-red-600 p-4 text-center">
      <p className={`${textSizes.lg} animate-pulse text-white`}>
        {missedUser.name} didn't workout yesterday. Shame time!!
      </p>
    </div>
  )
}
