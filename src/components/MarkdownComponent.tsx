import React from 'react';
import ReactMarkdown from 'react-markdown';

interface MarkdownProps {
    content: string;
}

const MarkdownComponent = ({ content }: MarkdownProps) => {
  return (
    <div className="markdown-container">
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
  );
};

export default MarkdownComponent;
