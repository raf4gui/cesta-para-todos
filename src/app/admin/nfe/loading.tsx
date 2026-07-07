export default function NfeLoading() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#006B2E] border-t-transparent" />
        <p className="text-sm text-[#526157]">Carregando notas fiscais...</p>
      </div>
    </div>
  )
}
