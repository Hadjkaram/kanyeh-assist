import { useLanguage } from '@/contexts/LanguageContext';
import { ShieldCheck, Microscope, FlaskConical, Stethoscope } from 'lucide-react';

const ProfilesSection = () => {
  const { t } = useLanguage();

  const profiles = [
    {
      key: 'admin',
      icon: ShieldCheck,
      gradient: 'from-primary to-primary/70',
    },
    {
      key: 'pathologist',
      icon: Microscope,
      gradient: 'from-accent to-accent/70',
    },
    {
      key: 'technician',
      icon: FlaskConical,
      gradient: 'from-success to-success/70',
    },
    {
      key: 'clinician',
      icon: Stethoscope,
      gradient: 'from-warning to-warning/70',
    },
  ];

  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">
            {t('profiles.title')}
          </h2>
          <p className="text-lg text-muted-foreground">
            {t('profiles.subtitle')}
          </p>
        </div>

        {/* Profiles Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {profiles.map((profile, index) => (
            <div
              key={profile.key}
              className="group relative bg-card rounded-2xl p-6 border border-border hover:border-transparent hover:shadow-2xl transition-all duration-500 overflow-hidden animate-fade-in-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Gradient Background on Hover */}
              <div className={`absolute inset-0 bg-gradient-to-br ${profile.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
              
              {/* Content */}
              <div className="relative z-10">
                {/* Icon */}
                <div className="w-14 h-14 rounded-xl bg-muted group-hover:bg-white/20 flex items-center justify-center mb-5 transition-colors">
                  <profile.icon className="h-7 w-7 text-foreground group-hover:text-white transition-colors" />
                </div>

                {/* Title */}
                <h3 className="text-lg font-display font-semibold text-foreground group-hover:text-white mb-2 transition-colors">
                  {t(`profiles.${profile.key}.title`)}
                </h3>

                {/* Description */}
                <p className="text-sm text-muted-foreground group-hover:text-white/80 transition-colors leading-relaxed">
                  {t(`profiles.${profile.key}.desc`)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProfilesSection;
