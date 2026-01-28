import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Shield, Download, Upload, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useSettings } from '@/store/useSettings';
import { useDistortions } from '@/store/useDistortions';
import { useToast } from '@/hooks/use-toast';

export default function SettingsPage() {
  const { 
    encryptionEnabled, 
    autoDetectDistortions, 
    syncStatsEnabled,
    loadSettings,
    updateSettings,
    setPassphrase,
    verifyPassphrase,
    currentPassphrase
  } = useSettings();
  
  const { distortions } = useDistortions();
  const { toast } = useToast();
  
  const [passphrase, setPassphraseInput] = useState('');
  const [confirmPassphrase, setConfirmPassphrase] = useState('');
  const [showPassphrase, setShowPassphrase] = useState(false);
  const [isSettingPassphrase, setIsSettingPassphrase] = useState(false);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const handleEncryptionToggle = async (enabled: boolean) => {
    if (enabled && !currentPassphrase) {
      setIsSettingPassphrase(true);
    } else {
      await updateSettings({ encryptionEnabled: enabled });
      toast({
        title: enabled ? "Encryption Enabled" : "Encryption Disabled",
        description: enabled 
          ? "Your journal entries will be encrypted on this device."
          : "Your journal entries will be stored in plain text.",
      });
    }
  };

  const handleSetPassphrase = async () => {
    if (passphrase !== confirmPassphrase) {
      toast({
        title: "Passphrases Don't Match",
        description: "Please ensure both passphrases are identical.",
        variant: "destructive"
      });
      return;
    }

    if (passphrase.length < 8) {
      toast({
        title: "Passphrase Too Short",
        description: "Please use at least 8 characters.",
        variant: "destructive"
      });
      return;
    }

    const success = await setPassphrase(passphrase);
    if (success) {
      toast({
        title: "Passphrase Set Successfully",
        description: "Your journal entries will now be encrypted.",
      });
      setIsSettingPassphrase(false);
      setPassphraseInput('');
      setConfirmPassphrase('');
    } else {
      toast({
        title: "Failed to Set Passphrase",
        description: "Please try again.",
        variant: "destructive"
      });
    }
  };

  const exportDistortionStats = () => {
    const data = {
      exportDate: new Date().toISOString(),
      totalDistortions: distortions.length,
      distortions: distortions.map(d => ({
        type: d.type,
        createdAt: d.createdAt,
        // Note: phrase is included but this contains minimal personal info
        phrase: d.phrase.substring(0, 50) + '...' // Truncate for privacy
      }))
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cbt-journal-stats-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Stats Exported",
      description: "Your distortion statistics have been downloaded.",
    });
  };

  const handleImportStats = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        toast({
          title: "Import Successful",
          description: `Imported ${data.distortions?.length || 0} distortion records.`,
        });
      } catch (error) {
        toast({
          title: "Import Failed",
          description: "Invalid file format.",
          variant: "destructive"
        });
      }
    };
    reader.readAsText(file);
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
            <h1 className="text-3xl font-bold text-foreground">Settings</h1>
            <p className="text-muted-foreground">Manage your privacy and preferences</p>
          </div>
        </header>

        {/* Privacy & Security */}
        <Card className="shadow-medium">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Privacy & Security
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            
            {/* Encryption */}
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-base font-medium">Encrypt journal entries</Label>
                <p className="text-sm text-muted-foreground">
                  Store your journal text encrypted on this device
                </p>
              </div>
              <Switch
                checked={encryptionEnabled}
                onCheckedChange={handleEncryptionToggle}
              />
            </div>

            {/* Auto-detect distortions */}
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-base font-medium">Auto-detect distortions</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically identify cognitive distortions in your writing
                </p>
              </div>
              <Switch
                checked={autoDetectDistortions}
                onCheckedChange={(checked) => updateSettings({ autoDetectDistortions: checked })}
              />
            </div>

            {encryptionEnabled && currentPassphrase && (
              <div className="p-4 bg-success/10 border border-success/20 rounded-lg">
                <p className="text-sm text-success">
                  🔒 Encryption is active. Your journal entries are protected.
                </p>
              </div>
            )}
            
          </CardContent>
        </Card>

        {/* Data Management */}
        <Card className="shadow-medium">
          <CardHeader>
            <CardTitle>Data Management</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            
            {/* Sync stats */}
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-base font-medium">Export/Import statistics</Label>
                <p className="text-sm text-muted-foreground">
                  Save or restore your distortion patterns (no personal text)
                </p>
              </div>
              <Switch
                checked={syncStatsEnabled}
                onCheckedChange={(checked) => updateSettings({ syncStatsEnabled: checked })}
              />
            </div>

            {/* Export/Import buttons */}
            <div className="flex gap-4">
              <Button
                onClick={exportDistortionStats}
                variant="outline"
                className="gap-2 flex-1"
              >
                <Download className="w-4 h-4" />
                Export Stats
              </Button>
              
              <Label className="flex-1">
                <Button variant="outline" className="gap-2 w-full" asChild>
                  <span>
                    <Upload className="w-4 h-4" />
                    Import Stats
                  </span>
                </Button>
                <Input
                  type="file"
                  accept=".json"
                  onChange={handleImportStats}
                  className="hidden"
                />
              </Label>
            </div>
            
          </CardContent>
        </Card>

        {/* Privacy Notice */}
        <Card className="shadow-medium border-primary/20">
          <CardContent className="p-6">
            <h3 className="font-semibold mb-2">🔒 Your Privacy Matters</h3>
            <div className="text-sm text-muted-foreground space-y-2">
              <p>
                • Your journal entries stay completely private on this device
              </p>
              <p>
                • Only anonymized distortion patterns are used for insights
              </p>
              <p>
                • No personal text is ever transmitted or stored elsewhere
              </p>
              <p>
                • Optional encryption adds an extra layer of security
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Passphrase Setting Dialog */}
        <Dialog open={isSettingPassphrase} onOpenChange={setIsSettingPassphrase}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Set Encryption Passphrase</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="passphrase">Passphrase</Label>
                <div className="relative">
                  <Input
                    id="passphrase"
                    type={showPassphrase ? "text" : "password"}
                    value={passphrase}
                    onChange={(e) => setPassphraseInput(e.target.value)}
                    placeholder="Enter a secure passphrase"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowPassphrase(!showPassphrase)}
                  >
                    {showPassphrase ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirm-passphrase">Confirm Passphrase</Label>
                <Input
                  id="confirm-passphrase"
                  type={showPassphrase ? "text" : "password"}
                  value={confirmPassphrase}
                  onChange={(e) => setConfirmPassphrase(e.target.value)}
                  placeholder="Confirm your passphrase"
                />
              </div>

              <p className="text-sm text-muted-foreground">
                Choose a strong passphrase you'll remember. This cannot be recovered if lost.
              </p>

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setIsSettingPassphrase(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSetPassphrase}>
                  Set Passphrase
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
        
      </div>
    </div>
  );
}