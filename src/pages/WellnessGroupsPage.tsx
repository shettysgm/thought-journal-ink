import { useState } from 'react';
import { MapPin, ExternalLink, Users, Heart, Globe, Phone, Search, Star, Calendar, Brain } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const SEARCH_PLATFORMS = [
  {
    name: 'Meetup',
    description: 'Find real, ongoing peer groups — meditation, mindfulness, mental wellness, and more.',
    searches: ['meditation', 'mindfulness', 'overthinking', 'mental wellness'],
    buildUrl: (zip: string, query: string) =>
      `https://www.meetup.com/find/?keywords=${encodeURIComponent(query)}&location=${zip}&source=EVENTS`,
    fallbackUrl: (query: string) =>
      `https://www.meetup.com/find/?keywords=${encodeURIComponent(query)}&source=EVENTS`,
    icon: Users,
    rank: '🥇',
    why: 'Real people · Ongoing groups · Social + low pressure',
    tag: 'Best for peer groups',
  },
  {
    name: 'Eventbrite',
    description: 'Discover one-time events — workshops, sound baths, retreats, and wellness sessions.',
    searches: ['mental wellness workshop', 'meditation event', 'sound bath', 'mindfulness retreat'],
    buildUrl: (zip: string, query: string) =>
      `https://www.eventbrite.com/d/united-states--${zip}/${encodeURIComponent(query)}/`,
    fallbackUrl: (query: string) =>
      `https://www.eventbrite.com/d/online/${encodeURIComponent(query)}/`,
    icon: Calendar,
    rank: '🥈',
    why: 'Great for one-time events · Workshops · Retreats',
    tag: 'Events & workshops',
  },
  {
    name: 'Psychology Today Groups',
    description: 'Find structured therapy groups — CBT, DBT, guided by licensed professionals.',
    searches: ['CBT group therapy', 'DBT skills group', 'anxiety support group'],
    buildUrl: (zip: string) =>
      `https://www.psychologytoday.com/us/groups/${zip}`,
    fallbackUrl: () =>
      'https://www.psychologytoday.com/us/groups',
    icon: Brain,
    rank: '🥉',
    why: 'Structured · Therapist-led · CBT & DBT focus',
    tag: 'Therapy groups',
  },
];

const ONLINE_COMMUNITIES = [
  { name: '7 Cups', url: 'https://www.7cups.com/connect/groupSupport', description: 'Free online group chats with trained listeners', tag: 'Free' },
  { name: 'TalkLife', url: 'https://www.talklife.com/', description: 'Peer support community for mental health', tag: 'Free' },
  { name: 'Wisdo', url: 'https://wisdo.com/', description: 'Community-based support groups by topic', tag: 'Free' },
  { name: 'NAMI Support Groups', url: 'https://www.nami.org/Support-Education/Support-Groups', description: 'Free peer-led groups for mental health conditions', tag: 'Free' },
  { name: 'DBSA Online Groups', url: 'https://www.dbsalliance.org/support/chapters-and-support-groups/online-support-groups/', description: 'Peer wellness groups for depression & bipolar', tag: 'Free' },
];

const HELPLINES = [
  { name: '988 Suicide & Crisis Lifeline', phone: '988', description: 'Call or text 24/7' },
  { name: 'NAMI Helpline', phone: '1-800-950-6264', description: 'Info & referrals Mon–Fri 10am–10pm ET' },
  { name: 'Crisis Text Line', phone: 'Text HELLO to 741741', description: 'Free crisis counseling via text' },
];

export default function WellnessGroupsPage() {
  const [zipcode, setZipcode] = useState('');

  const handleSearch = (platform: typeof SEARCH_PLATFORMS[0], query: string) => {
    const zip = zipcode.trim();
    const url = zip && /^\d{5}$/.test(zip)
      ? platform.buildUrl(zip, query)
      : platform.fallbackUrl(query);
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
          <h1 className="text-lg font-semibold text-foreground">Find Your People</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Peer-led wellness groups & communities</p>
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

        {/* How to find groups */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-foreground">🔍 How to Find Groups</h2>
          {SEARCH_PLATFORMS.map((platform) => {
            const Icon = platform.icon;
            return (
              <Card key={platform.name} className="shadow-soft overflow-hidden">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{platform.rank}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold text-card-foreground">{platform.name}</h3>
                        <Badge variant="secondary" className="text-[9px] px-1.5 py-0">{platform.tag}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{platform.description}</p>
                    </div>
                    <Icon className="w-5 h-5 text-primary shrink-0" />
                  </div>
                  <p className="text-[10px] text-muted-foreground italic">{platform.why}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {platform.searches.map((query) => (
                      <Button
                        key={query}
                        size="sm"
                        variant="outline"
                        className="h-7 text-[11px] gap-1 rounded-full"
                        onClick={() => handleSearch(platform, query)}
                      >
                        <Search className="w-3 h-3" />
                        {query}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Online communities */}
        <div className="space-y-2.5">
          <h2 className="text-sm font-semibold text-foreground">💻 Online Communities</h2>
          <div className="grid gap-2">
            {ONLINE_COMMUNITIES.map((group) => (
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
                    <div className="flex items-center gap-2">
                      <h3 className="text-xs font-semibold text-card-foreground">{group.name}</h3>
                      <span className="text-[9px] font-medium px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">{group.tag}</span>
                    </div>
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
