/**
 * hooks/useCountdown.js
 * -----------------------------------------------------------------------------
 * A seconds countdown, e.g. "Send a new code in 42s".
 *
 *   const { left, restart } = useCountdown(60);
 *   left        seconds remaining (0 when done)
 *   restart(n)  count down from n seconds again
 * -----------------------------------------------------------------------------
 */
import { useCallback, useEffect, useState } from 'react';

const useCountdown = (initial = 0) => {
  const [left, setLeft] = useState(() => Math.max(0, Math.round(initial || 0)));

  useEffect(() => {
    if (left <= 0) return undefined;
    const timer = setTimeout(() => setLeft((n) => Math.max(0, n - 1)), 1000);
    return () => clearTimeout(timer);
  }, [left]);

  const restart = useCallback((seconds) => setLeft(Math.max(0, Math.round(seconds || 0))), []);
  return { left, restart };
};

export default useCountdown;
