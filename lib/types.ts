export interface User {
  id: number
  name: string
  avatar_url: string
}

export interface WorkoutLog {
  id: number
  user_id: number
  workout_date: string
  completed: boolean
  completed_at: string | null
  workout_description: string | null
  created_at: string
}

export interface WorkoutPlan {
  id: number
  user_id: number
  plan_text: string
  created_at: string
  for_date: string
}

export interface MissedWorkout {
  id: number
  user_id: number
  workout_date: string
  acknowledged: boolean
  created_at: string
}
