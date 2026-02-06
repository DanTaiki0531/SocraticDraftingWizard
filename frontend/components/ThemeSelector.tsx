import { Sun, Moon } from 'lucide-react';
import { useTheme, Theme } from './ThemeProvider';

const themes: { id: Theme; label: string; icon: typeof Sun }[] = [
    { id: 'light', label: 'ライト', icon: Sun },
    { id: 'dark', label: 'ダーク', icon: Moon },
];

export function ThemeSelector() {
    const { theme, setTheme } = useTheme();

    return (
        <div className="flex items-center gap-1 bg-theme-surface rounded-lg p-1 border border-theme-border">
            {themes.map((t) => {
                const Icon = t.icon;
                const isActive = theme === t.id;
                return (
                    <button
                        key={t.id}
                        onClick={() => setTheme(t.id)}
                        className={`p-2 rounded-md transition-all duration-200 ${isActive
                            ? 'bg-theme-primary text-theme-primary-foreground shadow-sm'
                            : 'text-theme-muted-foreground hover:bg-theme-muted hover:text-theme-foreground'
                            }`}
                        title={t.label}
                        aria-label={`${t.label}テーマに切り替え`}
                    >
                        <Icon className="w-4 h-4" />
                    </button>
                );
            })}
        </div>
    );
}
