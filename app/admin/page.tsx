"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { UserManagement } from "@/components/admin/user-management"
import { VocabularyManagement } from "@/components/admin/vocabulary-management"
import { SubmissionReview } from "@/components/admin/submission-review"
import { AdminHeader } from "@/components/admin/admin-header"
import { motion } from "framer-motion"

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("users")

  return (
    <div className="flex min-h-screen flex-col">
      <AdminHeader />
      <main className="flex-1 container py-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-6"
        >
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="users">User Management</TabsTrigger>
              <TabsTrigger value="vocabulary">Vocabulary Management</TabsTrigger>
              <TabsTrigger value="submissions">Submission Review</TabsTrigger>
            </TabsList>
            <TabsContent value="users" className="space-y-4">
              <UserManagement />
            </TabsContent>
            <TabsContent value="vocabulary" className="space-y-4">
              <VocabularyManagement />
            </TabsContent>
            <TabsContent value="submissions" className="space-y-4">
              <SubmissionReview />
            </TabsContent>
          </Tabs>
        </motion.div>
      </main>
    </div>
  )
}

