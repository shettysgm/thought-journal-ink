import { useState } from 'react';
import { MapPin, ExternalLink, Users, Heart, HandHeart, Globe, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';

const GROUP_DIRECTORIES = [
  {
    name: 'NAMI Support Groups',
    description: 'Free peer-led groups for people living with mental health conditions and their families.',
    buildUrl: (zip: string) => `https://www.nami.org/Support-Education/Support-Groups?zip=${zip}`,
    fallbackUrl: 'https://www.nami.org/Support-Education/Support-Groups',
    icon: Heart,
    tag: 'Free',
  },
  {
    name: 'DBSA Support Groups',
    description: 'Peer-led wellness groups for depression and bipolar support — in-person and online.',
    buildUrl: (zip: string) => `https://www.dbsalliance.org/support/chapters-and-support-groups/find-a-support-group/?zip=${zip}`,
    fallbackUrl: 'https://www.dbsalliance.org/support/chapters-and-support-groups/find-a-support-group/',
    icon: Users,
    tag: 'Free',
  },
  {
    name: 'Mental Health America',
    description: 'Find local MHA affiliates with support groups, screening tools, and community resources.',
    buildUrl: (zip: string) => `https://arc.mhanational.org/find-affiliate?field_zip_code_value=${zip}`,
    fallbackUrl: 'https://arc.mhanational.org/find-affiliate',
    icon: HandHeart,
    tag: 'Free',
  },
  {
    name: 'Psychology Today Groups',
    description: 'Browse therapy groups by topic — anxiety, grief, self-esteem, relationships, and more.',
    buildUrl: (zip: string) => `https://www.psychologytoday.com/us/groups/${zip}`,
    fallbackUrl: 'https://www.psychologytoday.com/us/groups',
    icon: Globe,
    tag: 'Varies',
  },
  {
    name: 'SAMHSA Group Finder',
    description: 'Government directory of substance use and mental health treatment programs with group therapy.',
    buildUrl: (zip: string) => `https://findtreatment.gov/locator?sAddr=${zip}&submit=Go`,
    fallbackUrl: 'https://findtreatment.gov/locator',
    icon: Users,
    tag: 'Free',
  },
];

const ONLINE_GROUPS = [
  { name: '7 Cups', url: 'https://www.7cups.com/connect/groupSupport', description: 'Free online group chats with trained listeners' },
  { name: 'TalkLife', url: 'https://www.talklife.com/', description: 'Peer support community for mental health' },
  { name: 'Wisdo', url: 'https://wisdo.com/', description: 'Community-based support groups by topic' },
];

const HELPLINES = [
  { name: '988 Suicide & Crisis Lifeline', phone: '988', description: 'Call or text 24/7' },
  { name: 'NAMI Helpline', phone: '1-800-950-6264', description: 'Info & referrals Mon–Fri 10am–10pm ET' },
  { name: 'Crisis Text Line', phone: 'Text HELLO to 741741', description: 'Free crisis counseling via text' },
];

export default function WellnessGroupsPage() {
  const [zipcode, setZipcode] = useState('');

  const handleOpenResource = (resource: typeof GROUP_DIRECTORIES[0]) => {
    const zip = zipcode.trim();
    const url = zip && /^\d{5}$/.test(zip) ? resource.buildUrl(zip) : resource.fallbackUrl;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div
      className="min-h-[100svh] bg-background px-5 pb-24"
      style={{
        paddingTop: 'max(3.5rem, calc(env(safe-area-inset-top, 20px) + 1.5rem))',
        paddingBottom: 'max(6rem, calc(env(safe-area-inset-bottom, 0px) + 6rem))'
      }}
    >
      <div className="max-w-lg mx-auto space-y-6">
        {/* Header */}
        <header>
          <h1 className="text-lg font-semibold text-foreground">Wellness Groups</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Find peer-led support groups near you</p>
        </header>

        {/* Zip code input */}
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Enter zip code for local results"
            value={zipcode}
            onChange={(e) => setZipcode(e.target.value)}
            className="pl-10 h-11 rounded-xl"
            maxLength={5}
            inputMode="numeric"
          />
        </div>

        {/* Group directories */}
        <div className="space-y-2.5">
          <h2 className="text-sm font-semibold text-foreground">📍 Local Groups</h2>
          {GROUP_DIRECTORIES.map((resource) => {
            const Icon = resource.icon;
            return (
              <Card
                key={resource.name}
                className="shadow-soft hover:shadow-medium transition-all cursor-pointer active:scale-[0.98]"
                onClick={() => handleOpenResource(resource)}
              >
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5 text-primary" strokeWidth={2} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-card-foreground">{resource.name}</h3>
                      <span className="text-[9px] font-medium px-1.5 py-0.5 rounded-full bg-accent/15 text-accent-foreground">
                        {resource.tag}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{resource.description}</p>
                  </div>
                  <ExternalLink className="w-4 h-4 text-muted-foreground shrink-0" />
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Online communities */}
        <div className="space-y-2.5">
          <h2 className="text-sm font-semibold text-foreground">💻 Online Communities</h2>
          <div className="grid gap-2">
            {ONLINE_GROUPS.map((group) => (
              <Card
                key={group.name}
                className="shadow-soft cursor-pointer active:scale-[0.98] transition-all"
                onClick={() => window.open(group.url, '_blank', 'noopener,noreferrer')}
              >
                <CardContent className="p-3.5 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                    <Globe className="w-4 h-4 text-accent-foreground" strokeWidth={2} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xs font-semibold text-card-foreground">{group.name}</h3>
                    <p className="text-[11px] text-muted-foreground">{group.description}</p>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Helplines */}
        <div className="space-y-2.5">
          <h2 className="text-sm font-semibold text-foreground">🆘 Need Immediate Help?</h2>
          <Card className="border-destructive/30 bg-destructive/5">
            <CardContent className="p-4 space-y-3">
              <p className="text-xs text-muted-foreground">If you're in crisis, reach out now. Help is available 24/7.</p>
              {HELPLINES.map((line) => (
                <div key={line.name} className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-xs font-medium text-foreground">{line.name}</p>
                    <p className="text-[10px] text-muted-foreground">{line.description}</p>
                  </div>
                  {line.phone.startsWith('Text') ? (
                    <span className="text-[10px] font-medium text-primary whitespace-nowrap">{line.phone}</span>
                  ) : (
                    <a href={`tel:${line.phone}`}>
                      <Button size="sm" variant="outline" className="gap-1 text-primary shrink-0 h-7 text-xs">
                        <Phone className="w-3 h-3" />
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
