import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
  },
})

// Define types for our database tables
export interface User {
  id: number
  username: string
  password: string
  name: string
  email?: string
  role: "admin" | "user"
  words_per_day: number
  created_at: string
  last_login?: string
}

export interface Vocabulary {
  id: number
  word: string
  cefr: "A1" | "A2" | "B1" | "B2" | "C1" | "C2"
  part_of_speech: string
  pronunciation: string
  definition: string
  examples: string[]
  audio_url?: string
  created_at: string
  created_by: number
}

export interface UserVocabulary {
  id: number
  user_id: number
  vocabulary_id: number
  assigned_date: string
  is_learned: boolean
  last_practiced?: string
}

export interface Submission {
  id: number
  user_id: number
  vocabulary_id: number
  sentences: string[]
  status: "pending" | "approved" | "rejected"
  feedback?: string
  submitted_at: string
  reviewed_at?: string
  reviewed_by?: number
}

