"use client";   

export default function VisualizerLayout({ leftPanel, rightCanvas }) {
    return (
      <div className="flex flex-col md:flex-row gap-2 md:gap-4 p-2 md:p-4 h-screen overflow-hidden">
        {/* Left Panel - Stacked on top for mobile, side-by-side for desktop */}
        <aside className="w-full md:w-64 bg-white/5 rounded-lg md:rounded-xl p-3 md:p-4 border border-white/10 backdrop-blur overflow-hidden min-w-0 flex flex-col max-h-[45vh] md:max-h-none md:flex-1 md:flex-initial">
          <div className="w-full min-w-0 overflow-y-auto custom-scroll flex-1">
            {leftPanel}
          </div>
        </aside>
  
        {/* Right Canvas Area - Full width on mobile, flex-1 on desktop */}
        <main className="flex-1 rounded-lg md:rounded-xl border border-white/10 relative overflow-hidden min-h-0">
          {rightCanvas}
        </main>
      </div>
    );
  }
  