import { useEffect, useRef, useState } from 'react';

export default function SearchSelect({ value, options, onChange, placeholder = 'Select', allowNew = false }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [pos, setPos] = useState({});
  const btn = useRef(null);
  const pop = useRef(null);

  useEffect(() => {
    if (!open) return;
    const down = (e) => {
      if (btn.current?.contains(e.target) || pop.current?.contains(e.target)) return;
      setOpen(false);
    };
    const scroll = (e) => { if (!pop.current?.contains(e.target)) setOpen(false); };
    const resize = () => setOpen(false);
    const key = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', down);
    window.addEventListener('scroll', scroll, true);
    window.addEventListener('resize', resize);
    document.addEventListener('keydown', key);
    return () => {
      document.removeEventListener('mousedown', down);
      window.removeEventListener('scroll', scroll, true);
      window.removeEventListener('resize', resize);
      document.removeEventListener('keydown', key);
    };
  }, [open]);

  function toggle() {
    if (!open) {
      const r = btn.current.getBoundingClientRect();
      const flip = r.bottom + 270 > window.innerHeight && r.top > 270;
      setPos({
        left: Math.max(4, Math.min(r.left, window.innerWidth - 230)),
        width: Math.max(r.width, 220),
        ...(flip ? { bottom: window.innerHeight - r.top + 2 } : { top: r.bottom + 2 }),
      });
      setQ('');
    }
    setOpen(!open);
  }
  function pick(v) { onChange(v); setOpen(false); setQ(''); }

  const term = q.trim().toLowerCase();
  const list = options.filter((o) => o.toLowerCase().includes(term));
  const canAdd = allowNew && q.trim() && !options.some((o) => o.toLowerCase() === term);

  return (
    <>
      <button type="button" ref={btn} className={'ss-btn' + (open ? ' open' : '')} onClick={toggle}>
        {value || <span className="ss-ph">{placeholder}</span>}
      </button>
      {open && (
        <div className="ss-pop" ref={pop} style={pos}>
          <input autoFocus className="ss-q" value={q} onChange={(e) => setQ(e.target.value)}
                 placeholder={allowNew ? 'Search or type new' : 'Search'} />
          <ul>
            <li className={'ss-li' + (!value ? ' sel' : '')} onClick={() => pick('')}>{placeholder}</li>
            {canAdd && <li className="ss-li add" onClick={() => pick(q.trim())}>Add "{q.trim()}"</li>}
            {list.map((o) => (
              <li key={o} className={'ss-li' + (o === value ? ' sel' : '')} onClick={() => pick(o)}>{o}</li>
            ))}
            {!list.length && !canAdd && <li className="ss-none">No results</li>}
          </ul>
        </div>
      )}
    </>
  );
}