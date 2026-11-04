import React from 'react';

// The browser can scroll a focused preformatted region using the keyboard.
export default function StudioScrollableText({ label, children }) {
  return <pre className="studio-scrollable-text" role="region" aria-label={label} tabIndex={0}>{children}</pre>;
}
