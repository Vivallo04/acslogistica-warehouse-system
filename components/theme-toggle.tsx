"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"

export function ThemeToggle({ showText = false }: { showText?: boolean }) {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  // useEffect only runs on the client, so now we can safely show the UI
  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    // Return a placeholder button with the same dimensions to prevent layout shift
    return (
      <Button variant="ghost" size="sm" className={showText ? "w-full justify-start gap-2 rounded-full" : "w-9 h-9 rounded-full"}>
        <span className="sr-only">Toggle theme</span>
      </Button>
    )
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      className={showText ? "w-full justify-start gap-2 rounded-full" : "w-9 h-9 rounded-full"}
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
    >
      {theme === "dark" ? (
        <Sun className="h-4 w-4 transition-all" />
      ) : (
        <Moon className="h-4 w-4 transition-all" />
      )}
      {showText && <span>{theme === "dark" ? "Modo Claro" : "Modo Oscuro"}</span>}
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}