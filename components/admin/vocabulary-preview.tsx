"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Volume2, Users } from "lucide-react"
import type { Vocabulary } from "@/lib/supabase"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"

interface VocabularyPreviewProps {
  vocabulary: Vocabulary
  isOpen: boolean
  onClose: () => void
  onAssign: (userIds: number[]) => void
  users: { id: number; username: string; name: string }[]
}

export function VocabularyPreview({ vocabulary, isOpen, onClose, onAssign, users }: VocabularyPreviewProps) {
  const [selectedUsers, setSelectedUsers] = useState<number[]>([])

  const handleUserToggle = (userId: number) => {
    setSelectedUsers((prev) => (prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]))
  }

  const handleAssign = () => {
    onAssign(selectedUsers)
    setSelectedUsers([])
  }

  const playAudio = (audioUrl: string) => {
    if (!audioUrl) return

    const audio = new Audio(audioUrl)
    audio.play()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Vocabulary Preview</DialogTitle>
          <DialogDescription>Preview vocabulary details and assign to users</DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-6 py-4">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  {vocabulary.word}
                  {vocabulary.audio_url && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => playAudio(vocabulary.audio_url || "")}
                    >
                      <Volume2 className="h-5 w-5" />
                      <span className="sr-only">Play pronunciation</span>
                    </Button>
                  )}
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline">{vocabulary.cefr}</Badge>
                  <span className="text-sm text-muted-foreground">{vocabulary.part_of_speech}</span>
                  <span className="text-sm text-muted-foreground">{vocabulary.pronunciation}</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-medium">Definition</h3>
              <p className="text-muted-foreground">{vocabulary.definition}</p>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-medium">Examples</h3>
              <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                {vocabulary.examples.map((example, index) => (
                  <li key={index}>{example}</li>
                ))}
              </ul>
            </div>

            <div className="space-y-3 pt-4 border-t">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Assign to Users
                </h3>
                <Button variant="outline" size="sm" onClick={() => setSelectedUsers(users.map((user) => user.id))}>
                  Select All
                </Button>
              </div>

              <div className="space-y-2">
                {users.map((user) => (
                  <div key={user.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`user-${user.id}`}
                      checked={selectedUsers.includes(user.id)}
                      onCheckedChange={() => handleUserToggle(user.id)}
                    />
                    <Label htmlFor={`user-${user.id}`} className="flex-1">
                      {user.name} <span className="text-muted-foreground">({user.username})</span>
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleAssign} disabled={selectedUsers.length === 0}>
            Assign to {selectedUsers.length} {selectedUsers.length === 1 ? "User" : "Users"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

