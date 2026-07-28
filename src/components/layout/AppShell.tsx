'use client';

import { useEffect, useRef, useState } from 'react';
import { AppHeader } from './AppHeader';
import { BottomNav, type MobileView } from './BottomNav';
import { CollapsiblePanel } from './CollapsiblePanel';
import { WardrobePanel } from '@/components/wardrobe/WardrobePanel';
import { OutfitCanvas } from '@/components/outfit/OutfitCanvas';
import { OutfitControlsPanel } from '@/components/outfit/OutfitControlsPanel';
import { SettingsModal } from '@/components/settings/SettingsModal';
import { NotConfiguredScreen, AuthScreen } from '@/components/auth/AuthScreen';
import { useWardrobeStore } from '@/lib/store';
import { useApplyTheme } from '@/hooks/useApplyTheme';
import { useBreakpoint } from '@/hooks/useMediaQuery';

export function AppShell() {
  const configured = useWardrobeStore((s) => s.configured);
  const authReady = useWardrobeStore((s) => s.authReady);
  const session = useWardrobeStore((s) => s.session);
  const initAuth = useWardrobeStore((s) => s.initAuth);
  const ready = useWardrobeStore((s) => s.ready);
  const settings = useWardrobeStore((s) => s.settings);
  const selectSticker = useWardrobeStore((s) => s.selectSticker);

  useApplyTheme(settings);

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  const breakpoint = useBreakpoint();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [mobileView, setMobileView] = useState<MobileView>('canvas');
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [rightCollapsed, setRightCollapsed] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);

  // Escape deselects the currently selected accessory sticker.
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target?.isContentEditable) return;
      if (e.key === 'Escape') selectSticker(null);
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selectSticker]);

  if (!configured) {
    return <NotConfiguredScreen />;
  }

  if (!authReady) {
    return (
      <div className="flex h-dvh items-center justify-center bg-canvas dark:bg-dusk-bg">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-thread-300 border-t-thread-600" />
      </div>
    );
  }

  if (!session) {
    return <AuthScreen />;
  }

  if (!ready) {
    return (
      <div className="flex h-dvh items-center justify-center bg-canvas dark:bg-dusk-bg">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-thread-300 border-t-thread-600" />
          <p className="text-sm text-ink-muted dark:text-dusk-muted">Syncing your wardrobe…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-dvh flex-col bg-canvas dark:bg-dusk-bg">
      <AppHeader onOpenSettings={() => setSettingsOpen(true)} />

      {breakpoint === 'desktop' && (
        <div className="flex min-h-0 flex-1">
          <CollapsiblePanel side="left" collapsed={leftCollapsed} onToggle={() => setLeftCollapsed((v) => !v)}>
            <WardrobePanel />
          </CollapsiblePanel>
          <main className="min-w-0 flex-1">
            <OutfitCanvas ref={canvasRef} />
          </main>
          <CollapsiblePanel
            side="right"
            collapsed={rightCollapsed}
            onToggle={() => setRightCollapsed((v) => !v)}
            widthClass="w-96"
          >
            <div className="h-full pt-2">
              <OutfitControlsPanel canvasNode={canvasRef.current} />
            </div>
          </CollapsiblePanel>
        </div>
      )}

      {breakpoint === 'tablet' && (
        <div className="flex min-h-0 flex-1">
          <CollapsiblePanel
            side="left"
            collapsed={leftCollapsed}
            onToggle={() => setLeftCollapsed((v) => !v)}
            widthClass="w-72"
          >
            <WardrobePanel />
          </CollapsiblePanel>
          <main className="min-w-0 flex-1">
            <OutfitCanvas ref={canvasRef} />
          </main>
          <CollapsiblePanel
            side="right"
            collapsed={rightCollapsed}
            onToggle={() => setRightCollapsed((v) => !v)}
            widthClass="w-80"
          >
            <div className="h-full pt-2">
              <OutfitControlsPanel canvasNode={canvasRef.current} />
            </div>
          </CollapsiblePanel>
        </div>
      )}

      {breakpoint === 'mobile' && (
        <>
          <main className="min-h-0 flex-1 overflow-hidden">
            {mobileView === 'wardrobe' && <WardrobePanel />}
            {mobileView === 'canvas' && <OutfitCanvas ref={canvasRef} />}
            {mobileView === 'controls' && (
              <div className="h-full pt-2">
                <OutfitControlsPanel canvasNode={canvasRef.current} />
              </div>
            )}
          </main>
          <BottomNav active={mobileView} onChange={setMobileView} />
        </>
      )}

      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}
