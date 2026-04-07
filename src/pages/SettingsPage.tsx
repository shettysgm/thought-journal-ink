import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Shield, Download, Upload, Eye, EyeOff, Brain, Lock, FileDown, HardDrive, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useSettings } from '@/store/useSettings';
import { useDistortions } from '@/store/useDistortions';
import { useToast } from '@/hooks/use-toast';
import { exportJournalsToFile } from '@/lib/exportJournals';
import { useEntries } from '@/store/useEntries';
import { Progress } from '@/components/ui/progress';

export default function SettingsPage() {
  const { 
    encryptionEnabled, 
    autoDetectDistortions, 
    syncStatsEnabled,
    aiAnalysisEnabled,
    appLockEnabled,
    reminderTime,
    loadSettings,
    updateSettings,
    setPassphrase,
    verifyPassphrase,
    currentPassphrase,
    setAppLock,
    removeAppLock,
  } = useSettings();
  
  const { distortions } = useDistortions();
  const { toast } = useToast();
  const { entries, loadEntries } = useEntries();
  
  const [passphrase, setPassphraseInput] = useState('');
  const [confirmPassphrase, setConfirmPassphrase] = useState('');
  const [showPassphrase, setShowPassphrase] = useState(false);
  const [isSettingPassphrase, setIsSettingPassphrase] = useState(false);
  const [lockPin, setLockPin] = useState('');
  const [confirmLockPin, setConfirmLockPin] = useState('');
  const [isSettingLock, setIsSettingLock] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [storageUsage, setStorageUsage] = useState<{ used: number; quota: number } | null>(null);

  const loadStorageUsage = useCallback(async () => {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      try {
        const est = await navigator.storage.estimate();
        setStorageUsage({ used: est.usage || 0, quota: est.quota || 0 });
      } catch {
        // Not available
      }
    }
  }, []);

  useEffect(() => {
    loadSettings();
    loadStorageUsage();
  }, [loadSettings, loadStorageUsage]);

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

  const handleExportJournals = async () => {
    setExporting(true);
    try {
      await exportJournalsToFile();
      toast({
        title: "Journals Exported",
        description: "Your journal entries are ready to save to Files or iCloud Drive.",
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Could not export journal entries.",
        variant: "destructive",
      });
    } finally {
      setExporting(false);
    }
  };

  return (
    <div 
      className="min-h-screen bg-white dark:bg-background px-5 pb-24"
      style={{ 
        paddingTop: 'max(3.5rem, calc(env(safe-area-inset-top, 20px) + 1.5rem))',
        paddingBottom: 'max(6rem, calc(env(safe-area-inset-bottom, 0px) + 6rem))',
      }}
    >
      <div className="max-w-lg mx-auto space-y-5">
        
        {/* Header */}
        <header className="mt-1">
            <h1 className="text-lg font-semibold text-foreground">Settings</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Manage your privacy and preferences</p>
        </header>

        {/* Storage Usage */}
        {storageUsage && (
          <Card className="rounded-2xl border border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <HardDrive className="w-4 h-4" />
                Device Storage
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Progress value={(storageUsage.used / storageUsage.quota) * 100} className="h-2" />
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>{(storageUsage.used / 1024 / 1024).toFixed(1)} MB used</span>
                <span>{(storageUsage.quota / 1024 / 1024).toFixed(0)} MB available</span>
              </div>
              {storageUsage.used / storageUsage.quota > 0.7 && (
                <p className="text-xs text-destructive">
                  ⚠️ Storage is getting full. Consider exporting and deleting old entries with photos.
                </p>
              )}
            </CardContent>
          </Card>
        )}

        <Card className="rounded-2xl border border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Shield className="w-5 h-5" />
              Privacy & Security
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            
            {/* Encryption */}
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-sm font-medium">Encrypt journal entries</Label>
                <p className="text-sm text-muted-foreground">
                  Store your journal text encrypted on this device
                </p>
              </div>
              <Switch
                checked={encryptionEnabled}
                onCheckedChange={handleEncryptionToggle}
              />
            </div>

            {/* App Lock */}
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  App Lock
                </Label>
                <p className="text-sm text-muted-foreground">
                  Require a 4-digit PIN to open the app
                </p>
              </div>
              <Switch
                checked={appLockEnabled}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setIsSettingLock(true);
                  } else {
                    removeAppLock();
                    toast({ title: "App Lock Disabled", description: "The app is now accessible without a PIN." });
                  }
                }}
              />
            </div>

            {appLockEnabled && (
              <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg">
                <p className="text-sm text-primary">
                  🔐 App lock is active. If you forget your PIN, a 24-hour countdown will reset it.
                </p>
              </div>
            )}

            {/* AI Analysis Toggle */}
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Brain className="w-4 h-4" />
                  AI Analysis
                </Label>
                <p className="text-sm text-muted-foreground">
                  Send entries to Google Gemini AI for cognitive distortion detection
                </p>
              </div>
              <Switch
                checked={aiAnalysisEnabled}
                onCheckedChange={(checked) => {
                  updateSettings({ aiAnalysisEnabled: checked });
                  toast({
                    title: checked ? "AI Analysis Enabled" : "AI Analysis Disabled",
                    description: checked 
                      ? "Your entries will be analyzed for cognitive distortions."
                      : "AI analysis is now off. Your entries stay completely local.",
                  });
                }}
              />
            </div>

            {!aiAnalysisEnabled && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm text-amber-800">
                  ⚠️ AI analysis is disabled. Cognitive distortion detection will not work.
                </p>
              </div>
            )}

            {/* Auto-detect distortions */}
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-sm font-medium">Auto-detect distortions</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically identify cognitive distortions as you write
                </p>
              </div>
              <Switch
                checked={autoDetectDistortions}
                onCheckedChange={(checked) => updateSettings({ autoDetectDistortions: checked })}
                disabled={!aiAnalysisEnabled}
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

        {/* Daily Reminder */}
        <Card className="rounded-2xl border border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Bell className="w-5 h-5" />
              Daily Reminder
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Get a push notification to remind you to journal and protect your streak.
            </p>
            <div className="flex items-center gap-4">
              <Input
                type="time"
                value={reminderTime || ''}
                onChange={async (e) => {
                  const time = e.target.value;
                  if (time) {
                    await updateSettings({ reminderTime: time });
                    const [h, m] = time.split(':').map(Number);
                    const { scheduleStreakReminder } = await import('@/lib/notifications');
                    await scheduleStreakReminder(h, m);
                    toast({ title: 'Reminder Set', description: `You'll be reminded daily at ${time}.` });
                  }
                }}
                className="w-36"
              />
              {reminderTime && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    await updateSettings({ reminderTime: undefined });
                    const { cancelStreakReminder } = await import('@/lib/notifications');
                    await cancelStreakReminder();
                    toast({ title: 'Reminder Removed', description: 'Daily reminder has been turned off.' });
                  }}
                >
                  Remove
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Data Management */}
        <Card className="rounded-2xl border border-border/50">
          <CardHeader>
            <CardTitle className="text-sm">Data Management</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            
            {/* Sync stats */}
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-sm font-medium">Export/Import statistics</Label>
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
        <Card className="rounded-2xl border border-border/50">
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
        {/* App Lock PIN Dialog */}
        <Dialog open={isSettingLock} onOpenChange={setIsSettingLock}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Set App Lock PIN</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="lock-pin">4-digit PIN</Label>
                <Input
                  id="lock-pin"
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  value={lockPin}
                  onChange={(e) => setLockPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  placeholder="••••"
                  className="text-center text-2xl tracking-[0.5em]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-lock-pin">Confirm PIN</Label>
                <Input
                  id="confirm-lock-pin"
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  value={confirmLockPin}
                  onChange={(e) => setConfirmLockPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  placeholder="••••"
                  className="text-center text-2xl tracking-[0.5em]"
                />
              </div>
              <p className="text-sm text-muted-foreground">
                If you forget your PIN, a 24-hour countdown will reset it automatically.
              </p>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => { setIsSettingLock(false); setLockPin(''); setConfirmLockPin(''); }}>
                  Cancel
                </Button>
                <Button onClick={async () => {
                  if (lockPin.length !== 4) {
                    toast({ title: "Invalid PIN", description: "PIN must be exactly 4 digits.", variant: "destructive" });
                    return;
                  }
                  if (lockPin !== confirmLockPin) {
                    toast({ title: "PINs Don't Match", description: "Please ensure both PINs are identical.", variant: "destructive" });
                    return;
                  }
                  const success = await setAppLock(lockPin);
                  if (success) {
                    toast({ title: "App Lock Enabled", description: "A 4-digit PIN is now required to open the app." });
                    setIsSettingLock(false);
                    setLockPin('');
                    setConfirmLockPin('');
                  }
                }}>
                  Set PIN
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Build version */}
        <p className="text-center text-[10px] text-muted-foreground/50 mt-8 font-mono select-all">
          Build: {typeof __BUILD_TIME__ !== 'undefined' ? __BUILD_TIME__ : 'dev'}
        </p>
      </div>
    </div>
  );
}