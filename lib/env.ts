// Environment variable utility

export function getGeminiApiKey(): string {
  // Try different environment variable names
  const apiKey =
    process.env.NEXT_PUBLIC_GEMINI_API_KEY ||
    process.env.next_public_gemini_api_key ||
    "";

  if (!apiKey) {
    console.warn("GEMINI_API_KEY environment variable is not set");
  }

  return apiKey;
}
