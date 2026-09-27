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
  
    // A different letter lit on each line (fixed, so server and client render the same markup)
    const highlightIndex = (s, i) => (i * 3 + 1) % s.length;
    return (
      <div className={wrap}>
        <div className="loader">
          <div className="loader-track">
            {lines.map((s, i) => {
              const hi = highlightIndex(s, i);
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