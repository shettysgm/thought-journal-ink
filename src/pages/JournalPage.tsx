import { useState, useEffect, type MouseEvent, useMemo } from 'react';
import { subDays, isAfter, startOfDay as startOfDayFn } from 'date-fns';
import { Link, useNavigate } from 'react-router-dom';
import { FileText, Mic, Search, Trash2, FileDown, Smile, CalendarRange } from 'lucide-react';
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
import { awaitPendingSave } from '@/lib/pendingSave';
import { exportJournalsToFile } from '@/lib/exportJournals';
import { ALL_STICKERS, KAWAII_STICKERS } from '@/components/KawaiiStickers';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import CardBackgroundPicker, { getPatternStyle, getBorderClassName } from '@/components/CardBackgroundPicker';

function BlobImage({ blob, alt, className }: { blob: Blob; alt: string; className?: string }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    const objectUrl = URL.createObjectURL(blob);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [blob]);
  if (!url) return null;
  return <img src={url} alt={alt} loading="lazy" className={cn("object-cover rounded-lg", className)} />;
}

export default function JournalPage() {
  const { entries, loading, loadEntries, deleteEntry, updateEntry } = useEntries();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedEntries, setExpandedEntries] = useState<Set<string>>(new Set());
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [bannerBlobs, setBannerBlobs] = useState<Record<string, Blob[]>>({});
  const [exporting, setExporting] = useState(false);
  const [stickerPickerOpen, setStickerPickerOpen] = useState<string | null>(null);
  const [stickerCategory, setStickerCategory] = useState('moods');
  const [bgPickerOpen, setBgPickerOpen] = useState<string | null>(null);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [exportFrom, setExportFrom] = useState<Date | undefined>(undefined);
  const [exportTo, setExportTo] = useState<Date | undefined>(undefined);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteFrom, setDeleteFrom] = useState<Date | undefined>(undefined);
  const [deleteTo, setDeleteTo] = useState<Date | undefined>(undefined);
  const [deleting, setDeleting] = useState(false);
  const entriesPerPage = 10;

  const handleExportJournals = async (dateRange?: { from: Date; to: Date }) => {
    setExporting(true);
    try {
      await exportJournalsToFile(dateRange);
      toast({ title: "Journals Exported", description: dateRange ? `Entries from ${format(dateRange.from, 'MMM d')} to ${format(dateRange.to, 'MMM d')} exported.` : "Your journal entries are ready to save." });
    } catch {
      toast({ title: "Export Failed", description: "Could not export journal entries.", variant: "destructive" });
    } finally {
      setExporting(false);
      setExportDialogOpen(false);
    }
  };

  useEffect(() => {
    // Wait for any in-flight voice page save before loading entries
    awaitPendingSave().then(() => loadEntries()).then(async () => {
      const state = useEntries.getState();
      console.log('[JournalPage] Loaded entries:', state.entries.length);
      
      // Load banner blobs from IDB
      try {
        const { getJournalEntry } = await import('@/lib/idb');
        const blobs: Record<string, Blob[]> = {};
        for (const entry of state.entries) {
          const raw = await getJournalEntry(entry.id) as any;
          if (raw?.bannerBlobs && Array.isArray(raw.bannerBlobs)) {
            blobs[entry.id] = raw.bannerBlobs;
          } else if (raw?.bannerBlob && raw.bannerBlob instanceof Blob) {
            // Backwards compat: single blob → array
            blobs[entry.id] = [raw.bannerBlob];
          }
        }
        setBannerBlobs(blobs);
      } catch (e) {
        console.error('Failed to load banner blobs:', e);
      }
    });
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
    .filter(entry => !entry.hasDrawing)
    .filter(entry => {
      if (selectedDate) {
        return isSameDay(new Date(entry.createdAt), selectedDate);
      }
      // Default: only show last 3 days
      const threeDaysAgo = startOfDayFn(subDays(new Date(), 2));
      return isAfter(new Date(entry.createdAt), threeDaysAgo);
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

  const handleDeleteByDateRange = async () => {
    if (!deleteFrom || !deleteTo) return;
    const from = startOfDay(deleteFrom);
    const to = new Date(startOfDay(deleteTo));
    to.setHours(23, 59, 59, 999);

    const toDelete = entries.filter(e => {
      if (e.hasDrawing) return false;
      const d = new Date(e.createdAt);
      return d >= from && d <= to;
    });

    if (toDelete.length === 0) {
      toast({ title: "No Entries Found", description: "No entries exist in the selected date range." });
      return;
    }

    if (!confirm(`Delete ${toDelete.length} entries from ${format(from, 'MMM d')} to ${format(to, 'MMM d, yyyy')}? This cannot be undone.`)) return;

    setDeleting(true);
    try {
      for (const entry of toDelete) {
        await deleteEntry(entry.id);
      }
      toast({ title: "Entries Deleted", description: `${toDelete.length} entries removed.` });
      setDeleteDialogOpen(false);
      setDeleteFrom(undefined);
      setDeleteTo(undefined);
    } catch {
      toast({ title: "Delete Failed", description: "Could not delete some entries.", variant: "destructive" });
    } finally {
      setDeleting(false);
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
      <div 
        className="min-h-screen bg-white p-4 md:p-6"
        style={{ 
          paddingTop: 'max(1rem, env(safe-area-inset-top))',
          paddingBottom: 'max(1rem, env(safe-area-inset-bottom))'
        }}
      >
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="text-center">Loading your journal entries...</div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen bg-white px-4 md:px-6 pt-14 pb-6"
      style={{ 
        paddingTop: 'max(3.5rem, calc(env(safe-area-inset-top, 20px) + 1rem))',
        paddingBottom: 'max(1.5rem, calc(env(safe-area-inset-bottom, 0px) + 1rem))'
      }}
    >
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header */}
        <header className="mt-2">
            <h1 className="text-3xl font-bold text-foreground">Journal Inc</h1>
            <p className="text-muted-foreground">All your saved entries</p>
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

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-2 flex-1"
              onClick={() => handleExportJournals()}
              disabled={exporting}
            >
              <FileDown className="w-4 h-4" />
              {exporting ? 'Exporting…' : 'Export All'}
            </Button>
            <Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 flex-1">
                  <CalendarRange className="w-4 h-4" />
                  Export by Date
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-sm">
                <DialogHeader>
                  <DialogTitle>Export Date Range</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-2">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1 block">From</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" size="sm" className={cn("w-full justify-start text-left", !exportFrom && "text-muted-foreground")}>
                          {exportFrom ? format(exportFrom, 'MMM d, yyyy') : 'Pick start date'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={exportFrom} onSelect={setExportFrom} className={cn("p-3 pointer-events-auto")} />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1 block">To</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" size="sm" className={cn("w-full justify-start text-left", !exportTo && "text-muted-foreground")}>
                          {exportTo ? format(exportTo, 'MMM d, yyyy') : 'Pick end date'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={exportTo} onSelect={setExportTo} className={cn("p-3 pointer-events-auto")} />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    size="sm"
                    disabled={!exportFrom || !exportTo || exporting}
                    onClick={() => {
                      if (exportFrom && exportTo) {
                        const from = startOfDay(exportFrom);
                        const to = new Date(startOfDay(exportTo));
                        to.setHours(23, 59, 59, 999);
                        handleExportJournals({ from, to });
                      }
                    }}
                  >
                    {exporting ? 'Exporting…' : 'Export Range'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          
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
              {paginatedEntries.map((entry) => {
                const rawSticker = (entry as any).bannerSticker;
                // Guard against corrupted serialized undefined
                const stickerId = typeof rawSticker === 'string' ? rawSticker : null;
                const stickerDef = stickerId
                  ? ALL_STICKERS.find(s => s.id === stickerId)
                  : null;
                const entryBlob = bannerBlobs[entry.id];
                return (
              <Card
                key={entry.id}
                className={cn("shadow-soft hover:shadow-medium transition-shadow cursor-pointer overflow-hidden", getBorderClassName(entry.cardBorder))}
                style={getPatternStyle(entry.cardBackground)}
                onClick={(e: MouseEvent<HTMLDivElement>) => {
                  const target = e.target as HTMLElement | null;
                  // Don't navigate if clicking buttons, popovers, reframes, or dialogs
                  if (target?.closest?.('button:not([data-entry-card])')) return;
                  if (target?.closest?.('[data-reframe-trigger="true"]')) return;
                  if (target?.closest?.('[role="alertdialog"]')) return;
                  if (target?.closest?.('[data-radix-popper-content-wrapper]')) return;
                  if (bgPickerOpen === entry.id) return;
                  navigate(`/unified?edit=${entry.id}`);
                }}
              >
                <CardContent className="p-4 sm:p-6">
                  <div>
                    {/* Photo or sticker floated right */}
                    {entryBlob ? (
                      <div className="w-full h-36 sm:h-44 -mx-4 -mt-4 sm:-mx-6 sm:-mt-6 mb-3 rounded-t-lg overflow-hidden">
                        <BlobImage blob={entryBlob} alt="Journal banner" className="w-full h-full" />
                      </div>
                    ) : stickerDef ? (
                      <div className="float-right -mr-2 -mt-2 ml-3 mb-1">
                        <stickerDef.component size={72} {...(stickerDef.props as any)} />
                      </div>
                    ) : null}

                    {/* Content */}
                    {entry.text && (
                      <div className="bg-muted/30 rounded-lg p-4 mb-3">
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
                      <div className="flex flex-wrap gap-2 mb-3 items-center">
                        <span className="text-sm text-muted-foreground mr-1">Stickers:</span>
                        {entry.stickers.map((stickerId: string, index: number) => {
                          const stickerDef = ALL_STICKERS.find(s => s.id === stickerId);
                          if (stickerDef) {
                            return (
                              <button
                                key={`${stickerId}-${index}`}
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  const updated = [...(entry.stickers || [])];
                                  updated.splice(index, 1);
                                  await updateEntry(entry.id, { stickers: updated });
                                  toast({ title: "Sticker Removed" });
                                }}
                                className="relative group"
                                title="Click to remove"
                              >
                                <stickerDef.component size={36} {...(stickerDef.props as any)} />
                                <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full w-4 h-4 text-[10px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">×</span>
                              </button>
                            );
                          }
                          return (
                            <Badge key={`${stickerId}-${index}`} variant="outline" className="text-base">
                              {stickerId}
                            </Badge>
                          );
                        })}
                      </div>
                    )}

                    {/* Tags */}
                    {entry.tags && entry.tags.filter(t => t !== 'unified').length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {entry.tags.filter(t => t !== 'unified').map((tag, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            #{tag}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-1 mt-2 clear-both">
                      <CardBackgroundPicker
                        entryId={entry.id}
                        currentPattern={entry.cardBackground}
                        currentBorder={entry.cardBorder}
                        open={bgPickerOpen === entry.id}
                        onOpenChange={(open) => setBgPickerOpen(open ? entry.id : null)}
                        onSelectPattern={async (id, patternId) => {
                          await updateEntry(id, { cardBackground: patternId });
                          toast({ title: patternId === 'none' ? "Background Removed" : "Background Applied" });
                        }}
                        onSelectBorder={async (id, borderId) => {
                          await updateEntry(id, { cardBorder: borderId });
                          toast({ title: borderId === 'none' ? "Border Removed" : "Border Applied" });
                        }}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); handleDelete(entry.id); }}
                        className="text-muted-foreground hover:text-destructive ml-auto"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">{entry.updatedAt ? `${format(new Date(entry.createdAt), 'MMM d')} • Updated ${format(new Date(entry.updatedAt), 'h:mm a')}` : format(new Date(entry.createdAt), 'MMM d, yyyy')}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              );
              })}
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

        {/* Delete by Date Range - always visible */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2 w-full text-destructive hover:text-destructive">
              <Trash2 className="w-4 h-4" />
              Delete by Date Range
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Delete Date Range</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">All entries within the selected range will be permanently deleted.</p>
            <div className="space-y-4 py-2">
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">From</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className={cn("w-full justify-start text-left", !deleteFrom && "text-muted-foreground")}>
                      {deleteFrom ? format(deleteFrom, 'MMM d, yyyy') : 'Pick start date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={deleteFrom} onSelect={setDeleteFrom} className={cn("p-3 pointer-events-auto")} />
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">To</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className={cn("w-full justify-start text-left", !deleteTo && "text-muted-foreground")}>
                      {deleteTo ? format(deleteTo, 'MMM d, yyyy') : 'Pick end date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={deleteTo} onSelect={setDeleteTo} className={cn("p-3 pointer-events-auto")} />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            <DialogFooter>
              <Button
                size="sm"
                variant="destructive"
                disabled={!deleteFrom || !deleteTo || deleting}
                onClick={handleDeleteByDateRange}
              >
                {deleting ? 'Deleting…' : 'Delete Range'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}