import { useLanguage } from '@/contexts/LanguageContext';
import { useNavigate } from 'react-router-dom'; // <-- AJOUT DE useNavigate
import { Button } from '@/components/ui/button';
import { ArrowRight, Play, Microscope, Brain, Shield, Zap } from 'lucide-react';

const HeroSection = () => {
  const { t, language } = useLanguage();
  const navigate = useNavigate(); // <-- INITIALISATION

  const stats = [
    { key: 'stats.centers', value: '45+', icon: Microscope },
    { key: 'stats.cases', value: '12K+', icon: Brain },
    { key: 'stats.pathologists', value: '120+', icon: Shield },
    { key: 'stats.accuracy', value: '98%', icon: Zap },
  ];

  return (
    <section className="relative min-h-screen flex items-center pt-20 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-hero" />
      
      {/* Decorative Elements */}
      <div className="absolute top-1/4 left-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-0 w-80 h-80 bg-accent/10 rounded-full blur-3xl" />
      
      {/* Grid Pattern */}
      <div 
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px'
        }}
      />

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-dark mb-8 animate-fade-in">
            <span className="flex h-2 w-2 rounded-full bg-success animate-pulse" />
            <span className="text-sm font-medium text-primary-foreground/80">
              {t('hero.badge')} • Version 2.0
            </span>
          </div>

          {/* Title */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-display font-bold leading-tight mb-6 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            <span className="text-primary-foreground">{t('hero.title1')}</span>
            <br />
            <span className="text-gradient-primary">{t('hero.title2')}</span>
            <br />
            <span className="text-accent">{t('hero.title3')}</span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg md:text-xl text-primary-foreground/70 max-w-2xl mx-auto mb-10 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            {t('hero.subtitle')}
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
            <Button 
              size="lg" 
              className="bg-gradient-primary text-primary-foreground shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 transition-all gap-2 px-8 animate-pulse-glow"
              onClick={() => navigate('/login')} // <-- LIEN AJOUTÉ
            >
              {t('hero.cta.start')}
              <ArrowRight className="h-5 w-5" />
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10 gap-2 px-8"
              onClick={() => navigate('/login')} // <-- LIEN AJOUTÉ (ou '#features' si tu préfères que ça descende)
            >
              <Play className="h-5 w-5" />
              {t('hero.cta.demo')}
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
            {stats.map((stat, index) => (
              <div 
                key={stat.key}
                className="glass-dark rounded-2xl p-4 md:p-6 text-center"
                style={{ animationDelay: `${0.5 + index * 0.1}s` }}
              >
                <stat.icon className="h-6 w-6 text-primary mx-auto mb-2" />
                <div className="text-2xl md:text-3xl font-bold text-primary-foreground mb-1">
                  {stat.value}
                </div>
                <div className="text-sm text-primary-foreground/60">
                  {t(stat.key)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 rounded-full border-2 border-primary-foreground/30 flex items-start justify-center p-2">
          <div className="w-1 h-2 bg-primary-foreground/50 rounded-full" />
        </div>
      </div>
    </section>
  );
};

export default HeroSection;