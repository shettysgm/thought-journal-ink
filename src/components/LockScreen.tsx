import { useState, useEffect, useCallback } from 'react';
import { Delete, Clock } from 'lucide-react';
import { useSettings } from '@/store/useSettings';

const PIN_LENGTH = 4;
const MAX_ATTEMPTS = 5;

export default function LockScreen() {
  const {
    verifyAppLock,
    requestReset,
    checkResetComplete,
    getResetRemainingMs,
    resetRequestedAt,
    failedAttempts,
  } = useSettings();

  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);
  const [loading, setLoading] = useState(false);
  const [remainingTime, setRemainingTime] = useState('');
  const isResetPending = !!resetRequestedAt;
  const isLockedOut = (failedAttempts || 0) >= MAX_ATTEMPTS || isResetPending;

  // Countdown timer
  useEffect(() => {
    if (!isResetPending) { setRemainingTime(''); return; }

    const tick = async () => {
      const done = await checkResetComplete();
      if (done) { setRemainingTime(''); return; }
      const ms = getResetRemainingMs();
      const hours = Math.floor(ms / 3600000);
      const mins = Math.floor((ms % 3600000) / 60000);
      const secs = Math.floor((ms % 60000) / 1000);
      setRemainingTime(`${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`);
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [isResetPending, checkResetComplete, getResetRemainingMs]);

  const handleDigit = useCallback((digit: string) => {
    if (loading || isLockedOut) return;
    setError(false);
    setPin(prev => {
      const next = prev + digit;
      if (next.length === PIN_LENGTH) {
        // Auto-submit
        setLoading(true);
        verifyAppLock(next).then(success => {
          if (!success) {
            setError(true);
            setShake(true);
            setTimeout(() => setShake(false), 500);
          }
          setLoading(false);
        });
        return '';
      }
      return next;
    });
  }, [loading, isLockedOut, verifyAppLock]);

  const handleDelete = useCallback(() => {
    if (loading || isLockedOut) return;
    setPin(prev => prev.slice(0, -1));
    setError(false);
  }, [loading, isLockedOut]);

  const handleForgotPin = async () => {
    await requestReset();
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background"
      style={{
        paddingTop: 'env(safe-area-inset-top, 0px)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      <div className={`w-full max-w-xs flex flex-col items-center gap-8 ${shake ? 'animate-shake' : ''}`}>
        {/* Title */}
        <div className="text-center space-y-2">
          <h1 className="text-xl font-semibold text-foreground">Journal Inc</h1>
          {isResetPending ? (
            <div className="flex flex-col items-center gap-2">
              <Clock className="w-8 h-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">PIN reset in progress</p>
              <p className="text-2xl font-mono font-bold text-primary tabular-nums">{remainingTime}</p>
              <p className="text-xs text-muted-foreground mt-1">The app will unlock automatically</p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              {error
                ? `Incorrect PIN. ${MAX_ATTEMPTS - (failedAttempts || 0)} attempts remaining.`
                : 'Enter your PIN to unlock'}
            </p>
          )}
        </div>

        {/* PIN dots */}
        {!isResetPending && (
          <>
            <div className="flex gap-4">
              {Array.from({ length: PIN_LENGTH }).map((_, i) => (
                <div
                  key={i}
                  className={`w-4 h-4 rounded-full border-2 transition-all duration-200 ${
                    i < pin.length
                      ? 'bg-primary border-primary scale-110'
                      : error
                        ? 'border-destructive'
                        : 'border-muted-foreground/40'
                  }`}
                />
              ))}
            </div>

            {/* Number pad */}
            <div className="grid grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
                <button
                  key={n}
                  onClick={() => handleDigit(String(n))}
                  disabled={loading}
                  className="w-18 h-18 rounded-full bg-secondary text-foreground text-2xl font-medium flex items-center justify-center active:bg-primary active:text-primary-foreground transition-colors duration-100 select-none"
                  style={{ width: 72, height: 72 }}
                >
                  {n}
                </button>
              ))}
              {/* Bottom row */}
              <button
                onClick={handleForgotPin}
                className="w-18 h-18 rounded-full flex items-center justify-center text-xs text-muted-foreground select-none"
                style={{ width: 72, height: 72 }}
              >
                Forgot?
              </button>
              <button
                onClick={() => handleDigit('0')}
                disabled={loading}
                className="w-18 h-18 rounded-full bg-secondary text-foreground text-2xl font-medium flex items-center justify-center active:bg-primary active:text-primary-foreground transition-colors duration-100 select-none"
                style={{ width: 72, height: 72 }}
              >
                0
              </button>
              <button
                onClick={handleDelete}
                disabled={loading}
                className="w-18 h-18 rounded-full flex items-center justify-center text-muted-foreground select-none"
                style={{ width: 72, height: 72 }}
              >
                <Delete className="w-6 h-6" />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
