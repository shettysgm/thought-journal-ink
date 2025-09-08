import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { HandwritingCanvas } from '@/components/HandwritingCanvas';
import { processImage } from '@/lib/ocr';
import { useEntries } from '@/store/useEntries';
import { useToast } from '@/hooks/use-toast';

export default function HandwritingPage() {
  const { createEntry } = useEntries();
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
        
      </div>
    </div>
  );
}