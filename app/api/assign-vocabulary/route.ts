import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function POST(request: Request) {
  try {
    const { userId, count = 5 } = await request.json()

    if (!userId) {
      return NextResponse.json({ success: false, error: "User ID is required" }, { status: 400 })
    }

    // Check if user exists
    const { data: user, error: userError } = await supabase.from("users").select("id").eq("id", userId).single()

    if (userError || !user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 })
    }

    // Get vocabulary that hasn't been assigned to the user
    const { data: existingVocab, error: fetchError } = await supabase
      .from("user_vocabulary")
      .select("vocabulary_id")
      .eq("user_id", userId)

    if (fetchError) {
      return NextResponse.json({ success: false, error: fetchError.message }, { status: 500 })
    }

    // Get IDs of vocabulary already assigned to the user
    const existingVocabIds = existingVocab?.map((item) => item.vocabulary_id) || []

    // Fetch vocabulary that hasn't been assigned to the user
    let query = supabase.from("vocabulary").select("id")

    // Only add the "not in" filter if there are existing vocabulary IDs
    if (existingVocabIds.length > 0) {
      query = query.not("id", "in", `(${existingVocabIds.join(",")})`)
    }

    const { data: availableVocab, error: vocabError } = await query.limit(count)

    if (vocabError) {
      return NextResponse.json({ success: false, error: vocabError.message }, { status: 500 })
    }

    if (!availableVocab || availableVocab.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "No new vocabulary available to assign",
        },
        { status: 404 },
      )
    }

    // Prepare batch insert data
    const today = new Date().toISOString().split("T")[0]
    const insertData = availableVocab.map((vocab) => ({
      user_id: userId,
      vocabulary_id: vocab.id,
      assigned_date: today,
      is_learned: false,
    }))

    // Insert new assignments
    const { error: insertError } = await supabase.from("user_vocabulary").insert(insertData)

    if (insertError) {
      return NextResponse.json({ success: false, error: insertError.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: `Assigned ${insertData.length} vocabulary items to user ${userId}`,
      count: insertData.length,
    })
  } catch (error) {
    console.error("Error in assign-vocabulary API:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

