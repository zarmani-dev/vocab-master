"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AdminHeader } from "@/components/admin/admin-header"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/components/ui/use-toast"
import { logDatabaseInfo, checkUserVocabulary } from "@/lib/debug-utils"

export default function AssignVocabularyPage() {
  const [users, setUsers] = useState<{ id: number; username: string; name: string }[]>([])
  const [selectedUser, setSelectedUser] = useState<string>("")
  const [count, setCount] = useState<number>(5)
  const [isLoading, setIsLoading] = useState(false)
  const [isDebugLoading, setIsDebugLoading] = useState(false)
  const [debugInfo, setDebugInfo] = useState<string>("")
  const { toast } = useToast()

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase.from("users").select("id, username, name").eq("role", "user")

      if (error) throw error

      setUsers(data || [])
    } catch (error) {
      console.error("Error fetching users:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load users",
      })
    }
  }

  const handleAssignVocabulary = async () => {
    if (!selectedUser) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please select a user",
      })
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch("/api/assign-vocabulary", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: Number.parseInt(selectedUser),
          count,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to assign vocabulary")
      }

      toast({
        title: "Success",
        description: result.message,
      })
    } catch (error) {
      console.error("Error assigning vocabulary:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to assign vocabulary",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDebug = async () => {
    setIsDebugLoading(true)
    setDebugInfo("")

    try {
      // Log database info to console
      await logDatabaseInfo()

      // Check user vocabulary if a user is selected
      let userVocabInfo = ""
      if (selectedUser) {
        const userId = Number.parseInt(selectedUser)
        const vocabStatus = await checkUserVocabulary(userId)
        userVocabInfo = `User ${userId} has ${vocabStatus.count} vocabulary items assigned`
      }

      // Get table counts
      const tables = ["users", "vocabulary", "user_vocabulary", "submissions"]
      let tableInfo = ""

      for (const table of tables) {
        try {
          const { data, error } = await supabase.from(table).select("count").single()
          if (error) throw error
          tableInfo += `Table ${table}: ${data.count} rows\n`
        } catch (error) {
          tableInfo += `Table ${table}: Error getting count\n`
        }
      }

      setDebugInfo(`${tableInfo}\n${userVocabInfo}`)

      toast({
        title: "Debug Complete",
        description: "Debug information has been collected",
      })
    } catch (error) {
      console.error("Debug error:", error)
      toast({
        variant: "destructive",
        title: "Debug Error",
        description: error instanceof Error ? error.message : "An error occurred during debugging",
      })
    } finally {
      setIsDebugLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <AdminHeader />
      <main className="flex-1 container py-6">
        <div className="space-y-6">
          <h1 className="text-3xl font-bold">Assign Vocabulary</h1>
          <Card>
            <CardHeader>
              <CardTitle>Assign Vocabulary to User</CardTitle>
              <CardDescription>
                Manually assign vocabulary words to a user. This is useful if a user needs more vocabulary or if the
                automatic assignment didn't work.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="user">Select User</Label>
                <Select value={selectedUser} onValueChange={setSelectedUser}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a user" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id.toString()}>
                        {user.name} ({user.username})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="count">Number of Words</Label>
                <Input
                  id="count"
                  type="number"
                  min="1"
                  max="20"
                  value={count}
                  onChange={(e) => setCount(Number.parseInt(e.target.value))}
                />
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={handleDebug} disabled={isDebugLoading}>
                {isDebugLoading ? "Debugging..." : "Debug"}
              </Button>
              <Button onClick={handleAssignVocabulary} disabled={isLoading || !selectedUser}>
                {isLoading ? "Assigning..." : "Assign Vocabulary"}
              </Button>
            </CardFooter>
          </Card>

          {debugInfo && (
            <Card>
              <CardHeader>
                <CardTitle>Debug Information</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="bg-muted p-4 rounded-md overflow-auto whitespace-pre-wrap">{debugInfo}</pre>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}

