import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom'; // <-- AJOUT DE useNavigate
import { useLanguage } from '@/contexts/LanguageContext';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { Button } from '@/components/ui/button';
import { Menu, X } from 'lucide-react';
import kanyehLogo from '@/assets/kanyeh-logo.jpg';

const Header = () => {
  const { t } = useLanguage();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate(); // <-- INITIALISATION

  const navLinks = [
    { key: 'nav.features', href: '#features' },
    { key: 'nav.about', href: '#about' },
    { key: 'nav.contact', href: '#contact' },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3">
            <img 
              src={kanyehLogo} 
              alt="KANYEH ASSIST" 
              className="h-10 md:h-12 w-auto"
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.key}
                href={link.href}
                className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
              >
                {t(link.key)}
              </a>
            ))}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-4">
            <LanguageSwitcher />
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-muted-foreground hover:text-foreground"
              onClick={() => navigate('/login')} // <-- LIEN AJOUTÉ
            >
              {t('nav.login')}
            </Button>
            <Button 
              size="sm" 
              className="bg-gradient-primary text-primary-foreground shadow-md hover:shadow-lg transition-shadow"
              onClick={() => navigate('/dashboard')} // <-- LIEN AJOUTÉ
            >
              {t('nav.dashboard')}
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 text-foreground"
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-border/50 animate-fade-in">
            <nav className="flex flex-col gap-4">
              {navLinks.map((link) => (
                <a
                  key={link.key}
                  href={link.href}
                  onClick={() => setIsMenuOpen(false)}
                  className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors py-2"
                >
                  {t(link.key)}
                </a>
              ))}
              <div className="flex items-center gap-4 pt-4 border-t border-border/50">
                <LanguageSwitcher variant="minimal" />
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="flex-1"
                  onClick={() => { setIsMenuOpen(false); navigate('/login'); }} // <-- LIEN AJOUTÉ
                >
                  {t('nav.login')}
                </Button>
                <Button 
                  size="sm" 
                  className="flex-1 bg-gradient-primary"
                  onClick={() => { setIsMenuOpen(false); navigate('/dashboard'); }} // <-- LIEN AJOUTÉ
                >
                  {t('nav.dashboard')}
                </Button>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;