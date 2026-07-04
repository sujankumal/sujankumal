import React from 'react';
import ReactMarkdown from 'react-markdown';

interface MarkdownProps {
  content: string;
}

// Matches <a id="..."></a> or <a id="..."/> used as bookmark anchors in markdown.
// react-markdown v10 strips raw HTML before component renderers run, so we
// preprocess the string ourselves and replace anchors with real React elements.
const ANCHOR_REGEX = /<a\s+id="([^"]+)"\s*(?:><\/a>|\/>)/g;

/**
 * Helper function to detect if a string contains Nepali (Devanagari) characters.
 * The Unicode range \u0900-\u097F covers the entire Devanagari script block.
 */
const getLanguageCode = (text: string): 'ne' | 'en' => {
  const nepaliRegex = /[\u0900-\u097F]/;
  return nepaliRegex.test(text) ? 'ne' : 'en';
};

const MarkdownComponent = ({ content }: MarkdownProps) => {
  // Split the content on anchor tags, capturing the id in each match.
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  const regex = new RegExp(ANCHOR_REGEX.source, 'g');

  while ((match = regex.exec(content)) !== null) {
    // Markdown text before this anchor tag
    if (match.index > lastIndex) {
      const textSlice = content.slice(lastIndex, match.index);
      const lang = getLanguageCode(textSlice);

      parts.push(
        <div key={`md-${lastIndex}`} lang={lang}>
          <ReactMarkdown key={`md-${lastIndex}`}>{textSlice}</ReactMarkdown>
        </div>
      );
    }
    // The anchor element itself — rendered as a real DOM node
    parts.push(<span key={`anchor-${match[1]}`} id={match[1]} />);
    lastIndex = match.index + match[0].length;
  }

  // Remaining markdown after the last anchor
  if (lastIndex < content.length) {
    const textSlice = content.slice(lastIndex);
    const lang = getLanguageCode(textSlice);

    parts.push(
      <div key={`md-${lastIndex}`} lang={lang}>
        <ReactMarkdown key={`md-${lastIndex}`}>{textSlice}</ReactMarkdown>
      </div>
    );
  }

  // If there were no anchor tags at all, render normally
  if (parts.length === 0) {
    const lang = getLanguageCode(content);
    return (
      <div className="markdown-container" lang={lang}>
        <ReactMarkdown>{content}</ReactMarkdown>
      </div>
    );
  }

  return <div className="markdown-container">{parts}</div>;
};

export default MarkdownComponent;
