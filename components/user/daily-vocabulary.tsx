"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Volume2 } from "lucide-react"
import { motion } from "framer-motion"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/components/ui/use-toast"
import { getUserVocabulary } from "@/lib/vocabulary-utils"

interface VocabularyItem {
  id: number
  word: string
  cefr: string
  partOfSpeech: string
  pronunciation: string
  definition: string
  examples: string[]
  date: string
  learned: boolean
  audio_url?: string
  user_vocabulary_id: number // Added to track the join table ID
}

export function DailyVocabulary() {
  const [vocabulary, setVocabulary] = useState<VocabularyItem[]>([])
  const [activeDate, setActiveDate] = useState<string>(new Date().toISOString().split("T")[0])
  const [dates, setDates] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    fetchUserVocabulary()
  }, [])

  const fetchUserVocabulary = async () => {
    try {
      setIsLoading(true)

      // Get current user from localStorage
      const userString = localStorage.getItem("user")
      if (!userString) {
        throw new Error("User not found")
      }

      const user = JSON.parse(userString)

      // Use the utility function to fetch user vocabulary
      const data = await getUserVocabulary(user.id)

      if (!data || data.length === 0) {
        setVocabulary([])
        setDates([])
        return
      }

      // Transform the data to match our component's expected format
      const formattedData = data.map((item) => ({
        id: item.vocabulary.id,
        word: item.vocabulary.word,
        cefr: item.vocabulary.cefr,
        partOfSpeech: item.vocabulary.part_of_speech,
        pronunciation: item.vocabulary.pronunciation,
        definition: item.vocabulary.definition,
        examples: item.vocabulary.examples,
        date: item.assigned_date,
        learned: item.is_learned,
        audio_url: item.vocabulary.audio_url,
        user_vocabulary_id: item.id, // Store the join table ID
      }))

      // Get unique dates
      const uniqueDates = [...new Set(formattedData.map((item) => item.date))]
      setDates(uniqueDates)

      // Set active date to most recent if available
      if (uniqueDates.length > 0) {
        setActiveDate(uniqueDates[0])
      }

      setVocabulary(formattedData)
    } catch (error) {
      console.error("Error fetching vocabulary:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load vocabulary",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const speakWord = (word: string) => {
    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(word)
      utterance.lang = "en-US"
      window.speechSynthesis.speak(utterance)
    }
  }

  const toggleLearned = async (id: number, user_vocabulary_id: number) => {
    try {
      // Find the vocabulary item
      const vocabItem = vocabulary.find((item) => item.id === id)
      if (!vocabItem) return

      // Get current user
      const userString = localStorage.getItem("user")
      if (!userString) throw new Error("User not found")
      const user = JSON.parse(userString)

      // Update the is_learned status in the database using the join table ID
      const { error } = await supabase
        .from("user_vocabulary")
        .update({ is_learned: !vocabItem.learned })
        .eq("id", user_vocabulary_id)

      if (error) throw error

      // Update local state
      setVocabulary(vocabulary.map((word) => (word.id === id ? { ...word, learned: !word.learned } : word)))

      toast({
        title: vocabItem.learned ? "Marked as not learned" : "Marked as learned",
        description: `"${vocabItem.word}" has been updated.`,
      })
    } catch (error) {
      console.error("Error updating vocabulary status:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update vocabulary status",
      })
    }
  }

  const playAudio = (audioUrl: string | undefined, word: string) => {
    if (audioUrl) {
      const audio = new Audio(audioUrl)
      audio.play().catch((err) => {
        console.error("Error playing audio:", err)
        // Fallback to speech synthesis
        speakWord(word)
      })
    } else {
      speakWord(word)
    }
  }

  const filteredVocabulary = vocabulary.filter((word) => word.date === activeDate)

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }} className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Daily Vocabulary</h2>
        {dates.length > 0 && (
          <Tabs value={activeDate} onValueChange={setActiveDate} className="w-[400px]">
            <TabsList className="grid" style={{ gridTemplateColumns: `repeat(${Math.min(dates.length, 5)}, 1fr)` }}>
              {dates.slice(0, 5).map((date) => (
                <TabsTrigger key={date} value={date}>
                  {new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : filteredVocabulary.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-10">
            <p className="text-muted-foreground">No vocabulary words for this date.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {filteredVocabulary.map((word) => (
            <motion.div
              key={word.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card
                className={
                  word.learned ? "border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-900" : ""
                }
              >
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {word.word}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => playAudio(word.audio_url, word.word)}
                        >
                          <Volume2 className="h-4 w-4" />
                          <span className="sr-only">Pronounce</span>
                        </Button>
                      </CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {word.cefr}
                        </Badge>
                        <span className="text-sm text-muted-foreground">{word.partOfSpeech}</span>
                        <span className="text-sm text-muted-foreground">{word.pronunciation}</span>
                      </div>
                    </div>
                    <Button
                      variant={word.learned ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleLearned(word.id, word.user_vocabulary_id)}
                      className={word.learned ? "bg-green-500 hover:bg-green-600" : ""}
                    >
                      {word.learned ? "Learned" : "Mark as Learned"}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium">Definition</h4>
                      <p className="text-muted-foreground">{word.definition}</p>
                    </div>
                    <div>
                      <h4 className="font-medium">Examples</h4>
                      <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                        {word.examples.map((example, index) => (
                          <li key={index}>{example}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  )
}

