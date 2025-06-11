import { useAppearance } from '@/hooks/use-appearance';
import { cn } from '@/lib/utils';
import { Moon, Sun } from 'lucide-react';

export default function AppearanceToggleTab({ className = '' }) {
    const { appearance, updateAppearance } = useAppearance();
    const isDark = appearance === 'dark';

    const toggle = () => {
        updateAppearance(isDark ? 'light' : 'dark');
    };

    return (
        <button
            onClick={toggle}
            className={cn('relative flex h-8 w-16 items-center rounded-full bg-neutral-200 transition-colors dark:bg-neutral-700', className)}
            aria-label="Toggle theme"
        >
            {/* Sliding knob with icon */}
            <div
                className={cn(
                    'absolute top-1 flex h-6 w-6 items-center justify-center rounded-full bg-white shadow-md transition-transform',
                    isDark ? 'translate-x-8' : 'translate-x-1',
                )}
            >
                {isDark ? <Moon className="h-4 w-4 text-gray-700 dark:text-neutral-900" /> : <Sun className="h-4 w-4 text-yellow-500" />}
            </div>
        </button>
    );
}
