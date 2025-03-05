"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DailyVocabulary } from "@/components/user/daily-vocabulary"
import { PracticeSection } from "@/components/user/practice-section"
import { SubmissionSection } from "@/components/user/submission-section"
import { UserHeader } from "@/components/user/user-header"
import { motion } from "framer-motion"

export default function UserPortal() {
  const [activeTab, setActiveTab] = useState("vocabulary")

  return (
    <div className="flex min-h-screen flex-col">
      <UserHeader />
      <main className="flex-1 container py-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-6"
        >
          <h1 className="text-3xl font-bold">User Portal</h1>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="vocabulary">Daily Vocabulary</TabsTrigger>
              <TabsTrigger value="practice">Practice</TabsTrigger>
              <TabsTrigger value="submissions">Submissions</TabsTrigger>
            </TabsList>
            <TabsContent value="vocabulary" className="space-y-4">
              <DailyVocabulary />
            </TabsContent>
            <TabsContent value="practice" className="space-y-4">
              <PracticeSection />
            </TabsContent>
            <TabsContent value="submissions" className="space-y-4">
              <SubmissionSection />
            </TabsContent>
          </Tabs>
        </motion.div>
      </main>
    </div>
  )
}

