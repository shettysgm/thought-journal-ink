import { useState, useRef, useEffect } from 'react';
import { Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import lockIcon from '@/assets/lock-icon.png';

interface LockScreenProps {
  onUnlock: (password: string) => Promise<boolean>;
}

export default function LockScreen({ onUnlock }: LockScreenProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim() || loading) return;
    
    setLoading(true);
    setError(false);
    
    const success = await onUnlock(password);
    
    if (!success) {
      setError(true);
      setShake(true);
      setPassword('');
      setTimeout(() => setShake(false), 500);
      inputRef.current?.focus();
    }
    
    setLoading(false);
  };

  return (
    <div 
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background px-6"
      style={{ 
        paddingTop: 'env(safe-area-inset-top, 0px)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)'
      }}
    >
      <div className={`w-full max-w-xs space-y-8 text-center ${shake ? 'animate-shake' : ''}`}>
        {/* Icon */}
        <div className="flex flex-col items-center gap-4">
          <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Lock className="w-10 h-10 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-foreground">Thought Journal</h1>
            <p className="text-sm text-muted-foreground mt-1">Enter your password to unlock</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            ref={inputRef}
            type="password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(false); }}
            placeholder="Password"
            className={`text-center text-lg h-12 ${error ? 'border-destructive ring-destructive/20 ring-2' : ''}`}
            autoComplete="off"
            autoFocus
          />
          
          {error && (
            <p className="text-sm text-destructive">Incorrect password. Try again.</p>
          )}
          
          <Button 
            type="submit" 
            className="w-full h-12 text-base"
            disabled={!password.trim() || loading}
          >
            {loading ? 'Unlocking...' : 'Unlock'}
          </Button>
        </form>
      </div>
    </div>
  );
}
