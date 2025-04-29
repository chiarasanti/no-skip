"use client";

import { useWorkout } from "@/lib/workout-context";
import { UserSwitch } from "@/components/user-switch";
import { WorkoutDay } from "@/components/workout-day";
import { OffDay } from "@/components/off-day";
import { ShameAlert } from "@/components/shame-alert";

export default function Home() {
  const { isLoading, isWorkoutDay, hasMissedWorkout } = useWorkout();

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

      <div className="flex flex-1 flex-col border border-[#FDF2EC]">
        {isWorkoutDay ? <WorkoutDay /> : <OffDay />}
      </div>
    </main>
  );
}
