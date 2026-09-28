import React from "react";

function safeUrl(value, image = false) {
  const url = value.trim();
  if (/^(https?:\/\/|mailto:|\/|\.\.?\/|#)/i.test(url)) return url;
  return image ? "" : undefined;
}

function Inline({ text }) {
  const pattern = /(!?\[([^\]]*)\]\(([^\s)]+)(?:\s+[^)]*)?\)|\*\*(.+?)\*\*|__(.+?)__|`([^`]+)`|\*(.+?)\*|_(.+?)_)/g;
  const nodes = [];
  let start = 0;
  let match;
  let key = 0;
  while ((match = pattern.exec(text))) {
    if (match.index > start) nodes.push(text.slice(start, match.index));
    if (match[1]) {
      const image = match[1].startsWith("!");
      const url = safeUrl(match[3], image);
      if (image && url) nodes.push(<img key={key++} src={url} alt={match[2]} />);
      else if (url) nodes.push(<a key={key++} href={url} target={/^https?:/i.test(url) ? "_blank" : undefined} rel={/^https?:/i.test(url) ? "noreferrer" : undefined}>{match[2]}</a>);
      else nodes.push(match[2]);
    } else if (match[4] || match[5]) nodes.push(<strong key={key++}>{match[4] || match[5]}</strong>);
    else if (match[6]) nodes.push(<code key={key++}>{match[6]}</code>);
    else nodes.push(<em key={key++}>{match[7] || match[8]}</em>);
    start = pattern.lastIndex;
  }
  if (start < text.length) nodes.push(text.slice(start));
  return nodes;
}

const headingTags = [null, "h1", "h2", "h3", "h4", "h5", "h6"];
const unordered = /^\s*[-*+]\s+(.+)$/;
const ordered = /^\s*\d+\.\s+(.+)$/;

export default function MarkdownBody({ markdown }) {
  const lines = markdown.split(/\r?\n/);
  const blocks = [];
  let index = 0;
  while (index < lines.length) {
    const line = lines[index];
    if (!line.trim()) { index++; continue; }
    const fence = line.match(/^\s*```([^\s`]*)/);
    if (fence) {
      const code = [];
      index++;
      while (index < lines.length && !/^\s*```\s*$/.test(lines[index])) code.push(lines[index++]);
      if (index < lines.length) index++;
      blocks.push(<pre key={blocks.length}><code className={fence[1] ? `language-${fence[1]}` : undefined}>{code.join("\n")}</code></pre>);
      continue;
    }
    const heading = line.match(/^(#{1,6})\s+(.+?)\s*#*\s*$/);
    if (heading) {
      const Tag = headingTags[heading[1].length];
      blocks.push(<Tag key={blocks.length}><Inline text={heading[2]} /></Tag>);
      index++;
      continue;
    }
    if (/^\s*(?:---+|___+|\*\*\*+)\s*$/.test(line)) {
      blocks.push(<hr key={blocks.length} />);
      index++;
      continue;
    }
    if (/^\s*>/.test(line)) {
      const quote = [];
      while (index < lines.length && /^\s*>/.test(lines[index])) quote.push(lines[index++].replace(/^\s*>\s?/, ""));
      blocks.push(<blockquote key={blocks.length}><p><Inline text={quote.join(" ")} /></p></blockquote>);
      continue;
    }
    const listType = unordered.test(line) ? "ul" : ordered.test(line) ? "ol" : null;
    if (listType) {
      const items = [];
      const expression = listType === "ul" ? unordered : ordered;
      while (index < lines.length) {
        const item = lines[index].match(expression);
        if (!item) break;
        items.push(<li key={items.length}><Inline text={item[1]} /></li>);
        index++;
      }
      const List = listType;
      blocks.push(<List key={blocks.length}>{items}</List>);
      continue;
    }
    const paragraph = [line];
    index++;
    while (index < lines.length && lines[index].trim() && !/^\s*(?:#{1,6}\s|```|>|[-*+]\s+|\d+\.\s+|---+\s*$|___+\s*$|\*\*\*+\s*$)/.test(lines[index])) paragraph.push(lines[index++]);
    blocks.push(<p key={blocks.length}><Inline text={paragraph.join(" ")} /></p>);
  }
  return <div className="insight-prose">{blocks}</div>;
}
