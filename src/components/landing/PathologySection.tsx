import { useLanguage } from '@/contexts/LanguageContext';
import { Heart, Activity, CheckCircle } from 'lucide-react';

const PathologySection = () => {
  const { t, language } = useLanguage();

  const pathologies = [
    {
      key: 'breast',
      icon: Heart,
      color: 'accent',
      features: language === 'fr' 
        ? ['Analyse histopathologique', 'Grading tumoral', 'Biomarqueurs (ER, PR, HER2)', 'Classification moléculaire']
        : ['Histopathological analysis', 'Tumor grading', 'Biomarkers (ER, PR, HER2)', 'Molecular classification']
    },
    {
      key: 'cervical',
      icon: Activity,
      color: 'primary',
      features: language === 'fr'
        ? ['Cytologie cervicale', 'Classification Bethesda', 'Détection HPV', 'Suivi des lésions']
        : ['Cervical cytology', 'Bethesda classification', 'HPV detection', 'Lesion monitoring']
    },
  ];

  return (
    <section id="about" className="py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">
            {t('pathology.title')}
          </h2>
          <p className="text-lg text-muted-foreground">
            {t('pathology.subtitle')}
          </p>
        </div>

        {/* Pathology Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {pathologies.map((pathology, index) => (
            <div
              key={pathology.key}
              className="relative bg-card rounded-3xl p-8 border border-border overflow-hidden group hover:shadow-xl transition-all duration-500 animate-fade-in-up"
              style={{ animationDelay: `${index * 0.15}s` }}
            >
              {/* Background Decoration */}
              <div 
                className={`absolute top-0 right-0 w-40 h-40 rounded-full blur-3xl opacity-20 group-hover:opacity-30 transition-opacity ${
                  pathology.color === 'accent' ? 'bg-accent' : 'bg-primary'
                }`}
              />

              {/* Icon */}
              <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-6 ${
                pathology.color === 'accent' 
                  ? 'bg-accent/10 text-accent' 
                  : 'bg-primary/10 text-primary'
              }`}>
                <pathology.icon className="h-8 w-8" />
              </div>

              {/* Title */}
              <h3 className="text-2xl font-display font-bold text-foreground mb-3">
                {t(`pathology.${pathology.key}`)}
              </h3>

              {/* Description */}
              <p className="text-muted-foreground mb-6">
                {t(`pathology.${pathology.key}.desc`)}
              </p>

              {/* Features List */}
              <ul className="space-y-3">
                {pathology.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm">
                    <CheckCircle className={`h-5 w-5 flex-shrink-0 ${
                      pathology.color === 'accent' ? 'text-accent' : 'text-primary'
                    }`} />
                    <span className="text-foreground">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PathologySection;
