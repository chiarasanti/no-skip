"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
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

      setUsers(data.sort((a, b) => a.name.localeCompare(b.name)));
    };

    fetchUsers();
  }, []);

  // Fetch workout data
  const fetchWorkoutData = useCallback(async () => {
    if (users.length === 0) return;

    setIsLoading(true);
    const supabase = getSupabaseBrowserClient();
    const today = formatDateForDB(todayDate);
    const yesterday = formatDateForDB(getYesterdayDate());

    try {
      // Fetch all data in parallel
      const [
        { data: logsData, error: logsError },
        { data: plansData, error: plansError },
        { data: missedData, error: missedError },
      ] = await Promise.all([
        supabase
          .from("workout_logs")
          .select("*")
          .in("workout_date", [today, yesterday]),
        supabase
          .from("workout_plans")
          .select("*")
          .order("created_at", { ascending: false }),
        supabase
          .from("missed_workouts")
          .select("*")
          .eq("workout_date", yesterday)
          .eq("acknowledged", false),
      ]);

      if (logsError) throw logsError;
      if (plansError) throw plansError;
      if (missedError) throw missedError;

      setWorkoutLogs(logsData || []);
      setWorkoutPlans(plansData || []);
      setMissedWorkouts(missedData || []);

      // Check for missed workouts from yesterday
      if (isWorkoutDay(getYesterdayDate())) {
        const yesterdayLogs = (logsData || []).filter(
          (log) => log.workout_date === yesterday
        );

        const missedWorkoutPromises = users.map(async (user) => {
          const userCompletedYesterday = yesterdayLogs.some(
            (log) => log.user_id === user.id && log.completed
          );

          if (!userCompletedYesterday) {
            const alreadyRecorded = (missedData || []).some(
              (miss) => miss.user_id === user.id && miss.workout_date === yesterday
            );

            if (!alreadyRecorded) {
              return supabase.from("missed_workouts").insert({
                user_id: user.id,
                workout_date: yesterday,
                acknowledged: false,
              });
            }
          }
          return null;
        });

        await Promise.all(missedWorkoutPromises);
      }

      // Auto-acknowledge missed workouts that are older than yesterday
      const oldMissedWorkouts = (missedData || []).filter(
        (miss) => miss.workout_date !== yesterday
      );

      if (oldMissedWorkouts.length > 0) {
        const acknowledgePromises = oldMissedWorkouts.map((miss) =>
          supabase
            .from("missed_workouts")
            .update({ acknowledged: true })
            .eq("id", miss.id)
        );

        await Promise.all(acknowledgePromises);
      }
    } catch (error) {
      console.error("Error fetching workout data:", error);
    } finally {
      setIsLoading(false);
    }
  }, [users, todayDate]);

  // Set up interval to check every minute
  useEffect(() => {
    fetchWorkoutData();
    const interval = setInterval(fetchWorkoutData, 60000);
    return () => clearInterval(interval);
  }, [fetchWorkoutData]);

  const switchUser = () => {
    setCurrentUserIndex((prev) => (prev === 0 ? 1 : 0));
  };

  const markWorkoutDone = async (description: string) => {
    if (!currentUser) return;

    const supabase = getSupabaseBrowserClient();
    const today = formatDateForDB(todayDate);

    try {
      const existingLogIndex = workoutLogs.findIndex(
        (log) => log.user_id === currentUser.id && log.workout_date === today
      );

      if (existingLogIndex >= 0) {
        const { error } = await supabase
          .from("workout_logs")
          .update({
            completed: true,
            completed_at: new Date().toISOString(),
            workout_description: description,
          })
          .eq("id", workoutLogs[existingLogIndex].id);

        if (error) throw error;

        setWorkoutLogs((prev) =>
          prev.map((log, index) =>
            index === existingLogIndex
              ? {
                  ...log,
                  completed: true,
                  completed_at: new Date().toISOString(),
                  workout_description: description,
                }
              : log
          )
        );
      } else {
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

        if (error) throw error;

        setWorkoutLogs((prev) => [...prev, data[0]]);
      }
    } catch (error) {
      console.error("Error marking workout as done:", error);
    }
  };

  const savePlan = async (planText: string) => {
    if (!currentUser) return;

    const supabase = getSupabaseBrowserClient();

    try {
      // Find the next workout day
      const nextWorkoutDate = new Date(todayDate);
      do {
        nextWorkoutDate.setDate(nextWorkoutDate.getDate() + 1);
      } while (!isWorkoutDay(nextWorkoutDate));

      const nextWorkoutDateStr = formatDateForDB(nextWorkoutDate);

      const existingPlanIndex = workoutPlans.findIndex(
        (plan) =>
          plan.user_id === currentUser.id &&
          plan.for_date === nextWorkoutDateStr
      );

      if (existingPlanIndex >= 0) {
        const { error } = await supabase
          .from("workout_plans")
          .update({
            plan_text: planText,
            created_at: new Date().toISOString(),
          })
          .eq("id", workoutPlans[existingPlanIndex].id);

        if (error) throw error;

        setWorkoutPlans((prev) =>
          prev.map((plan, index) =>
            index === existingPlanIndex
              ? {
                  ...plan,
                  plan_text: planText,
                  created_at: new Date().toISOString(),
                }
              : plan
          )
        );
      } else {
        const { data, error } = await supabase
          .from("workout_plans")
          .insert({
            user_id: currentUser.id,
            for_date: nextWorkoutDateStr,
            plan_text: planText,
            created_at: new Date().toISOString(),
          })
          .select();

        if (error) throw error;

        setWorkoutPlans((prev) => [...prev, data[0]]);
      }
    } catch (error) {
      console.error("Error saving workout plan:", error);
    }
  };

  const hasMissedWorkout = (userId: number): boolean => {
    return missedWorkouts.some(
      (missed) => missed.user_id === userId && !missed.acknowledged
    );
  };

  const hasCompletedWorkout = (userId: number): boolean => {
    return workoutLogs.some(
      (log) =>
        log.user_id === userId &&
        log.workout_date === formatDateForDB(todayDate) &&
        log.completed
    );
  };

  const hasPlannedWorkout = (userId: number): boolean => {
    return workoutPlans.some(
      (plan) =>
        plan.user_id === userId && plan.for_date === formatDateForDB(todayDate)
    );
  };

  const getWorkoutPlan = (userId: number): string => {
    const plan = workoutPlans.find(
      (plan) =>
        plan.user_id === userId && plan.for_date === formatDateForDB(todayDate)
    );
    return plan?.plan_text || "";
  };

  const value = {
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
  };

  return (
    <WorkoutContext.Provider value={value}>{children}</WorkoutContext.Provider>
  );
}

export function useWorkout() {
  const context = useContext(WorkoutContext);
  if (context === undefined) {
    throw new Error("useWorkout must be used within a WorkoutProvider");
  }
  return context;
}
