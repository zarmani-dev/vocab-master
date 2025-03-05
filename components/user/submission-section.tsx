"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Volume2, Send, Plus, Trash } from "lucide-react"
import { motion } from "framer-motion"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/components/ui/use-toast"
// Add import for debug utilities
import { logDatabaseInfo, checkUserVocabulary } from "@/lib/debug-utils"

interface VocabularyItem {
  id: number
  word: string
  cefr: string
  part_of_speech: string
  pronunciation: string
  definition: string
  audio_url?: string
}

interface Submission {
  id: number
  word: string
  sentences: string[]
  status: "pending" | "approved" | "rejected"
  date: string
  feedback: string
}

export function SubmissionSection() {
  const [vocabulary, setVocabulary] = useState<VocabularyItem[]>([])
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [selectedWord, setSelectedWord] = useState("")
  const [sentences, setSentences] = useState([""])
  const [submissionStatus, setSubmissionStatus] = useState<"idle" | "success" | "error">("idle")
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchVocabulary()
    fetchSubmissions()
  }, [])

  const fetchVocabulary = async () => {
    try {
      // Get current user from localStorage
      const userString = localStorage.getItem("user")
      if (!userString) {
        throw new Error("User not found")
      }

      const user = JSON.parse(userString)

      // Fetch user's vocabulary with join to get vocabulary details
      const { data, error } = await supabase
        .from("user_vocabulary")
        .select(`
          vocabulary:vocabulary_id (
            id,
            word,
            cefr,
            part_of_speech,
            pronunciation,
            definition,
            audio_url
          )
        `)
        .eq("user_id", user.id)

      if (error) throw error

      // Transform the data to match our component's expected format
      const formattedData = data.map((item) => ({
        id: item.vocabulary.id,
        word: item.vocabulary.word,
        cefr: item.vocabulary.cefr,
        part_of_speech: item.vocabulary.part_of_speech,
        pronunciation: item.vocabulary.pronunciation,
        definition: item.vocabulary.definition,
        audio_url: item.vocabulary.audio_url,
      }))

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

  const fetchSubmissions = async () => {
    try {
      // Get current user from localStorage
      const userString = localStorage.getItem("user")
      if (!userString) {
        throw new Error("User not found")
      }

      const user = JSON.parse(userString)

      // Fetch user's submissions with join to get vocabulary details
      const { data, error } = await supabase
        .from("submissions")
        .select(`
          id,
          sentences,
          status,
          feedback,
          submitted_at,
          vocabulary:vocabulary_id (
            id,
            word
          )
        `)
        .eq("user_id", user.id)
        .order("submitted_at", { ascending: false })

      if (error) throw error

      // Transform the data to match our component's expected format
      const formattedData = data.map((item) => ({
        id: item.id,
        word: item.vocabulary.word,
        sentences: item.sentences,
        status: item.status,
        date: item.submitted_at,
        feedback: item.feedback || "",
      }))

      setSubmissions(formattedData)
    } catch (error) {
      console.error("Error fetching submissions:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load submissions",
      })
    }
  }

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

  const handleAddSentence = () => {
    setSentences([...sentences, ""])
  }

  const handleRemoveSentence = (index: number) => {
    if (sentences.length > 1) {
      const newSentences = [...sentences]
      newSentences.splice(index, 1)
      setSentences(newSentences)
    }
  }

  const handleSentenceChange = (index: number, value: string) => {
    const newSentences = [...sentences]
    newSentences[index] = value
    setSentences(newSentences)
  }

  const handleSubmit = async () => {
    if (!selectedWord || sentences.some((s) => !s.trim())) {
      setSubmissionStatus("error")
      return
    }

    setIsSubmitting(true)

    try {
      // Get current user from localStorage
      const userString = localStorage.getItem("user")
      if (!userString) {
        throw new Error("User not found")
      }

      const user = JSON.parse(userString)

      // Find the vocabulary ID from the selected word
      const selectedVocab = vocabulary.find((v) => v.word === selectedWord)
      if (!selectedVocab) {
        throw new Error("Selected vocabulary not found")
      }

      // Create the submission in the database
      const { data, error } = await supabase
        .from("submissions")
        .insert([
          {
            user_id: user.id,
            vocabulary_id: selectedVocab.id,
            sentences: sentences.filter((s) => s.trim()),
            status: "pending",
            submitted_at: new Date().toISOString(),
          },
        ])
        .select()

      if (error) throw error

      // Add the new submission to the state
      const newSubmission = {
        id: data[0].id,
        word: selectedWord,
        sentences: sentences.filter((s) => s.trim()),
        status: "pending" as const,
        date: data[0].submitted_at,
        feedback: "",
      }

      setSubmissions([newSubmission, ...submissions])
      setSelectedWord("")
      setSentences([""])
      setSubmissionStatus("success")

      toast({
        title: "Success",
        description: "Your submission has been sent successfully!",
      })

      // Reset status after 3 seconds
      setTimeout(() => {
        setSubmissionStatus("idle")
      }, 3000)
    } catch (error) {
      console.error("Error submitting sentences:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to submit sentences",
      })
      setSubmissionStatus("error")
    } finally {
      setIsSubmitting(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-500">Approved</Badge>
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>
      default:
        return <Badge variant="outline">Pending</Badge>
    }
  }

  const selectedVocab = vocabulary.find((v) => v.word === selectedWord)

  // Add a debug function
  const debugSubmission = async () => {
    try {
      // Log general database info
      await logDatabaseInfo()

      // Check user vocabulary
      const userString = localStorage.getItem("user")
      if (userString) {
        const user = JSON.parse(userString)
        const vocabStatus = await checkUserVocabulary(user.id)
        console.log(`User ${user.id} has ${vocabStatus.count} vocabulary items assigned`)

        // Log vocabulary data
        console.log("Current vocabulary state:", vocabulary)
        console.log("Selected word:", selectedWord)
        console.log(
          "Selected vocabulary item:",
          vocabulary.find((v) => v.word === selectedWord),
        )
      }

      toast({
        title: "Debug Info",
        description: "Check browser console for debug information",
      })
    } catch (error) {
      console.error("Debug error:", error)
    }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }} className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Submissions</h2>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Create New Submission</CardTitle>
            <CardDescription>
              Create sentences using vocabulary words to demonstrate your understanding.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <div className="flex justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Select Word</label>
                  <Select value={selectedWord} onValueChange={setSelectedWord}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a vocabulary word" />
                    </SelectTrigger>
                    <SelectContent>
                      {vocabulary.map((vocab) => (
                        <SelectItem key={vocab.id} value={vocab.word}>
                          {vocab.word}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedVocab && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-muted rounded-lg space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium">{selectedVocab.word}</h3>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => playAudio(selectedVocab.audio_url, selectedVocab.word)}
                      >
                        <Volume2 className="h-4 w-4" />
                        <span className="sr-only">Pronounce</span>
                      </Button>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {selectedVocab.cefr}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{selectedVocab.part_of_speech}</span>
                    </div>
                    <p className="text-sm">{selectedVocab.definition}</p>
                  </motion.div>
                )}

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Your Sentences</label>
                    <Button variant="outline" size="sm" onClick={handleAddSentence} disabled={sentences.length >= 3}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Sentence
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {sentences.map((sentence, index) => (
                      <div key={index} className="flex gap-2">
                        <Textarea
                          value={sentence}
                          onChange={(e) => handleSentenceChange(index, e.target.value)}
                          placeholder={`Write a sentence using "${selectedWord || "the selected word"}"`}
                          className="flex-1"
                        />
                        {sentences.length > 1 && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveSentence(index)}
                            className="h-10 w-10 self-center"
                          >
                            <Trash className="h-4 w-4" />
                            <span className="sr-only">Remove</span>
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {submissionStatus === "error" && (
                  <div className="p-3 bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 rounded-md text-sm">
                    Please select a word and write at least one sentence.
                  </div>
                )}

                {submissionStatus === "success" && (
                  <div className="p-3 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 rounded-md text-sm">
                    Your submission has been sent successfully!
                  </div>
                )}
              </>
            )}
          </CardContent>
          <CardFooter>
            <Button variant="outline" size="sm" onClick={debugSubmission} className="mr-auto">
              Debug
            </Button>
            <Button
              className="w-full"
              onClick={handleSubmit}
              disabled={isSubmitting || isLoading || !selectedWord || sentences.every((s) => !s.trim())}
            >
              {isSubmitting ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Submit
                </>
              )}
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Submission History</CardTitle>
            <CardDescription>View your previous submissions and feedback.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 max-h-[500px] overflow-y-auto">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : submissions.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No submissions yet.</p>
            ) : (
              submissions.map((submission) => (
                <motion.div
                  key={submission.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="border rounded-lg p-4 space-y-3"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium">{submission.word}</h3>
                      <p className="text-xs text-muted-foreground">
                        Submitted on {new Date(submission.date).toLocaleDateString()}
                      </p>
                    </div>
                    {getStatusBadge(submission.status)}
                  </div>
                  <div>
                    <h4 className="text-sm font-medium">Sentences:</h4>
                    <ul className="list-disc pl-5 text-sm space-y-1 mt-1">
                      {submission.sentences.map((sentence, index) => (
                        <li key={index}>{sentence}</li>
                      ))}
                    </ul>
                  </div>
                  {submission.feedback && (
                    <div className="bg-muted p-3 rounded-md">
                      <h4 className="text-sm font-medium">Feedback:</h4>
                      <p className="text-sm mt-1">{submission.feedback}</p>
                    </div>
                  )}
                </motion.div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </motion.div>
  )
}

