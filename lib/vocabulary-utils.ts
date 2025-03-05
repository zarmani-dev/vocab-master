import { supabase } from "./supabase"

/**
 * Assigns vocabulary to a user
 */
export async function assignVocabularyToUser(userId: number, vocabularyId: number) {
  try {
    const { error } = await supabase.from("user_vocabulary").upsert(
      {
        user_id: userId,
        vocabulary_id: vocabularyId,
        assigned_date: new Date().toISOString().split("T")[0],
        is_learned: false,
      },
      { onConflict: "user_id,vocabulary_id" },
    )

    if (error) throw error
    return true
  } catch (error) {
    console.error("Error assigning vocabulary:", error)
    return false
  }
}

/**
 * Fetches vocabulary assigned to a user
 */
export async function getUserVocabulary(userId: number) {
  try {
    const { data, error } = await supabase
      .from("user_vocabulary")
      .select(`
        id,
        assigned_date,
        is_learned,
        last_practiced,
        vocabulary:vocabulary_id (
          id,
          word,
          cefr,
          part_of_speech,
          pronunciation,
          definition,
          examples,
          audio_url
        )
      `)
      .eq("user_id", userId)
      .order("assigned_date", { ascending: false })

    if (error) throw error
    return data
  } catch (error) {
    console.error("Error fetching user vocabulary:", error)
    return []
  }
}

// Improve the assignDailyVocabulary function to handle empty vocabulary tables

export async function assignDailyVocabulary(userId: number, wordsPerDay: number) {
  try {
    // Get user's current vocabulary to avoid duplicates
    const { data: existingVocab, error: fetchError } = await supabase
      .from("user_vocabulary")
      .select("vocabulary_id")
      .eq("user_id", userId)

    if (fetchError) throw fetchError

    // Get IDs of vocabulary already assigned to the user
    const existingVocabIds = existingVocab?.map((item) => item.vocabulary_id) || []

    // Check if there's any vocabulary in the database
    const { count: vocabCount, error: countError } = await supabase
      .from("vocabulary")
      .select("*", { count: "exact", head: true })

    if (countError) throw countError

    if (!vocabCount || vocabCount === 0) {
      console.log("No vocabulary available in the database")
      return false
    }

    // Fetch new vocabulary that hasn't been assigned to the user yet
    let query = supabase.from("vocabulary").select("id")

    // Only add the "not in" filter if there are existing vocabulary IDs
    if (existingVocabIds.length > 0) {
      query = query.not("id", "in", `(${existingVocabIds.join(",")})`)
    }

    const { data: newVocab, error: vocabError } = await query.limit(wordsPerDay)

    if (vocabError) throw vocabError

    if (!newVocab || newVocab.length === 0) {
      console.log("No new vocabulary available to assign")
      return false
    }

    // Prepare batch insert data
    const today = new Date().toISOString().split("T")[0]
    const insertData = newVocab.map((vocab) => ({
      user_id: userId,
      vocabulary_id: vocab.id,
      assigned_date: today,
      is_learned: false,
    }))

    // Insert new assignments
    const { error: insertError } = await supabase.from("user_vocabulary").insert(insertData)

    if (insertError) throw insertError

    console.log(`Assigned ${insertData.length} new vocabulary items to user ${userId}`)
    return true
  } catch (error) {
    console.error("Error assigning daily vocabulary:", error)
    return false
  }
}

