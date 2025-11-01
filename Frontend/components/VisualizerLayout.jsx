"use client";   

export default function VisualizerLayout({ leftPanel, rightCanvas }) {
    return (
      <div className="flex gap-4 p-4 h-screen">
        {/* Left Panel */}
        <aside className="w-64 bg-white/5 rounded-xl p-4 border border-white/10 backdrop-blur overflow-hidden min-w-0 flex flex-col">
          <div className="w-full min-w-0 overflow-y-auto custom-scroll flex-1">
            {leftPanel}
          </div>
        </aside>
  
        {/* Right Canvas Area */}
        <main className="flex-1 rounded-xl border border-white/10 relative overflow-hidden">
          {rightCanvas}
        </main>
      </div>
    );
  }
  