'use client';

import { useEffect, useState } from 'react';
import QRCode from 'qrcode';

export function CardQRCode({
  value,
  size = 132,
  dark = '#0b0d12',
  light = '#ffffff',
  className = '',
}: {
  value: string;
  size?: number;
  dark?: string;
  light?: string;
  className?: string;
}) {
  const [src, setSrc] = useState('');

  useEffect(() => {
    let active = true;
    QRCode.toDataURL(value || 'https://app.innovated.marketing', {
      width: size * 2,
      margin: 1,
      errorCorrectionLevel: 'M',
      color: { dark, light },
    }).then((url) => active && setSrc(url));
    return () => { active = false; };
  }, [value, size, dark, light]);

  if (!src) return <div className={`animate-pulse rounded-xl bg-white/15 ${className}`} style={{ width: size, height: size }} />;
  // Generated data URL; Next Image optimization does not apply.
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} width={size} height={size} alt="Scan this digital business card" className={`rounded-xl ${className}`} />;
}

