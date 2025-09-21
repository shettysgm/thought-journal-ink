import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import HandwritingCanvasWithStickers from '@/components/HandwritingCanvasWithStickers';
import { processImage } from '@/lib/ocr';
import { useEntries } from '@/store/useEntries';
import { useToast } from '@/hooks/use-toast';
import SameDayEntryDialog from '@/components/SameDayEntryDialog';
import StickerPicker from '@/components/StickerPicker';

interface StickerPlacement {
  sticker: string;
  x: number;
  y: number;
  id: string;
  isGraphic?: boolean;
  stickerData?: any;
}

export default function HandwritingPage() {
  const [showSameDayDialog, setShowSameDayDialog] = useState(false);
  const [pendingEntry, setPendingEntry] = useState<{ imageBlob: Blob; text?: string } | null>(null);
  const [selectedSticker, setSelectedSticker] = useState<string>('');
  const [selectedStickerData, setSelectedStickerData] = useState<any>(null);
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

  const handleSave = async (imageBlob: Blob, text?: string, stickerPlacements?: StickerPlacement[]) => {
    // Check if there are entries from today
    const todaysEntries = findTodaysEntries();
    
    if (todaysEntries.length > 0) {
      // Store the pending entry and show dialog
      setPendingEntry({ imageBlob, text });
      setShowSameDayDialog(true);
      return;
    }

    // No entries today, create new one
    await createNewEntry(imageBlob, text);
  };

  const createNewEntry = async (imageBlob: Blob, text?: string) => {
    try {
      await createEntry({
        text: text || '',
        hasDrawing: true,
        drawingBlob: imageBlob,
        tags: ['handwriting']
      });

      toast({
        title: "Saved Successfully",
        description: "Your handwriting has been saved and analyzed.",
      });
    } catch (error) {
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

  const handleStickerSelect = (stickerId: string, stickerData?: any) => {
    setSelectedSticker(stickerId);
    setSelectedStickerData(stickerData);
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

        {/* Canvas with Sticker Support */}
        <HandwritingCanvasWithStickers 
          onSave={handleSave} 
          onOCR={handleOCR}
          selectedSticker={selectedSticker}
          selectedStickerData={selectedStickerData}
        />
        
        {/* Sticker Picker for Canvas Placement */}
        <StickerPicker
          onStickerClick={handleStickerSelect}
        />
        
        {/* Same Day Entry Dialog */}
        <SameDayEntryDialog
          isOpen={showSameDayDialog}
          onClose={() => {
            setShowSameDayDialog(false);
            setPendingEntry(null);
          }}
          todaysEntries={findTodaysEntries()}
          onCreateNew={handleCreateNew}
          onAppendTo={appendToExistingEntry}
          newEntryType="handwriting"
        />
        
      </div>
    </div>
  );
}