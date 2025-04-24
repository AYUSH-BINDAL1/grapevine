import { useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import './MarkdownToolbar.css';

const MarkdownToolbar = ({ onInsert }) => {
  const insertMarkdown = useCallback((prefix, suffix = '', placeholder = '') => {
    onInsert(prefix, suffix, placeholder);
  }, [onInsert]);

  // Define keyboard shortcuts handler
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Check if Ctrl key (or Command key on Mac) is pressed
      const isCmdOrCtrl = e.ctrlKey || e.metaKey;
      
      // Only process shortcuts when in a textarea or contentEditable element
      if (e.target.tagName !== 'TEXTAREA' && !e.target.isContentEditable) return;
      
      // Process Ctrl/Cmd shortcuts
      if (isCmdOrCtrl) {
        switch (e.key.toLowerCase()) {
          case 'b':
            e.preventDefault();
            insertMarkdown('**', '**', 'bold text');
            break;
          case 'i':
            e.preventDefault();
            insertMarkdown('*', '*', 'italic text');
            break;
          case 'k':
            e.preventDefault();
            insertMarkdown('[', '](https://example.com)', 'link text');
            break;
          case '1':
            if (e.shiftKey) {
              e.preventDefault();
              insertMarkdown('# ', '', 'Heading 1');
            }
            break;
          case '2':
            if (e.shiftKey) {
              e.preventDefault();
              insertMarkdown('## ', '', 'Heading 2');
            }
            break;
          case 'l':
            if (e.shiftKey) {
              e.preventDefault();
              insertMarkdown('- ', '', 'list item');
            }
            break;
          case 'o':
            if (e.shiftKey) {
              e.preventDefault();
              insertMarkdown('1. ', '', 'numbered item');
            }
            break;
          case '/':
            e.preventDefault();
            insertMarkdown('> ', '', 'quote');
            break;
          case '`':
            if (e.shiftKey) {
              e.preventDefault();
              insertMarkdown('```\n', '\n```', 'code');
            }
            break;
          default:
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [insertMarkdown]);
  
  // Define button groups with shortcuts in titles
  const buttonGroups = [
    {
      id: 'text-formatting',
      ariaLabel: 'Text formatting',
      buttons: [
        {
          id: 'bold',
          onClick: () => insertMarkdown('**', '**', 'bold text'),
          title: 'Bold (Ctrl+B)',
          ariaLabel: 'Bold text formatting',
          content: <strong>B</strong>,
          shortcutKey: 'B'
        },
        {
          id: 'italic',
          onClick: () => insertMarkdown('*', '*', 'italic text'),
          title: 'Italic (Ctrl+I)',
          ariaLabel: 'Italic text formatting',
          content: <em>I</em>,
          shortcutKey: 'I'
        }
      ]
    },
    {
      id: 'headings',
      ariaLabel: 'Headings',
      buttons: [
        {
          id: 'heading-1',
          onClick: () => insertMarkdown('# ', '', 'Heading 1'),
          title: 'Heading 1 (Ctrl+Shift+1)',
          ariaLabel: 'Add heading level 1',
          content: <span>H1</span>,
          shortcutKey: '⇧1'
        },
        {
          id: 'heading-2',
          onClick: () => insertMarkdown('## ', '', 'Heading 2'),
          title: 'Heading 2 (Ctrl+Shift+2)',
          ariaLabel: 'Add heading level 2',
          content: <span>H2</span>,
          shortcutKey: '⇧2'
        },
        {
          id: 'heading-3',
          onClick: () => insertMarkdown('### ', '', 'Heading 3'),
          title: 'Heading 3',
          ariaLabel: 'Add heading level 3',
          content: <span>H3</span>
        }
      ]
    },
    {
      id: 'links-media',
      ariaLabel: 'Links and media',
      buttons: [
        {
          id: 'link',
          onClick: () => insertMarkdown('[', '](https://example.com)', 'link text'),
          title: 'Link (Ctrl+K)',
          ariaLabel: 'Insert link',
          content: <span aria-hidden="true">🔗</span>,
          shortcutKey: 'K'
        },
        {
          id: 'image',
          onClick: () => insertMarkdown('![', '](https://example.com/image.jpg)', 'alt text'),
          title: 'Image',
          ariaLabel: 'Insert image',
          content: <span aria-hidden="true">🖼️</span>
        }
      ]
    },
    {
      id: 'lists',
      ariaLabel: 'Lists',
      buttons: [
        {
          id: 'bullet-list',
          onClick: () => insertMarkdown('- ', '', 'list item'),
          title: 'Bullet List (Ctrl+Shift+L)',
          ariaLabel: 'Insert bullet list item',
          content: <span aria-hidden="true">•</span>,
          shortcutKey: '⇧L'
        },
        {
          id: 'numbered-list',
          onClick: () => insertMarkdown('1. ', '', 'numbered item'),
          title: 'Numbered List (Ctrl+Shift+O)',
          ariaLabel: 'Insert numbered list item',
          content: <span aria-hidden="true">1.</span>,
          shortcutKey: '⇧O'
        }
      ]
    },
    {
      id: 'other-formatting',
      ariaLabel: 'Other formatting',
      buttons: [
        {
          id: 'quote',
          onClick: () => insertMarkdown('> ', '', 'quote'),
          title: 'Quote (Ctrl+/)',
          ariaLabel: 'Insert block quote',
          content: <span aria-hidden="true">❝</span>,
          shortcutKey: '/'
        },
        {
          id: 'code-block',
          onClick: () => insertMarkdown('```\n', '\n```', 'code'),
          title: 'Code Block (Ctrl+Shift+`)',
          ariaLabel: 'Insert code block',
          content: <span aria-hidden="true">{'</>'}</span>,
          shortcutKey: '⇧`'
        },
        {
          id: 'help',
          onClick: () => window.open('https://www.markdownguide.org/cheat-sheet/', '_blank'),
          title: 'Markdown Syntax Guide',
          ariaLabel: 'Open Markdown syntax guide in new window',
          className: 'help-button',
          content: <span aria-hidden="true">?</span>,
          hasPopup: true
        }
      ]
    }
  ];
  
  return (
    <div 
      className="markdown-toolbar" 
      role="toolbar"
      aria-label="Markdown formatting options"
    >
      {buttonGroups.map((group, groupIndex) => (
        <div 
          key={group.id}
          className="toolbar-button-group"
          role="group"
          aria-label={group.ariaLabel}
        >
          {group.buttons.map((button) => (
            <button 
              key={button.id}
              type="button" 
              onClick={button.onClick}
              title={button.title}
              aria-label={button.ariaLabel}
              className={`${button.className || ''} ${button.shortcutKey ? 'has-shortcut' : ''}`}
              {...(button.hasPopup ? { 'aria-haspopup': 'dialog' } : {})}
              data-shortcut={button.shortcutKey}
            >
              {button.content}
              {button.shortcutKey && (
                <span className="shortcut-hint">
                  {button.shortcutKey}
                </span>
              )}
            </button>
          ))}
          
          {/* Add divider after each group except the last */}
          {groupIndex < buttonGroups.length - 1 && (
            <span 
              className="toolbar-divider"
              role="separator"
              aria-orientation="vertical"
            ></span>
          )}
        </div>
      ))}
    </div>
  );
};

MarkdownToolbar.propTypes = {
  onInsert: PropTypes.func.isRequired,
  textareaRef: PropTypes.object
};

export default MarkdownToolbar;
