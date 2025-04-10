<script>
    import { onMount, onDestroy, createEventDispatcher } from 'svelte';
    
    // Props
    export let content = '';
    export let placeholder = 'Write your content here...';
    
    // State
    let editor;
    let editorElement;
    let editorLoaded = false;
    let currentContent = content;
    
    const dispatch = createEventDispatcher();
    
    // Load TipTap editor
    onMount(async () => {
      try {
        // Dynamically import to avoid SSR issues with Astro
        const { Editor } = await import('@tiptap/core');
        const { default: StarterKit } = await import('@tiptap/starter-kit');
        const { default: Placeholder } = await import('@tiptap/extension-placeholder');
        const { default: Image } = await import('@tiptap/extension-image');
        const { default: Link } = await import('@tiptap/extension-link');
        const { default: TextAlign } = await import('@tiptap/extension-text-align');
        const { default: Table } = await import('@tiptap/extension-table');
        const { default: TableRow } = await import('@tiptap/extension-table-row');
        const { default: TableCell } = await import('@tiptap/extension-table-cell');
        const { default: TableHeader } = await import('@tiptap/extension-table-header');
        const { default: CodeBlockLowlight } = await import('@tiptap/extension-code-block-lowlight');
        const { lowlight } = await import('lowlight');
        
        // Initialize editor
        editor = new Editor({
          element: editorElement,
          extensions: [
            StarterKit.configure({
              heading: {
                levels: [1, 2, 3, 4, 5, 6]
              }
            }),
            Placeholder.configure({
              placeholder,
            }),
            Image.configure({
              inline: true,
              allowBase64: true,
            }),
            Link.configure({
              openOnClick: false,
              linkOnPaste: true,
            }),
            TextAlign.configure({
              types: ['heading', 'paragraph'],
            }),
            Table.configure({
              resizable: true,
            }),
            TableRow,
            TableCell,
            TableHeader,
            CodeBlockLowlight.configure({
              lowlight,
            }),
          ],
          content: currentContent,
          autofocus: false,
          onUpdate: ({ editor }) => {
            // Convert to Markdown/MDX for storage
            const html = editor.getHTML();
            currentContent = htmlToMarkdown(html);
            dispatch('update', currentContent);
          },
        });
        
        editorLoaded = true;
      } catch (error) {
        console.error('Failed to load editor:', error);
      }
    });
    
    onDestroy(() => {
      if (editor) {
        editor.destroy();
      }
    });
    
    // Update content if prop changes
    $: if (editor && content !== currentContent) {
      currentContent = content;
      editor.commands.setContent(content, false);
    }
    
    // Editor commands
    function formatText(command, option) {
      if (!editor) return;
      
      switch (command) {
        case 'heading':
          editor.chain().focus().toggleHeading({ level: option }).run();
          break;
        case 'bold':
          editor.chain().focus().toggleBold().run();
          break;
        case 'italic':
          editor.chain().focus().toggleItalic().run();
          break;
        case 'strike':
          editor.chain().focus().toggleStrike().run();
          break;
        case 'code':
          editor.chain().focus().toggleCode().run();
          break;
        case 'codeBlock':
          editor.chain().focus().toggleCodeBlock().run();
          break;
        case 'paragraph':
          editor.chain().focus().setParagraph().run();
          break;
        case 'bulletList':
          editor.chain().focus().toggleBulletList().run();
          break;
        case 'orderedList':
          editor.chain().focus().toggleOrderedList().run();
          break;
        case 'blockquote':
          editor.chain().focus().toggleBlockquote().run();
          break;
        case 'align':
          editor.chain().focus().setTextAlign(option).run();
          break;
        case 'link':
          const url = prompt('URL', 'https://');
          if (url) {
            editor.chain().focus().setLink({ href: url }).run();
          }
          break;
        case 'unlink':
          editor.chain().focus().unsetLink().run();
          break;
        case 'image':
          const imageUrl = prompt('Image URL', 'https://');
          if (imageUrl) {
            editor.chain().focus().setImage({ src: imageUrl }).run();
          }
          break;
        case 'table':
          editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
          break;
        case 'undo':
          editor.chain().focus().undo().run();
          break;
        case 'redo':
          editor.chain().focus().redo().run();
          break;
      }
    }
    
    // Utility to convert HTML to Markdown
    function htmlToMarkdown(html) {
      // If the content is empty, return empty string
      if (!html || html === '<p></p>') return '';
      
      // This is a very simplified version - in production you would want to use a library like turndown
      // but for the purposes of this demo, we'll do some basic conversions
      
      // Store code blocks to prevent them from being processed
      const codeBlocks = [];
      html = html.replace(/<pre><code[^>]*>([\s\S]*?)<\/code><\/pre>/g, (_, code) => {
        const id = codeBlocks.length;
        codeBlocks.push(code);
        return `CODE_BLOCK_${id}`;
      });
      
      let markdown = html
        // Headings
        .replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n\n')
        .replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n\n')
        .replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n\n')
        .replace(/<h4[^>]*>(.*?)<\/h4>/gi, '#### $1\n\n')
        .replace(/<h5[^>]*>(.*?)<\/h5>/gi, '##### $1\n\n')
        .replace(/<h6[^>]*>(.*?)<\/h6>/gi, '###### $1\n\n')
        
        // Bold and Italic
        .replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**')
        .replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**')
        .replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*')
        .replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*')
        
        // Lists
        .replace(/<ul[^>]*>([\s\S]*?)<\/ul>/gi, (_, content) => {
          return content.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, '- $1\n');
        })
        .replace(/<ol[^>]*>([\s\S]*?)<\/ol>/gi, (_, content) => {
          let index = 1;
          return content.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, () => {
            return `${index++}. $1\n`;
          });
        })
        
        // Links and Images
        .replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '[$2]($1)')
        .replace(/<img[^>]*src="([^"]*)"[^>]*>/gi, '![]($1)')
        
        // Blockquotes
        .replace(/<blockquote[^>]*>([\s\S]*?)<\/blockquote>/gi, (_, content) => {
          return content.split('\n').map(line => `> ${line}`).join('\n');
        })
        
        // Inline code
        .replace(/<code[^>]*>(.*?)<\/code>/gi, '`$1`')
        
        // Tables (simplified)
        .replace(/<table[^>]*>([\s\S]*?)<\/table>/gi, (_, content) => {
          let markdown = '';
          let headerRow = '';
          let separatorRow = '';
          
          // Process header row
          content = content.replace(/<thead[^>]*>([\s\S]*?)<\/thead>/gi, (_, header) => {
            header.replace(/<th[^>]*>(.*?)<\/th>/gi, (__, cell) => {
              headerRow += `| ${cell.trim()} `;
              separatorRow += '| --- ';
              return '';
            });
            
            return '';
          });
          
          if (headerRow) {
            markdown += headerRow + '|\n' + separatorRow + '|\n';
          }
          
          // Process body rows
          content.replace(/<tr[^>]*>([\s\S]*?)<\/tr>/gi, (_, row) => {
            let markdownRow = '';
            
            row.replace(/<td[^>]*>(.*?)<\/td>/gi, (__, cell) => {
              markdownRow += `| ${cell.trim()} `;
              return '';
            });
            
            if (markdownRow) {
              markdown += markdownRow + '|\n';
            }
            
            return '';
          });
          
          return markdown;
        })
        
        // Paragraphs and line breaks
        .replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n')
        .replace(/<br\s*\/?>/gi, '\n');
      
      // Restore code blocks
      markdown = markdown.replace(/CODE_BLOCK_(\d+)/g, (_, id) => {
        return '```\n' + codeBlocks[parseInt(id)].replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&') + '\n```';
      });
      
      // Clean up extra spaces and normalize linebreaks
      markdown = markdown
        .replace(/&nbsp;/g, ' ')
        .replace(/\n\s*\n\s*\n/g, '\n\n')
        .trim();
        
      return markdown;
    }
    
    // Check if a format is active in the editor
    function isActive(format, options = {}) {
      if (!editor) return false;
      
      if (format === 'heading' && options.level) {
        return editor.isActive('heading', { level: options.level });
      }
      
      return editor.isActive(format, options);
    }
  </script>
  
  <div class="rich-text-editor w-full">
    <!-- Toolbar -->
    <div class="flex flex-wrap gap-1 p-1 bg-neutral-100 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 rounded-t text-neutral-700 dark:text-neutral-300">
      <!-- Text format buttons -->
      <div class="flex items-center">
        <select 
          class="h-8 px-2 bg-white dark:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 rounded text-sm"
          on:change={(e) => {
            const value = e.target.value;
            if (value === 'paragraph') {
              formatText('paragraph');
            } else if (value.startsWith('heading-')) {
              formatText('heading', parseInt(value.split('-')[1]));
            }
          }}
        >
          <option value="paragraph" selected={isActive('paragraph')}>Paragraph</option>
          <option value="heading-1" selected={isActive('heading', { level: 1 })}>Heading 1</option>
          <option value="heading-2" selected={isActive('heading', { level: 2 })}>Heading 2</option>
          <option value="heading-3" selected={isActive('heading', { level: 3 })}>Heading 3</option>
        </select>
      </div>
      
      <div class="w-px h-8 bg-neutral-300 dark:bg-neutral-600 mx-1"></div>
      
      <!-- Text style buttons -->
      <button 
        type="button" 
        on:click={() => formatText('bold')} 
        class="p-1.5 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700 {isActive('bold') ? 'bg-neutral-200 dark:bg-neutral-700' : ''}" 
        title="Bold"
      >
        <span class="font-bold">B</span>
      </button>
      <button 
        type="button" 
        on:click={() => formatText('italic')} 
        class="p-1.5 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700 {isActive('italic') ? 'bg-neutral-200 dark:bg-neutral-700' : ''}" 
        title="Italic"
      >
        <span class="italic">I</span>
      </button>
      <button 
        type="button" 
        on:click={() => formatText('strike')} 
        class="p-1.5 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700 {isActive('strike') ? 'bg-neutral-200 dark:bg-neutral-700' : ''}" 
        title="Strikethrough"
      >
        <span class="line-through">S</span>
      </button>
      <button 
        type="button" 
        on:click={() => formatText('code')} 
        class="p-1.5 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700 {isActive('code') ? 'bg-neutral-200 dark:bg-neutral-700' : ''}" 
        title="Inline Code"
      >
        <span class="font-mono">{'<>'}</span>
      </button>
      
      <div class="w-px h-8 bg-neutral-300 dark:bg-neutral-600 mx-1"></div>
      
      <!-- List buttons -->
      <button 
        type="button" 
        on:click={() => formatText('bulletList')} 
        class="p-1.5 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700 {isActive('bulletList') ? 'bg-neutral-200 dark:bg-neutral-700' : ''}" 
        title="Bullet List"
      >
        <span>•</span>
      </button>
      <button 
        type="button" 
        on:click={() => formatText('orderedList')} 
        class="p-1.5 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700 {isActive('orderedList') ? 'bg-neutral-200 dark:bg-neutral-700' : ''}" 
        title="Numbered List"
      >
        <span>1.</span>
      </button>
      <button 
        type="button" 
        on:click={() => formatText('blockquote')} 
        class="p-1.5 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700 {isActive('blockquote') ? 'bg-neutral-200 dark:bg-neutral-700' : ''}" 
        title="Quote"
      >
        <span>"</span>
      </button>
      
      <div class="w-px h-8 bg-neutral-300 dark:bg-neutral-600 mx-1"></div>
      
      <!-- Link and media buttons -->
      <button 
        type="button" 
        on:click={() => formatText('link')} 
        class="p-1.5 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700 {isActive('link') ? 'bg-neutral-200 dark:bg-neutral-700' : ''}" 
        title="Add Link"
      >
        <span>🔗</span>
      </button>
      <button 
        type="button" 
        on:click={() => formatText('image')}
        class="p-1.5 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700" 
        title="Add Image"
      >
        <span>🖼️</span>
      </button>
      <button 
        type="button" 
        on:click={() => formatText('codeBlock')} 
        class="p-1.5 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700 {isActive('codeBlock') ? 'bg-neutral-200 dark:bg-neutral-700' : ''}" 
        title="Code Block"
      >
        <span class="font-mono tracking-tighter">{ '{ }' }</span>
      </button>
      <button 
        type="button" 
        on:click={() => formatText('table')}
        class="p-1.5 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700" 
        title="Insert Table"
      >
        <span>⊞</span>
      </button>
      
      <div class="w-px h-8 bg-neutral-300 dark:bg-neutral-600 mx-1"></div>
      
      <!-- Undo/Redo buttons -->
      <button 
        type="button" 
        on:click={() => formatText('undo')}
        class="p-1.5 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700" 
        title="Undo"
      >
        <span>↩</span>
      </button>
      <button 
        type="button" 
        on:click={() => formatText('redo')}
        class="p-1.5 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700" 
        title="Redo"
      >
        <span>↪</span>
      </button>
    </div>
    
    <!-- Editor container -->
    <div 
      bind:this={editorElement}
      class="rich-text-editor__content w-full p-3 min-h-[400px] max-h-[700px] overflow-y-auto bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 border-t-0 rounded-b text-sm text-neutral-900 dark:text-white focus:outline-none"
    ></div>
  </div>
  
  <style>
    /* Editor content styles */
    :global(.rich-text-editor__content) {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";
    }
    
    :global(.rich-text-editor__content p) {
      margin-bottom: 0.75em;
    }
    
    :global(.rich-text-editor__content h1) {
      font-size: 1.75em;
      font-weight: bold;
      margin: 1em 0 0.5em;
    }
    
    :global(.rich-text-editor__content h2) {
      font-size: 1.5em;
      font-weight: bold;
      margin: 1em 0 0.5em;
    }
    
    :global(.rich-text-editor__content h3) {
      font-size: 1.25em;
      font-weight: bold;
      margin: 1em 0 0.5em;
    }
    
    :global(.rich-text-editor__content a) {
      color: #3b82f6;
      text-decoration: underline;
    }
    
    :global(.dark .rich-text-editor__content a) {
      color: #60a5fa;
    }
    
    :global(.rich-text-editor__content ul) {
      list-style-type: disc;
      margin-left: 1.5em;
      margin-bottom: 1em;
    }
    
    :global(.rich-text-editor__content ol) {
      list-style-type: decimal;
      margin-left: 1.5em;
      margin-bottom: 1em;
    }
    
    :global(.rich-text-editor__content blockquote) {
      border-left: 3px solid #d1d5db;
      padding-left: 1em;
      color: #6b7280;
      margin: 1em 0;
    }
    
    :global(.dark .rich-text-editor__content blockquote) {
      border-left-color: #4b5563;
      color: #9ca3af;
    }
    
    :global(.rich-text-editor__content pre) {
      background-color: #f3f4f6;
      padding: 0.75em 1em;
      border-radius: 0.25em;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
      overflow-x: auto;
      margin: 1em 0;
    }
    
    :global(.dark .rich-text-editor__content pre) {
      background-color: #1f2937;
    }
    
    :global(.rich-text-editor__content code) {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
      background-color: #f3f4f6;
      padding: 0.125em 0.25em;
      border-radius: 0.25em;
    }
    
    :global(.dark .rich-text-editor__content code) {
      background-color: #1f2937;
    }
    
    :global(.rich-text-editor__content img) {
      max-width: 100%;
      height: auto;
    }
    
    :global(.rich-text-editor__content table) {
      border-collapse: collapse;
      width: 100%;
      margin: 1em 0;
      overflow-x: auto;
      display: block;
    }
    
    :global(.rich-text-editor__content th) {
      border: 1px solid #d1d5db;
      padding: 0.5em;
      background-color: #f3f4f6;
      font-weight: bold;
    }
    
    :global(.dark .rich-text-editor__content th) {
      border-color: #4b5563;
      background-color: #1f2937;
    }
    
    :global(.rich-text-editor__content td) {
      border: 1px solid #d1d5db;
      padding: 0.5em;
    }
    
    :global(.dark .rich-text-editor__content td) {
      border-color: #4b5563;
    }
    
    :global(.rich-text-editor__content .ProseMirror) {
      outline: none;
      min-height: 350px;
    }
    
    :global(.rich-text-editor__content .ProseMirror p.is-editor-empty:first-child::before) {
      content: attr(data-placeholder);
      float: left;
      color: #9ca3af;
      pointer-events: none;
      height: 0;
    }
  </style>