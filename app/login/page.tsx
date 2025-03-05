"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { motion } from "framer-motion"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/components/ui/use-toast"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Info } from "lucide-react"
import { assignDailyVocabulary } from "@/lib/vocabulary-utils"

export default function LoginPage() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [dbInitialized, setDbInitialized] = useState(true)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    // Check if user is already logged in
    const user = localStorage.getItem("user")
    if (user) {
      const userData = JSON.parse(user)
      if (userData.role === "admin") {
        router.push("/admin")
      } else {
        router.push("/user")
      }
    }

    // Check if database tables exist
    checkDatabaseTables()
  }, [router])

  const checkDatabaseTables = async () => {
    try {
      // Try to query the users table
      const { error } = await supabase.from("users").select("id").limit(1)

      // If there's an error about the table not existing
      if (error && error.message.includes("does not exist")) {
        setDbInitialized(false)
      }
    } catch (error) {
      console.error("Error checking database tables:", error)
      setDbInitialized(false)
    }
  }

  const initializeDatabase = async () => {
    setIsLoading(true)
    try {
      // Get the SQL schema
      const response = await fetch("/api/init-database")

      if (!response.ok) {
        throw new Error("Failed to initialize database")
      }

      const result = await response.json()

      if (result.success) {
        toast({
          title: "Database Initialized",
          description: "Database tables have been created successfully.",
        })

        // Create default admin user
        await createDefaultAdmin()

        // Create some sample vocabulary
        await createSampleVocabulary()

        setDbInitialized(true)
      } else {
        throw new Error(result.error || "Failed to initialize database")
      }
    } catch (error) {
      console.error("Error initializing database:", error)
      toast({
        variant: "destructive",
        title: "Initialization Failed",
        description: "Failed to initialize database. Please try again.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const createDefaultAdmin = async () => {
    try {
      const { data, error } = await supabase
        .from("users")
        .insert([
          {
            username: "admin",
            password: "admin123", // In a real app, this should be hashed
            name: "Administrator",
            role: "admin",
            words_per_day: 10,
          },
        ])
        .select()

      if (error) throw error

      // Also create a regular user
      await supabase.from("users").insert([
        {
          username: "user",
          password: "user123", // In a real app, this should be hashed
          name: "Test User",
          role: "user",
          words_per_day: 5,
        },
      ])

      toast({
        title: "Default Users Created",
        description: "Admin: admin/admin123, User: user/user123",
      })
    } catch (error) {
      console.error("Error creating default users:", error)
    }
  }

  const createSampleVocabulary = async () => {
    try {
      // Get the admin user ID
      const { data: adminData, error: adminError } = await supabase
        .from("users")
        .select("id")
        .eq("username", "admin")
        .single()

      if (adminError) throw adminError

      const adminId = adminData.id

      // Sample vocabulary words
      const sampleVocabulary = [
        {
          word: "ubiquitous",
          cefr: "C1",
          part_of_speech: "adjective",
          pronunciation: "/juːˈbɪkwɪtəs/",
          definition: "present, appearing, or found everywhere",
          examples: [
            "Mobile phones are now ubiquitous in modern society.",
            "The ubiquitous presence of technology has changed how we live.",
          ],
          created_by: adminId,
        },
        {
          word: "ephemeral",
          cefr: "C1",
          part_of_speech: "adjective",
          pronunciation: "/ɪˈfem(ə)rəl/",
          definition: "lasting for a very short time",
          examples: [
            "The ephemeral nature of fashion trends makes them difficult to follow.",
            "Their happiness was ephemeral, lasting only a few hours.",
          ],
          created_by: adminId,
        },
        {
          word: "pragmatic",
          cefr: "B2",
          part_of_speech: "adjective",
          pronunciation: "/præɡˈmætɪk/",
          definition: "dealing with things sensibly and realistically",
          examples: [
            "We need a pragmatic approach to solving this problem.",
            "She's known for her pragmatic decision-making style.",
          ],
          created_by: adminId,
        },
        {
          word: "serendipity",
          cefr: "C1",
          part_of_speech: "noun",
          pronunciation: "/ˌser.ənˈdɪp.ə.ti/",
          definition: "the fact of finding interesting or valuable things by chance",
          examples: [
            "It was serendipity that I met my wife at that coffee shop.",
            "The discovery of penicillin was a case of serendipity.",
          ],
          created_by: adminId,
        },
        {
          word: "meticulous",
          cefr: "B2",
          part_of_speech: "adjective",
          pronunciation: "/məˈtɪk.jə.ləs/",
          definition: "very careful and precise about small details",
          examples: ["She is meticulous about keeping records.", "The work requires meticulous attention to detail."],
          created_by: adminId,
        },
      ]

      // Insert sample vocabulary
      const { error: vocabError } = await supabase.from("vocabulary").insert(sampleVocabulary)

      if (vocabError) throw vocabError

      toast({
        title: "Sample Vocabulary Created",
        description: "Sample vocabulary words have been added to the database.",
      })
    } catch (error) {
      console.error("Error creating sample vocabulary:", error)
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!username || !password) {
      toast({
        variant: "destructive",
        title: "Invalid Input",
        description: "Please enter both username and password.",
      })
      return
    }

    setIsLoading(true)

    try {
      // Check if the database is initialized
      if (!dbInitialized) {
        toast({
          variant: "destructive",
          title: "Database Not Initialized",
          description: "Please initialize the database first.",
        })
        setIsLoading(false)
        return
      }

      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("username", username)
        .eq("password", password)
        .single()

      if (error) {
        if (error.code === "PGRST116") {
          throw new Error("Invalid username or password")
        } else {
          throw error
        }
      }

      if (data) {
        // Update last login
        await supabase.from("users").update({ last_login: new Date().toISOString() }).eq("id", data.id)

        // If this is a regular user, assign daily vocabulary if needed
        if (data.role === "user") {
          // Check if the user already has vocabulary assigned for today
          const today = new Date().toISOString().split("T")[0]
          const { data: existingAssignments, error: checkError } = await supabase
            .from("user_vocabulary")
            .select("id")
            .eq("user_id", data.id)
            .eq("assigned_date", today)

          if (checkError) {
            console.error("Error checking existing assignments:", checkError)
          } else if (!existingAssignments || existingAssignments.length < data.words_per_day) {
            // Assign new vocabulary for today
            await assignDailyVocabulary(data.id, data.words_per_day)
          }
        }

        // Store user data in localStorage
        localStorage.setItem("user", JSON.stringify(data))

        toast({
          title: "Login Successful",
          description: `Welcome back, ${data.name}!`,
        })

        // Redirect based on role
        if (data.role === "admin") {
          router.push("/admin")
        } else {
          router.push("/user")
        }
      }
    } catch (error) {
      console.error("Login error:", error)
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">VocabMaster</CardTitle>
            <CardDescription className="text-center">Enter your credentials to access your account</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!dbInitialized && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Database tables not found. Please initialize the database before logging in.
                </AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={isLoading || !dbInitialized}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading || !dbInitialized}
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading || !dbInitialized}>
                {isLoading ? "Logging in..." : "Login"}
              </Button>
            </form>
          </CardContent>
          <CardFooter>
            {!dbInitialized && (
              <Button variant="outline" className="w-full" onClick={initializeDatabase} disabled={isLoading}>
                {isLoading ? "Initializing..." : "Initialize Database"}
              </Button>
            )}
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  )
}

