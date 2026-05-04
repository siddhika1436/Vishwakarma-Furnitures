export default function LoadingSpinner({ text = 'Loading...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-3">
      <div className="animate-spin rounded-full h-10 w-10 border-4 border-wood-500 border-t-transparent" />
      <p className="text-wood-500 text-sm">{text}</p>
    </div>
  )
}
