import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, FileText, Mic, PenTool, Calendar, Search, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useEntries } from '@/store/useEntries';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

export default function JournalPage() {
  const { entries, loading, loadEntries, deleteEntry } = useEntries();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  const filteredEntries = entries.filter(entry =>
    entry.text?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entry.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this entry?')) {
      try {
        await deleteEntry(id);
        toast({
          title: "Entry Deleted",
          description: "Your journal entry has been removed.",
        });
      } catch (error) {
        toast({
          title: "Delete Failed",
          description: "Could not delete the entry. Please try again.",
          variant: "destructive"
        });
      }
    }
  };

  const getEntryIcon = (entry: any) => {
    if (entry.hasAudio) return <Mic className="w-4 h-4" />;
    if (entry.hasDrawing) return <PenTool className="w-4 h-4" />;
    return <FileText className="w-4 h-4" />;
  };

  const getEntryType = (entry: any) => {
    if (entry.hasAudio) return 'Voice';
    if (entry.hasDrawing) return 'Drawing';
    return 'Text';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-therapeutic p-4 md:p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="text-center">Loading your journal entries...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-therapeutic p-4 md:p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header */}
        <header className="flex items-center gap-4">
          <Link to="/">
            <Button variant="outline" size="sm" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-foreground">Your Journal</h1>
            <p className="text-muted-foreground">All your saved entries in one place</p>
          </div>
        </header>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search your entries..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="shadow-soft">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary">{entries.length}</div>
              <p className="text-sm text-muted-foreground">Total Entries</p>
            </CardContent>
          </Card>
          <Card className="shadow-soft">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-accent">
                {entries.filter(e => e.hasAudio).length}
              </div>
              <p className="text-sm text-muted-foreground">Voice Entries</p>
            </CardContent>
          </Card>
          <Card className="shadow-soft">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-therapeutic-growth">
                {entries.filter(e => e.hasDrawing).length}
              </div>
              <p className="text-sm text-muted-foreground">Handwriting Entries</p>
            </CardContent>
          </Card>
        </div>

        {/* Entries List */}
        {filteredEntries.length === 0 ? (
          <Card className="shadow-medium">
            <CardContent className="p-8 text-center">
              <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">
                {entries.length === 0 ? 'No Entries Yet' : 'No Matching Entries'}
              </h3>
              <p className="text-muted-foreground mb-4">
                {entries.length === 0 
                  ? 'Start journaling to see your entries here.'
                  : 'Try adjusting your search terms.'
                }
              </p>
              {entries.length === 0 && (
                <div className="flex gap-2 justify-center">
                  <Link to="/voice">
                    <Button variant="outline" className="gap-2">
                      <Mic className="w-4 h-4" />
                      Voice Journal
                    </Button>
                  </Link>
                  <Link to="/handwriting">
                    <Button className="gap-2">
                      <PenTool className="w-4 h-4" />
                      Handwriting
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredEntries
              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
              .map((entry) => (
              <Card key={entry.id} className="shadow-soft hover:shadow-medium transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      {/* Header */}
                      <div className="flex items-center gap-2 mb-3">
                        {getEntryIcon(entry)}
                        <Badge variant="secondary" className="text-xs">
                          {getEntryType(entry)}
                        </Badge>
                        <div className="flex items-center gap-1 text-muted-foreground text-sm">
                          <Calendar className="w-3 h-3" />
                          {format(new Date(entry.createdAt), 'MMM d, yyyy • h:mm a')}
                        </div>
                      </div>

                      {/* Content */}
                      {entry.text && (
                        <div className="bg-muted/30 rounded-lg p-4 mb-3">
                          <p className="text-foreground whitespace-pre-wrap">
                            {entry.text.length > 300 
                              ? `${entry.text.substring(0, 300)}...` 
                              : entry.text
                            }
                          </p>
                        </div>
                      )}

                      {/* Tags */}
                      {entry.tags && entry.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {entry.tags.map((tag, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              #{tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(entry.id)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
        
      </div>
    </div>
  );
}