import { AlertCircle } from "lucide-react"

export function ErrorMessage({ message }: { message: string }) {
  return (
    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md flex items-start mb-4">
      <AlertCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
      <span>{message}</span>
    </div>
  )
}

