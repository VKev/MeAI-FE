import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Toolbar } from './Toolbar';
import { AssetsPanel } from './AssetsPanel';
import { Preview } from './Preview';
import { InspectorPanel } from './InspectorPanel';
import { Timeline } from './Timeline';
import { KeyboardShortcutsOverlay } from './KeyboardShortcutsOverlay';
import { PanelErrorBoundary } from '../ErrorBoundary';
import { SpotlightTour } from './tour';
import { useProjectStore } from '../../stores/project-store';
import { useUIStore } from '../../stores/ui-store';
import { useEngineStore } from '../../stores/engine-store';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';
import { initializePlaybackBridge, disposePlaybackBridge } from '../../bridges/playback-bridge';
import { initializeMediaBridge, disposeMediaBridge } from '../../bridges/media-bridge';
import { initializeRenderBridge, disposeRenderBridge } from '../../bridges/render-bridge';
import { initializeEffectsBridge, disposeEffectsBridge } from '../../bridges/effects-bridge';
import { initializeTransitionBridge, disposeTransitionBridge } from '../../bridges/transition-bridge';

const DEFAULT_TIMELINE_HEIGHT = 320;
const MIN_TIMELINE_HEIGHT = 220;
const MIN_TOP_WORKSPACE_HEIGHT = 280;
const DEFAULT_ASSETS_WIDTH = 320;
const MIN_ASSETS_WIDTH = 240;
const MAX_ASSETS_WIDTH = 520;
const DEFAULT_INSPECTOR_WIDTH = 320;
const MIN_INSPECTOR_WIDTH = 260;
const MAX_INSPECTOR_WIDTH = 520;
const MIN_PREVIEW_WIDTH = 420;
const SIDE_RESIZE_HANDLE_WIDTH = 6;
const HORIZONTAL_RESIZE_HANDLE_HEIGHT = 4;

type ResizeTarget = 'timeline' | 'assets' | 'inspector';

const clamp = (value: number, min: number, max: number): number => {
  return Math.min(Math.max(value, min), max);
};

/**
 * Auto-save initialization hook
 */
const useAutoSave = () => {
  const { initializeAutoSave } = useProjectStore();

  useEffect(() => {
    initializeAutoSave().catch(console.error);
  }, [initializeAutoSave]);
};

/**
 * Unsaved changes warning hook
 * Shows native browser confirmation when user tries to leave with unsaved changes
 */
const useUnsavedChangesWarning = () => {
  const { isDirty } = useProjectStore();

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isDirty]);
};

/**
 * Engine and bridge initialization hook
 * Ensures all engines and bridges are fully initialized before rendering editor
 */
