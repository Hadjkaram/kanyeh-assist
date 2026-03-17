import { useLanguage } from '@/contexts/LanguageContext';
import { 
  Camera, 
  Brain, 
  Users, 
  Shield, 
  Plug, 
  WifiOff 
} from 'lucide-react';

const FeaturesSection = () => {
  const { t } = useLanguage();

  const features = [
    { 
      key: 'capture', 
      icon: Camera,
      color: 'primary'
    },
    { 
      key: 'analysis', 
      icon: Brain,
      color: 'accent'
    },
    { 
      key: 'collab', 
      icon: Users,
      color: 'primary'
    },
    { 
      key: 'security', 
      icon: Shield,
      color: 'success'
    },
    { 
      key: 'integration', 
      icon: Plug,
      color: 'primary'
    },
    { 
      key: 'offline', 
      icon: WifiOff,
      color: 'warning'
    },
  ];

  const getColorClasses = (color: string) => {
    switch (color) {
      case 'accent':
        return 'bg-accent/10 text-accent group-hover:bg-accent group-hover:text-accent-foreground';
      case 'success':
        return 'bg-success/10 text-success group-hover:bg-success group-hover:text-success-foreground';
      case 'warning':
        return 'bg-warning/10 text-warning group-hover:bg-warning group-hover:text-warning-foreground';
      default:
        return 'bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground';
    }
  };

  return (
    <section id="features" className="py-24 bg-background">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">
            {t('features.title')}
          </h2>
          <p className="text-lg text-muted-foreground">
            {t('features.subtitle')}
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {features.map((feature, index) => (
            <div
              key={feature.key}
              className="group relative bg-card rounded-2xl p-6 md:p-8 border border-border hover:border-primary/50 hover:shadow-lg transition-all duration-300 animate-fade-in-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Icon */}
              <div className={`inline-flex items-center justify-center w-14 h-14 rounded-xl mb-6 transition-all duration-300 ${getColorClasses(feature.color)}`}>
                <feature.icon className="h-7 w-7" />
              </div>

              {/* Content */}
              <h3 className="text-xl font-display font-semibold text-foreground mb-3 group-hover:text-primary transition-colors">
                {t(`features.${feature.key}.title`)}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {t(`features.${feature.key}.desc`)}
              </p>

              {/* Hover Gradient */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
