import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useEffect, useRef } from 'react';

interface CandidatesBarProps {
  candidates: string[];
  onSelect: (text: string) => void;
  className?: string;
}

export function CandidatesBar({
  candidates,
  onSelect,
  className,
}: CandidatesBarProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Enable horizontal scrolling with mouse wheel (vertical scroll)
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      // If user is scrolling vertically (deltaY), treat it as horizontal scroll
      if (e.deltaY !== 0) {
        // Prevent default vertical scroll behavior of the page (if any)
        // only if the element actually can scroll horizontally? 
        // Or simply always prevent default to allow pure horizontal scrolling here.
        e.preventDefault();
        el.scrollLeft += e.deltaY;
      }
    };

    // Add passive: false to allow preventDefault
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  if (!candidates || candidates.length === 0) return null;

  return (
    <div
      ref={scrollRef}
      className={cn(
        'flex gap-2 overflow-x-auto pb-2 scrollbar-none items-center w-full',
        className
      )}
      // Add some minimal styles for hiding scrollbar in standard CSS if tailwind utility missing
      style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }} 
    >
      {candidates.map((candidate, index) => (
        <Button
          key={`${candidate}-${index}`}
          variant="outline"
          size="sm"
          onClick={() => onSelect(candidate)}
          className="flex-shrink-0 text-xs sm:text-sm h-8 px-3 max-w-[200px]"
          title={candidate} // Show full text on hover
        >
          <span className="truncate block w-full text-left">
            {candidate}
          </span>
        </Button>
      ))}
    </div>
  );
}
