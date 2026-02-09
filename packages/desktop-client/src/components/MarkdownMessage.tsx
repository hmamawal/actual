import ReactMarkdown from 'react-markdown';

import rehypeHighlight from 'rehype-highlight';
import remarkGfm from 'remark-gfm';
import 'highlight.js/styles/github.css';

type MarkdownMessageProps = {
  content: string;
  sender: 'user' | 'bot';
};

export function MarkdownMessage({ content, sender }: MarkdownMessageProps) {
  const isUser = sender === 'user';

  return (
    <div
      style={{
        maxWidth: '80%',
        padding: '10px 14px',
        borderRadius: '12px',
        backgroundColor: isUser ? '#2563eb' : '#e5e7eb',
        color: isUser ? 'white' : '#1f2937',
        fontSize: '14px',
        wordWrap: 'break-word',
        lineHeight: '1.4',
        userSelect: 'text',
      }}
    >
      {isUser ? (
        // User messages - plain text
        content
      ) : (
        // Bot messages - rendered markdown
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeHighlight]}
          components={{
            // Style code blocks
            code({ node, className, children, ...props }: any) {
              const inline = !className;
              return inline ? (
                <code
                  {...props}
                  style={{
                    backgroundColor: 'rgba(0, 0, 0, 0.1)',
                    padding: '2px 4px',
                    borderRadius: '3px',
                    fontSize: '13px',
                    fontFamily: 'monospace',
                  }}
                >
                  {children}
                </code>
              ) : (
                <code
                  {...props}
                  className={className}
                  style={{
                    display: 'block',
                    padding: '8px',
                    borderRadius: '4px',
                    backgroundColor: '#f6f8fa',
                    overflow: 'auto',
                    fontSize: '13px',
                    fontFamily: 'monospace',
                  }}
                >
                  {children}
                </code>
              );
            },
            // Style links
            a({ children, href, ...props }: any) {
              return (
                <a
                  {...props}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color: '#2563eb',
                    textDecoration: 'underline',
                  }}
                >
                  {children}
                </a>
              );
            },
            // Style tables
            table({ children, ...props }: any) {
              return (
                <table
                  {...props}
                  style={{
                    borderCollapse: 'collapse',
                    width: '100%',
                    margin: '8px 0',
                    fontSize: '13px',
                  }}
                >
                  {children}
                </table>
              );
            },
            th({ children, ...props }: any) {
              return (
                <th
                  {...props}
                  style={{
                    border: '1px solid #ddd',
                    padding: '6px 8px',
                    backgroundColor: 'rgba(0, 0, 0, 0.05)',
                    textAlign: 'left',
                    fontWeight: 'bold',
                  }}
                >
                  {children}
                </th>
              );
            },
            td({ children, ...props }: any) {
              return (
                <td
                  {...props}
                  style={{
                    border: '1px solid #ddd',
                    padding: '6px 8px',
                  }}
                >
                  {children}
                </td>
              );
            },
            // Style lists
            ul({ children, ...props }: any) {
              return (
                <ul
                  {...props}
                  style={{
                    marginLeft: '20px',
                    marginTop: '4px',
                    marginBottom: '4px',
                  }}
                >
                  {children}
                </ul>
              );
            },
            ol({ children, ...props }: any) {
              return (
                <ol
                  {...props}
                  style={{
                    marginLeft: '20px',
                    marginTop: '4px',
                    marginBottom: '4px',
                  }}
                >
                  {children}
                </ol>
              );
            },
            // Style paragraphs
            p({ children, ...props }: any) {
              return (
                <p
                  {...props}
                  style={{
                    margin: '4px 0',
                  }}
                >
                  {children}
                </p>
              );
            },
            // Style blockquotes
            blockquote({ children, ...props }: any) {
              return (
                <blockquote
                  {...props}
                  style={{
                    borderLeft: '3px solid #ddd',
                    paddingLeft: '12px',
                    marginLeft: '0',
                    fontStyle: 'italic',
                    color: '#555',
                  }}
                >
                  {children}
                </blockquote>
              );
            },
            // Style headings
            h1({ children, ...props }: any) {
              return (
                <h1
                  {...props}
                  style={{
                    fontSize: '18px',
                    fontWeight: 'bold',
                    marginTop: '8px',
                    marginBottom: '4px',
                  }}
                >
                  {children}
                </h1>
              );
            },
            h2({ children, ...props }: any) {
              return (
                <h2
                  {...props}
                  style={{
                    fontSize: '16px',
                    fontWeight: 'bold',
                    marginTop: '6px',
                    marginBottom: '4px',
                  }}
                >
                  {children}
                </h2>
              );
            },
            h3({ children, ...props }: any) {
              return (
                <h3
                  {...props}
                  style={{
                    fontSize: '14px',
                    fontWeight: 'bold',
                    marginTop: '4px',
                    marginBottom: '2px',
                  }}
                >
                  {children}
                </h3>
              );
            },
            // Style horizontal rules
            hr({ ...props }: any) {
              return (
                <hr
                  {...props}
                  style={{
                    border: 'none',
                    borderTop: '1px solid #ddd',
                    margin: '8px 0',
                  }}
                />
              );
            },
          }}
        >
          {content}
        </ReactMarkdown>
      )}
    </div>
  );
}
