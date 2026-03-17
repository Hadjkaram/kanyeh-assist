import { useLanguage } from '@/contexts/LanguageContext';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import kanyehLogo from '@/assets/kanyeh-logo.jpg';

const Footer = () => {
  const { t } = useLanguage();

  const links = {
    product: [
      { label: t('features.capture.title'), href: '#' },
      { label: t('features.analysis.title'), href: '#' },
      { label: t('features.integration.title'), href: '#' },
    ],
    company: [
      { label: t('nav.about'), href: '#about' },
      { label: t('nav.contact'), href: '#contact' },
    ],
    legal: [
      { label: t('footer.privacy'), href: '#' },
      { label: t('footer.terms'), href: '#' },
    ],
  };

  return (
    <footer className="bg-card border-t border-border">
      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12 mb-12">
          {/* Brand */}
          <div className="lg:col-span-2">
            <img 
              src={kanyehLogo} 
              alt="KANYEH ASSIST" 
              className="h-12 w-auto mb-4"
            />
            <p className="text-muted-foreground max-w-sm mb-6">
              {t('footer.tagline')}
            </p>
            <LanguageSwitcher />
          </div>

          {/* Product */}
          <div>
            <h4 className="font-display font-semibold text-foreground mb-4">
              {t('footer.product')}
            </h4>
            <ul className="space-y-3">
              {links.product.map((link) => (
                <li key={link.label}>
                  <a 
                    href={link.href}
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-display font-semibold text-foreground mb-4">
              {t('footer.company')}
            </h4>
            <ul className="space-y-3">
              {links.company.map((link) => (
                <li key={link.label}>
                  <a 
                    href={link.href}
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-display font-semibold text-foreground mb-4">
              {t('footer.legal')}
            </h4>
            <ul className="space-y-3">
              {links.legal.map((link) => (
                <li key={link.label}>
                  <a 
                    href={link.href}
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-border">
          <p className="text-center text-sm text-muted-foreground">
            {t('footer.copyright')}
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
