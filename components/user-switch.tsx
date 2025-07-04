"use client";

import { useWorkout } from "@/lib/workout-context";
import { UserAvatar } from "@/components/user-avatar";
import { textSizes, isWorkoutDay as isWorkoutDayFn } from "@/lib/utils";

export function UserSwitch() {
  const {
    otherUser,
    switchUser,
    hasCompletedWorkout,
    workoutPlans,
    isWorkoutDay,
  } = useWorkout();

  if (!otherUser) return null;

  const hasCompleted = hasCompletedWorkout(otherUser.id);

  // Find the next workout day
  const today = new Date();
  const nextWorkoutDate = new Date(today);
  do {
    nextWorkoutDate.setDate(nextWorkoutDate.getDate() + 1);
  } while (!isWorkoutDayFn(nextWorkoutDate));

  const nextWorkoutDateStr = nextWorkoutDate.toISOString().split('T')[0];
  const hasPlanned = workoutPlans.some(
    (plan) =>
      plan.user_id === otherUser.id &&
      plan.for_date === nextWorkoutDateStr
  );

  let statusText = "";

  // Determine the other user's name based on their avatar
  const otherUserName = otherUser.avatar_url.includes("cherry-avatar")
    ? "Peus"
    : "Cherry";

  if (isWorkoutDay) {
    statusText = hasCompleted
      ? `* I've already worked out!`
      : `* Still haven't worked out... mock me!`;
  } else {
    statusText = hasPlanned
      ? "* Already planned my next move!"
      : "* Still need to plan. Go ahead, shame me.";
  }

  return (
    <div
      className="flex cursor-pointer items-center gap-4 border border-[#FDF2EC] p-4 transition-all"
      onClick={switchUser}
    >
      <UserAvatar
        src={otherUser.avatar_url}
        alt={otherUser.name}
        size="sm"
        className="border border-[#FDF2EC]"
      />
      <p className="text-base text-[#FDF2EC]">{statusText}</p>
    </div>
  );
}
