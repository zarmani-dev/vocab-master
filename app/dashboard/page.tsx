"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function DashboardPage() {
  const router = useRouter()

  useEffect(() => {
    // Get user from localStorage
    const userString = localStorage.getItem("user")
    if (!userString) {
      router.push("/login")
      return
    }

    const user = JSON.parse(userString)

    // Redirect based on role
    if (user.role === "admin") {
      router.push("/admin")
    } else {
      router.push("/user")
    }
  }, [router])

  return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  )
}

