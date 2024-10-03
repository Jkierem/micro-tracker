import { useCallback, useEffect, useRef } from "react";

export const useOnClickOutside = <T extends HTMLElement>(
  handler: (e: MouseEvent) => void,
  handlerDeps: unknown[]
) => {
  const ref = useRef<T>(null);

  const callback = useCallback(handler, handlerDeps);

  useEffect(() => {
    const listener = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        callback(event);
      }
    };
    document.addEventListener('click', listener);
    return () => {
      document.removeEventListener('click', listener);
    };
  }, [ref, callback]);

  return ref;
}