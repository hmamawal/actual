# Chat Text Selection and Copy Feature

## Overview

Added text selection and copy functionality to the AI Chat widget, allowing users to:

1. **Copy All Messages** via right-click context menu
2. **Select and Copy** text by highlighting with mouse drag
3. **Copy Individual Messages** by selecting specific text

## Implementation Details

### Files Modified

- **[packages/desktop-client/src/components/ChatWidget.tsx](packages/desktop-client/src/components/ChatWidget.tsx)**

### Features Added

#### 1. **Right-Click Context Menu**

- Right-click anywhere in the messages area displays a context menu
- Single option: "📋 Copy All Messages"
- Copies all messages (both user and AI) to clipboard in a readable format
- Menu automatically closes when clicking outside or after selecting an option

**Implementation:**

- Added `handleMessagesContextMenu` function to detect right-click events on messages container
- Added `handleCopyAllMessages` function to format and copy all messages
- Messages are formatted as:

  ```
  You: [user message]

  AI Assistant: [assistant response]

  You: [next user message]
  ...
  ```

#### 2. **Text Selection and Manual Copying**

- Messages are now selectable by default (users can click and drag to highlight)
- Selected text can be copied using standard keyboard shortcut (Ctrl+C / Cmd+C)
- Works for:
  - Individual message selection
  - Selecting across multiple messages
  - Partial message selection

**Implementation:**

- Changed message container `userSelect` CSS property from `'none'` to `'text'`
- Applied `userSelect: 'text'` to individual message containers
- Messages are selectable without affecting UI interaction

#### 3. **Context Menu UI**

- Fixed positioning (doesn't move with scroll)
- Styled to match the application theme:
  - Clean white background
  - Subtle border and shadow
  - Hover effect on button
- Closes automatically when:
  - User clicks outside the menu
  - User clicks the copy button
  - User opens a new menu

### Key Code Changes

#### State Addition

```typescript
type ContextMenuState = {
  x: number;
  y: number;
} | null;

const [contextMenu, setContextMenu] = useState<ContextMenuState>(null);
```

#### Event Handlers

```typescript
const handleCopyAllMessages = () => {
  if (!currentConversation?.messages) return;

  const allMessages = currentConversation.messages
    .map(msg => {
      const senderLabel = msg.sender === 'user' ? 'You' : 'AI Assistant';
      return `${senderLabel}: ${msg.content}`;
    })
    .join('\n\n');

  navigator.clipboard.writeText(allMessages).then(() => {
    setContextMenu(null);
  });
};

const handleMessagesContextMenu = (e: any) => {
  e.preventDefault();
  if (
    currentConversation?.messages &&
    currentConversation.messages.length > 0
  ) {
    setContextMenu({ x: e.clientX, y: e.clientY });
  }
};
```

#### Context Menu Close Handler

```typescript
useEffect(() => {
  const handleClickOutside = () => {
    setContextMenu(null);
  };

  if (contextMenu) {
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }
}, [contextMenu]);
```

### Styling Changes

1. **Messages Container**
   - Added `onContextMenu={handleMessagesContextMenu}` event handler
   - Changed to `userSelect: 'text'` to enable selection
   - Added `position: 'relative'` for proper context menu positioning

2. **Individual Message Boxes**
   - Added `userSelect: 'text'` to preserve selectability
   - Inherits from parent container

3. **UI Header/Controls**
   - Remains `userSelect: 'none'` to prevent accidental selection while dragging the widget

### Browser Compatibility

- Uses `navigator.clipboard.writeText()` API (supported in all modern browsers)
- Fallback: Users can still manually select and copy using Ctrl+C / Cmd+C
- Context menu uses standard mouse events

### User Experience

#### Usage Instructions

**To copy all messages:**

1. Open the AI Chat widget
2. Right-click anywhere in the message area
3. Click "📋 Copy All Messages" in the context menu
4. Messages are copied to your clipboard ready to paste

**To copy specific text:**

1. Click and drag to select the text you want
2. Use Ctrl+C (Windows/Linux) or Cmd+C (Mac) to copy
3. Paste anywhere with Ctrl+V or Cmd+V

### Testing Recommendations

1. **Right-click functionality:**
   - Open chat
   - Send some messages
   - Right-click on messages area
   - Verify context menu appears
   - Click "Copy All Messages"
   - Paste and verify format is correct

2. **Text selection:**
   - Highlight individual messages
   - Highlight across multiple messages
   - Copy and paste to verify content

3. **Context menu behavior:**
   - Right-click to open menu
   - Click outside to close
   - Right-click again to open at new location
   - Verify menu z-index is above chat widget

### Future Enhancements

Potential improvements:

1. Add "Copy Single Message" option to right-click menu
2. Add "Export as JSON" option for programmatic access
3. Add "Copy as Markdown" for better formatting
4. Add toast notification confirmation after copying
5. Remember cursor position when scrolling/copying
6. Add keyboard shortcuts (e.g., Ctrl+Shift+C for copy all)

## No Breaking Changes

- All existing functionality remains unchanged
- Widget still draggable
- Chat history still saves normally
- All other interactions unaffected
