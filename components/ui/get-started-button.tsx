import { ArrowRight } from 'lucide-react';

import { cn } from '@/lib/utils';

interface IGetStartedButtonProps {
  text: string;
  className?: string;
  onClick?: () => void;
}

export default function GetStartedButton({
  text = 'Get started',
  className,
  onClick,
}: IGetStartedButtonProps) {
  return (
    <div className="min-h-12 w-48">
      <button
        onClick={onClick}
        className={cn(
          'group flex h-12 w-40 items-center justify-center gap-3 rounded-lg bg-zinc-100 p-2 font-bold transition-colors duration-100 ease-in-out hover:bg-zinc-900 dark:bg-zinc-800 dark:hover:bg-zinc-100',
          className,
        )}
      >
        <span
          className={cn(
            'text-zinc-900 transition-colors duration-100 ease-in-out group-hover:text-zinc-100 dark:text-zinc-100 dark:group-hover:text-zinc-900',
          )}
        >
          {text}
        </span>
        <div
          className={cn(
            'relative flex h-7 w-7 items-center justify-center overflow-hidden rounded-full transition-transform duration-100',
            'bg-zinc-900 group-hover:bg-zinc-100 dark:bg-zinc-100 dark:group-hover:bg-zinc-900',
          )}
        >
          <div className="absolute left-0 flex h-7 w-14 -translate-x-1/2 items-center justify-center transition-all duration-200 ease-in-out group-hover:translate-x-0">
            <ArrowRight
              size={16}
              className={cn(
                'size-7 transform p-1 text-zinc-900 opacity-0 group-hover:opacity-100 dark:text-zinc-100',
              )}
            />
            <ArrowRight
              size={16}
              className={cn(
                'size-7 transform p-1 text-zinc-100 opacity-100 transition-transform duration-300 ease-in-out group-hover:opacity-0 dark:text-zinc-900',
              )}
            />
          </div>
        </div>
      </button>
    </div>
  );
}
