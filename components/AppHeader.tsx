import { Gamepad2 } from 'lucide-react';
import Link from 'next/link';
import { UserMenu } from './UserMenu';

export function AppHeader() {
  return (
    <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/create" className="flex items-center gap-2 font-semibold">
          <Gamepad2 className="h-5 w-5 text-primary" />
          <span>Create A Game</span>
        </Link>
        <UserMenu />
      </div>
    </header>
  );
}
