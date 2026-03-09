import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Search, MapPin, Phone, Globe, ExternalLink, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

type Facility = {
  name1: string;
  name2?: string;
  street1: string;
  street2?: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
  website?: string;
  miles?: string;
  services?: string[];
  categories?: string[];
};

export default function CounselorSearchPage() {
  const [zipcode, setZipcode] = useState('');
  const [results, setResults] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const { toast } = useToast();

  const handleSearch = async () => {
    const zip = zipcode.trim();
    if (!/^\d{5}$/.test(zip)) {
      toast({ title: 'Invalid Zip Code', description: 'Please enter a valid 5-digit US zip code.', variant: 'destructive' });
      return;
    }

    setLoading(true);
    setSearched(true);
    setResults([]);

    try {
      const response = await fetch(
        `https://findtreatment.gov/locator/exportsAsJson/v2?sAddr=${zip}&limitType=0&limitValue=25&sType=SA,MH`
      );

      if (!response.ok) throw new Error('API request failed');

      const data = await response.json();
      const rows: Facility[] = (data?.rows || []).map((row: any) => ({
        name1: row.name1 || row.NAME1 || 'Unknown Facility',
        name2: row.name2 || row.NAME2,
        street1: row.street1 || row.STREET1 || '',
        street2: row.street2 || row.STREET2,
        city: row.city || row.CITY || '',
        state: row.state || row.STATE || '',
        zip: row.zip || row.ZIP || '',
        phone: row.phone || row.PHONE || '',
        website: row.website || row.WEBSITE,
        miles: row.miles || row.MILES,
        services: row.services || [],
        categories: row.typeFacility ? [row.typeFacility] : [],
      }));

      setResults(rows);

      if (rows.length === 0) {
        toast({ title: 'No Results', description: 'No treatment facilities found near this zip code. Try a different area.' });
      }
    } catch (error) {
      console.error('SAMHSA API error:', error);
      toast({ title: 'Search Failed', description: 'Could not reach the SAMHSA locator. Please try again later.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen bg-background px-4 md:px-6 pt-14 pb-24"
      style={{
        paddingTop: 'max(3.5rem, calc(env(safe-area-inset-top, 20px) + 1rem))',
        paddingBottom: 'max(6rem, calc(env(safe-area-inset-bottom, 0px) + 5rem))',
      }}
    >
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <header className="flex items-center gap-4 mt-2">
          <Link to="/">
            <Button variant="outline" size="sm" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-foreground">Find a Counselor</h1>
            <p className="text-sm text-muted-foreground">Search SAMHSA's national directory</p>
          </div>
        </header>

        {/* Search */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Enter zip code (e.g. 90210)"
              value={zipcode}
              onChange={(e) => setZipcode(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="pl-10"
              maxLength={5}
              inputMode="numeric"
            />
          </div>
          <Button onClick={handleSearch} disabled={loading} className="gap-2">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            Search
          </Button>
        </div>

        {/* Info banner */}
        <div className="bg-muted/50 rounded-lg p-3 text-xs text-muted-foreground">
          <p>
            Results from <strong>SAMHSA's National Helpline</strong> — a free, confidential, 24/7 treatment referral service.
            Call <a href="tel:1-800-662-4357" className="text-primary underline font-medium">1-800-662-4357</a> for immediate help.
          </p>
        </div>

        {/* Results */}
        {loading && (
          <div className="text-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">Searching facilities near {zipcode}…</p>
          </div>
        )}

        {!loading && searched && results.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <h3 className="text-lg font-semibold mb-1">No Facilities Found</h3>
              <p className="text-sm text-muted-foreground">Try a different zip code or expand your search area.</p>
            </CardContent>
          </Card>
        )}

        {results.length > 0 && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">{results.length} facilities found near {zipcode}</p>
            {results.map((facility, i) => (
              <Card key={i} className="shadow-soft hover:shadow-medium transition-shadow">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground leading-snug">{facility.name1}</h3>
                      {facility.name2 && (
                        <p className="text-sm text-muted-foreground">{facility.name2}</p>
                      )}
                    </div>
                    {facility.miles && (
                      <Badge variant="secondary" className="shrink-0 text-xs">
                        {parseFloat(facility.miles).toFixed(1)} mi
                      </Badge>
                    )}
                  </div>

                  <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                    <p className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 shrink-0" />
                      {facility.street1}{facility.street2 ? `, ${facility.street2}` : ''}, {facility.city}, {facility.state} {facility.zip}
                    </p>
                    {facility.phone && (
                      <a href={`tel:${facility.phone}`} className="flex items-center gap-2 text-primary hover:underline">
                        <Phone className="w-3.5 h-3.5 shrink-0" />
                        {facility.phone}
                      </a>
                    )}
                  </div>

                  {facility.website && (
                    <a
                      href={facility.website.startsWith('http') ? facility.website : `https://${facility.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 mt-2 text-xs text-primary hover:underline"
                    >
                      <Globe className="w-3 h-3" />
                      Visit Website
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}

                  {facility.categories && facility.categories.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {facility.categories.map((cat, j) => (
                        <Badge key={j} variant="outline" className="text-xs">{cat}</Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
