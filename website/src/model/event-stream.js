// Consume only complete SSE frames; a line ending may be split across reads.
export function takeEventFrames(buffer) {
  const frames = [];
  const separator = /\r\n\r\n|\r\n\n|\n\r\n|\n\n|\r\r/g;
  let match;
  let start = 0;
  while ((match = separator.exec(buffer)) !== null) {
    const lines = buffer.slice(start, match.index).split(/\r\n|\n|\r/);
    let type = '';
    const data = [];
    for (const line of lines) {
      const colon = line.indexOf(':');
      const field = colon < 0 ? line : line.slice(0, colon);
      let value = colon < 0 ? '' : line.slice(colon + 1);
      if (value.startsWith(' ')) value = value.slice(1);
      if (field === 'event') type = value;
      else if (field === 'data') data.push(value);
    }
    if (data.length) frames.push({ type, data: data.join('\n') });
    start = separator.lastIndex;
  }
  return { frames, remainder: buffer.slice(start) };
}
