'use client';

import { useSession, signOut } from 'next-auth/react';
import { LogOut, User } from 'lucide-react';

export function UserMenu() {
  const { data: session } = useSession();

  if (!session?.user) {
    return null;
  }

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2 text-sm">
        {session.user.image ? (
          <img 
            src={session.user.image} 
            alt={session.user.name || 'User'} 
            className="h-8 w-8 rounded-full"
          />
        ) : (
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="h-4 w-4 text-primary" />
          </div>
        )}
        <span className="text-muted-foreground hidden sm:inline">
          {session.user.name || session.user.email}
        </span>
      </div>
      <button
        onClick={() => signOut({ callbackUrl: '/' })}
        className="p-2 rounded-lg hover:bg-muted transition-colors"
        title="Sign out"
      >
        <LogOut className="h-4 w-4" />
      </button>
    </div>
  );
}
