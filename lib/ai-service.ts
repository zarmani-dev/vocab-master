// AI service for Gemini integration

export async function generateAIExamples(word: string): Promise<string[]> {
  try {
    const prompt = `Generate 3 example sentences using the word "${word}" in different contexts. Each sentence should clearly demonstrate the meaning of the word. Return only the sentences as a JSON array of strings.`

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1024,
          },
        }),
      },
    )

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`)
    }

    const data = await response.json()

    // Extract the text from the response
    const text = data.candidates[0].content.parts[0].text

    // Try to parse the JSON array from the text
    try {
      // Look for anything that looks like a JSON array in the response
      const match = text.match(/\[.*\]/s)
      if (match) {
        const jsonArray = JSON.parse(match[0])
        return Array.isArray(jsonArray) ? jsonArray : []
      }

      // If no JSON array is found, split by newlines and clean up
      return text
        .split("\n")
        .filter((line) => line.trim().length > 0 && line.toLowerCase().includes(word.toLowerCase()))
        .slice(0, 3)
    } catch (e) {
      console.error("Error parsing examples:", e)
      // Fallback: split by newlines and clean up
      return text
        .split("\n")
        .filter((line) => line.trim().length > 0)
        .slice(0, 3)
    }
  } catch (error) {
    console.error("Error generating examples:", error)
    throw error
  }
}

export async function generatePronunciation(word: string): Promise<{ pronunciation: string; audioUrl: string }> {
  try {
    const prompt = `Generate the IPA pronunciation for the English word "${word}". Return only the IPA pronunciation in the format /pronunciation/ without any additional text or explanation.`

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 100,
          },
        }),
      },
    )

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`)
    }

    const data = await response.json()

    // Extract the text from the response
    const text = data.candidates[0].content.parts[0].text

    // Extract the pronunciation from the text
    const pronunciationMatch = text.match(/\/[^/]+\//)
    const pronunciation = pronunciationMatch ? pronunciationMatch[0] : `/${word}/`

    // In a real app, we would generate audio here
    // For now, we'll use a placeholder URL
    const audioUrl = `https://api.dictionaryapi.dev/media/pronunciations/en/${word.toLowerCase()}-us.mp3`

    return {
      pronunciation,
      audioUrl,
    }
  } catch (error) {
    console.error("Error generating pronunciation:", error)
    throw error
  }
}

export async function generateVocabularyWithAI(level: string, count: number, topic?: string): Promise<any[]> {
  try {
    let prompt = `Generate ${count} vocabulary words at CEFR level ${level}`

    if (topic) {
      prompt += ` related to the topic of ${topic}`
    }

    prompt += `. For each word, provide the following in JSON format:
    1. word: the vocabulary word
    2. cefr: the CEFR level (${level})
    3. part_of_speech: the part of speech (noun, verb, adjective, etc.)
    4. pronunciation: the IPA pronunciation
    5. definition: a clear definition of the word
    6. examples: an array of 2-3 example sentences using the word

    Return the result as a JSON array of objects.`

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2048,
          },
        }),
      },
    )

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`)
    }

    const data = await response.json()

    // Extract the text from the response
    const text = data.candidates[0].content.parts[0].text

    // Try to parse the JSON array from the text
    try {
      // Look for anything that looks like a JSON array in the response
      const match = text.match(/\[.*\]/s)
      if (match) {
        const jsonArray = JSON.parse(match[0])
        return Array.isArray(jsonArray) ? jsonArray : []
      }

      throw new Error("No JSON array found in response")
    } catch (e) {
      console.error("Error parsing vocabulary:", e)
      throw e
    }
  } catch (error) {
    console.error("Error generating vocabulary:", error)
    throw error
  }
}

