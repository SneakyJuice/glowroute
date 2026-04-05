'use client'
interface Props { currentPage: number; totalPages: number; onChange: (p: number) => void }
export default function Pagination({ currentPage, totalPages, onChange }: Props) {
  const pages = Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1)
  return (
    <div className="flex items-center justify-center gap-1.5 mt-9">
      <button onClick={() => onChange(Math.max(1, currentPage - 1))} className="w-9 h-9 rounded flex items-center justify-center border border-gray-200 bg-white text-gray-400 hover:text-onyx hover:border-sage transition-all">←</button>
      {pages.map(p => (
        <button key={p} onClick={() => onChange(p)} className={`w-9 h-9 rounded flex items-center justify-center text-[13px] font-medium border transition-all ${p === currentPage ? 'bg-onyx text-white border-onyx' : 'bg-white text-gray-700 border-gray-200 hover:border-sage hover:text-sage'}`}>{p}</button>
      ))}
      {totalPages > 5 && <><span className="text-[13px] text-gray-400 px-1">…</span><button onClick={() => onChange(totalPages)} className="w-9 h-9 rounded flex items-center justify-center text-[13px] font-medium border border-gray-200 bg-white text-gray-700 hover:border-sage hover:text-sage transition-all">{totalPages}</button></>}
      <button onClick={() => onChange(Math.min(totalPages, currentPage + 1))} className="w-9 h-9 rounded flex items-center justify-center border border-gray-200 bg-white text-gray-400 hover:text-onyx hover:border-sage transition-all">→</button>
    </div>
  )
}
