import { useEffect, useRef } from 'react';

export function useClickOutside(onOutside) {
  const ref = useRef(null);

  useEffect(() => {
    if (!onOutside) return undefined;
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onOutside(e);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') onOutside(e);
    };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [onOutside]);

  return ref;
}
