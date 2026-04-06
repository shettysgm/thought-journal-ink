import { useState, useEffect, useMemo } from 'react';
import { subDays, isAfter, startOfDay, format, isSameDay } from 'date-fns';
import { Link, useNavigate } from 'react-router-dom';
import { FileText, Mic, Search, Trash2, FileDown, CalendarRange, ChevronLeft, Info, X } from 'lucide-react';
import { TEMPLATE_CONFIG } from '@/config/templates';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { useEntries } from '@/store/useEntries';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { awaitPendingSave } from '@/lib/pendingSave';
import { exportJournalsToFile } from '@/lib/exportJournals';
import { ALL_STICKERS } from '@/components/KawaiiStickers';
import TextWithStickers from '@/components/TextWithStickers';
import { GRID_PATTERNS } from '@/components/HeaderCustomizer';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { getPatternStyle, getBorderClassName } from '@/components/CardBackgroundPicker';

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

export default function CalendarPage() {
  const { entries, loading, loadEntries, deleteEntry, updateEntry } = useEntries();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedEntries, setExpandedEntries] = useState<Set<string>>(new Set());
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [bannerBlobs, setBannerBlobs] = useState<Record<string, Blob[]>>({});
  const [exporting, setExporting] = useState(false);
  
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [exportFrom, setExportFrom] = useState<Date | undefined>(undefined);
  const [exportTo, setExportTo] = useState<Date | undefined>(undefined);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteFrom, setDeleteFrom] = useState<Date | undefined>(undefined);
  const [deleteTo, setDeleteTo] = useState<Date | undefined>(undefined);
  const [deleting, setDeleting] = useState(false);
  const entriesPerPage = 10;
  const [welcomeDismissed, setWelcomeDismissed] = useState(() => localStorage.getItem('calendar_welcome_dismissed') === 'true');

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
    awaitPendingSave().then(() => loadEntries()).then(async () => {
      const state = useEntries.getState();
      try {
        const { getJournalEntry } = await import('@/lib/idb');
        const blobs: Record<string, Blob[]> = {};
        for (const entry of state.entries) {
          const raw = await getJournalEntry(entry.id) as any;
          if (raw?.bannerBlobs && Array.isArray(raw.bannerBlobs)) {
            blobs[entry.id] = raw.bannerBlobs;
          } else if (raw?.bannerBlob && raw.bannerBlob instanceof Blob) {
            blobs[entry.id] = [raw.bannerBlob];
          }
        }
        setBannerBlobs(blobs);
      } catch (e) {
        console.error('Failed to load banner blobs:', e);
      }
    });
  }, [loadEntries]);

  useEffect(() => {
    const handleVisibilityChange = () => { if (!document.hidden) loadEntries(); };
    const handleFocus = () => { loadEntries(); };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [loadEntries]);

  const datesWithEntries = useMemo(() => {
    const dates = new Set<string>();
    entries.filter(e => !e.hasDrawing).forEach(e => {
      dates.add(format(startOfDay(new Date(e.createdAt)), 'yyyy-MM-dd'));
    });
    return dates;
  }, [entries]);

  const filteredEntries = entries
    .filter(entry => !entry.hasDrawing)
    .filter(entry => {
      if (selectedDate) return isSameDay(new Date(entry.createdAt), selectedDate);
      const threeDaysAgo = startOfDay(subDays(new Date(), 2));
      return isAfter(new Date(entry.createdAt), threeDaysAgo);
    })
    .filter(entry => {
      if (!searchTerm.trim()) return true;
      return entry.text?.toLowerCase().includes(searchTerm.toLowerCase()) ||
             entry.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    });

  const totalPages = Math.ceil(filteredEntries.length / entriesPerPage);
  const startIndex = (currentPage - 1) * entriesPerPage;
  const endIndex = startIndex + entriesPerPage;
  const paginatedEntries = filteredEntries
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(startIndex, endIndex);

  useEffect(() => { setCurrentPage(1); }, [searchTerm, selectedDate]);

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this entry?')) {
      try {
        await deleteEntry(id);
        toast({ title: "Entry Deleted", description: "Your journal entry has been removed." });
      } catch {
        toast({ title: "Delete Failed", description: "Could not delete the entry.", variant: "destructive" });
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
      for (const entry of toDelete) await deleteEntry(entry.id);
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
    if (newExpanded.has(entryId)) newExpanded.delete(entryId);
    else newExpanded.add(entryId);
    setExpandedEntries(newExpanded);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4" style={{ paddingTop: 'max(1rem, env(safe-area-inset-top))' }}>
        <div className="max-w-lg mx-auto text-center">Loading entries...</div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-background px-4 pb-6"
      style={{
        paddingTop: 'max(3.5rem, calc(env(safe-area-inset-top, 20px) + 1rem))',
        paddingBottom: 'max(1.5rem, calc(env(safe-area-inset-bottom, 0px) + 1rem))'
      }}
    >
      <div className="max-w-lg mx-auto space-y-5">
        {/* Header */}
        <header className="flex items-center gap-3 mt-2">
          <Button variant="ghost" size="icon" className="shrink-0" onClick={() => navigate('/journal')}>
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-lg font-semibold text-foreground">Calendar</h1>
            <p className="text-xs text-muted-foreground">Browse entries by date</p>
          </div>
        </header>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search entries..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10 h-10 rounded-xl" />
        </div>

        {/* Welcome notice */}
        {!welcomeDismissed && (
          <div className="flex items-start gap-3 p-3 rounded-xl bg-accent/10 border border-accent/20">
            <Info className="w-4 h-4 text-accent-foreground mt-0.5 shrink-0" />
            <p className="text-xs text-muted-foreground flex-1">
              Deleting or reinstalling the app will permanently remove all journal entries. Always export your entries from Settings before deleting the app.
            </p>
            <button
              onClick={() => {
                setWelcomeDismissed(true);
                localStorage.setItem('calendar_welcome_dismissed', 'true');
              }}
              className="shrink-0 text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Calendar */}
        <Card className="shadow-soft">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center justify-between">
              <span>Select a Date</span>
              {selectedDate && (
                <Button variant="ghost" size="sm" onClick={() => setSelectedDate(undefined)} className="text-xs h-7">Clear</Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center pb-4">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              className={cn("pointer-events-auto")}
              modifiers={{
                hasEntry: (date) => datesWithEntries.has(format(startOfDay(date), 'yyyy-MM-dd'))
              }}
              modifiersClassNames={{
                hasEntry: "bg-primary/10 font-bold text-primary"
              }}
            />
          </CardContent>
        </Card>

        {/* Export buttons */}
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-2 flex-1" onClick={() => handleExportJournals()} disabled={exporting}>
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
              <DialogHeader><DialogTitle>Export Date Range</DialogTitle></DialogHeader>
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
                <Button size="sm" disabled={!exportFrom || !exportTo || exporting} onClick={() => {
                  if (exportFrom && exportTo) {
                    const from = startOfDay(exportFrom);
                    const to = new Date(startOfDay(exportTo));
                    to.setHours(23, 59, 59, 999);
                    handleExportJournals({ from, to });
                  }
                }}>
                  {exporting ? 'Exporting…' : 'Export Range'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {filteredEntries.length > 0 && (
          <p className="text-xs text-muted-foreground">
            Showing {startIndex + 1}-{Math.min(endIndex, filteredEntries.length)} of {filteredEntries.length} entries
            {selectedDate && ` on ${format(selectedDate, 'MMM d, yyyy')}`}
            {searchTerm && ` matching "${searchTerm}"`}
          </p>
        )}

        {/* Entries */}
        {filteredEntries.length === 0 ? (
          <Card className="shadow-soft">
            <CardContent className="p-8 text-center">
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <h3 className="text-base font-semibold mb-1">{entries.length === 0 ? 'No Entries Yet' : 'No Matching Entries'}</h3>
              <p className="text-sm text-muted-foreground">
                {entries.length === 0 ? 'Start journaling to see your entries here.' : 'Try adjusting your search or date.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
             {paginatedEntries.map(entry => {
              const rawSticker = (entry as any).bannerSticker;
              const stickerId = typeof rawSticker === 'string' ? rawSticker : null;
              const stickerDef = stickerId ? ALL_STICKERS.find(s => s.id === stickerId) : null;
              const entryBlobs = bannerBlobs[entry.id] || [];
              const entryTemplate = entry.templateId ? TEMPLATE_CONFIG[entry.templateId] : null;
              const headerColor = typeof (entry as any).headerColor === 'string'
                ? (entry as any).headerColor
                : 'hsl(0 0% 100%)';
              const headerPattern = typeof (entry as any).headerPattern === 'string'
                ? (entry as any).headerPattern
                : 'dots';
              const headerStickerIds = Array.isArray((entry as any).headerStickers)
                ? (entry as any).headerStickers
                : [];
              const customHeaderSticker = headerStickerIds.length > 0
                ? ALL_STICKERS.find(s => s.id === headerStickerIds[0])
                : null;
              return (
                <Card
                  key={entry.id}
                  className={cn(
                    "shadow-soft hover:shadow-medium transition-shadow cursor-pointer overflow-visible",
                    getBorderClassName(entry.cardBorder),
                    !entryTemplate && stickerDef && !entryBlobs.length && "mt-8"
                  )}
                  style={getPatternStyle(entry.cardBackground)}
                  onClick={() => navigate(`/unified?edit=${entry.id}`)}
                >
                  {/* Template header - matches editor style */}
                  {entryTemplate && (
                    <div
                      className="relative rounded-t-xl overflow-hidden"
                      style={{
                        backgroundColor: headerColor,
                        ...(GRID_PATTERNS.find(pattern => pattern.id === headerPattern)?.style || {}),
                      }}
                    >
                      {customHeaderSticker ? (
                        <div className="absolute -left-5 bottom-2 pointer-events-none drop-shadow-md">
                          <customHeaderSticker.component size={72} {...(customHeaderSticker.props as any)} />
                        </div>
                      ) : (
                        entryTemplate.stickers.slice(0, 1).map((sticker, index) => (
                          <div key={index} className="absolute -left-5 bottom-2 pointer-events-none drop-shadow-md">
                            <img src={sticker.src} alt="" className="w-[72px] h-[72px] object-contain" />
                          </div>
                        ))
                      )}
                      <div className="relative z-10 text-center px-8 pt-5 pb-2">
                        <h2 className="text-sm font-bold text-foreground tracking-tight">
                          {entryTemplate.title}
                        </h2>
                        <p className="text-[10px] text-muted-foreground font-medium mt-0.5">{entryTemplate.subtitle}</p>
                      </div>
                      {entryTemplate.prompts.length > 0 && (
                        <div className="relative z-10 flex flex-col items-start gap-1 pl-8 pr-4 pb-3">
                          {entryTemplate.prompts.slice(0, 2).map((prompt, i) => (
                            <span
                              key={i}
                              className="inline-flex items-center gap-1.5 text-[10px] px-2.5 py-1 rounded-lg border border-border/40 font-medium text-foreground/70"
                              style={{ backgroundColor: 'hsl(0 0% 100% / 0.9)' }}
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-primary/40 shrink-0" />
                              {prompt}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Banner sticker peeking from header edge */}
                  {stickerDef && !entryBlobs.length && (
                    <div className="relative h-6">
                      <div className="absolute left-1/2 -translate-x-1/2 -top-6 pointer-events-none drop-shadow-lg z-10">
                        <stickerDef.component size={52} {...(stickerDef.props as any)} />
                      </div>
                    </div>
                  )}
                  <CardContent className="p-4">
                    {entry.text && (
                      <div className="bg-muted/30 rounded-lg p-3 mb-3">
                        <TextWithStickers
                          text={entry.text.length > 300 && !expandedEntries.has(entry.id) ? entry.text.substring(0, 300) + '…' : entry.text}
                          className="text-foreground text-sm leading-relaxed"
                        />
                        {entry.text.length > 300 && (
                          <Button variant="ghost" size="sm" onClick={e => { e.stopPropagation(); toggleExpanded(entry.id); }} className="mt-1 p-0 h-auto text-primary text-xs">
                            {expandedEntries.has(entry.id) ? "Show less" : "Show more"}
                          </Button>
                        )}
                      </div>
                    )}

                    {entryBlobs.length > 0 && (
                      <div className="w-full mb-3 overflow-hidden rounded-lg">
                        {entryBlobs.length === 1 ? (
                          <div className="h-36">
                            <BlobImage blob={entryBlobs[0]} alt="Journal banner" className="w-full h-full" />
                          </div>
                        ) : entryBlobs.length === 2 ? (
                          <div className="grid grid-cols-2 gap-0.5 h-36">
                            {entryBlobs.map((blob, i) => (
                              <div key={i} className="overflow-hidden min-h-0">
                                <BlobImage blob={blob} alt={`Photo ${i + 1}`} className="w-full h-full" />
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 grid-rows-2 gap-0.5 h-44">
                            <div className="row-span-2 overflow-hidden min-h-0">
                              <BlobImage blob={entryBlobs[0]} alt="Photo 1" className="w-full h-full" />
                            </div>
                            <div className="overflow-hidden min-h-0">
                              <BlobImage blob={entryBlobs[1]} alt="Photo 2" className="w-full h-full" />
                            </div>
                            <div className="overflow-hidden min-h-0 relative">
                              <BlobImage blob={entryBlobs[2]} alt="Photo 3" className="w-full h-full" />
                              {entryBlobs.length > 3 && (
                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                  <span className="text-white font-semibold text-sm">+{entryBlobs.length - 3}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}


                    {entry.tags && entry.tags.filter(t => t !== 'unified').length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {entry.tags.filter(t => t !== 'unified').map((tag, i) => (
                          <Badge key={i} variant="outline" className="text-[10px]">#{tag}</Badge>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center gap-1 mt-2 clear-both">
                      <Button variant="ghost" size="sm" onClick={e => { e.stopPropagation(); handleDelete(entry.id); }} className="text-muted-foreground hover:text-destructive ml-auto">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                      <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                        {entry.updatedAt ? `${format(new Date(entry.createdAt), 'MMM d')} • Updated ${format(new Date(entry.updatedAt), 'h:mm a')}` : format(new Date(entry.createdAt), 'MMM d, yyyy')}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {totalPages > 1 && (
              <div className="flex items-center justify-between">
                <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1}>Previous</Button>
                <span className="text-xs text-muted-foreground">Page {currentPage} of {totalPages}</span>
                <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages}>Next</Button>
              </div>
            )}
          </div>
        )}

        {/* Delete by range */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2 w-full text-destructive hover:text-destructive">
              <Trash2 className="w-4 h-4" />Delete by Date Range
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-sm">
            <DialogHeader><DialogTitle>Delete Date Range</DialogTitle></DialogHeader>
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
              <Button size="sm" variant="destructive" disabled={!deleteFrom || !deleteTo || deleting} onClick={handleDeleteByDateRange}>
                {deleting ? 'Deleting…' : 'Delete Range'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}