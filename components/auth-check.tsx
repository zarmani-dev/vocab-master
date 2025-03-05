"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"

export function AuthCheck({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check if user is logged in
    const user = localStorage.getItem("user")

    // Define public paths that don't require authentication
    const isPublicPath = pathname === "/login" || pathname === "/"

    if (!user && !isPublicPath) {
      // Redirect to login if not authenticated and not on a public path
      router.push("/login")
    } else if (user) {
      // Check role-based access
      const userData = JSON.parse(user)

      // Redirect admin trying to access user pages
      if (userData.role === "admin" && pathname.startsWith("/user")) {
        router.push("/admin")
      }

      // Redirect user trying to access admin pages
      if (userData.role === "user" && pathname.startsWith("/admin")) {
        router.push("/user")
      }
    }

    setIsLoading(false)
  }, [pathname, router])

  // Show nothing while checking authentication
  if (isLoading) {
    return null
  }

  return <>{children}</>
}

