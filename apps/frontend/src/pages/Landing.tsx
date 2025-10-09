import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTranslation } from "@/hooks/useTranslation";
import {
  Wallet,
  Calendar,
  TrendingUp,
  Globe,
  ArrowRight,
  CheckCircle2,
  Languages,
  Mail,
  Grip
} from "lucide-react";

const Landing = () => {
  const [selectedLanguage, setSelectedLanguage] = useState<string>("spanish");
  const { t } = useTranslation(selectedLanguage as 'english' | 'spanish');
  const navigate = useNavigate();

  const features = [
    {
      icon: Calendar,
      titleKey: 'landingFeature1Title',
      descriptionKey: 'landingFeature1Desc',
    },
    {
      icon: Globe,
      titleKey: 'landingFeature2Title',
      descriptionKey: 'landingFeature2Desc',
    },
    {
      icon: TrendingUp,
      titleKey: 'landingFeature3Title',
      descriptionKey: 'landingFeature3Desc',
    },
    {
      icon: Mail,
      titleKey: 'landingFeature4Title',
      descriptionKey: 'landingFeature4Desc',
    },
    {
      icon: Grip,
      titleKey: 'landingFeature5Title',
      descriptionKey: 'landingFeature5Desc',
    },
    {
      icon: Wallet,
      titleKey: 'landingFeature6Title',
      descriptionKey: 'landingFeature6Desc',
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/40 sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src="/penny.png" alt="Penny" className="h-10 w-10 object-contain" />
              <h1 className="text-xl font-bold text-foreground">FinPal Pocket Planner</h1>
            </div>
            <div className="flex items-center gap-3">
              <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                <SelectTrigger className="w-32">
                  <Languages className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="english">{t('english')}</SelectItem>
                  <SelectItem value="spanish">{t('spanish')}</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="ghost" onClick={() => navigate('/auth')}>
                {t('signIn')}
              </Button>
              <Button onClick={() => navigate('/auth')} className="hidden sm:flex">
                {t('getStarted')}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center rounded-full border px-4 py-1.5 text-sm font-semibold bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
                <Wallet className="w-4 h-4 mr-2 text-primary" />
                {t('landingBadge')}
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-foreground leading-tight">
                {t('landingHeroTitle')}
              </h2>
              <p className="text-lg text-muted-foreground">
                {t('landingHeroSubtitle')}
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" onClick={() => navigate('/auth')} className="text-base">
                  {t('getStarted')}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button size="lg" variant="outline" onClick={() => navigate('/auth')}>
                  {t('signIn')}
                </Button>
              </div>
              <div className="flex items-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  <span>{t('landingBenefit1')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  <span>{t('landingBenefit2')}</span>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-purple-500/20 blur-3xl rounded-full"></div>
              <img
                src="/penny.png"
                alt="FinPal Pocket Planner"
                className="relative w-full max-w-md mx-auto drop-shadow-2xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h3 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              {t('landingFeaturesTitle')}
            </h3>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {t('landingFeaturesSubtitle')}
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card key={index} className="bg-gradient-card hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Icon className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-foreground mb-2">
                          {t(feature.titleKey)}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {t(feature.descriptionKey)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <Card className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-primary/20">
            <CardContent className="p-12">
              <h3 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                {t('landingCtaTitle')}
              </h3>
              <p className="text-lg text-muted-foreground mb-8">
                {t('landingCtaSubtitle')}
              </p>
              <Button size="lg" onClick={() => navigate('/auth')} className="text-base">
                {t('createFreeAccount')}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 py-8 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <img src="/penny.png" alt="Penny" className="h-8 w-8 object-contain" />
              <span className="text-sm text-muted-foreground">
                © 2025 FinPal Pocket Planner
              </span>
            </div>
            <div className="flex gap-6 text-sm">
              <button
                onClick={() => navigate('/policy')}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                {t('privacyPolicy')}
              </button>
              <button
                onClick={() => navigate('/terms')}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                {t('termsOfService')}
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
