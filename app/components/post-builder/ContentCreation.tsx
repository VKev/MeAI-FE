import { Button } from '@/components/ui/button';
import { MenuBar } from '@/components/rich-text-editor/MenuBar';
import type { Editor } from '@tiptap/core';
import { useEffect, useMemo, useRef, useState } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import usePostBuilder from '@/routes/post-builder/hooks/usePostBuilder';

function ContentCreation() {
  const [hasGenerated, setHasGenerated] = useState(false);
  const setRawContent = usePostBuilder((state) => state.setRawContent);
  const activePlatform = usePostBuilder((state) => state.activePlatform);
  const platformContents = usePostBuilder((state) => state.platformContents);
  const isSyncingRef = useRef(false);

  const handleContentChange = (currentEditor: Editor) => {
    if (isSyncingRef.current) {
      isSyncingRef.current = false;
      return;
    }

    const text = currentEditor.getText().trim();
    const htmlContent = currentEditor.getHTML();
    setRawContent({ content: text, htmlContent });
  };

  const editor = useEditor({
    extensions: [StarterKit],
    content: '',
    immediatelyRender: false,
    onCreate: ({ editor: currentEditor }: { editor: Editor }) => {
      handleContentChange(currentEditor);
    },
    onUpdate: ({ editor: currentEditor }: { editor: Editor }) => {
      handleContentChange(currentEditor);
    }
  });

  useEffect(() => {
    if (!editor) return;

    const nextHtml = platformContents[activePlatform]?.html || '';
    const currentHtml = editor.getHTML();
    const isNextEmpty = nextHtml.trim() === '';
    const isCurrentEmpty = currentHtml === '<p></p>' || currentHtml.trim() === '';

    if ((isNextEmpty && isCurrentEmpty) || currentHtml === nextHtml) {
      return;
    }

    isSyncingRef.current = true;
    editor.commands.setContent(nextHtml);
  }, [activePlatform, editor, platformContents]);

  const generateLabel = useMemo(() => (hasGenerated ? 'Regenerate' : 'Generate'), [hasGenerated]);

  return (
    <div className='rounded-2xl border border-white/10 bg-zinc-950'>
      <div className='border-b border-white/10 px-6 py-4'>
        <h2 className='text-lg font-semibold text-white'>Content Creation</h2>
      </div>

      <div className='space-y-5 p-6'>
        <div className='space-y-3'>
          <MenuBar editor={editor} />

          <EditorContent
            editor={editor}
            onClick={() => editor?.chain().focus().run()}
            className='post-builder-editor rounded-xl border border-white/10 bg-[linear-gradient(180deg,rgba(10,12,20,0.82)_0%,rgba(8,10,16,0.9)_100%)]'
          />
        </div>

        <div className='border-t border-white/10 pt-5 flex items-center justify-center gap-3'>
          <Button
            type='button'
            className='w-1/3 bg-purple-600 text-white hover:bg-purple-700'
            onClick={() => setHasGenerated(true)}
          >
            {generateLabel}
          </Button>
          <Button
            type='button'
            className='w-2/3 border border-purple-600 bg-zinc-950 text-purple-300 hover:bg-purple-950/40 hover:text-purple-200'
          >
            Save Draft
          </Button>
        </div>
      </div>
    </div>
  );
}

export default ContentCreation;
