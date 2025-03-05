"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Volume2, ArrowRight, Check, X } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/components/ui/use-toast"
import { getUserVocabulary } from "@/lib/vocabulary-utils"

interface VocabularyItem {
  id: number
  word: string
  cefr: string
  part_of_speech: string
  pronunciation: string
  definition: string
  examples: string[]
  audio_url?: string
  user_vocabulary_id: number // Added to track the join table ID
}

export function PracticeSection() {
  const [vocabulary, setVocabulary] = useState<VocabularyItem[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showDefinition, setShowDefinition] = useState(false)
  const [userAnswer, setUserAnswer] = useState("")
  const [result, setResult] = useState<"correct" | "incorrect" | null>(null)
  const [practiceMode, setPracticeMode] = useState<"flashcard" | "fillBlank">("flashcard")
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    fetchVocabularyForPractice()
  }, [])

  const fetchVocabularyForPractice = async () => {
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
        return
      }

      // Transform the data to match our component's expected format
      const formattedData = data.map((item) => ({
        id: item.vocabulary.id,
        word: item.vocabulary.word,
        cefr: item.vocabulary.cefr,
        part_of_speech: item.vocabulary.part_of_speech,
        pronunciation: item.vocabulary.pronunciation,
        definition: item.vocabulary.definition,
        examples: item.vocabulary.examples,
        audio_url: item.vocabulary.audio_url,
        user_vocabulary_id: item.id, // Store the join table ID
      }))

      setVocabulary(formattedData)
    } catch (error) {
      console.error("Error fetching vocabulary for practice:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load vocabulary for practice",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const currentWord = vocabulary[currentIndex]

  const speakWord = (word: string) => {
    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(word)
      utterance.lang = "en-US"
      window.speechSynthesis.speak(utterance)
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

  const handleNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % vocabulary.length)
    setShowDefinition(false)
    setUserAnswer("")
    setResult(null)
  }

  const handlePrevious = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + vocabulary.length) % vocabulary.length)
    setShowDefinition(false)
    setUserAnswer("")
    setResult(null)
  }

  const checkAnswer = () => {
    if (!currentWord) return

    const isCorrect = userAnswer.toLowerCase() === currentWord.word.toLowerCase()
    setResult(isCorrect ? "correct" : "incorrect")

    // Update practice timestamp in the database
    updatePracticeTimestamp(currentWord.user_vocabulary_id)
  }

  const updatePracticeTimestamp = async (userVocabularyId: number) => {
    try {
      // Update the last_practiced timestamp
      await supabase
        .from("user_vocabulary")
        .update({ last_practiced: new Date().toISOString() })
        .eq("id", userVocabularyId)
    } catch (error) {
      console.error("Error updating practice timestamp:", error)
    }
  }

  const getBlankExample = () => {
    if (!currentWord || !currentWord.examples || currentWord.examples.length === 0) return ""

    const example = currentWord.examples[0]
    return example.replace(new RegExp(currentWord.word, "gi"), "_______")
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (vocabulary.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-10">
          <p className="text-muted-foreground">No vocabulary words available for practice.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }} className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Practice</h2>
        <div className="flex gap-2">
          <Button
            variant={practiceMode === "flashcard" ? "default" : "outline"}
            onClick={() => setPracticeMode("flashcard")}
          >
            Flashcards
          </Button>
          <Button
            variant={practiceMode === "fillBlank" ? "default" : "outline"}
            onClick={() => setPracticeMode("fillBlank")}
          >
            Fill in the Blank
          </Button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {practiceMode === "flashcard" ? (
          <motion.div
            key="flashcard"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="min-h-[400px] flex flex-col">
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  <span>Flashcard Practice</span>
                  <Badge variant="outline">
                    {currentIndex + 1} / {vocabulary.length}
                  </Badge>
                </CardTitle>
                <CardDescription>Click on the card to reveal the definition</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col justify-center">
                <div
                  className="bg-muted rounded-lg p-8 min-h-[200px] flex flex-col items-center justify-center text-center cursor-pointer transition-all hover:bg-muted/80"
                  onClick={() => setShowDefinition(!showDefinition)}
                >
                  {showDefinition ? (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                      <div>
                        <h3 className="font-medium">Definition</h3>
                        <p>{currentWord.definition}</p>
                      </div>
                      <div>
                        <h3 className="font-medium">Examples</h3>
                        <ul className="list-disc pl-5 text-left">
                          {currentWord.examples.map((example, index) => (
                            <li key={index}>{example}</li>
                          ))}
                        </ul>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
                      <h2 className="text-2xl font-bold">{currentWord.word}</h2>
                      <div className="flex items-center justify-center gap-2">
                        <Badge variant="outline">{currentWord.cefr}</Badge>
                        <span className="text-sm text-muted-foreground">{currentWord.part_of_speech}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="mt-2"
                        onClick={(e) => {
                          e.stopPropagation()
                          playAudio(currentWord.audio_url, currentWord.word)
                        }}
                      >
                        <Volume2 className="h-4 w-4" />
                        <span className="sr-only">Pronounce</span>
                      </Button>
                    </motion.div>
                  )}
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={handlePrevious}>
                  Previous
                </Button>
                <Button onClick={handleNext}>
                  Next
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          </motion.div>
        ) : (
          <motion.div
            key="fillblank"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="min-h-[400px] flex flex-col">
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  <span>Fill in the Blank</span>
                  <Badge variant="outline">
                    {currentIndex + 1} / {vocabulary.length}
                  </Badge>
                </CardTitle>
                <CardDescription>Fill in the blank with the correct vocabulary word</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col justify-center">
                <div className="space-y-6">
                  <div className="bg-muted rounded-lg p-6">
                    <p className="text-lg">{getBlankExample()}</p>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="answer" className="w-20">
                        Your answer:
                      </Label>
                      <div className="flex-1 flex gap-2">
                        <Input
                          id="answer"
                          value={userAnswer}
                          onChange={(e) => setUserAnswer(e.target.value)}
                          placeholder="Type the missing word"
                          className="flex-1"
                        />
                        <Button onClick={checkAnswer} disabled={!userAnswer}>
                          Check
                        </Button>
                      </div>
                    </div>

                    {result && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`p-4 rounded-lg ${
                          result === "correct"
                            ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                            : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {result === "correct" ? <Check className="h-5 w-5" /> : <X className="h-5 w-5" />}
                          <p>
                            {result === "correct"
                              ? "Correct! Well done."
                              : `Incorrect. The correct answer is "${currentWord.word}".`}
                          </p>
                        </div>
                        {result === "incorrect" && (
                          <div className="mt-2">
                            <p className="font-medium">Definition:</p>
                            <p className="text-sm">{currentWord.definition}</p>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={handlePrevious}>
                  Previous
                </Button>
                <Button onClick={handleNext}>
                  Next
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

