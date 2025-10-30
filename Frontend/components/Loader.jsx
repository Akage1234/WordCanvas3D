export default function Loader({ fullscreen = true }) {
    const wrap = fullscreen
      ? "fixed inset-0 z-50 grid place-items-center"
      : "grid place-items-center min-h-[100dvh]";
  
    const lines = [
      'Loading...',
      'godnLai...',
      'oiaglni...',
      'Liongad...',
      'gindola...',
      'naloidg...',
    ];
  
    // Choose a random char to color per line
    const highlightIndex = (s) => Math.floor(Math.random() * s.length);
    return (
      <div className={wrap}>
        <div className="loader">
          <div className="loader-track">
            {lines.map((s, i) => {
              const hi = highlightIndex(s);
              return (
                <div key={i}>
                  {s.split('').map((ch, j) =>
                    j === hi ? <span key={j} className="loader-hl">{ch}</span> : <span key={j}>{ch}</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }