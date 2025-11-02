import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, Mic, Calendar as CalendarIcon, Search, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { useEntries } from '@/store/useEntries';
import { useToast } from '@/hooks/use-toast';
import { format, isSameDay, startOfDay } from 'date-fns';
import HighlightedTextWithReframes from '@/components/HighlightedTextWithReframes';
import { cn } from '@/lib/utils';

function BlobImage({ blob, alt }: { blob: Blob; alt: string }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    const objectUrl = URL.createObjectURL(blob);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [blob]);
  if (!url) return null;
  return <img src={url} alt={alt} loading="lazy" className="w-full max-h-40 object-contain rounded-md mb-3" />;
}

export default function JournalPage() {
  const { entries, loading, loadEntries, deleteEntry } = useEntries();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedEntries, setExpandedEntries] = useState<Set<string>>(new Set());
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const entriesPerPage = 10;

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  // Reload entries when page becomes visible (user navigates back)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadEntries();
      }
    };

    const handleFocus = () => {
      loadEntries();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [loadEntries]);

  // Get dates that have entries
  const getDatesWithEntries = () => {
    const dates = new Set<string>();
    entries
      .filter(entry => !entry.hasDrawing)
      .forEach(entry => {
        const dateKey = format(startOfDay(new Date(entry.createdAt)), 'yyyy-MM-dd');
        dates.add(dateKey);
      });
    return dates;
  };

  const datesWithEntries = getDatesWithEntries();

  const filteredEntries = entries
    .filter(entry => !entry.hasDrawing) // Filter out handwriting entries
    .filter(entry => {
      // Filter by selected date
      if (selectedDate) {
        return isSameDay(new Date(entry.createdAt), selectedDate);
      }
      return true;
    })
    .filter(entry => {
      // If no search term, show all entries
      if (!searchTerm.trim()) return true;
      
      // Otherwise, filter by text or tags
      return entry.text?.toLowerCase().includes(searchTerm.toLowerCase()) ||
             entry.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    });

  // Pagination calculations
  const totalPages = Math.ceil(filteredEntries.length / entriesPerPage);
  const startIndex = (currentPage - 1) * entriesPerPage;
  const endIndex = startIndex + entriesPerPage;
  const paginatedEntries = filteredEntries
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(startIndex, endIndex);

  // Reset page when search or date changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedDate]);

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

  const toggleExpanded = (entryId: string) => {
    const newExpanded = new Set(expandedEntries);
    if (newExpanded.has(entryId)) {
      newExpanded.delete(entryId);
    } else {
      newExpanded.add(entryId);
    }
    setExpandedEntries(newExpanded);
  };

  const getEntryIcon = (entry: any) => {
    const icons = [];
    if (entry.hasAudio) icons.push(<Mic key="audio" className="w-4 h-4" />);
    if (entry.text && !entry.hasAudio) icons.push(<FileText key="text" className="w-4 h-4" />);
    
    return icons.length > 0 ? (
      <div className="flex gap-1">
        {icons}
      </div>
    ) : <FileText className="w-4 h-4" />;
  };

  const getEntryTypes = (entry: any) => {
    const types = [];
    if (entry.hasAudio) types.push('Voice');
    if (entry.text && !entry.hasAudio) types.push('Text');
    
    return types.length > 0 ? types : ['Entry'];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white p-4 md:p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="text-center">Loading your journal entries...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-4 md:p-6">
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

        {/* Search and Calendar */}
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search your entries..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Calendar */}
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle className="text-lg flex items-center justify-between">
                <span>Select a Date</span>
                {selectedDate && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedDate(undefined)}
                    className="text-xs"
                  >
                    Clear
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                className={cn("pointer-events-auto")}
                modifiers={{
                  hasEntry: (date) => {
                    const dateKey = format(startOfDay(date), 'yyyy-MM-dd');
                    return datesWithEntries.has(dateKey);
                  }
                }}
                modifiersClassNames={{
                  hasEntry: "bg-primary/10 font-bold text-primary"
                }}
              />
            </CardContent>
          </Card>
          
          {filteredEntries.length > 0 && (
            <div className="text-sm text-muted-foreground">
              Showing {startIndex + 1}-{Math.min(endIndex, filteredEntries.length)} of {filteredEntries.length} entries
              {selectedDate && ` on ${format(selectedDate, 'MMM d, yyyy')}`}
              {searchTerm && ` matching "${searchTerm}"`}
            </div>
          )}
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
                  <Link to="/text">
                    <Button variant="outline" className="gap-2">
                      <FileText className="w-4 h-4" />
                      Text Journal
                    </Button>
                  </Link>
                  <Link to="/voice">
                    <Button className="gap-2">
                      <Mic className="w-4 h-4" />
                      Voice Journal
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            <div className="space-y-4">
              {paginatedEntries.map((entry) => (
              <Card key={entry.id} className="shadow-soft hover:shadow-medium transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-1">
                      {/* Header */}
                      <div className="flex items-center gap-2 mb-3">
                        {getEntryIcon(entry)}
                        <div className="flex gap-1">
                          {getEntryTypes(entry).map((type, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {type}
                            </Badge>
                          ))}
                        </div>
                         <div className="flex items-center gap-1 text-muted-foreground text-sm">
                           <CalendarIcon className="w-3 h-3" />
                           {entry.updatedAt 
                             ? `${format(new Date(entry.createdAt), 'MMM d, yyyy')} • Updated ${format(new Date(entry.updatedAt), 'h:mm a')}`
                             : format(new Date(entry.createdAt), 'MMM d, yyyy • h:mm a')
                           }
                         </div>
                      </div>

                      {/* Content */}
                      {entry.text && (
                        <div className="bg-muted/30 rounded-lg p-4 mb-3 cursor-pointer hover:bg-muted/50 transition-colors"
                             onClick={() => navigate(`/unified?edit=${entry.id}`)}>
                          <div className="text-foreground">
                            <HighlightedTextWithReframes
                              text={entry.text.length > 300 && !expandedEntries.has(entry.id)
                                ? entry.text.substring(0, 300)
                                : entry.text
                              }
                              reframes={entry.reframes}
                            />
                          </div>
                          {entry.text.length > 300 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleExpanded(entry.id);
                              }}
                              className="mt-2 p-0 h-auto text-primary hover:text-primary/80"
                            >
                              {expandedEntries.has(entry.id) ? "Show less" : "Show more"}
                            </Button>
                          )}
                        </div>
                      )}
                      {entry.stickers && entry.stickers.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-3">
                          <span className="text-sm text-muted-foreground mr-2">Mood:</span>
                          {entry.stickers.map((stickerId: string, index: number) => {
                            // Map sticker IDs back to emojis for display
                            const stickerMap: { [key: string]: string } = {
                              'heart-pink': '💗',
                              'heart-red': '❤️', 
                              'heart-purple': '💜',
                              'sun': '☀️',
                              'cloud': '☁️',
                              'rainbow': '🌈',
                              'flower-pink': '🌸',
                              'flower-purple': '🌺',
                              'butterfly': '🦋',
                              'star-yellow': '⭐',
                              'star-pink': '💖',
                              'crown': '👑',
                              'diamond': '💎',
                              'bubble-blue': '💬',
                              'bubble-green': '💭',
                              'arrow-purple': '↗️',
                              'arrow-orange': '➡️',
                              'thumbs-up': '👍'
                            };
                            const displaySticker = stickerMap[stickerId] || stickerId;
                            
                            return (
                              <Badge key={index} variant="outline" className="text-base">
                                {displaySticker}
                              </Badge>
                            );
                          })}
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

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    Page {currentPage} of {totalPages}
                  </span>
                </div>
                
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        )}
        
      </div>
    </div>
  );
}