"use client";

import { useState, useEffect } from "react";
import { useWorkout } from "@/lib/workout-context";
import { UserAvatar } from "@/components/user-avatar";
import { PixelButton } from "@/components/pixel-button";
import { formatDate, textSizes } from "@/lib/utils";
import dynamic from "next/dynamic";

const Confetti = dynamic(() => import("react-confetti"), {
  ssr: false,
});

export function WorkoutDay() {
  const {
    currentUser,
    todayDate,
    markWorkoutDone,
    hasCompletedWorkout,
    getWorkoutPlan,
  } = useWorkout();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== "undefined" ? window.innerWidth : 0,
    height: typeof window !== "undefined" ? window.innerHeight : 0,
  });

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  if (!currentUser) return null;

  const hasCompleted = hasCompletedWorkout(currentUser.id);
  const workoutPlan = getWorkoutPlan(currentUser.id);

  const handleMarkDone = async () => {
    if (hasCompleted || !currentUser || isSubmitting) return;

    setIsSubmitting(true);
    await markWorkoutDone(workoutPlan);
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 3000);
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      <div
        className={`fixed inset-0 transition-opacity duration-500 ${
          showConfetti ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        {showConfetti && (
          <Confetti
            width={windowSize.width}
            height={windowSize.height}
            recycle={false}
            numberOfPieces={300}
            gravity={0.8}
          />
        )}
      </div>
      <div>
        <p className="text-lg text-center text-[#FDF2EC]">
          {formatDate(todayDate)}
        </p>
        <p className="text-5xl text-center text-[#FDF2EC]">workout day</p>
      </div>

      <div className="flex justify-center py-8">
        <UserAvatar
          src={currentUser.avatar_url}
          alt={currentUser.name}
          size="lg"
        />
      </div>

      <p className="text-lg text-center text-[#FDF2EC] mb-8">
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
