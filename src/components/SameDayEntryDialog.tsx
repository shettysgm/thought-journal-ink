import { useState } from 'react';
import { format } from 'date-fns';
import { FileText, Mic, PenTool, Plus, Combine } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { JournalEntry } from '@/types';

interface SameDayEntryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  todaysEntries: JournalEntry[];
  onCreateNew: () => void;
  onAppendTo: (entryId: string) => void;
  newEntryType: string; // 'voice', 'handwriting', 'text'
}

export default function SameDayEntryDialog({
  isOpen,
  onClose,
  todaysEntries,
  onCreateNew,
  onAppendTo,
  newEntryType
}: SameDayEntryDialogProps) {
  const [selectedOption, setSelectedOption] = useState<'new' | string>('new');

  const getEntryIcon = (entry: JournalEntry) => {
    if (entry.hasAudio && entry.hasDrawing) return <div className="flex gap-1"><Mic className="w-3 h-3" /><PenTool className="w-3 h-3" /></div>;
    if (entry.hasAudio) return <Mic className="w-3 h-3" />;
    if (entry.hasDrawing) return <PenTool className="w-3 h-3" />;
    return <FileText className="w-3 h-3" />;
  };

  const getEntryTypes = (entry: JournalEntry) => {
    const types = [];
    if (entry.hasAudio) types.push('Voice');
    if (entry.hasDrawing) types.push('Handwriting');
    if (!entry.hasAudio && !entry.hasDrawing) types.push('Text');
    return types;
  };

  const handleConfirm = () => {
    if (selectedOption === 'new') {
      onCreateNew();
    } else {
      onAppendTo(selectedOption);
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Add to Today's Journal
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            You already have {todaysEntries.length} entry{todaysEntries.length > 1 ? 'ies' : ''} from today. 
            Would you like to add your {newEntryType} content to an existing entry or create a new one?
          </p>

          <RadioGroup value={selectedOption} onValueChange={setSelectedOption}>
            {/* Create New Entry Option */}
            <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer">
              <RadioGroupItem value="new" id="new" />
              <Label htmlFor="new" className="flex items-center gap-2 cursor-pointer flex-1">
                <Plus className="w-4 h-4" />
                <div>
                  <div className="font-medium">Create new entry</div>
                  <div className="text-xs text-muted-foreground">Start a separate journal entry</div>
                </div>
              </Label>
            </div>

            {/* Append to Existing Options */}
            {todaysEntries.map((entry) => (
              <div key={entry.id} className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer">
                <RadioGroupItem value={entry.id} id={entry.id} />
                <Label htmlFor={entry.id} className="flex items-center gap-2 cursor-pointer flex-1">
                  <Combine className="w-4 h-4" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {getEntryIcon(entry)}
                      <div className="flex gap-1">
                        {getEntryTypes(entry).map((type, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {type}
                          </Badge>
                        ))}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(entry.createdAt), 'h:mm a')}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Add to this entry • {entry.text ? `${entry.text.substring(0, 60)}${entry.text.length > 60 ? '...' : ''}` : 'No text content'}
                    </div>
                  </div>
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleConfirm}>
            {selectedOption === 'new' ? 'Create New Entry' : 'Add to Entry'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}