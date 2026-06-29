import React from 'react';
import ReactMarkdown from 'react-markdown';

interface MarkdownProps {
    content: string;
}

const MarkdownComponent = ({ content }: MarkdownProps) => {
  return (
    <div className="markdown-container">
      <ReactMarkdown
        components={{
          // Render raw HTML nodes (like <a id="...">) via dangerouslySetInnerHTML
          // This enables in-page anchor bookmarks without needing rehype-raw
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          html: ({ node }: any) => (
            <span dangerouslySetInnerHTML={{ __html: node?.value ?? '' }} />
          ),
          // Pass id and all other attributes through on regular <a> links
          a: ({ node, ...props }) => <a {...props} />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownComponent;
