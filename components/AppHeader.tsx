import { Gamepad2, Map } from 'lucide-react';
import Link from 'next/link';
import { UserMenu } from './UserMenu';

export function AppHeader() {
  return (
    <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/journey" className="flex items-center gap-2 font-semibold hover:opacity-80 transition-opacity">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 text-primary">
            <Map className="h-4 w-4" />
            <span className="text-sm">Journey</span>
          </div>
        </Link>
        <div className="flex items-center gap-2">
          <Gamepad2 className="h-5 w-5 text-muted-foreground" />
          <span className="font-semibold">Create A Game</span>
        </div>
        <UserMenu />
      </div>
    </header>
  );
}
