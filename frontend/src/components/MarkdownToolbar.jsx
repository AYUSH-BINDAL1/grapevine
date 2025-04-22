import PropTypes from 'prop-types';
import './MarkdownToolbar.css';

const MarkdownToolbar = ({ onInsert }) => {
  const insertMarkdown = (prefix, suffix = '', placeholder = '') => {
    onInsert(prefix, suffix, placeholder);
  };
  
  return (
    <div className="markdown-toolbar">
      <button type="button" onClick={() => insertMarkdown('**', '**', 'bold text')} title="Bold">
        <strong>B</strong>
      </button>
      <button type="button" onClick={() => insertMarkdown('*', '*', 'italic text')} title="Italic">
        <em>I</em>
      </button>
      <span className="toolbar-divider"></span>
      
      <button type="button" onClick={() => insertMarkdown('# ', '', 'Heading 1')} title="Heading 1">
        <span>H1</span>
      </button>
      <button type="button" onClick={() => insertMarkdown('## ', '', 'Heading 2')} title="Heading 2">
        <span>H2</span>
      </button>
      <span className="toolbar-divider"></span>
      
      <button type="button" onClick={() => insertMarkdown('[', '](https://example.com)', 'link text')} title="Link">
        <span>🔗</span>
      </button>
      <button type="button" onClick={() => insertMarkdown('![', '](https://example.com/image.jpg)', 'alt text')} title="Image">
        <span>🖼️</span>
      </button>
      <span className="toolbar-divider"></span>
      
      <button type="button" onClick={() => insertMarkdown('- ', '', 'list item')} title="Bullet List">
        <span>•</span>
      </button>
      <button type="button" onClick={() => insertMarkdown('1. ', '', 'numbered item')} title="Numbered List">
        <span>1.</span>
      </button>
      <span className="toolbar-divider"></span>
      
      <button type="button" onClick={() => insertMarkdown('> ', '', 'quote')} title="Quote">
        <span>❝</span>
      </button>
      <button type="button" onClick={() => insertMarkdown('```\n', '\n```', 'code')} title="Code Block">
        <span>{'</>'}</span>
      </button>
      <button 
        type="button" 
        onClick={() => window.open('https://www.markdownguide.org/cheat-sheet/', '_blank')}
        title="Markdown Syntax Guide" 
        className="help-button"
      >
        <span>?</span>
      </button>
    </div>
  );
};

MarkdownToolbar.propTypes = {
  onInsert: PropTypes.func.isRequired
};

export default MarkdownToolbar;
