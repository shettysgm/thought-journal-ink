import { useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Phone, ExternalLink, Heart, Search, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

const RESOURCES = [
  {
    name: 'SAMHSA Treatment Locator',
    description: 'Find mental health and substance use treatment facilities near you.',
    buildUrl: (zip: string) => `https://findtreatment.gov/locator?sAddr=${zip}&submit=Go`,
    fallbackUrl: 'https://findtreatment.gov/locator',
    icon: Search,
  },
  {
    name: 'Psychology Today Therapist Finder',
    description: 'Browse therapists with reviews, specialties, and insurance filters.',
    buildUrl: (zip: string) => `https://www.psychologytoday.com/us/therapists/${zip}`,
    fallbackUrl: 'https://www.psychologytoday.com/us/therapists',
    icon: Heart,
  },
  {
    name: 'Open Path Collective',
    description: 'Affordable therapy sessions ($30-$80) from licensed therapists.',
    buildUrl: () => 'https://openpathcollective.org/find-a-clinician/',
    fallbackUrl: 'https://openpathcollective.org/find-a-clinician/',
    icon: ShieldCheck,
  },
];

const CRISIS_LINES = [
  { name: '988 Suicide & Crisis Lifeline', phone: '988', description: 'Call or text 24/7' },
  { name: 'SAMHSA National Helpline', phone: '1-800-662-4357', description: 'Free referrals 24/7' },
  { name: 'Crisis Text Line', phone: 'Text HOME to 741741', description: 'Free crisis counseling via text' },
];

export default function CounselorSearchPage() {
  const [zipcode, setZipcode] = useState('');
  const { toast } = useToast();

  const handleOpenResource = (resource: typeof RESOURCES[0]) => {
    const zip = zipcode.trim();
    const url = zip && /^\d{5}$/.test(zip) ? resource.buildUrl(zip) : resource.fallbackUrl;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div
      className="min-h-screen bg-white dark:bg-background px-5 pb-24"
      style={{
        paddingTop: 'max(3.5rem, calc(env(safe-area-inset-top, 20px) + 1.5rem))',
        paddingBottom: 'max(6rem, calc(env(safe-area-inset-bottom, 0px) + 6rem))',
      }}
    >
      <div className="max-w-lg md:max-w-2xl mx-auto space-y-5">
        {/* Header */}
        <header className="mt-1">
            <h1 className="text-lg font-semibold text-foreground">Find a Counselor</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Trusted directories & crisis resources</p>
        </header>

        {/* Zip code input */}
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Enter your zip code for localized results"
            value={zipcode}
            onChange={(e) => setZipcode(e.target.value)}
            className="pl-10"
            maxLength={5}
            inputMode="numeric"
          />
        </div>

        {/* Resource cards */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">Search Directories</h2>
          {RESOURCES.map((resource) => {
            const Icon = resource.icon;
            return (
              <Card
                key={resource.name}
                className="shadow-soft hover:shadow-medium transition-shadow cursor-pointer"
                onClick={() => handleOpenResource(resource)}
              >
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground">{resource.name}</h3>
                    <p className="text-sm text-muted-foreground">{resource.description}</p>
                  </div>
                  <ExternalLink className="w-4 h-4 text-muted-foreground shrink-0" />
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Crisis resources */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">Crisis Resources</h2>
          <Card className="border-destructive/30 bg-destructive/5">
            <CardContent className="p-4 space-y-3">
              <p className="text-sm text-muted-foreground">If you or someone you know is in crisis, reach out now. Help is available 24/7.</p>
              {CRISIS_LINES.map((line) => (
                <div key={line.name} className="flex items-center justify-between gap-2">
                  <div>
                    <p className="font-medium text-sm text-foreground">{line.name}</p>
                    <p className="text-xs text-muted-foreground">{line.description}</p>
                  </div>
                  {line.phone.startsWith('Text') ? (
                    <span className="text-xs font-medium text-primary whitespace-nowrap">{line.phone}</span>
                  ) : (
                    <a href={`tel:${line.phone}`}>
                      <Button size="sm" variant="outline" className="gap-1.5 text-primary shrink-0">
                        <Phone className="w-3.5 h-3.5" />
                        {line.phone}
                      </Button>
                    </a>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
