"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, MessageSquare } from "lucide-react"
import { motion } from "framer-motion"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/components/ui/use-toast"

interface Submission {
  id: number
  user: {
    id: number
    name: string
  }
  word: string
  vocabulary_id: number
  sentences: string[]
  status: "pending" | "approved" | "rejected"
  date: string
  feedback: string
}

export function SubmissionReview() {
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null)
  const [feedback, setFeedback] = useState("")
  const [isReviewOpen, setIsReviewOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchSubmissions()
  }, [])

  const fetchSubmissions = async () => {
    try {
      setIsLoading(true)

      const { data, error } = await supabase
        .from("submissions")
        .select(`
          id,
          sentences,
          status,
          feedback,
          submitted_at,
          user:user_id (
            id,
            name
          ),
          vocabulary:vocabulary_id (
            id,
            word
          )
        `)
        .order("submitted_at", { ascending: false })

      if (error) throw error

      // Transform the data to match our component's expected format
      const formattedData = data.map((item) => ({
        id: item.id,
        user: {
          id: item.user.id,
          name: item.user.name,
        },
        word: item.vocabulary.word,
        vocabulary_id: item.vocabulary.id,
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
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenReview = (submission: Submission) => {
    setSelectedSubmission(submission)
    setFeedback(submission.feedback)
    setIsReviewOpen(true)
  }

  const handleApprove = async () => {
    if (!selectedSubmission) return
    await updateSubmissionStatus("approved")
  }

  const handleReject = async () => {
    if (!selectedSubmission) return
    await updateSubmissionStatus("rejected")
  }

  const updateSubmissionStatus = async (status: "approved" | "rejected") => {
    if (!selectedSubmission) return

    setIsSubmitting(true)

    try {
      // Get current user from localStorage
      const userString = localStorage.getItem("user")
      if (!userString) {
        throw new Error("User not found")
      }

      const user = JSON.parse(userString)

      // Update the submission in the database
      const { error } = await supabase
        .from("submissions")
        .update({
          status: status,
          feedback: feedback,
          reviewed_at: new Date().toISOString(),
          reviewed_by: user.id,
        })
        .eq("id", selectedSubmission.id)

      if (error) throw error

      // Update the local state
      setSubmissions(
        submissions.map((sub) => (sub.id === selectedSubmission.id ? { ...sub, status: status, feedback } : sub)),
      )

      setIsReviewOpen(false)

      toast({
        title: "Success",
        description: `Submission ${status === "approved" ? "approved" : "rejected"} successfully`,
      })
    } catch (error) {
      console.error(`Error ${status === "approved" ? "approving" : "rejecting"} submission:`, error)
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to ${status === "approved" ? "approve" : "reject"} submission`,
      })
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

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }} className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Submission Review</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>User Submissions</CardTitle>
          <CardDescription>Review and provide feedback on user sentence submissions.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : submissions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No submissions to review.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Word</TableHead>
                  <TableHead>Sentences</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {submissions.map((submission) => (
                  <TableRow key={submission.id}>
                    <TableCell className="font-medium">{submission.user.name}</TableCell>
                    <TableCell>{submission.word}</TableCell>
                    <TableCell className="max-w-xs truncate">
                      {submission.sentences[0]}
                      {submission.sentences.length > 1 && "..."}
                    </TableCell>
                    <TableCell>{new Date(submission.date).toLocaleDateString()}</TableCell>
                    <TableCell>{getStatusBadge(submission.status)}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => handleOpenReview(submission)}>
                        <MessageSquare className="mr-2 h-4 w-4" />
                        Review
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isReviewOpen} onOpenChange={setIsReviewOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Review Submission</DialogTitle>
            <DialogDescription>Review the sentences and provide feedback to the user.</DialogDescription>
          </DialogHeader>
          {selectedSubmission && (
            <div className="grid gap-4 py-4">
              <div>
                <h3 className="text-lg font-medium">Word: {selectedSubmission.word}</h3>
                <p className="text-sm text-muted-foreground">
                  Submitted by {selectedSubmission.user.name} on{" "}
                  {new Date(selectedSubmission.date).toLocaleDateString()}
                </p>
              </div>
              <div>
                <h4 className="font-medium mb-2">Sentences:</h4>
                <ul className="space-y-2 list-disc pl-5">
                  {selectedSubmission.sentences.map((sentence: string, index: number) => (
                    <li key={index}>{sentence}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">Feedback:</h4>
                <Textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Provide feedback on the sentences..."
                  className="min-h-[100px]"
                />
              </div>
            </div>
          )}
          <DialogFooter className="flex justify-between">
            <Button variant="outline" onClick={() => setIsReviewOpen(false)}>
              Cancel
            </Button>
            <div className="flex gap-2">
              <Button variant="destructive" onClick={handleReject} disabled={isSubmitting}>
                {isSubmitting ? (
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                ) : (
                  <XCircle className="mr-2 h-4 w-4" />
                )}
                Reject
              </Button>
              <Button onClick={handleApprove} disabled={isSubmitting}>
                {isSubmitting ? (
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                ) : (
                  <CheckCircle className="mr-2 h-4 w-4" />
                )}
                Approve
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}