const useEngineInitialization = () => {
  const { initialize, initialized, initializing, initError } = useEngineStore();
  const [bridgesReady, setBridgesReady] = useState(false);
  const [initStatus, setInitStatus] = useState('Starting...');
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const initAll = async () => {
      try {
        const currentState = useEngineStore.getState();
        if (!currentState.initialized && !currentState.initializing) {
          setInitStatus('Initializing video engine...');
          await initialize();
        } else if (currentState.initializing) {
          await new Promise<void>((resolve) => {
            const unsubscribe = useEngineStore.subscribe((state) => {
              if (state.initialized || state.initError) {
                unsubscribe();
                resolve();
              }
            });
          });
        }

        if (!isMounted) return;

        const engineState = useEngineStore.getState();
        if (!engineState.initialized) {
          throw new Error(engineState.initError || 'Engine initialization failed');
        }

        setInitStatus('Initializing media bridge...');
        await initializeMediaBridge();
        if (!isMounted) return;

        setInitStatus('Initializing playback bridge...');
        await initializePlaybackBridge();
        if (!isMounted) return;

        setInitStatus('Initializing render bridge...');
        await initializeRenderBridge();
        if (!isMounted) return;

        setInitStatus('Initializing effects bridge...');
        const projectState = useProjectStore.getState();
        const { width, height } = projectState.project.settings;
        try {
          await initializeEffectsBridge(width, height);
        } catch (effectsError) {
          console.error('[EditorInterface] EffectsBridge initialization failed:', effectsError);
        }
        if (!isMounted) return;

        setInitStatus('Initializing transition bridge...');
        try {
          initializeTransitionBridge(width, height);
        } catch (transitionError) {
          console.error('[EditorInterface] TransitionBridge initialization failed:', transitionError);
        }
        if (!isMounted) return;

        setBridgesReady(true);
      } catch (error) {
        console.error('Failed to initialize engines/bridges:', error);
        if (isMounted) {
          setLocalError(error instanceof Error ? error.message : 'Unknown error');
          setInitStatus(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
    };

    initAll();

    return () => {
      isMounted = false;
      disposePlaybackBridge();
      disposeMediaBridge();
      disposeRenderBridge();
      disposeEffectsBridge();
      disposeTransitionBridge();
    };
  }, [initialize, initialized, initializing]);

  return {
    initialized: initialized && bridgesReady,
    initializing: initializing || (!bridgesReady && initialized),
    initError: initError || localError,
    initStatus
  };
};

/**
 * Main Editor Interface Component
 */
export const EditorInterface: React.FC = () => {
  const { initialized, initializing, initError, initStatus } = useEngineInitialization();

  const { showShortcutsOverlay, setShowShortcutsOverlay } = useKeyboardShortcuts();
  useAutoSave();
  useUnsavedChangesWarning();

  const { keyframeEditorOpen } = useUIStore();

  const editorBodyRef = useRef<HTMLDivElement>(null);
  const workspaceRef = useRef<HTMLDivElement>(null);

  const keyframePanelRef = useRef<HTMLDivElement>(null);
  const resizeStateRef = useRef<ResizeTarget | null>(null);

  const [timelineHeight, setTimelineHeight] = useState(DEFAULT_TIMELINE_HEIGHT);
  const [assetsWidth, setAssetsWidth] = useState(DEFAULT_ASSETS_WIDTH);
  const [inspectorWidth, setInspectorWidth] = useState(DEFAULT_INSPECTOR_WIDTH);

  const timelineHeightRef = useRef(DEFAULT_TIMELINE_HEIGHT);
  const assetsWidthRef = useRef(DEFAULT_ASSETS_WIDTH);
  const inspectorWidthRef = useRef(DEFAULT_INSPECTOR_WIDTH);

  useEffect(() => {
    timelineHeightRef.current = timelineHeight;
  }, [timelineHeight]);

  useEffect(() => {
    assetsWidthRef.current = assetsWidth;
  }, [assetsWidth]);

  useEffect(() => {
    inspectorWidthRef.current = inspectorWidth;
  }, [inspectorWidth]);

  const beginResize = useCallback(
    (target: ResizeTarget) => (e: React.MouseEvent<HTMLDivElement>) => {
      e.preventDefault();
      resizeStateRef.current = target;
      document.body.style.cursor = target === 'timeline' ? 'row-resize' : 'col-resize';
      document.body.style.userSelect = 'none';
    },
    []
  );

  const clampLayout = useCallback(() => {
    const workspaceRect = workspaceRef.current?.getBoundingClientRect();
    if (workspaceRect) {
      const keyframeWidth = keyframePanelRef.current?.getBoundingClientRect().width ?? 0;
      const maxResizableWidth = workspaceRect.width - keyframeWidth - MIN_PREVIEW_WIDTH - SIDE_RESIZE_HANDLE_WIDTH * 2;

      const nextAssetsWidth = clamp(
        assetsWidthRef.current,
        MIN_ASSETS_WIDTH,
        Math.max(MIN_ASSETS_WIDTH, Math.min(MAX_ASSETS_WIDTH, maxResizableWidth - inspectorWidthRef.current))
      );

      const nextInspectorWidth = clamp(
        inspectorWidthRef.current,
        MIN_INSPECTOR_WIDTH,
        Math.max(MIN_INSPECTOR_WIDTH, Math.min(MAX_INSPECTOR_WIDTH, maxResizableWidth - nextAssetsWidth))
      );

      if (nextAssetsWidth !== assetsWidthRef.current) {
        setAssetsWidth(nextAssetsWidth);
      }

      if (nextInspectorWidth !== inspectorWidthRef.current) {
        setInspectorWidth(nextInspectorWidth);
      }
    }

    const bodyRect = editorBodyRef.current?.getBoundingClientRect();
    if (bodyRect) {
      const audioMixerHeight = 0;
      const maxTimelineHeight = Math.max(
        MIN_TIMELINE_HEIGHT,
        bodyRect.height - audioMixerHeight - MIN_TOP_WORKSPACE_HEIGHT - HORIZONTAL_RESIZE_HANDLE_HEIGHT
      );
      const nextTimelineHeight = clamp(timelineHeightRef.current, MIN_TIMELINE_HEIGHT, maxTimelineHeight);

      if (nextTimelineHeight !== timelineHeightRef.current) {
        setTimelineHeight(nextTimelineHeight);
      }
    }
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const resizeTarget = resizeStateRef.current;
      if (!resizeTarget) return;

      if (resizeTarget === 'timeline') {
        const bodyRect = editorBodyRef.current?.getBoundingClientRect();
        if (!bodyRect) return;

        const audioMixerHeight = 0;
        const maxTimelineHeight = Math.max(
          MIN_TIMELINE_HEIGHT,
          bodyRect.height - audioMixerHeight - MIN_TOP_WORKSPACE_HEIGHT - HORIZONTAL_RESIZE_HANDLE_HEIGHT
        );
        const desiredTimelineHeight = bodyRect.bottom - e.clientY - audioMixerHeight;

        setTimelineHeight(clamp(desiredTimelineHeight, MIN_TIMELINE_HEIGHT, maxTimelineHeight));
        return;
      }

      const workspaceRect = workspaceRef.current?.getBoundingClientRect();
      if (!workspaceRect) return;

      const keyframeWidth = keyframePanelRef.current?.getBoundingClientRect().width ?? 0;
      const maxResizableWidth = workspaceRect.width - keyframeWidth - MIN_PREVIEW_WIDTH - SIDE_RESIZE_HANDLE_WIDTH * 2;

      if (resizeTarget === 'assets') {
        const maxAssetsWidth = Math.max(
          MIN_ASSETS_WIDTH,
          Math.min(MAX_ASSETS_WIDTH, maxResizableWidth - inspectorWidthRef.current)
        );
        const desiredAssetsWidth = e.clientX - workspaceRect.left;
        setAssetsWidth(clamp(desiredAssetsWidth, MIN_ASSETS_WIDTH, maxAssetsWidth));
        return;
      }

      const maxInspectorWidth = Math.max(
        MIN_INSPECTOR_WIDTH,
        Math.min(MAX_INSPECTOR_WIDTH, maxResizableWidth - assetsWidthRef.current)
      );
      const desiredInspectorWidth = workspaceRect.right - e.clientX;
      setInspectorWidth(clamp(desiredInspectorWidth, MIN_INSPECTOR_WIDTH, maxInspectorWidth));
    };

    const handleMouseUp = () => {
      resizeStateRef.current = null;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  useEffect(() => {
    clampLayout();

    const handleResize = () => {
      clampLayout();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [clampLayout, keyframeEditorOpen]);

  if (initializing || !initialized) {
    return (
      <div className='w-full h-full bg-background flex items-center justify-center'>
        <div className='text-center'>
          <div className='w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4' />
          <p className='text-text-secondary text-sm'>Initializing editor...</p>
          <p className='text-text-muted text-xs mt-2'>{initStatus}</p>
          {initError && <p className='text-red-500 text-xs mt-2'>{initError}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className='w-full h-full bg-background flex flex-col overflow-hidden font-sans select-none relative z-20 text-xs text-text-secondary'>
      {/* Main App Toolbar */}
      <Toolbar />

      <div ref={editorBodyRef} className='min-h-0 flex-1 flex flex-col overflow-hidden'>
        <div ref={workspaceRef} className='min-h-0 flex-1 flex overflow-hidden'>
          <div className='h-full shrink-0 min-w-0 overflow-hidden' style={{ width: assetsWidth }}>
            <PanelErrorBoundary name='Assets Panel'>
              <AssetsPanel />
            </PanelErrorBoundary>
          </div>

          <div
            className='relative h-full shrink-0 cursor-col-resize bg-border/80 transition-colors hover:bg-primary/50'
            style={{ width: SIDE_RESIZE_HANDLE_WIDTH }}
            onMouseDown={beginResize('assets')}
          >
            <div className='absolute inset-y-0 -left-1 -right-1' />
          </div>

          <div className='min-h-0 min-w-0 flex-1 flex overflow-hidden'>
            <PanelErrorBoundary name='Preview'>
              <Preview />
            </PanelErrorBoundary>
          </div>

          <div
            className='relative h-full shrink-0 cursor-col-resize bg-border/80 transition-colors hover:bg-primary/50'
            style={{ width: SIDE_RESIZE_HANDLE_WIDTH }}
            onMouseDown={beginResize('inspector')}
          >
            <div className='absolute inset-y-0 -left-1 -right-1' />
          </div>

          <div className='h-full shrink-0 min-w-0 overflow-hidden' style={{ width: inspectorWidth }}>
            <PanelErrorBoundary name='Inspector'>
              <InspectorPanel />
            </PanelErrorBoundary>
          </div>
        </div>

        <div
          className='shrink-0 bg-border transition-colors hover:bg-primary/50 cursor-row-resize z-10 relative'
          style={{ height: HORIZONTAL_RESIZE_HANDLE_HEIGHT }}
          onMouseDown={beginResize('timeline')}
        >
          <div className='absolute inset-x-0 -top-1 -bottom-1 bg-transparent' />
        </div>

        <div style={{ height: timelineHeight }} className='min-h-0 shrink-0 flex flex-col overflow-hidden'>
          <PanelErrorBoundary name='Timeline'>
            <Timeline />
          </PanelErrorBoundary>
        </div>
      </div>

      <KeyboardShortcutsOverlay isOpen={showShortcutsOverlay} onClose={() => setShowShortcutsOverlay(false)} />

      <SpotlightTour />
    </div>
  );
};

export default EditorInterface;
