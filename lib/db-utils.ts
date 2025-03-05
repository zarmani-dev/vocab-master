import { supabase } from "./supabase"

export async function isDatabaseInitialized(): Promise<boolean> {
  try {
    // Try to query the users table
    const { error } = await supabase.from("users").select("id").limit(1)

    // If there's an error about the table not existing
    if (error && error.message.includes("does not exist")) {
      return false
    }

    return true
  } catch (error) {
    console.error("Error checking database tables:", error)
    return false
  }
}

