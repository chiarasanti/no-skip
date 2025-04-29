"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import type { User, WorkoutLog, WorkoutPlan, MissedWorkout } from "@/lib/types";
import { formatDateForDB, isWorkoutDay, getYesterdayDate } from "@/lib/utils";

interface WorkoutContextType {
  users: User[];
  currentUser: User | null;
  otherUser: User | null;
  isLoading: boolean;
  isWorkoutDay: boolean;
  todayDate: Date;
  workoutLogs: WorkoutLog[];
  workoutPlans: WorkoutPlan[];
  missedWorkouts: MissedWorkout[];
  switchUser: () => void;
  markWorkoutDone: (description: string) => Promise<void>;
  savePlan: (planText: string) => Promise<void>;
  hasMissedWorkout: (userId: number) => boolean;
  hasCompletedWorkout: (userId: number) => boolean;
  hasPlannedWorkout: (userId: number) => boolean;
  getWorkoutPlan: (userId: number) => string;
}

const WorkoutContext = createContext<WorkoutContextType | undefined>(undefined);

export function WorkoutProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<User[]>([]);
  const [currentUserIndex, setCurrentUserIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [todayDate] = useState(new Date());
  const [workoutLogs, setWorkoutLogs] = useState<WorkoutLog[]>([]);
  const [workoutPlans, setWorkoutPlans] = useState<WorkoutPlan[]>([]);
  const [missedWorkouts, setMissedWorkouts] = useState<MissedWorkout[]>([]);

  const isWorkoutToday = isWorkoutDay(todayDate);
  const currentUser = users[currentUserIndex] || null;
  const otherUser =
    users.find((user) => user.name !== currentUser?.name) || null;

  // Fetch users
  useEffect(() => {
    const fetchUsers = async () => {
      const supabase = getSupabaseBrowserClient();
      const { data, error } = await supabase.from("users").select("*");

      if (error) {
        console.error("Error fetching users:", error);
        return;
      }

      // Sort users by name to ensure consistent order
      const sortedUsers = data.sort((a, b) => a.name.localeCompare(b.name));
      setUsers(sortedUsers);
    };

    fetchUsers();
  }, []);

  // Fetch workout data
  useEffect(() => {
    const fetchWorkoutData = async () => {
      if (users.length === 0) return;

      setIsLoading(true);
      const supabase = getSupabaseBrowserClient();
      const today = formatDateForDB(todayDate);
      const yesterday = formatDateForDB(getYesterdayDate());

      // Fetch workout logs for today
      const { data: logsData, error: logsError } = await supabase
        .from("workout_logs")
        .select("*")
        .in("workout_date", [today, yesterday]);

      if (logsError) {
        console.error("Error fetching workout logs:", logsError);
      } else {
        setWorkoutLogs(logsData || []);
      }

      // Fetch workout plans
      const { data: plansData, error: plansError } = await supabase
        .from("workout_plans")
        .select("*")
        .order("created_at", { ascending: false });

      if (plansError) {
        console.error("Error fetching workout plans:", plansError);
      } else {
        setWorkoutPlans(plansData || []);
      }

      // Fetch missed workouts
      const { data: missedData, error: missedError } = await supabase
        .from("missed_workouts")
        .select("*")
        .eq("workout_date", yesterday)
        .eq("acknowledged", false);

      if (missedError) {
        console.error("Error fetching missed workouts:", missedError);
      } else {
        setMissedWorkouts(missedData || []);
      }

      // Check for missed workouts from yesterday
      if (isWorkoutDay(getYesterdayDate())) {
        const yesterdayLogs = (logsData || []).filter(
          (log) => log.workout_date === yesterday
        );

        // For each user, check if they missed their workout yesterday
        for (const user of users) {
          const userCompletedYesterday = yesterdayLogs.some(
            (log) => log.user_id === user.id && log.completed
          );

          if (!userCompletedYesterday) {
            const alreadyRecorded = (missedData || []).some(
              (miss) =>
                miss.user_id === user.id && miss.workout_date === yesterday
            );

            if (!alreadyRecorded) {
              // Record missed workout
              await supabase.from("missed_workouts").insert({
                user_id: user.id,
                workout_date: yesterday,
                acknowledged: false,
              });
            }
          }
        }
      }

      setIsLoading(false);
    };

    fetchWorkoutData();

    // Set up interval to check every minute
    const interval = setInterval(fetchWorkoutData, 60000);
    return () => clearInterval(interval);
  }, [users, todayDate]);

  const switchUser = () => {
    setCurrentUserIndex((prev) => (prev === 0 ? 1 : 0));
  };

  const markWorkoutDone = async (description: string) => {
    if (!currentUser) return;

    const supabase = getSupabaseBrowserClient();
    const today = formatDateForDB(todayDate);

    // Check if there's already a log for today
    const existingLogIndex = workoutLogs.findIndex(
      (log) => log.user_id === currentUser.id && log.workout_date === today
    );

    if (existingLogIndex >= 0) {
      // Update existing log
      const { error } = await supabase
        .from("workout_logs")
        .update({
          completed: true,
          completed_at: new Date().toISOString(),
          workout_description: description,
        })
        .eq("id", workoutLogs[existingLogIndex].id);

      if (error) {
        console.error("Error updating workout log:", error);
        return;
      }

      // Update local state
      const updatedLogs = [...workoutLogs];
      updatedLogs[existingLogIndex] = {
        ...updatedLogs[existingLogIndex],
        completed: true,
        completed_at: new Date().toISOString(),
        workout_description: description,
      };
      setWorkoutLogs(updatedLogs);
    } else {
      // Create new log
      const { data, error } = await supabase
        .from("workout_logs")
        .insert({
          user_id: currentUser.id,
          workout_date: today,
          completed: true,
          completed_at: new Date().toISOString(),
          workout_description: description,
        })
        .select();

      if (error) {
        console.error("Error creating workout log:", error);
        return;
      }

      // Update local state
      setWorkoutLogs([...workoutLogs, data[0]]);
    }
  };

  const savePlan = async (planText: string) => {
    if (!currentUser) return;

    const supabase = getSupabaseBrowserClient();

    // Find the next workout day
    const nextWorkoutDate = new Date(todayDate);
    do {
      nextWorkoutDate.setDate(nextWorkoutDate.getDate() + 1);
    } while (!isWorkoutDay(nextWorkoutDate));

    const nextWorkoutDateStr = formatDateForDB(nextWorkoutDate);

    // Check if there's already a plan for the next workout day
    const existingPlanIndex = workoutPlans.findIndex(
      (plan) =>
        plan.user_id === currentUser.id && plan.for_date === nextWorkoutDateStr
    );

    if (existingPlanIndex >= 0) {
      // Update existing plan
      const { error } = await supabase
        .from("workout_plans")
        .update({
          plan_text: planText,
          created_at: new Date().toISOString(),
        })
        .eq("id", workoutPlans[existingPlanIndex].id);

      if (error) {
        console.error("Error updating workout plan:", error);
        return;
      }

      // Update local state
      const updatedPlans = [...workoutPlans];
      updatedPlans[existingPlanIndex] = {
        ...updatedPlans[existingPlanIndex],
        plan_text: planText,
        created_at: new Date().toISOString(),
      };
      setWorkoutPlans(updatedPlans);
    } else {
      // Create new plan
      const { data, error } = await supabase
        .from("workout_plans")
        .insert({
          user_id: currentUser.id,
          plan_text: planText,
          for_date: nextWorkoutDateStr,
        })
        .select();

      if (error) {
        console.error("Error creating workout plan:", error);
        return;
      }

      // Update local state
      setWorkoutPlans([...workoutPlans, data[0]]);
    }
  };

  const hasMissedWorkout = (userId: number): boolean => {
    return missedWorkouts.some((miss) => miss.user_id === userId);
  };

  const hasCompletedWorkout = (userId: number): boolean => {
    const today = formatDateForDB(todayDate);
    return workoutLogs.some(
      (log) =>
        log.user_id === userId && log.workout_date === today && log.completed
    );
  };

  const hasPlannedWorkout = (userId: number): boolean => {
    // Find the next workout day
    const nextWorkoutDate = new Date(todayDate);
    do {
      nextWorkoutDate.setDate(nextWorkoutDate.getDate() + 1);
    } while (!isWorkoutDay(nextWorkoutDate));

    const nextWorkoutDateStr = formatDateForDB(nextWorkoutDate);

    return workoutPlans.some(
      (plan) => plan.user_id === userId && plan.for_date === nextWorkoutDateStr
    );
  };

  const getWorkoutPlan = (userId: number): string => {
    const today = formatDateForDB(todayDate);
    const todayPlan = workoutPlans.find(
      (plan) => plan.user_id === userId && plan.for_date === today
    );

    if (todayPlan) {
      return todayPlan.plan_text;
    }

    // Get the most recent plan
    const userPlans = workoutPlans.filter((plan) => plan.user_id === userId);
    if (userPlans.length > 0) {
      userPlans.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      return userPlans[0].plan_text;
    }

    return "";
  };

  return (
    <WorkoutContext.Provider
      value={{
        users,
        currentUser,
        otherUser,
        isLoading,
        isWorkoutDay: isWorkoutToday,
        todayDate,
        workoutLogs,
        workoutPlans,
        missedWorkouts,
        switchUser,
        markWorkoutDone,
        savePlan,
        hasMissedWorkout,
        hasCompletedWorkout,
        hasPlannedWorkout,
        getWorkoutPlan,
      }}
    >
      {children}
    </WorkoutContext.Provider>
  );
}

export function useWorkout() {
  const context = useContext(WorkoutContext);
  if (context === undefined) {
    throw new Error("useWorkout must be used within a WorkoutProvider");
  }
  return context;
}
