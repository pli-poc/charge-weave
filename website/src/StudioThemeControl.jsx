import React, { useEffect, useState } from 'react';

const storageKey = 'chargeweave.studio.theme.v1';
const choices = new Set(['system', 'light', 'dark']);
const densityKey = 'chargeweave.studio.density.v1';
const densities = new Set(['comfortable', 'compact']);

function initialChoice() {
  try {
    const value = localStorage.getItem(storageKey);
    return choices.has(value) ? value : 'system';
  } catch { return 'system'; }
}
function initialDensity() {
  try {
    const value = localStorage.getItem(densityKey);
    return densities.has(value) ? value : 'comfortable';
  } catch { return 'comfortable'; }
}

// The theme is a local presentation preference, never a shared workspace edit.
export default function StudioThemeControl() {
  const [choice, setChoice] = useState(initialChoice);
  const [density, setDensity] = useState(initialDensity);
  const [compact, setCompact] = useState(() => window.matchMedia('(max-width: 600px)').matches);
  const [settingsOpen, setSettingsOpen] = useState(false);
  useEffect(() => {
    const media = window.matchMedia('(max-width: 600px)');
    const update = () => {
      setCompact(media.matches);
      setSettingsOpen(!media.matches);
    };
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);
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
  useEffect(() => {
    document.documentElement.dataset.studioDensity = density;
    try { localStorage.setItem(densityKey, density); } catch { /* Preference remains in memory. */ }
    return () => { delete document.documentElement.dataset.studioDensity; };
  }, [density]);
  return <div className="studio-appearance-menu" data-compact={compact}>
    <button type="button" className="studio-appearance-toggle" aria-label="Studio preferences" aria-controls="studio-appearance-controls" aria-expanded={!compact || settingsOpen} onClick={() => setSettingsOpen(open => !open)}>Preferences</button>
    {(!compact || settingsOpen) && <div id="studio-appearance-controls" className="studio-appearance-controls">
    <label className="studio-theme-control">Appearance
      <select value={choice} onChange={event => setChoice(event.target.value)}>
        <option value="system">System</option>
        <option value="light">Light</option>
        <option value="dark">Dark</option>
      </select>
    </label>
    <label className="studio-density-control">Density
      <select value={density} onChange={event => setDensity(event.target.value)}>
        <option value="comfortable">Comfortable</option>
        <option value="compact">Compact</option>
      </select>
    </label>
    </div>}
  </div>;
}
