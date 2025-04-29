"use client";

import { useState } from "react";
import { useWorkout } from "@/lib/workout-context";
import { UserAvatar } from "@/components/user-avatar";
import { PixelButton } from "@/components/pixel-button";
import { formatDate, textSizes } from "@/lib/utils";

export function WorkoutDay() {
  const {
    currentUser,
    todayDate,
    markWorkoutDone,
    hasCompletedWorkout,
    getWorkoutPlan,
  } = useWorkout();

  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!currentUser) return null;

  const hasCompleted = hasCompletedWorkout(currentUser.id);
  const workoutPlan = getWorkoutPlan(currentUser.id);

  const handleMarkDone = async () => {
    if (hasCompleted || !currentUser || isSubmitting) return;

    setIsSubmitting(true);
    await markWorkoutDone(workoutPlan);
    // We'll keep isSubmitting true to keep the button disabled
    // The page will refresh with the updated state from the context
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <p className="text-lg text-center text-white">
          {formatDate(todayDate)}
        </p>
        <p className="text-5xl text-center text-white">workout day</p>
      </div>

      <div className="flex justify-center py-8">
        <UserAvatar
          src={currentUser.avatar_url}
          alt={currentUser.name}
          size="lg"
        />
      </div>

      <p className="text-lg text-center text-white mb-8">
        {hasCompleted
          ? "Workout completed for today, go flex!"
          : workoutPlan || "No workout planned"}
      </p>

      <div className="mt-auto">
        <PixelButton
          className="w-full"
          onClick={handleMarkDone}
          disabled={hasCompleted || isSubmitting}
        >
          {hasCompleted ? "- DONE -" : isSubmitting ? "- SAVING -" : "- DONE -"}
        </PixelButton>
      </div>
    </div>
  );
}
