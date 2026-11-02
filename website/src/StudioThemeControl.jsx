import React, { useEffect, useState } from 'react';

const storageKey = 'chargeweave.studio.theme.v1';
const choices = new Set(['system', 'light', 'dark']);

function initialChoice() {
  try {
    const value = localStorage.getItem(storageKey);
    return choices.has(value) ? value : 'system';
  } catch { return 'system'; }
}

// The theme is a local presentation preference, never a shared workspace edit.
export default function StudioThemeControl() {
  const [choice, setChoice] = useState(initialChoice);
  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: light)');
    const apply = () => {
      document.documentElement.dataset.studioTheme = choice === 'system' ? (media.matches ? 'light' : 'dark') : choice;
    };
    apply();
    media.addEventListener('change', apply);
    try { localStorage.setItem(storageKey, choice); } catch { /* Preference remains in memory. */ }
    return () => {
      media.removeEventListener('change', apply);
      delete document.documentElement.dataset.studioTheme;
    };
  }, [choice]);
  return <label className="studio-theme-control">Appearance
    <select value={choice} onChange={event => setChoice(event.target.value)}>
      <option value="system">System</option>
      <option value="light">Light</option>
      <option value="dark">Dark</option>
    </select>
  </label>;
}
