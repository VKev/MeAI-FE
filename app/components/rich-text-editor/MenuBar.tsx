import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { menuBarStateSelector } from '@/components/rich-text-editor/MenuBarState';
import type { Editor } from '@tiptap/core';
import { useEditorState } from '@tiptap/react';
import {
  Bold,
  Code,
  CornerDownLeft,
  Eraser,
  FileCode2,
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  Heading5,
  Heading6,
  Italic,
  List,
  ListOrdered,
  Minus,
  MoreHorizontal,
  Pilcrow,
  Quote,
  Redo2,
  RemoveFormatting,
  Strikethrough,
  Undo2
} from 'lucide-react';

export const MenuBar = ({ editor }: { editor: Editor | null }) => {
  const editorState = useEditorState({
    editor,
    selector: menuBarStateSelector
  });

  if (!editor || !editorState) {
    return null;
  }

  const btn = (active?: boolean) =>
    cn(
      'size-8 shrink-0 rounded-md text-zinc-300 transition-colors hover:bg-purple-700/30 hover:text-purple-100 flex items-center justify-center',
      active && 'bg-purple-700/45 text-purple-100 ring-1 ring-purple-500/70'
    );

  const dropItem =
    'flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm text-zinc-200 hover:bg-purple-700/30 hover:text-purple-100 focus:bg-purple-700/30 focus:text-purple-100 focus:outline-none';

  return (
    <div className='flex items-center gap-0.5 rounded-xl border border-white/10 bg-[linear-gradient(180deg,rgba(10,12,20,0.82)_0%,rgba(8,10,16,0.9)_100%)] px-2 py-1.5'>
      {/* ── Main actions ── */}
      <button
        type='button'
        aria-pressed={editorState.isBold}
        className={btn(editorState.isBold)}
        onClick={() => editor.chain().focus().toggleBold().run()}
        disabled={!editorState.canBold}
        title='Bold'
      >
        <Bold className='size-4' />
      </button>
      <button
        type='button'
        aria-pressed={editorState.isItalic}
        className={btn(editorState.isItalic)}
        onClick={() => editor.chain().focus().toggleItalic().run()}
        disabled={!editorState.canItalic}
        title='Italic'
      >
        <Italic className='size-4' />
      </button>
      <button
        type='button'
        aria-pressed={editorState.isStrike}
        className={btn(editorState.isStrike)}
        onClick={() => editor.chain().focus().toggleStrike().run()}
        disabled={!editorState.canStrike}
        title='Strikethrough'
      >
        <Strikethrough className='size-4' />
      </button>
      <button
        type='button'
        aria-pressed={editorState.isCode}
        className={btn(editorState.isCode)}
        onClick={() => editor.chain().focus().toggleCode().run()}
        disabled={!editorState.canCode}
        title='Inline code'
      >
        <Code className='size-4' />
      </button>

      <span className='mx-1 h-5 w-px bg-zinc-700' />

      <button
        type='button'
        aria-pressed={editorState.isBulletList}
        className={btn(editorState.isBulletList)}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        title='Bullet list'
      >
        <List className='size-4' />
      </button>
      <button
        type='button'
        aria-pressed={editorState.isOrderedList}
        className={btn(editorState.isOrderedList)}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        title='Ordered list'
      >
        <ListOrdered className='size-4' />
      </button>
      <button
        type='button'
        aria-pressed={editorState.isBlockquote}
        className={btn(editorState.isBlockquote)}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        title='Blockquote'
      >
        <Quote className='size-4' />
      </button>

      <span className='mx-1 h-5 w-px bg-zinc-700' />

      <button
        type='button'
        className={btn()}
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editorState.canUndo}
        title='Undo'
      >
        <Undo2 className='size-4' />
      </button>
      <button
        type='button'
        className={btn()}
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editorState.canRedo}
        title='Redo'
      >
        <Redo2 className='size-4' />
      </button>

      {/* ── More options ── */}
      <span className='mx-1 h-5 w-px bg-zinc-700' />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button type='button' className={btn()} title='More options'>
            <MoreHorizontal className='size-4' />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className='min-w-44 border-zinc-800 bg-zinc-950 p-1 shadow-lg shadow-black/40' align='end'>
          {/* Text blocks */}
          <DropdownMenuItem
            className={cn(dropItem, editorState.isParagraph && 'bg-purple-700/30 text-purple-100')}
            onSelect={() => editor.chain().focus().setParagraph().run()}
          >
            <Pilcrow className='size-4' /> Paragraph
          </DropdownMenuItem>
          <DropdownMenuItem
            className={cn(dropItem, editorState.isHeading1 && 'bg-purple-700/30 text-purple-100')}
            onSelect={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          >
            <Heading1 className='size-4' /> Heading 1
          </DropdownMenuItem>
          <DropdownMenuItem
            className={cn(dropItem, editorState.isHeading2 && 'bg-purple-700/30 text-purple-100')}
            onSelect={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          >
            <Heading2 className='size-4' /> Heading 2
          </DropdownMenuItem>
          <DropdownMenuItem
            className={cn(dropItem, editorState.isHeading3 && 'bg-purple-700/30 text-purple-100')}
            onSelect={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          >
            <Heading3 className='size-4' /> Heading 3
          </DropdownMenuItem>
          <DropdownMenuItem
            className={cn(dropItem, editorState.isHeading4 && 'bg-purple-700/30 text-purple-100')}
            onSelect={() => editor.chain().focus().toggleHeading({ level: 4 }).run()}
          >
            <Heading4 className='size-4' /> Heading 4
          </DropdownMenuItem>
          <DropdownMenuItem
            className={cn(dropItem, editorState.isHeading5 && 'bg-purple-700/30 text-purple-100')}
            onSelect={() => editor.chain().focus().toggleHeading({ level: 5 }).run()}
          >
            <Heading5 className='size-4' /> Heading 5
          </DropdownMenuItem>
          <DropdownMenuItem
            className={cn(dropItem, editorState.isHeading6 && 'bg-purple-700/30 text-purple-100')}
            onSelect={() => editor.chain().focus().toggleHeading({ level: 6 }).run()}
          >
            <Heading6 className='size-4' /> Heading 6
          </DropdownMenuItem>

          <DropdownMenuSeparator className='my-1 bg-zinc-800' />

          {/* Code & special blocks */}
          <DropdownMenuItem
            className={cn(dropItem, editorState.isCodeBlock && 'bg-purple-700/30 text-purple-100')}
            onSelect={() => editor.chain().focus().toggleCodeBlock().run()}
          >
            <FileCode2 className='size-4' /> Code block
          </DropdownMenuItem>
          <DropdownMenuItem className={dropItem} onSelect={() => editor.chain().focus().setHorizontalRule().run()}>
            <Minus className='size-4' /> Horizontal rule
          </DropdownMenuItem>
          <DropdownMenuItem className={dropItem} onSelect={() => editor.chain().focus().setHardBreak().run()}>
            <CornerDownLeft className='size-4' /> Hard break
          </DropdownMenuItem>

          <DropdownMenuSeparator className='my-1 bg-zinc-800' />

          {/* Clear */}
          <DropdownMenuItem className={dropItem} onSelect={() => editor.chain().focus().unsetAllMarks().run()}>
            <RemoveFormatting className='size-4' /> Clear marks
          </DropdownMenuItem>
          <DropdownMenuItem className={dropItem} onSelect={() => editor.chain().focus().clearNodes().run()}>
            <Eraser className='size-4' /> Clear nodes
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
