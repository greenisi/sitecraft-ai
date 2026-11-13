'use client';

import { createElement, useEffect } from 'react';

/** The 9-dot Innovated app launcher shared by every Innovated app (Card, Booking, Website, Video, Chat…). */
export function InnovatedLauncher() {
  useEffect(() => {
    if (document.querySelector('script[data-innovated-bar]')) return;
    const s = document.createElement('script');
    s.src = 'https://innovatedwebdesign.com/innovated-bar.js';
    s.defer = true;
    s.dataset.innovatedBar = '1';
    document.head.appendChild(s);
  }, []);
  return createElement('innovated-bar', { app: 'website', theme: 'dark', 'launcher-only': '' });
}
