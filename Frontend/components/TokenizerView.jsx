export default function TokenizerView({ tokens }) {
    if (!tokens.length) return null;
  
    return (
      <div className="mt-6">
        <h2 className="text-lg font-semibold mb-2">Tokens</h2>
        <div className="flex flex-wrap gap-2">
          {tokens.map(t => (
            <span
              key={t.id + Math.random()}
              className="px-2 py-1 bg-blue-100 text-blue-700 rounded-lg"
              title={`Token ID: ${t.id}`}
            >
              {t.token}
            </span>
          ))}
        </div>
      </div>
    );
  }
  