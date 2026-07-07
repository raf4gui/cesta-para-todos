export default function PrintLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="print-root w-screen min-h-screen bg-white overflow-y-auto">
      <style>{`
        @media print {
          body > *:not(.print-root) { display: none !important; }
          .print-root { position: static !important; width: 100% !important; height: auto !important; }
        }
      `}</style>
      {children}
    </div>
  )
}
