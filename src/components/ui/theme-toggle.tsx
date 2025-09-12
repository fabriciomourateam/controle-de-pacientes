import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/contexts/ThemeContext";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  const handleToggle = () => {
    // Usar o mesmo método do teste manual
    const currentTheme = document.documentElement.className;
    const newTheme = currentTheme.includes('light') ? 'theme-dark' : 'theme-light';
    
    document.documentElement.className = newTheme;
    localStorage.setItem('theme', newTheme.replace('theme-', ''));
    
    // Também chamar o toggleTheme para manter consistência
    toggleTheme();
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleToggle}
      className="hover-gold transition-all duration-300"
      title={theme === 'light' ? 'Alternar para tema escuro' : 'Alternar para tema claro'}
    >
      {theme === 'light' ? (
        <Moon className="h-4 w-4" />
      ) : (
        <Sun className="h-4 w-4" />
      )}
    </Button>
  );
}
