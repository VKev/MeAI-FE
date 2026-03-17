import { Button } from '@/components/ui/button';
import { MenuBar } from '@/components/rich-text-editor/MenuBar';
import type { Editor } from '@tiptap/core';
import { useMemo, useState } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';

function ContentCreation() {
  const [hasGenerated, setHasGenerated] = useState(false);
  const [isEditorEmpty, setIsEditorEmpty] = useState(true);

  const editor = useEditor({
    extensions: [StarterKit],
    content: '',
    immediatelyRender: false,
    onCreate: ({ editor: currentEditor }: { editor: Editor }) => {
      setIsEditorEmpty(currentEditor.getText().trim().length === 0);
    },
    onUpdate: ({ editor: currentEditor }: { editor: Editor }) => {
      setIsEditorEmpty(currentEditor.getText().trim().length === 0);
    }
  });

  const generateLabel = useMemo(() => (hasGenerated ? 'Regenerate' : 'Generate'), [hasGenerated]);

  return (
    <section className='sticky top-24'>
      <div className='rounded-2xl border border-white/10 bg-zinc-950'>
        <div className='border-b border-white/10 px-6 py-4'>
          <h2 className='text-lg font-semibold text-white'>Content Creation</h2>
        </div>

        <div className='space-y-5 p-6'>
          <div className='space-y-3'>
            <MenuBar editor={editor} />

            <div className='min-h-80 rounded-xl border border-white/10 bg-[linear-gradient(180deg,rgba(10,12,20,0.82)_0%,rgba(8,10,16,0.9)_100%)] p-4'>
              <EditorContent editor={editor} className='post-builder-editor text-zinc-100' />
            </div>
          </div>

          <div className='border-t border-white/10 pt-5 flex items-center justify-center gap-3'>
            <Button
              type='button'
              className='w-1/3 bg-purple-600 text-white hover:bg-purple-700'
              onClick={() => setHasGenerated(true)}
              disabled={isEditorEmpty}
            >
              {generateLabel}
            </Button>
            <Button
              type='button'
              variant='outline'
              className='w-2/3 border-purple-600 bg-zinc-950 text-purple-300 hover:bg-purple-950/40 hover:text-purple-200'
            >
              Save Draft
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

export default ContentCreation;
