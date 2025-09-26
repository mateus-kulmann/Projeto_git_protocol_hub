import React, { useRef, useState, forwardRef, useImperativeHandle } from 'react';
import { Bold, Italic, List, Link, Smile, AtSign, Type } from 'lucide-react';

interface Mention {
  id: string;
  value: string;
  type: 'user' | 'department';
  name: string;
  email?: string;
}

interface RichTextEditorProps {
  value?: string;
  onChange?: (content: string, mentions: Mention[]) => void;
  placeholder?: string;
  protocolId?: string;
  height?: number;
  disabled?: boolean;
  className?: string;
}

export interface RichTextEditorRef {
  getContent: () => string;
  getMentions: () => Mention[];
  setContent: (content: string) => void;
  focus: () => void;
  clear: () => void;
}

const RichTextEditor = forwardRef<RichTextEditorRef, RichTextEditorProps>(({
  value = '',
  onChange,
  placeholder = 'Digite seu texto...',
  protocolId,
  height = 200,
  disabled = false,
  className = ''
}, ref) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [content, setContent] = useState(value);
  const [mentions, setMentions] = useState<Mention[]>([]);
  const [showMentionSuggestions, setShowMentionSuggestions] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionPosition, setMentionPosition] = useState<number>(0);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });

  // Mock data for mentions
  const availableMentions: Mention[] = [
    {
      id: 'user-1',
      value: '@admin',
      type: 'user',
      name: 'Administrador',
      email: 'admin@demo.local'
    },
    {
      id: 'user-2', 
      value: '@joao',
      type: 'user',
      name: 'João Silva',
      email: 'joao@demo.local'
    },
    {
      id: 'dept-1',
      value: '@ti',
      type: 'department',
      name: 'TI'
    },
    {
      id: 'dept-2',
      value: '@rh',
      type: 'department',
      name: 'RH'
    }
  ];

  // Comprehensive emoji collection organized by categories
  const emojiCategories = {
    '😊': [
      '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃',
      '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😙',
      '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔',
      '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥',
      '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢', '🤮', '🤧',
      '🥵', '🥶', '🥴', '😵', '🤯', '🤠', '🥳', '😎', '🤓', '🧐',
      '😕', '😟', '🙁', '☹️', '😮', '😯', '😲', '😳', '🥺', '😦',
      '😧', '😨', '😰', '😥', '😢', '😭', '😱', '😖', '😣', '😞',
      '😓', '😩', '😫', '🥱', '😤', '😡', '🤬', '😠', '🤯', '😈',
      '👿', '💀', '☠️', '💩', '🤡', '👹', '👺', '👻', '👽', '👾'
    ],
    '👍': [
      '👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤏', '✌️', '🤞', '🤟',
      '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👍', '👎',
      '👊', '✊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🤝', '🙏',
      '✍️', '💅', '🤳', '💪', '🦾', '🦿', '🦵', '🦶', '👂', '🦻',
      '👃', '🧠', '🦷', '🦴', '👀', '👁️', '👅', '👄', '💋', '🩸'
    ],
    '🔧': [
      '📱', '💻', '🖥️', '🖨️', '⌨️', '🖱️', '🖲️', '💽', '💾', '💿',
      '📀', '🧮', '🔨', '⚒️', '🛠️', '🔧', '🔩', '⚙️', '🧰', '🧲',
      '💼', '🏢', '🏬', '🏭', '🏪', '🏫', '🏦', '🏛️', '⚖️', '🔍',
      '🔎', '🕯️', '💡', '🔦', '🏮', '🪔', '💰', '💴', '💵', '💶'
    ],
    '📧': [
      '📧', '📨', '📩', '📤', '📥', '📦', '📫', '📪', '📬', '📭',
      '📮', '🗳️', '✏️', '✒️', '🖋️', '🖊️', '🖌️', '🖍️', '📝', '💼',
      '📁', '📂', '🗂️', '📅', '📆', '🗒️', '🗓️', '📇', '📈', '📉',
      '📊', '📋', '📌', '📍', '📎', '🖇️', '📏', '📐', '✂️', '🗃️'
    ],
    '🚀': [
      '🚗', '🚕', '🚙', '🚌', '🚎', '🏎️', '🚓', '🚑', '🚒', '🚐',
      '🛻', '🚚', '🚛', '🚜', '🏍️', '🛵', '🚲', '🛴', '🛹', '🛼',
      '🚁', '🛸', '✈️', '🛩️', '🛫', '🛬', '🪂', '💺', '🚀', '🛰️',
      '🚢', '⛵', '🚤', '🛥️', '🛳️', '⛴️', '🚂', '🚃', '🚄', '🚅'
    ],
    '🌎': [
      '🌍', '🌎', '🌏', '🌐', '🗺️', '🗾', '🧭', '🏔️', '⛰️', '🌋',
      '🗻', '🏕️', '🏖️', '🏜️', '🏝️', '🏞️', '🏟️', '🏛️', '🏗️', '🧱',
      '🏘️', '🏚️', '🏠', '🏡', '🏢', '🏣', '🏤', '🏥', '🏦', '🏨',
      '🏩', '🏪', '🏫', '🏬', '🏭', '🏯', '🏰', '🗼', '🗽', '⛪'
    ],
    '🍎': [
      '🍎', '🍏', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐', '🍈',
      '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🍆', '🥑', '🥦',
      '🥬', '🥒', '🌶️', '🫑', '🌽', '🥕', '🫒', '🧄', '🧅', '🥔',
      '🍠', '🥐', '🥖', '🍞', '🥨', '🥯', '🧀', '🥚', '🍳', '🧈'
    ],
    '🎮': [
      '⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱',
      '🪀', '🏓', '🏸', '🏒', '🏑', '🥍', '🏏', '🪃', '🥅', '⛳',
      '🪁', '🏹', '🎣', '🤿', '🥊', '🥋', '🎽', '🛹', '🛷', '🎮'
    ],
    '❤️': [
      '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔',
      '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '☮️',
      '✝️', '☪️', '🕉️', '☸️', '✡️', '🔯', '🕎', '☯️', '☦️', '🛐',
      '⛎', '♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐'
    ]
  };

  // Flatten all emojis for search
  const allEmojis = Object.values(emojiCategories).flat();
  const [selectedEmojiCategory, setSelectedEmojiCategory] = useState('😊');
  const [emojiSearch, setEmojiSearch] = useState('');

  // Filter emojis based on search
  const getFilteredEmojis = () => {
    if (emojiSearch) {
      return allEmojis.filter(emoji => {
        // Simple search - could be enhanced with emoji names
        return true; // For now, show all when searching
      });
    }
    return emojiCategories[selectedEmojiCategory] || [];
  };

  // Expose methods via ref
  useImperativeHandle(ref, () => ({
    getContent: () => content,
    getMentions: () => mentions,
    setContent: (newContent: string) => {
      setContent(newContent);
      extractMentions(newContent);
    },
    focus: () => {
      textareaRef.current?.focus();
    },
    clear: () => {
      setContent('');
      setMentions([]);
    }
  }));

  // Extract mentions from content
  const extractMentions = (text: string) => {
    const mentionRegex = /@(\w+)/g;
    const extractedMentions: Mention[] = [];
    let match;
    
    while ((match = mentionRegex.exec(text)) !== null) {
      const mentionValue = `@${match[1]}`;
      const mentionData = availableMentions.find(m => m.value === mentionValue);
      if (mentionData && !extractedMentions.find(em => em.id === mentionData.id)) {
        extractedMentions.push(mentionData);
      }
    }
    
    setMentions(extractedMentions);
  };

  // Calculate cursor position in pixels
  const getCursorPosition = (textarea: HTMLTextAreaElement, cursorIndex: number) => {
    // Create a temporary div to measure text
    const div = document.createElement('div');
    const style = window.getComputedStyle(textarea);
    
    // Copy textarea styles to div
    div.style.position = 'absolute';
    div.style.visibility = 'hidden';
    div.style.whiteSpace = 'pre-wrap';
    div.style.wordWrap = 'break-word';
    div.style.font = style.font;
    div.style.fontSize = style.fontSize;
    div.style.fontFamily = style.fontFamily;
    div.style.fontWeight = style.fontWeight;
    div.style.lineHeight = style.lineHeight;
    div.style.letterSpacing = style.letterSpacing;
    div.style.padding = style.padding;
    div.style.border = style.border;
    div.style.width = style.width;
    div.style.height = 'auto';
    div.style.overflow = 'hidden';
    
    document.body.appendChild(div);
    
    // Get text up to cursor position
    const textBeforeCursor = textarea.value.substring(0, cursorIndex);
    div.textContent = textBeforeCursor;
    
    // Create a span for the cursor position
    const span = document.createElement('span');
    span.textContent = '|';
    div.appendChild(span);
    
    // Get position relative to textarea
    const textareaRect = textarea.getBoundingClientRect();
    const spanRect = span.getBoundingClientRect();
    
    const position = {
      top: spanRect.top - textareaRect.top + textarea.scrollTop,
      left: spanRect.left - textareaRect.left + textarea.scrollLeft
    };
    
    document.body.removeChild(div);
    return position;
  };
  // Handle content change
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setContent(newContent);
    extractMentions(newContent);
    
    if (onChange) {
      onChange(newContent, mentions);
    }

    // Check for mention trigger
    const cursorPosition = e.target.selectionStart;
    const textBeforeCursor = newContent.substring(0, cursorPosition);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');
    
    if (lastAtIndex !== -1) {
      const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1);
      
      if (!textAfterAt.includes(' ') && textAfterAt.length >= 0) {
        setMentionQuery(textAfterAt);
        setMentionPosition(lastAtIndex);
        
        // Calculate dropdown position
        const cursorPos = getCursorPosition(e.target, cursorPosition);
        const containerRect = containerRef.current?.getBoundingClientRect();
        
        if (containerRect) {
          setDropdownPosition({
            top: cursorPos.top + 25, // 25px below cursor
            left: Math.min(cursorPos.left, containerRect.width - 250) // Ensure it doesn't overflow
          });
        }
        
        setShowMentionSuggestions(true);
      } else {
        setShowMentionSuggestions(false);
      }
    } else {
      setShowMentionSuggestions(false);
    }
  };

  // Filter mentions based on query
  const filteredMentions = availableMentions.filter(mention =>
    mention.name.toLowerCase().includes(mentionQuery.toLowerCase()) ||
    mention.value.toLowerCase().includes(mentionQuery.toLowerCase())
  );

  // Insert mention
  const insertMention = (mention: Mention) => {
    if (textareaRef.current) {
      const textarea = textareaRef.current;
      const start = mentionPosition;
      const end = mentionPosition + mentionQuery.length + 1; // +1 for @
      
      const newContent = content.substring(0, start) + mention.value + ' ' + content.substring(end);
      setContent(newContent);
      extractMentions(newContent);
      
      if (onChange) {
        onChange(newContent, mentions);
      }
      
      // Set cursor position after mention
      setTimeout(() => {
        const newCursorPos = start + mention.value.length + 1;
        textarea.setSelectionRange(newCursorPos, newCursorPos);
        textarea.focus();
      }, 0);
    }
    
    setShowMentionSuggestions(false);
    setMentionQuery('');
  };

  // Insert emoji
  const insertEmoji = (emoji: string) => {
    if (textareaRef.current) {
      const textarea = textareaRef.current;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      
      const newContent = content.substring(0, start) + emoji + ' ' + content.substring(end);
      setContent(newContent);
      extractMentions(newContent);
      
      if (onChange) {
        onChange(newContent, mentions);
      }
      
      // Set cursor position after emoji
      setTimeout(() => {
        const newCursorPos = start + emoji.length + 1;
        textarea.setSelectionRange(newCursorPos, newCursorPos);
        textarea.focus();
      }, 0);
    }
    
    setShowEmojiPicker(false);
  };

  // Insert text formatting
  const insertFormatting = (before: string, after: string = '') => {
    if (textareaRef.current) {
      const textarea = textareaRef.current;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selectedText = content.substring(start, end);
      
      const newContent = content.substring(0, start) + before + selectedText + after + content.substring(end);
      setContent(newContent);
      
      if (onChange) {
        onChange(newContent, mentions);
      }
      
      // Set cursor position
      setTimeout(() => {
        const newStart = start + before.length;
        const newEnd = newStart + selectedText.length;
        textarea.setSelectionRange(newStart, newEnd);
        textarea.focus();
      }, 0);
    }
  };

  return (
    <div ref={containerRef} className={`simple-rich-editor relative ${className}`}>
      {/* Toolbar */}
      <div className="border border-gray-300 border-b-0 rounded-t-lg bg-gray-50 p-2 flex items-center space-x-2 flex-wrap">
        <button
          type="button"
          onClick={() => insertFormatting('**', '**')}
          className="p-2 hover:bg-gray-200 rounded transition-colors"
          title="Negrito"
        >
          <Bold className="w-4 h-4" />
        </button>
        
        <button
          type="button"
          onClick={() => insertFormatting('*', '*')}
          className="p-2 hover:bg-gray-200 rounded transition-colors"
          title="Itálico"
        >
          <Italic className="w-4 h-4" />
        </button>
        
        <button
          type="button"
          onClick={() => insertFormatting('\n- ', '')}
          className="p-2 hover:bg-gray-200 rounded transition-colors"
          title="Lista"
        >
          <List className="w-4 h-4" />
        </button>
        
        <button
          type="button"
          onClick={() => insertFormatting('[', '](url)')}
          className="p-2 hover:bg-gray-200 rounded transition-colors"
          title="Link"
        >
          <Link className="w-4 h-4" />
        </button>
        
        <div className="w-px h-6 bg-gray-300"></div>
        
        <button
          type="button"
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          className="p-2 hover:bg-gray-200 rounded transition-colors"
          title="Emoji"
        >
          <Smile className="w-4 h-4" />
        </button>
        
        {/* Emoji picker dropdown - positioned relative to button */}
        {showEmojiPicker && (
          <div className="absolute z-50 bg-white border border-gray-200 rounded-lg shadow-lg w-80 max-h-96 overflow-hidden right-0 -top-12">
            {/* Search bar */}
            <div className="p-3 border-b border-gray-200">
              <input
                type="text"
                placeholder="Buscar emojis..."
                value={emojiSearch}
                onChange={(e) => setEmojiSearch(e.target.value)}
                className="w-full px-2 py-1 text-sm border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            {/* Category tabs */}
            {!emojiSearch && (
              <div className="flex border-b border-gray-200 bg-gray-50">
                {Object.keys(emojiCategories).map((category) => (
                  <button
                    key={category}
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setSelectedEmojiCategory(category);
                    }}
                    className={`flex-1 px-2 py-2 text-sm font-medium border-b-2 transition-colors ${
                      selectedEmojiCategory === category
                        ? 'border-blue-500 text-blue-600 bg-white'
                        : 'border-transparent text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            )}
            
            {/* Emoji grid */}
            <div className="p-3">
              <div className="grid grid-cols-8 gap-1 max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                {getFilteredEmojis().map((emoji, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      insertEmoji(emoji);
                    }}
                    className="text-xl hover:bg-gray-100 rounded p-1 transition-colors w-8 h-8 flex items-center justify-center"
                    title={emoji}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
              
              {getFilteredEmojis().length === 0 && (
                <div className="text-center py-4 text-gray-500 text-sm">
                  {emojiSearch ? 'Nenhum emoji encontrado' : 'Categoria vazia'}
                </div>
              )}
            </div>
            
            {/* Footer */}
            <div className="p-2 border-t border-gray-200 bg-gray-50">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">
                  {getFilteredEmojis().length} emojis
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowEmojiPicker(false);
                  }}
                  className="text-xs text-gray-500 hover:text-gray-700"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Textarea */}
      <textarea
        ref={textareaRef}
        value={content}
        onChange={handleChange}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full border border-gray-300 border-t-0 rounded-b-lg p-3 resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        style={{ 
          height: `${height}px`,
          minHeight: `${height}px`,
          maxHeight: `${height}px`
        }}
      />
      
      {/* Mention suggestions dropdown */}
      {showMentionSuggestions && (
        <div className="absolute z-50 bg-white border border-gray-200 rounded-lg shadow-lg w-80 max-h-96 overflow-hidden right-0 -top-12">
          <div className="p-2 border-b border-gray-100">
            <input
              type="text"
              placeholder="Buscar pessoas ou setores..."
              value={mentionQuery}
              onChange={(e) => setMentionQuery(e.target.value)}
              className="w-full px-2 py-1 text-sm border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="max-h-32 overflow-y-auto">
            {filteredMentions.map((mention) => (
              <button
                key={mention.id}
                type="button"
                onClick={() => insertMention(mention)}
                className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center space-x-2"
              >
                <span className="text-lg">
                  {mention.type === 'user' ? '👤' : '🏢'}
                </span>
                <div>
                  <div className="font-medium text-sm">{mention.name}</div>
                  <div className="text-xs text-gray-500">{mention.value}</div>
                </div>
              </button>
            ))}
            {filteredMentions.length === 0 && (
              <div className="px-3 py-2 text-sm text-gray-500">
                Nenhuma pessoa ou setor encontrado
              </div>
            )}
          </div>
          <div className="p-2 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setShowMentionSuggestions(false)}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
      
      {/* Mentions preview */}
      {mentions.length > 0 && (
        <div className="mt-2 p-2 bg-blue-50 rounded-lg border border-blue-200">
          <div className="text-xs font-medium text-blue-800 mb-1">
            Menções nesta mensagem:
          </div>
          <div className="flex flex-wrap gap-1">
            {mentions.map((mention) => (
              <span
                key={mention.id}
                className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  mention.type === 'user'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-green-100 text-green-800'
                }`}
              >
                {mention.type === 'user' ? '👤' : '🏢'} {mention.name}
              </span>
            ))}
          </div>
        </div>
      )}
      
      {/* Help text */}
      <div className="mt-1 text-xs text-gray-500">
        💡 Use **texto** para negrito, *texto* para itálico, @ para mencionar pessoas/setores
      </div>
    </div>
  );
});

RichTextEditor.displayName = 'RichTextEditor';

export default RichTextEditor;
