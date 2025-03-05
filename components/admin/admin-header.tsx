import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Home, Wand2 } from "lucide-react"
import { LogoutButton } from "@/components/logout-button"

export function AdminHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <span className="font-bold">VocabMaster Admin</span>
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-end space-x-2">
          <nav className="flex items-center space-x-2">
            <Link href="/">
              <Button variant="ghost" size="icon">
                <Home className="h-5 w-5" />
                <span className="sr-only">Home</span>
              </Button>
            </Link>
            <Link href="/admin/assign-vocabulary">
              <Button variant="ghost" size="icon">
                <Wand2 className="h-5 w-5" />
                <span className="sr-only">Assign Vocabulary</span>
              </Button>
            </Link>
            <LogoutButton />
          </nav>
        </div>
      </div>
    </header>
  )
}

