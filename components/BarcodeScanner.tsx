'use client';

import { useEffect, useRef, useState } from 'react';

interface Props {
  onGescand: (barcode: string) => void;
  onSluiten: () => void;
}

export default function BarcodeScanner({ onGescand, onSluiten }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [fout, setFout] = useState('');
  const [status, setStatus] = useState<'laden' | 'scannen' | 'gevonden'>('laden');
  const stopRef = useRef<(() => void) | null>(null);
  const gevondenRef = useRef(false);

  useEffect(() => {
    let stream: MediaStream | null = null;

    async function startScanner() {
      try {
        const { BrowserMultiFormatReader } = await import('@zxing/browser');
        const reader = new BrowserMultiFormatReader();

        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          setStatus('scannen');

          const controls = await reader.decodeFromStream(stream, videoRef.current, (result, error) => {
            if (result && !gevondenRef.current) {
              gevondenRef.current = true;
              setStatus('gevonden');
              controls.stop();
              stream?.getTracks().forEach((t) => t.stop());
              onGescand(result.getText());
            }
          });

          stopRef.current = () => {
            controls.stop();
            stream?.getTracks().forEach((t) => t.stop());
          };
        }
      } catch (e) {
        setFout('Camera niet beschikbaar. Controleer of je toestemming hebt gegeven.');
      }
    }

    startScanner();

    return () => {
      stopRef.current?.();
    };
  }, [onGescand]);

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 300,
      background: '#000',
      display: 'flex', flexDirection: 'column',
    }}>
      <video
        ref={videoRef}
        muted
        playsInline
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
      />

      {/* Overlay */}
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        pointerEvents: 'none',
      }}>
        {/* Dark vignette */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(ellipse 280px 200px at center, transparent 40%, rgba(0,0,0,0.7) 100%)',
        }} />

        {/* Scan frame */}
        <div style={{
          position: 'relative',
          width: 260, height: 160,
          borderRadius: 16,
        }}>
          {/* Corner markers */}
          {[
            { top: 0, left: 0, borderTop: '3px solid var(--accent)', borderLeft: '3px solid var(--accent)', borderTopLeftRadius: 12 },
            { top: 0, right: 0, borderTop: '3px solid var(--accent)', borderRight: '3px solid var(--accent)', borderTopRightRadius: 12 },
            { bottom: 0, left: 0, borderBottom: '3px solid var(--accent)', borderLeft: '3px solid var(--accent)', borderBottomLeftRadius: 12 },
            { bottom: 0, right: 0, borderBottom: '3px solid var(--accent)', borderRight: '3px solid var(--accent)', borderBottomRightRadius: 12 },
          ].map((s, i) => (
            <div key={i} style={{ position: 'absolute', width: 24, height: 24, ...s }} />
          ))}

          {/* Scan line animation */}
          {status === 'scannen' && (
            <div style={{
              position: 'absolute', left: 8, right: 8, height: 2,
              background: 'var(--accent)',
              borderRadius: 1,
              boxShadow: '0 0 8px var(--accent)',
              animation: 'scanLine 1.8s ease-in-out infinite',
            }} />
          )}

          {status === 'gevonden' && (
            <div style={{
              position: 'absolute', inset: 0, borderRadius: 16,
              background: 'rgba(74,222,128,0.2)',
              border: '2px solid var(--success)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ fontSize: 32 }}>✓</span>
            </div>
          )}
        </div>

        <div style={{
          marginTop: 20, color: '#fff', fontSize: 14, fontWeight: 500,
          textShadow: '0 1px 4px rgba(0,0,0,0.8)',
          textAlign: 'center', padding: '0 40px',
        }}>
          {fout || (status === 'laden' ? 'Camera starten…' : status === 'gevonden' ? 'Barcode gevonden!' : 'Richt op de barcode van een product')}
        </div>
      </div>

      {/* Close button */}
      <button
        onClick={() => { stopRef.current?.(); onSluiten(); }}
        style={{
          position: 'absolute', top: 52, right: 20,
          background: 'rgba(0,0,0,0.6)',
          border: '1px solid rgba(255,255,255,0.2)',
          borderRadius: 12, color: '#fff',
          padding: '10px 18px', cursor: 'pointer',
          fontSize: 14, fontWeight: 600,
          backdropFilter: 'blur(8px)',
        }}
      >
        Sluiten
      </button>

      <style>{`
        @keyframes scanLine {
          0%   { top: 8px;  opacity: 1; }
          50%  { top: calc(100% - 10px); opacity: 1; }
          100% { top: 8px;  opacity: 1; }
        }
      `}</style>
    </div>
  );
}
