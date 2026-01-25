'use client';

import { HelpCircle } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface WhyPopoverProps {
  children: React.ReactNode;
}

export function WhyPopover({ children }: WhyPopoverProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          type="button"
        >
          <HelpCircle className="h-4 w-4" />
          <span>Why?</span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 text-sm">
        {children}
      </PopoverContent>
    </Popover>
  );
}
