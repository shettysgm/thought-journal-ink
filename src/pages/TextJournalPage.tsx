import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, X, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useEntries } from '@/store/useEntries';
import { format } from 'date-fns';
import StickerPicker from '@/components/StickerPicker';
import CBTReframeReview, { Detection } from '@/components/CBTReframeReview';
import { detectWithAI } from '@/lib/aiClient';

export default function TextJournalPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { createEntry, updateEntry } = useEntries();
  
  const [text, setText] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [currentTag, setCurrentTag] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  
  // CBT Reframe Review state
  const [showReframeReview, setShowReframeReview] = useState(false);
  const [detections, setDetections] = useState<Detection[]>([]);
  const [savedEntryId, setSavedEntryId] = useState<string | null>(null);
  const [isProcessingReframes, setIsProcessingReframes] = useState(false);

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && currentTag.trim()) {
      e.preventDefault();
      const tag = currentTag.trim().toLowerCase();
      if (!tags.includes(tag)) {
        setTags([...tags, tag]);
      }
      setCurrentTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleInsertSticker = (stickerId: string, stickerData?: any) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    let stickerText = stickerId;
    
    // For graphic stickers, use a placeholder or convert to text representation
    if (stickerData) {
      // Create a text representation for graphic stickers in text mode
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
      stickerText = stickerMap[stickerId] || `[${stickerId}]`;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newText = text.substring(0, start) + stickerText + text.substring(end);
    
    setText(newText);
    
    // Restore cursor position after the inserted sticker
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + stickerText.length, start + stickerText.length);
    }, 0);
  };

  const handleSave = async () => {
    if (!text.trim()) {
      toast({
        title: "Empty Entry",
        description: "Please write something before saving.",
        variant: "destructive"
      });
      return;
    }

    setIsSaving(true);
    try {
      const entryId = await createEntry({
        text: text.trim(),
        tags: [...tags, 'text'],
        hasAudio: false,
        hasDrawing: false
      });

      toast({
        title: "Entry Saved",
        description: "Analyzing for thought patterns..."
      });

      setSavedEntryId(entryId);

      // Try to detect distortions and show reframe review
      try {
        const response = await detectWithAI(text.trim());
        
        // Convert reframes to Detection format
        if (response.reframes && response.reframes.length > 0) {
          const detectionsList: Detection[] = response.reframes.map(r => ({
            span: r.span.slice(0, 100), // Limit span to 100 chars
            type: "Mind Reading" as const, // Default type, can be enhanced later
            reframe: r.suggestion
          }));
          
          setDetections(detectionsList);
          setShowReframeReview(true);
        } else {
          // No reframes found, just navigate
          navigate('/journal');
        }
      } catch (aiError) {
        console.error('AI detection error:', aiError);
        // Still save entry, just skip reframe review
        toast({
          title: "Entry Saved",
          description: "Your entry was saved, but we couldn't analyze it right now."
        });
        navigate('/journal');
      }
    } catch (error) {
      console.error('TextJournalPage save error:', error);
      toast({
        title: "Save Failed",
        description: "Could not save your entry. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAcceptReframe = async (index: number, acceptedText: string) => {
    if (!savedEntryId) return;
    
    setIsProcessingReframes(true);
    try {
      // Get current detections
      const detection = detections[index];
      const reframe = {
        span: detection.span,
        suggestion: acceptedText,
        socratic: detection.type
      };
      
      // Update entry with this reframe
      await updateEntry(savedEntryId, {
        reframes: [reframe]
      });
      
      console.log('Reframe accepted:', reframe);
    } catch (error) {
      console.error('Failed to save reframe:', error);
      toast({
        title: "Save Failed",
        description: "Could not save the reframe.",
        variant: "destructive"
      });
    } finally {
      setIsProcessingReframes(false);
    }
  };

  const handleAcceptAllReframes = async (acceptedItems: { index: number; text: string }[]) => {
    if (!savedEntryId) return;
    
    setIsProcessingReframes(true);
    try {
      const reframes = acceptedItems.map(item => {
        const detection = detections[item.index];
        return {
          span: detection.span,
          suggestion: item.text,
          socratic: detection.type
        };
      });
      
      await updateEntry(savedEntryId, { reframes });
      
      toast({
        title: "Reframes Saved",
        description: "Your thought reframes have been saved."
      });
      
      // Close dialog and navigate
      setShowReframeReview(false);
      navigate('/journal');
    } catch (error) {
      console.error('Failed to save reframes:', error);
      toast({
        title: "Save Failed",
        description: "Could not save the reframes.",
        variant: "destructive"
      });
    } finally {
      setIsProcessingReframes(false);
    }
  };

  const handleDiscard = () => {
    if (text.trim() || tags.length > 0) {
      if (confirm('Are you sure you want to discard this entry?')) {
        navigate('/');
      }
    } else {
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-therapeutic p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header */}
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Text Journal</h1>
              <p className="text-sm text-muted-foreground">
                {format(new Date(), 'EEEE, MMMM d, yyyy • h:mm a')}
              </p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={handleDiscard}
              className="gap-2"
            >
              <X className="w-4 h-4" />
              Discard
            </Button>
            <Button 
              onClick={handleSave}
              disabled={isSaving || !text.trim()}
              className="gap-2"
            >
              <Save className="w-4 h-4" />
              {isSaving ? 'Saving...' : 'Save Entry'}
            </Button>
          </div>
        </header>

        {/* Main Content */}
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-primary" />
              What's on your mind?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            
            {/* Text Input */}
            <div className="space-y-2">
              <Textarea
                ref={textareaRef}
                placeholder="Start typing your thoughts here... Express yourself freely and honestly. This is your safe space. Use the sticker picker below to add emojis inline! 😊"
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="min-h-[300px] resize-none text-base leading-relaxed"
                autoFocus
              />
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>{text.length} characters</span>
                <span>{text.trim().split(/\s+/).filter(word => word.length > 0).length} words</span>
              </div>
            </div>

            {/* Tags Section */}
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Tags (optional)
                </label>
                <Input
                  placeholder="Add a tag and press Enter (e.g., work, anxiety, gratitude)"
                  value={currentTag}
                  onChange={(e) => setCurrentTag(e.target.value)}
                  onKeyDown={handleAddTag}
                  className="w-full"
                />
              </div>
              
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <Badge 
                      key={tag} 
                      variant="secondary" 
                      className="gap-1 cursor-pointer hover:bg-destructive hover:text-destructive-foreground transition-colors"
                      onClick={() => removeTag(tag)}
                    >
                      #{tag}
                      <X className="w-3 h-3" />
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Inline Stickers */}
            <StickerPicker
              onStickerClick={handleInsertSticker}
            />

            {/* Writing Tips */}
            <div className="bg-muted/30 rounded-lg p-4 space-y-2">
              <h4 className="text-sm font-medium text-foreground">💡 Writing Tips:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Write in stream-of-consciousness style - don't worry about grammar</li>
                <li>• Include both positive and challenging thoughts</li>
                <li>• Notice any patterns in your thinking</li>
                <li>• Be compassionate with yourself</li>
              </ul>
            </div>
            
          </CardContent>
        </Card>

        {/* CBT Reframe Review Dialog */}
        <CBTReframeReview
          open={showReframeReview}
          onOpenChange={(open) => {
            setShowReframeReview(open);
            if (!open && savedEntryId) {
              // If user closes without accepting, navigate to journal
              navigate('/journal');
            }
          }}
          detections={detections}
          onAccept={handleAcceptReframe}
          onAcceptAll={handleAcceptAllReframes}
          busy={isProcessingReframes}
        />

      </div>
    </div>
  );
}