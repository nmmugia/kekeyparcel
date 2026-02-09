"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { Search, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

interface SearchInputProps {
  placeholder?: string
  paramName?: string
  className?: string
  debounceMs?: number
}

export default function SearchInput({
  placeholder = "Cari...",
  paramName = "q",
  className = "",
  debounceMs = 300,
}: SearchInputProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const initialValue = searchParams.get(paramName) || ""
  const [value, setValue] = useState(initialValue)
  const [debouncedValue, setDebouncedValue] = useState(initialValue)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Update search value when URL param changes
  useEffect(() => {
    const currentValue = searchParams.get(paramName) || ""
    setValue(currentValue)
    setDebouncedValue(currentValue)
  }, [searchParams, paramName])

  // Debounce search input
  useEffect(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }

    timerRef.current = setTimeout(() => {
      setDebouncedValue(value)
    }, debounceMs)

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [value, debounceMs])

  // Update URL when debounced value changes
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString())

    if (debouncedValue) {
      params.set(paramName, debouncedValue)
    } else {
      params.delete(paramName)
    }

    const newUrl = `${pathname}?${params.toString()}`
    router.push(newUrl)
  }, [debouncedValue, pathname, router, searchParams, paramName])

  const handleClear = () => {
    setValue("")
    setDebouncedValue("")
  }

  return (
    <div className={`relative ${className}`}>
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
      <Input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="pl-10 pr-10"
      />
      {value && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
          onClick={handleClear}
        >
          <X className="h-4 w-4 text-gray-400" />
          <span className="sr-only">Clear search</span>
        </Button>
      )}
    </div>
  )
}

