import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Globe } from 'lucide-react';

interface LanguageSwitcherProps {
  variant?: 'default' | 'minimal';
}

const LanguageSwitcher = ({ variant = 'default' }: LanguageSwitcherProps) => {
  const { language, setLanguage } = useLanguage();

  const toggleLanguage = () => {
    setLanguage(language === 'fr' ? 'en' : 'fr');
  };

  if (variant === 'minimal') {
    return (
      <button
        onClick={toggleLanguage}
        className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
      >
        <Globe className="h-4 w-4" />
        <span className="uppercase">{language === 'fr' ? 'EN' : 'FR'}</span>
      </button>
    );
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={toggleLanguage}
      className="gap-2 border-primary/20 hover:border-primary hover:bg-primary/5"
    >
      <Globe className="h-4 w-4" />
      <span className="font-medium">{language === 'fr' ? 'English' : 'Français'}</span>
    </Button>
  );
};

export default LanguageSwitcher;
