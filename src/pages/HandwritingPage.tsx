import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { HandwritingCanvas } from '@/components/HandwritingCanvas';
import { processImage } from '@/lib/ocr';
import { useEntries } from '@/store/useEntries';
import { useToast } from '@/hooks/use-toast';
import SameDayEntryDialog from '@/components/SameDayEntryDialog';

export default function HandwritingPage() {
  const [showSameDayDialog, setShowSameDayDialog] = useState(false);
  const [pendingEntry, setPendingEntry] = useState<{ imageBlob: Blob; text?: string } | null>(null);
  const { createEntry, appendToEntry, findTodaysEntries } = useEntries();
  const { toast } = useToast();

  const handleOCR = async (imageBlob: Blob): Promise<string> => {
    try {
      return await processImage(imageBlob);
    } catch (error) {
      toast({
        title: "OCR Failed",
        description: "Could not process the image. Please try again.",
        variant: "destructive"
      });
      throw error;
    }
  };

  const handleSave = async (imageBlob: Blob, text?: string) => {
    // Check if there are recent entries (last 3 days)
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    
    const recentEntries = findTodaysEntries().concat(
      // Get entries from last 3 days (excluding today)
      useEntries.getState().entries.filter(entry => {
        const entryDate = new Date(entry.createdAt);
        return entryDate >= threeDaysAgo && entryDate < startOfToday;
      })
    );
    
    if (recentEntries.length > 0) {
      // Store the pending entry and show dialog
      setPendingEntry({ imageBlob, text });
      setShowSameDayDialog(true);
      return;
    }

    // No recent entries, create new one
    await createNewEntry(imageBlob, text);
  };

  const createNewEntry = async (imageBlob: Blob, text?: string) => {
    try {
      const entryId = await createEntry({
        text: text || '',
        hasDrawing: true,
        drawingBlob: imageBlob,
        tags: ['handwriting']
      });

      toast({
        title: "Saved Successfully",
        description: "Analyzing handwriting for CBT patterns...",
      });
      
      // Show follow-up toast after brief delay
      setTimeout(() => {
        toast({
          title: "Analysis Complete",
          description: "Check Journal to see CBT highlights on your entry.",
        });
      }, 3000);
    } catch (error) {
      console.error('HandwritingPage save error:', error);
      toast({
        title: "Save Failed", 
        description: "Could not save your entry. Please try again.",
        variant: "destructive"
      });
    }
  };

  const appendToExistingEntry = async (existingId: string) => {
    if (!pendingEntry) return;
    
    try {
      await appendToEntry(existingId, {
        text: pendingEntry.text || '',
        hasDrawing: true,
        drawingBlob: pendingEntry.imageBlob,
        tags: ['handwriting']
      });

      toast({
        title: "Added Successfully", 
        description: "Your handwriting has been added to the existing entry.",
      });
      
      setPendingEntry(null);
    } catch (error) {
      toast({
        title: "Save Failed",
        description: "Could not add to the existing entry. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleCreateNew = async () => {
    if (!pendingEntry) return;
    await createNewEntry(pendingEntry.imageBlob, pendingEntry.text);
    setPendingEntry(null);
  };

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
          <div>
            <h1 className="text-3xl font-bold text-foreground">Handwriting Journal</h1>
            <p className="text-muted-foreground">Write naturally with your finger or Apple Pencil</p>
          </div>
        </header>

        <HandwritingCanvas onSave={handleSave} onOCR={handleOCR} />
        
        {/* Recent Entry Dialog */}
        <SameDayEntryDialog
          isOpen={showSameDayDialog}
          onClose={() => {
            setShowSameDayDialog(false);
            setPendingEntry(null);
          }}
          todaysEntries={(() => {
            const threeDaysAgo = new Date();
            threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
            
            const startOfToday = new Date();
            startOfToday.setHours(0, 0, 0, 0);
            
            const todaysEntries = findTodaysEntries();
            const recentEntries = useEntries.getState().entries.filter(entry => {
              const entryDate = new Date(entry.createdAt);
              return entryDate >= threeDaysAgo && entryDate < startOfToday;
            });
            
            return [...todaysEntries, ...recentEntries].slice(0, 5); // Show max 5 recent entries
          })()}
          onCreateNew={handleCreateNew}
          onAppendTo={appendToExistingEntry}
          newEntryType="handwriting"
        />
        
      </div>
    </div>
  );
}