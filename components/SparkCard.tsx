'use client';

import { Check, RotateCcw, Sparkles, Target } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { IdeaSpark, LIKED_PARTS_OPTIONS } from '@/lib/types';

interface SparkCardProps {
  spark: IdeaSpark;
  onSelect: () => void;
  onToggleLikedPart: (part: string) => void;
  isSelected?: boolean;
}

export function SparkCard({ spark, onSelect, onToggleLikedPart, isSelected }: SparkCardProps) {
  return (
    <Card className={`transition-all ${isSelected ? 'ring-2 ring-primary border-primary' : 'hover:border-primary/50'}`}>
      <CardContent className="pt-4 pb-4 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-base leading-tight">{spark.title}</h3>
          <Button
            size="sm"
            variant={isSelected ? 'default' : 'outline'}
            onClick={onSelect}
            className="shrink-0"
          >
            {isSelected ? (
              <>
                <Check className="h-3 w-3 mr-1" />
                Selected
              </>
            ) : (
              'Select'
            )}
          </Button>
        </div>

        {/* Hook */}
        <p className="text-sm text-muted-foreground">{spark.hook}</p>

        {/* Details */}
        <div className="space-y-1.5 text-xs">
          <div className="flex items-center gap-2">
            <RotateCcw className="h-3 w-3 text-blue-500" />
            <span className="text-muted-foreground">Loop:</span>
            <span className="text-foreground">{spark.coreLoop}</span>
          </div>
          <div className="flex items-center gap-2">
            <Sparkles className="h-3 w-3 text-violet-500" />
            <span className="text-muted-foreground">Unique:</span>
            <span className="text-foreground">{spark.uniqueMechanic}</span>
          </div>
          <div className="flex items-center gap-2">
            <Target className="h-3 w-3 text-green-500" />
            <span className="text-muted-foreground">Scope:</span>
            <span className="text-foreground">{spark.scopeLevel} • {spark.targetPlatform}</span>
          </div>
        </div>

        {/* Like Parts */}
        <div className="pt-2 border-t">
          <p className="text-xs text-muted-foreground mb-2">What do you like?</p>
          <div className="flex flex-wrap gap-2">
            {LIKED_PARTS_OPTIONS.map((part) => (
              <div key={part} className="flex items-center gap-1">
                <Checkbox
                  id={`${spark.id}-${part}`}
                  checked={spark.likedParts.includes(part)}
                  onCheckedChange={() => onToggleLikedPart(part)}
                  className="h-3 w-3"
                />
                <Label htmlFor={`${spark.id}-${part}`} className="text-xs cursor-pointer">
                  {part}
                </Label>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
