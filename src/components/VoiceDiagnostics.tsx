import { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { SpeechRecognition } from '@capacitor-community/speech-recognition';
import { ChevronDown, ChevronUp, Bug } from 'lucide-react';
import { cn } from '@/lib/utils';

type DiagnosticData = {
  platform: string;
  isNative: boolean;
  iosVersion: string | null;
  isSecureContext: boolean;
  userAgent: string;
  speechAvailable: boolean | null;
  micPermission: string;
  speechPermission: string;
  lastError: string | null;
};

export function VoiceDiagnostics({ lastError }: { lastError?: string | null }) {
  const [expanded, setExpanded] = useState(false);
  const [data, setData] = useState<DiagnosticData>({
    platform: 'unknown',
    isNative: false,
    iosVersion: null,
    isSecureContext: false,
    userAgent: '',
    speechAvailable: null,
    micPermission: 'unknown',
    speechPermission: 'unknown',
    lastError: null,
  });

  useEffect(() => {
    const gather = async () => {
      const isNative = Capacitor.isNativePlatform();
      const platform = Capacitor.getPlatform();
      const ua = navigator.userAgent;

      // Extract iOS version from UA
      const iosMatch = ua.match(/OS (\d+[_\.]\d+)/);
      const iosVersion = iosMatch ? iosMatch[1].replace('_', '.') : null;

      let speechAvailable: boolean | null = null;
      let micPermission = 'unknown';
      let speechPermission = 'unknown';

      if (isNative) {
        try {
          const avail = await SpeechRecognition.available();
          speechAvailable = avail.available;
        } catch {
          speechAvailable = false;
        }

        try {
          const perms = await SpeechRecognition.checkPermissions();
          speechPermission = perms?.speechRecognition || 'unknown';
        } catch {
          speechPermission = 'error';
        }
      }

      // Check browser mic permission (works in secure contexts)
      if (navigator.permissions) {
        try {
          const mic = await navigator.permissions.query({ name: 'microphone' as PermissionName });
          micPermission = mic.state;
        } catch {
          micPermission = 'unsupported';
        }
      }

      setData({
        platform,
        isNative,
        iosVersion,
        isSecureContext: window.isSecureContext,
        userAgent: ua,
        speechAvailable,
        micPermission,
        speechPermission,
        lastError: lastError || null,
      });
    };

    gather();
  }, [lastError]);

  const statusColor = (val: string | boolean | null) => {
    if (val === true || val === 'granted') return 'text-green-600';
    if (val === false || val === 'denied') return 'text-red-600';
    return 'text-amber-600';
  };

  return (
    <div className="mt-4 rounded-lg border bg-muted/30 text-xs">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-3 py-2 text-muted-foreground hover:text-foreground transition-colors"
      >
        <span className="flex items-center gap-1.5">
          <Bug className="w-3.5 h-3.5" />
          Voice Diagnostics
        </span>
        {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>

      {expanded && (
        <div className="px-3 pb-3 space-y-1.5 border-t pt-2">
          <Row label="Platform" value={data.platform} />
          <Row label="Native" value={data.isNative ? 'Yes' : 'No'} className={statusColor(data.isNative)} />
          {data.iosVersion && <Row label="iOS" value={data.iosVersion} />}
          <Row label="Secure Context" value={data.isSecureContext ? 'Yes' : 'No'} className={statusColor(data.isSecureContext)} />
          <Row label="Speech Available" value={data.speechAvailable === null ? '—' : data.speechAvailable ? 'Yes' : 'No'} className={statusColor(data.speechAvailable)} />
          <Row label="Mic Permission" value={data.micPermission} className={statusColor(data.micPermission)} />
          <Row label="Speech Permission" value={data.speechPermission} className={statusColor(data.speechPermission)} />
          {data.lastError && (
            <Row label="Last Error" value={data.lastError} className="text-red-600" />
          )}
          <details className="pt-1">
            <summary className="cursor-pointer text-muted-foreground">User Agent</summary>
            <p className="mt-1 break-all text-[10px] text-muted-foreground">{data.userAgent}</p>
          </details>

          {/* Fallback hint */}
          <div className="mt-3 p-2 rounded bg-primary/5 border border-primary/20">
            <p className="text-muted-foreground leading-relaxed">
              <strong>Tip:</strong> If voice isn't working, you can always use{' '}
              <span className="font-medium text-foreground">iOS keyboard dictation</span> — tap the{' '}
              <span className="inline-block align-middle">🎤</span> icon on your keyboard.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn('font-mono', className)}>{value}</span>
    </div>
  );
}
