"use client";

import { useState, useEffect } from "react";
import { useWorkout } from "@/lib/workout-context";
import { UserAvatar } from "@/components/user-avatar";
import { PixelButton } from "@/components/pixel-button";
import { PixelInput } from "@/components/pixel-input";
import { formatDate, isWorkoutDay } from "@/lib/utils";

export function OffDay() {
  const {
    currentUser,
    todayDate,
    savePlan,
    workoutPlans,
  } = useWorkout();

  const [planText, setPlanText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasPlanned, setHasPlanned] = useState(false);
  const [confirmedPlan, setConfirmedPlan] = useState("");

  // Find the next workout day
  const nextWorkoutDate = new Date(todayDate);
  do {
    nextWorkoutDate.setDate(nextWorkoutDate.getDate() + 1);
  } while (!isWorkoutDay(nextWorkoutDate));

  const nextWorkoutDateStr = nextWorkoutDate.toISOString().split('T')[0];

  useEffect(() => {
    if (currentUser) {
      const hasPlan = workoutPlans.some(
        (plan) =>
          plan.user_id === currentUser.id &&
          plan.for_date === nextWorkoutDateStr
      );
      setHasPlanned(hasPlan);
      if (hasPlan) {
        const plan = workoutPlans.find(
          (plan) =>
            plan.user_id === currentUser.id &&
            plan.for_date === nextWorkoutDateStr
        );
        setConfirmedPlan(plan?.plan_text || "");
      }
    }
  }, [currentUser, workoutPlans, nextWorkoutDateStr]);

  if (!currentUser) return null;

  const handleSavePlan = async () => {
    if (!planText.trim() || !currentUser) return;

    setIsSubmitting(true);
    try {
      await savePlan(planText);
      setPlanText("");
      // Update the local state after saving
      setHasPlanned(true);
      setConfirmedPlan(planText);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <p className="text-lg text-center text-[#FDF2EC]">
          {formatDate(todayDate)}
        </p>
        <p className="text-5xl text-center text-[#FDF2EC]">off day</p>
      </div>

      <div className="flex justify-center py-8">
        <UserAvatar
          src={currentUser.off_avatar_url}
          alt={currentUser.name}
          size="lg"
        />
      </div>

      {hasPlanned ? (
        <p className="text-lg text-center text-[#FDF2EC] whitespace-pre-wrap mb-8">
          {confirmedPlan}
        </p>
      ) : (
        <PixelInput
          className="h-[60px] w-full resize-none"
          placeholder="Next time workout?"
          value={planText}
          onChange={(e) => setPlanText(e.target.value)}
          disabled={isSubmitting}
        />
      )}

      <div className="mt-auto">
        <PixelButton
          className="w-full"
          onClick={handleSavePlan}
          disabled={!planText.trim() || hasPlanned || isSubmitting}
        >
          {hasPlanned
            ? "- CONFIRMED -"
            : isSubmitting
            ? "- SAVING -"
            : "- CONFIRM -"}
        </PixelButton>
      </div>
    </div>
  );
}
