import { supabase } from "./supabase"

/**
 * Checks if a table exists in the database
 */
export async function checkTableExists(tableName: string): Promise<boolean> {
  try {
    const { error } = await supabase.from(tableName).select("id").limit(1)

    if (error && error.message.includes("does not exist")) {
      return false
    }

    return true
  } catch (error) {
    console.error(`Error checking if table ${tableName} exists:`, error)
    return false
  }
}

/**
 * Logs database table information for debugging
 */
export async function logDatabaseInfo() {
  const tables = ["users", "vocabulary", "user_vocabulary", "submissions"]

  console.log("--- Database Tables Status ---")

  for (const table of tables) {
    const exists = await checkTableExists(table)
    console.log(`Table ${table}: ${exists ? "Exists" : "Does not exist"}`)

    if (exists) {
      try {
        const { data, error } = await supabase.from(table).select("count").single()
        if (error) throw error
        console.log(`  - Row count: ${data.count}`)
      } catch (error) {
        console.error(`  - Error getting row count: ${error}`)
      }
    }
  }

  console.log("--- End Database Info ---")
}

/**
 * Checks if a user has vocabulary assigned
 */
export async function checkUserVocabulary(userId: number) {
  try {
    const { data, error, count } = await supabase
      .from("user_vocabulary")
      .select("id", { count: "exact" })
      .eq("user_id", userId)

    if (error) throw error

    return {
      hasVocabulary: count !== null && count > 0,
      count: count || 0,
    }
  } catch (error) {
    console.error("Error checking user vocabulary:", error)
    return { hasVocabulary: false, count: 0 }
  }
}

