"use client";
import { useState } from "react";
import { usePathname } from "next/navigation";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Maximize2, Minimize2 } from "lucide-react";
import { useLayoutMode } from "@/components/LayoutContext";

export default function VisualizerLayout({ 
  leftPanel, 
  rightCanvas,
  mobileControlSections = null // Array of { icon: IconComponent, label: string, content: ReactNode }
}) {
  // State for each mobile control drawer
  const [openDrawers, setOpenDrawers] = useState({});
  // Get layout mode from global context
  const { isMinimalistMode, setIsMinimalistMode } = useLayoutMode();
  // Get current pathname to check if we're on a visualizer page
  const pathname = usePathname();
  const isVisualizerPage = pathname === '/embedding' || pathname === '/vector-playground';
  
  // Only allow minimalist mode on visualizer pages
  const effectiveMinimalistMode = isVisualizerPage && isMinimalistMode;

  const toggleDrawer = (sectionId) => {
    setOpenDrawers(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  // If mobileControlSections provided, use multi-icon tray. Otherwise, fallback to single button
  const useMultiIconTray = mobileControlSections && mobileControlSections.length > 0;

  // Render bottom control tray
  const renderBottomTray = () => (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50">
      {useMultiIconTray ? (
        <div className="flex items-center gap-2 px-2 py-2 rounded-full bg-white/50 dark:bg-black/40 backdrop-blur-lg supports-[backdrop-filter]:bg-white/40 dark:supports-[backdrop-filter]:bg-black/30 border border-white/20 dark:border-white/10 shadow-xl outline outline-white/20 dark:outline-white/10">
          {mobileControlSections.map((section, index) => {
            const Icon = section.icon;
            const sectionId = section.id || `section-${index}`;
            const isOpen = openDrawers[sectionId];
            
            // Create a close function that can be passed to content
            const closeDrawer = () => {
              setOpenDrawers(prev => ({ ...prev, [sectionId]: false }));
            };
            
            // Clone content with closeDrawer prop if content accepts it
            const contentWithClose = typeof section.content === 'function' 
              ? section.content(closeDrawer)
              : section.content;
            
            return (
              <Drawer 
                key={sectionId}
                open={isOpen} 
                onOpenChange={(open) => {
                  setOpenDrawers(prev => ({ ...prev, [sectionId]: open }));
                }}
                direction="bottom"
              >
                <DrawerTrigger asChild>
                  <button 
                    onClick={() => toggleDrawer(sectionId)}
                    className={`flex flex-col items-center justify-center gap-1 rounded-full p-2.5 min-w-[60px] transition-colors ${
                      isOpen 
                        ? "bg-blue-500/20 text-blue-400" 
                        : "text-neutral-200 hover:bg-neutral-800/50"
                    }`}
                    aria-label={section.label}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="text-[10px] font-medium leading-tight">{section.label}</span>
                  </button>
                </DrawerTrigger>
                <DrawerContent className="bg-neutral-950/95 backdrop-blur-xl border-t border-white/10 max-h-[85vh]">
                  <DrawerHeader className="sr-only">
                    <DrawerTitle>{section.label}</DrawerTitle>
                  </DrawerHeader>
                  <div className="w-full overflow-y-auto custom-scroll flex-1 px-4 pt-4 pb-6">
                    {contentWithClose}
                  </div>
                  <div className="flex justify-center pb-4 pt-2 border-t border-white/10">
                    <DrawerClose asChild>
                      <button className="rounded-full px-6 py-2 text-sm font-medium bg-neutral-800 hover:bg-neutral-700 text-neutral-200 transition-colors">
                        Close
                      </button>
                    </DrawerClose>
                  </div>
                </DrawerContent>
              </Drawer>
            );
          })}
        </div>
      ) : (
        // Fallback: Single button for all controls
        <Drawer 
          open={openDrawers.all || false} 
          onOpenChange={(open) => {
            setOpenDrawers(prev => ({ ...prev, all: open }));
          }}
          direction="bottom"
        >
          <DrawerTrigger asChild>
            <button 
              onClick={() => toggleDrawer('all')}
              className="flex items-center justify-center gap-2 rounded-full px-4 py-3 bg-white/50 dark:bg-black/40 backdrop-blur-lg supports-[backdrop-filter]:bg-white/40 dark:supports-[backdrop-filter]:bg-black/30 border border-white/20 dark:border-white/10 shadow-xl outline outline-white/20 dark:outline-white/10 text-neutral-200 hover:bg-neutral-800/50 transition-colors"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
              <span className="text-sm font-medium">Controls</span>
            </button>
          </DrawerTrigger>
          <DrawerContent className="bg-neutral-950/95 backdrop-blur-xl border-t border-white/10 max-h-[85vh]">
            <DrawerHeader className="sr-only">
              <DrawerTitle>Visualization Controls</DrawerTitle>
            </DrawerHeader>
            <div className="w-full overflow-y-auto custom-scroll flex-1 px-4 pt-4 pb-6">
              {leftPanel}
            </div>
            <div className="flex justify-center pb-4 pt-2 border-t border-white/10">
              <DrawerClose asChild>
                <button className="rounded-full px-6 py-2 text-sm font-medium bg-neutral-800 hover:bg-neutral-700 text-neutral-200 transition-colors">
                  Close
                </button>
              </DrawerClose>
            </div>
          </DrawerContent>
        </Drawer>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop Layout - Side-by-side */}
      {!effectiveMinimalistMode && (
      <div className="hidden md:flex gap-4 p-4 h-screen overflow-hidden relative">
        {/* Layout Toggle Button - Only show on visualizer pages */}
        {isVisualizerPage && (
        <button
          onClick={() => setIsMinimalistMode(true)}
          className="absolute top-4 right-4 z-50 flex items-center justify-center rounded-full p-2.5 bg-white/50 dark:bg-black/40 backdrop-blur-lg supports-[backdrop-filter]:bg-white/40 dark:supports-[backdrop-filter]:bg-black/30 border border-white/20 dark:border-white/10 shadow-xl outline outline-white/20 dark:outline-white/10 text-neutral-200 hover:bg-neutral-800/50 transition-colors"
          aria-label="Switch to minimalist layout"
        >
          <Maximize2 className="h-4 w-4" />
        </button>
        )}

        {/* Left Panel */}
        <aside className="w-64 bg-white/5 rounded-xl p-4 border border-white/10 backdrop-blur overflow-hidden min-w-0 flex flex-col">
          <div className="w-full min-w-0 overflow-y-auto custom-scroll flex-1">
            {leftPanel}
          </div>
        </aside>

        {/* Right Canvas Area */}
        <main className="flex-1 rounded-xl border border-white/10 relative overflow-hidden min-h-0">
          {rightCanvas}
        </main>
      </div>
      )}

      {/* Desktop Minimalist Layout - Full screen canvas with bottom controls - Only on visualizer pages */}
      {effectiveMinimalistMode && (
      <div className="hidden md:flex fixed inset-0 w-screen h-screen overflow-hidden">
        {/* Layout Toggle Button - Top Center */}
        <button
          onClick={() => setIsMinimalistMode(false)}
          className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 flex items-center justify-center rounded-full p-2.5 bg-white/50 dark:bg-black/40 backdrop-blur-lg supports-[backdrop-filter]:bg-white/40 dark:supports-[backdrop-filter]:bg-black/30 border border-white/20 dark:border-white/10 shadow-xl outline outline-white/20 dark:outline-white/10 text-neutral-200 hover:bg-neutral-800/50 transition-colors"
          aria-label="Switch to sidebar layout"
        >
          <Minimize2 className="h-4 w-4" />
        </button>

        {/* Full Screen Canvas */}
        <main className="absolute inset-0 w-full h-full">
          {rightCanvas}
        </main>

        {/* Bottom Control Tray */}
        {renderBottomTray()}
      </div>
      )}

      {/* Mobile Layout - Canvas-first with bottom icon tray */}
      <div className="md:hidden flex flex-col h-screen overflow-hidden">
        {/* Canvas Area - Takes most of screen */}
        <main className="flex-1 rounded-lg border border-white/10 relative overflow-hidden min-h-0 m-2 mb-16 landscape:mb-12">
          {rightCanvas}
        </main>

        {/* Bottom Icon Tray - Multiple icons if provided, otherwise single button */}
        <div className="fixed bottom-2 landscape:bottom-1 left-1/2 transform -translate-x-1/2 z-50">
          {useMultiIconTray ? (
            <div className="flex items-center gap-1.5 landscape:gap-1 px-1.5 landscape:px-1 py-1.5 landscape:py-1 rounded-full bg-white/50 dark:bg-black/40 backdrop-blur-lg supports-[backdrop-filter]:bg-white/40 dark:supports-[backdrop-filter]:bg-black/30 border border-white/20 dark:border-white/10 shadow-xl outline outline-white/20 dark:outline-white/10">
              {mobileControlSections.map((section, index) => {
                const Icon = section.icon;
                const sectionId = section.id || `section-${index}`;
                const isOpen = openDrawers[sectionId];
                
                // Create a close function that can be passed to content
                const closeDrawer = () => {
                  setOpenDrawers(prev => ({ ...prev, [sectionId]: false }));
                };
                
                // Clone content with closeDrawer prop if content accepts it
                const contentWithClose = typeof section.content === 'function' 
                  ? section.content(closeDrawer)
                  : section.content;
                
                return (
                  <Drawer 
                    key={sectionId}
                    open={isOpen} 
                    onOpenChange={(open) => {
                      setOpenDrawers(prev => ({ ...prev, [sectionId]: open }));
                    }}
                    direction="bottom"
                  >
                    <DrawerTrigger asChild>
                      <button 
                        onClick={() => toggleDrawer(sectionId)}
                        className={`flex flex-col items-center justify-center gap-0.5 landscape:gap-0 rounded-full p-2 landscape:p-1.5 min-w-[50px] landscape:min-w-[45px] transition-colors ${
                          isOpen 
                            ? "bg-blue-500/20 text-blue-400" 
                            : "text-neutral-200 hover:bg-neutral-800/50"
                        }`}
                        aria-label={section.label}
                      >
                        <Icon className="h-4 w-4 landscape:h-3.5 landscape:w-3.5" />
                        <span className="text-[9px] landscape:text-[8px] font-medium leading-tight">{section.label}</span>
                      </button>
                    </DrawerTrigger>
                    <DrawerContent className="bg-neutral-950/95 backdrop-blur-xl border-t border-white/10 max-h-[85vh] landscape:max-h-[75vh]">
                      <DrawerHeader className="sr-only">
                        <DrawerTitle>{section.label}</DrawerTitle>
                      </DrawerHeader>
                      <div className="w-full overflow-y-auto custom-scroll flex-1 px-4 pt-4 pb-6">
                        {contentWithClose}
                      </div>
                      <div className="flex justify-center pb-4 pt-2 border-t border-white/10">
                        <DrawerClose asChild>
                          <button className="rounded-full px-6 py-2 text-sm font-medium bg-neutral-800 hover:bg-neutral-700 text-neutral-200 transition-colors">
                            Close
                          </button>
                        </DrawerClose>
                      </div>
                    </DrawerContent>
                  </Drawer>
                );
              })}
            </div>
          ) : (
            // Fallback: Single button for all controls
            <Drawer 
              open={openDrawers.all || false} 
              onOpenChange={(open) => {
                setOpenDrawers(prev => ({ ...prev, all: open }));
              }}
              direction="bottom"
            >
              <DrawerTrigger asChild>
                  <button 
                    onClick={() => toggleDrawer('all')}
                    className="flex items-center justify-center gap-1.5 landscape:gap-1 rounded-full px-3 landscape:px-2 py-2 landscape:py-1.5 bg-white/50 dark:bg-black/40 backdrop-blur-lg supports-[backdrop-filter]:bg-white/40 dark:supports-[backdrop-filter]:bg-black/30 border border-white/20 dark:border-white/10 shadow-xl outline outline-white/20 dark:outline-white/10 text-neutral-200 hover:bg-neutral-800/50 transition-colors"
                  >
                  <svg className="h-4 w-4 landscape:h-3.5 landscape:w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                  </svg>
                  <span className="text-xs landscape:text-[10px] font-medium">Controls</span>
                </button>
              </DrawerTrigger>
              <DrawerContent className="bg-neutral-950/95 backdrop-blur-xl border-t border-white/10 max-h-[85vh] landscape:max-h-[75vh]">
                <DrawerHeader className="sr-only">
                  <DrawerTitle>Visualization Controls</DrawerTitle>
                </DrawerHeader>
                <div className="w-full overflow-y-auto custom-scroll flex-1 px-4 pt-4 pb-6">
                  {leftPanel}
                </div>
                <div className="flex justify-center pb-4 pt-2 border-t border-white/10">
                  <DrawerClose asChild>
                    <button className="rounded-full px-6 py-2 text-sm font-medium bg-neutral-800 hover:bg-neutral-700 text-neutral-200 transition-colors">
                      Close
                    </button>
                  </DrawerClose>
                </div>
              </DrawerContent>
            </Drawer>
          )}
        </div>
      </div>
    </>
  );
}
  