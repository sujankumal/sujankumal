import React from 'react';
import ReactMarkdown from 'react-markdown';

interface MarkdownProps {
  content: string;
}

// Matches <a id="..."></a> or <a id="..."/> used as bookmark anchors in markdown.
// react-markdown v10 strips raw HTML before component renderers run, so we
// preprocess the string ourselves and replace anchors with real React elements.
const ANCHOR_REGEX = /<a\s+id="([^"]+)"\s*(?:><\/a>|\/>)/g;

const MarkdownComponent = ({ content }: MarkdownProps) => {
  // Split the content on anchor tags, capturing the id in each match.
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  const regex = new RegExp(ANCHOR_REGEX.source, 'g');

  while ((match = regex.exec(content)) !== null) {
    // Markdown text before this anchor tag
    if (match.index > lastIndex) {
      parts.push(
        <ReactMarkdown key={`md-${lastIndex}`}>
          {content.slice(lastIndex, match.index)}
        </ReactMarkdown>
      );
    }
    // The anchor element itself — rendered as a real DOM node
    parts.push(<span key={`anchor-${match[1]}`} id={match[1]} />);
    lastIndex = match.index + match[0].length;
  }

  // Remaining markdown after the last anchor
  if (lastIndex < content.length) {
    parts.push(
      <ReactMarkdown key={`md-${lastIndex}`}>
        {content.slice(lastIndex)}
      </ReactMarkdown>
    );
  }

  // If there were no anchor tags at all, render normally
  if (parts.length === 0) {
    return (
      <div className="markdown-container">
        <ReactMarkdown>{content}</ReactMarkdown>
      </div>
    );
  }

  return <div className="markdown-container">{parts}</div>;
};

export default MarkdownComponent;
