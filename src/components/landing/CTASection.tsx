import { useLanguage } from '@/contexts/LanguageContext';
import { useNavigate } from 'react-router-dom'; // <-- AJOUT DE useNavigate
import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles } from 'lucide-react';

const CTASection = () => {
  const { t } = useLanguage();
  const navigate = useNavigate(); // <-- INITIALISATION

  return (
    <section id="contact" className="py-24 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-hero" />
      
      {/* Decorative Elements */}
      <div className="absolute top-0 left-1/4 w-64 h-64 bg-primary/20 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-accent/15 rounded-full blur-3xl" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-3xl mx-auto text-center">
          {/* Icon */}
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/20 mb-8 animate-pulse-glow">
            <Sparkles className="h-8 w-8 text-primary" />
          </div>

          {/* Title */}
          <h2 className="text-3xl md:text-5xl font-display font-bold text-primary-foreground mb-6 animate-fade-in-up">
            {t('cta.title')}
          </h2>

          {/* Subtitle */}
          <p className="text-lg md:text-xl text-primary-foreground/70 mb-10 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            {t('cta.subtitle')}
          </p>

          {/* CTA Button */}
          <Button 
            size="lg" 
            className="bg-gradient-accent text-accent-foreground shadow-lg shadow-accent/30 hover:shadow-xl hover:shadow-accent/40 transition-all gap-2 px-10 py-6 text-lg animate-fade-in-up"
            style={{ animationDelay: '0.2s' }}
            onClick={() => navigate('/login')} // <-- LIEN AJOUTÉ
          >
            {t('cta.button')}
            <ArrowRight className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </section>
  );
};

export default CTASection;