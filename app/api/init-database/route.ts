import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET() {
  try {
    // SQL statements to create tables
    const createUserTable = `
      CREATE TABLE IF NOT EXISTS users (
        id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        name TEXT NOT NULL,
        email TEXT UNIQUE,
        role TEXT NOT NULL CHECK (role IN ('admin', 'user')),
        words_per_day INTEGER DEFAULT 5,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
        last_login TIMESTAMP WITH TIME ZONE
      );
    `

    const createVocabularyTable = `
      CREATE TABLE IF NOT EXISTS vocabulary (
        id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
        word TEXT NOT NULL,
        cefr TEXT NOT NULL CHECK (cefr IN ('A1', 'A2', 'B1', 'B2', 'C1', 'C2')),
        part_of_speech TEXT NOT NULL,
        pronunciation TEXT,
        definition TEXT NOT NULL,
        examples TEXT[] NOT NULL,
        audio_url TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
        created_by BIGINT REFERENCES users(id)
      );
    `

    const createUserVocabularyTable = `
      CREATE TABLE IF NOT EXISTS user_vocabulary (
        id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
        user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
        vocabulary_id BIGINT REFERENCES vocabulary(id) ON DELETE CASCADE,
        assigned_date DATE NOT NULL DEFAULT CURRENT_DATE,
        is_learned BOOLEAN NOT NULL DEFAULT FALSE,
        last_practiced TIMESTAMP WITH TIME ZONE,
        UNIQUE(user_id, vocabulary_id)
      );
    `

    const createSubmissionsTable = `
      CREATE TABLE IF NOT EXISTS submissions (
        id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
        user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
        vocabulary_id BIGINT REFERENCES vocabulary(id) ON DELETE CASCADE,
        sentences TEXT[] NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
        feedback TEXT,
        submitted_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
        reviewed_at TIMESTAMP WITH TIME ZONE,
        reviewed_by BIGINT REFERENCES users(id)
      );
    `

    // Execute SQL statements
    await supabase.rpc("exec_sql", { query: createUserTable })
    await supabase.rpc("exec_sql", { query: createVocabularyTable })
    await supabase.rpc("exec_sql", { query: createUserVocabularyTable })
    await supabase.rpc("exec_sql", { query: createSubmissionsTable })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error initializing database:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}

