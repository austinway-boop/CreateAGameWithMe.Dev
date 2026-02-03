import { Map, X } from 'lucide-react';
import Link from 'next/link';

export function AppHeader() {
  return (
    <header className="bg-white shadow-[0_2px_0_#e5e7eb] sticky top-0 z-50">
      <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link 
          href="/journey" 
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gray-100 
            hover:bg-gray-200 active:translate-y-0.5 transition-all text-gray-600 font-bold text-sm"
        >
          <X className="h-4 w-4" />
          Exit
        </Link>
        
        <Link
          href="/journey"
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-pink-500 text-white
            shadow-[0_3px_0_#be185d] hover:bg-pink-600 active:translate-y-0.5 active:shadow-none 
            transition-all font-bold text-sm"
        >
          <Map className="h-4 w-4" />
          Journey
        </Link>
      </div>
    </header>
  );
}
