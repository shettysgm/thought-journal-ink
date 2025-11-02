import { useState, useEffect } from 'react';
import { format, isToday } from 'date-fns';
import { FileText, Mic, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useEntries } from '@/store/useEntries';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/use-mobile';

type JournalSidebarProps = {
  currentEntryId?: string | null;
  onSelectEntry: (entryId: string) => void;
  onNewEntry: () => void;
  filterType?: 'text' | 'voice' | 'all';
};

export function JournalSidebar({ 
  currentEntryId, 
  onSelectEntry, 
  onNewEntry,
  filterType = 'all' 
}: JournalSidebarProps) {
  const { entries, loadEntries } = useEntries();
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  const filteredEntries = entries.filter(entry => {
    if (filterType === 'all') return true;
    return entry.tags?.includes(filterType);
  }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const handleSelectEntry = (entryId: string) => {
    onSelectEntry(entryId);
    if (isMobile) setOpen(false);
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Journal Entries</h2>
          {isMobile && (
            <Button variant="ghost" size="icon" onClick={() => setOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        <Button onClick={onNewEntry} className="w-full" size="sm">
          <Plus className="h-4 w-4 mr-2" />
          New Entry
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-2">
          {filteredEntries.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No entries yet
            </div>
          ) : (
            filteredEntries.map((entry) => {
              const entryDate = new Date(entry.createdAt);
              const isVoice = entry.tags?.includes('voice');
              const isText = entry.tags?.includes('text');
              const preview = entry.text?.slice(0, 80) || 'Empty entry';
              const isActive = currentEntryId === entry.id;

              return (
                <button
                  key={entry.id}
                  onClick={() => handleSelectEntry(entry.id)}
                  className={cn(
                    "w-full text-left p-3 rounded-lg border transition-colors",
                    isActive 
                      ? "bg-primary/10 border-primary" 
                      : "bg-card hover:bg-accent border-transparent"
                  )}
                >
                  <div className="flex items-start gap-2">
                    <div className="mt-0.5">
                      {isVoice ? (
                        <Mic className="h-4 w-4 text-primary" />
                      ) : (
                        <FileText className="h-4 w-4 text-primary" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium">
                          {isToday(entryDate) 
                            ? 'Today' 
                            : format(entryDate, 'MMM d, yyyy')}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {format(entryDate, 'h:mm a')}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {preview}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </ScrollArea>
    </div>
  );

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button 
            variant="outline" 
            size="sm" 
            className="fixed bottom-20 right-4 z-50 shadow-lg"
          >
            <FileText className="h-4 w-4 mr-2" />
            Entries
          </Button>
        </SheetTrigger>
        <SheetContent side="bottom" className="h-[80vh]">
          <SidebarContent />
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <div className="w-80 border-r bg-card">
      <SidebarContent />
    </div>
  );
}
