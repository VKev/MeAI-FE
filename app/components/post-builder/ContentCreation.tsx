import { Button } from '@/components/ui/button';
import { MenuBar } from '@/components/rich-text-editor/MenuBar';
import type { Editor } from '@tiptap/core';
import { useEffect, useMemo, useRef, useState } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import usePostBuilder, { type PostBuilderPlatform } from '@/routes/post-builder/hooks/usePostBuilder';
import { CheckIcon, Copy, Loader2 } from 'lucide-react';
import { useParams } from 'react-router';
import { PostPrepareClientApi } from '@/services/client/post-prepare.client';
import { PostBuilderClientApi } from '@/services/client/post-builder.client';
import { toast } from 'sonner';
import {
  ALL_PLATFORMS,
  buildCaptionPayloads,
  applyCaptionResults,
  loadSavedCaptions
} from './common/caption-utils';
import { PlatformPicker } from './common/PlatformPicker';

function ContentCreation() {
  const [hasGenerated, setHasGenerated] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [generatePlatforms, setGeneratePlatforms] = useState<Set<PostBuilderPlatform>>(new Set(ALL_PLATFORMS));
  const [showPlatformPicker, setShowPlatformPicker] = useState(false);
  const copyResetTimerRef = useRef<number | null>(null);
  const setRawContent = usePostBuilder((state) => state.setRawContent);
  const setPlatformContent = usePostBuilder((state) => state.setPlatformContent);
  const activePlatform = usePostBuilder((state) => state.activePlatform);
  const platformContents = usePostBuilder((state) => state.platformContents);
  const platformModes = usePostBuilder((state) => state.platformModes);
  const previewStates = usePostBuilder((state) => state.previewStates);
  const content = usePostBuilder((state) => state.content);
  const lastEditorHtmlRef = useRef('');

  const { id } = useParams();
  const queryClient = useQueryClient();

  const { data: postBuilderData } = useQuery({
    queryKey: ['post-builder', id],
    queryFn: () => PostBuilderClientApi.getPostBuilder(id!),
    enabled: !!id
  });

  const handleContentChange = (currentEditor: Editor) => {
    const text = currentEditor.getText().trim();
    const htmlContent = currentEditor.getHTML();
    lastEditorHtmlRef.current = htmlContent;
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

  const handleCopyContent = async () => {
    const text = platformContents[activePlatform]?.text ?? '';
    if (!text) return;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    if (copyResetTimerRef.current) {
      clearTimeout(copyResetTimerRef.current);
    }
    copyResetTimerRef.current = window.setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  const toggleGeneratePlatform = (platform: PostBuilderPlatform) => {
    setGeneratePlatforms((prev) => {
      const next = new Set(prev);
      if (next.has(platform)) {
        next.delete(platform);
      } else {
        next.add(platform);
      }
      return next;
    });
  };

  const handleGenerate = async () => {
    if (!postBuilderData?.value) {
      toast.error('Post builder data not loaded');
      return;
    }

    setIsGenerating(true);

    try {
      const entries = buildCaptionPayloads(postBuilderData.value, generatePlatforms, platformModes, previewStates);

      if (entries.length === 0) {
        toast.error('No platforms with resources available to generate captions');
        setIsGenerating(false);
        return;
      }

      const response = await PostPrepareClientApi.createPostCaption({
        language: null,
        instruction: content || null,
        socialMedia: entries.map((e) => e.payload)
      });

      if (!response.isSuccess || !response.value) {
        throw new Error(response.error?.description || 'Failed to generate captions');
      }

      const savePromises = applyCaptionResults(response.value.socialMedia, entries, setPlatformContent);
      await Promise.all(savePromises);

      queryClient.invalidateQueries({ queryKey: ['post-builder', id] });
      setHasGenerated(true);
      toast.success('Captions generated successfully');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Generation failed';
      toast.error(message);
    } finally {
      setIsGenerating(false);
    }
  };

  // Load saved captions from post builder data on mount
  const contentLoadedRef = useRef(false);
  useEffect(() => {
    if (contentLoadedRef.current || !postBuilderData?.value) return;

    const hasContent = loadSavedCaptions(postBuilderData.value, setPlatformContent);
    if (hasContent) {
      contentLoadedRef.current = true;
      setHasGenerated(true);
    }
  }, [postBuilderData, setPlatformContent]);

  // Sync editor content when active platform changes
  useEffect(() => {
    if (!editor) return;

    const nextHtml = platformContents[activePlatform]?.html || '';
    const currentHtml = editor.getHTML();
    const isNextEmpty = nextHtml.trim() === '';
    const isCurrentEmpty = currentHtml === '<p></p>' || currentHtml.trim() === '';

    if ((isNextEmpty && isCurrentEmpty) || currentHtml === nextHtml || lastEditorHtmlRef.current === nextHtml) {
      return;
    }

    editor.commands.setContent(nextHtml);
    lastEditorHtmlRef.current = nextHtml;
  }, [activePlatform, editor, platformContents]);

  // Cleanup copy timer
  useEffect(() => {
    return () => {
      if (copyResetTimerRef.current !== null) {
        window.clearTimeout(copyResetTimerRef.current);
      }
    };
  }, []);

  const generateLabel = useMemo(() => {
    if (isGenerating) return 'Generating...';
    return hasGenerated ? 'Regenerate' : 'Generate';
  }, [hasGenerated, isGenerating]);

  return (
    <div className='rounded-2xl border border-white/10 bg-zinc-950'>
      <div className='border-b border-white/10 px-6 py-4'>
        <div className='flex items-center justify-between gap-3'>
          <h2 className='text-lg font-semibold text-white'>Content Creation</h2>
          <Button
            type='button'
            variant='ghost'
            size='sm'
            onClick={handleCopyContent}
            className='border border-white/10 text-zinc-200 hover:bg-white/10 hover:text-white'
          >
            {copied ? (
              <>
                <CheckIcon className='size-4' /> Copied
              </>
            ) : (
              <>
                <Copy className='size-4' /> Copy
              </>
            )}
          </Button>
        </div>
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

        <div className='border-t border-white/10 pt-5 space-y-3'>
          <PlatformPicker
            selectedPlatforms={generatePlatforms}
            isOpen={showPlatformPicker}
            onToggleOpen={() => setShowPlatformPicker((prev) => !prev)}
            onTogglePlatform={toggleGeneratePlatform}
          />

          <div className='flex items-center justify-center gap-3'>
            <Button
              type='button'
              disabled={isGenerating || generatePlatforms.size === 0}
              className='w-1/3 bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-60'
              onClick={handleGenerate}
            >
              {isGenerating && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
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
    </div>
  );
}

export default ContentCreation;
