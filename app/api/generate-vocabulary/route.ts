import { NextResponse } from "next/server";
import { generateVocabularyWithAI } from "@/lib/ai-service";
import { supabase } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const { level, count, topic, userId } = await request.json();

    if (!level || !count || !userId) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required parameters",
        },
        { status: 400 }
      );
    }

    // Generate vocabulary with AI
    const generatedWords = await generateVocabularyWithAI(level, count, topic);

    if (!generatedWords || generatedWords.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Failed to generate vocabulary",
        },
        { status: 500 }
      );
    }

    // Format the generated words for insertion into the database
    const wordsToInsert = generatedWords.map((word) => ({
      word: word.word,
      cefr: level,
      part_of_speech: word.part_of_speech,
      pronunciation: word.pronunciation,
      definition: word.definition,
      examples: word.examples,
      audio_url: "",
      created_by: userId,
      created_at: new Date().toISOString(),
    }));

    // Insert the generated words into the database
    const { data, error } = await supabase
      .from("vocabulary")
      .insert(wordsToInsert)
      .select();

    if (error) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
      message: `${data.length} vocabulary words generated successfully`,
    });
  } catch (error) {
    console.error("Error generating vocabulary:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
