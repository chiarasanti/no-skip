"use client";

import { useWorkout } from "@/lib/workout-context";
import { UserSwitch } from "@/components/user-switch";
import { WorkoutDay } from "@/components/workout-day";
import { OffDay } from "@/components/off-day";
import { ShameAlert } from "@/components/shame-alert";
import { PixelButton } from "@/components/pixel-button";

export default function Home() {
  const { 
    isLoading, 
    isWorkoutDay, 
    hasMissedWorkout,
    isTestMode,
    toggleTestMode,
    isTestWorkoutDay,
    toggleTestWorkoutDay,
  } = useWorkout();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="font-mono text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <main className="mx-auto flex max-w-md flex-col gap-4">
      <ShameAlert />

      <UserSwitch />

      {/* Test mode controls - only visible in development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="flex flex-col gap-2 border border-[#FDF2EC] p-4">
          <p className="text-center text-white">Test Mode Controls</p>
          <div className="flex gap-2">
            <PixelButton
              className="flex-1"
              onClick={toggleTestMode}
            >
              {isTestMode ? "Disable Test Mode" : "Enable Test Mode"}
            </PixelButton>
            {isTestMode && (
              <PixelButton
                className="flex-1"
                onClick={toggleTestWorkoutDay}
              >
                {isTestWorkoutDay ? "Switch to Off Day" : "Switch to Workout Day"}
              </PixelButton>
            )}
          </div>
        </div>
      )}

      <div className="flex flex-1 flex-col border border-[#FDF2EC]">
        {isWorkoutDay ? <WorkoutDay /> : <OffDay />}
      </div>
    </main>
  );
}
