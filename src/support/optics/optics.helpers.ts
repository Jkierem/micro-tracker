function shallowCopy<T>(a: T): T {
    if (Array.isArray(a)) {
      return [...a] as T;
    } else if (typeof a === 'object') {
      return { ...a };
    } else {
      return a;
    }
  }
  
export function shallowSet<T, K extends keyof T>(attr: K): (s: T, a: T[K]) => T {
    return (s: T, a: T[K]) => {
      const cp = shallowCopy<T>(s);
      cp[attr] = a;
      return cp;
    };
}
  
export function uncurryShallowSet<T, K extends keyof T>(attr: K, s: T, a: T[K]): T {
    const cp = shallowCopy<T>(s);
    cp[attr] = a;
    return cp;
}
  
export function shallowGet<T, K extends keyof T>(attr: K): (s: T) => T[K] {
    return (s: T) => s[attr];
}
  
export function safeShallowGet<T, K extends keyof T>(attr: K): (s: T) => T[K] | undefined {
    return (s: T) => s?.[attr];
}
  
export function memoize<S, A>(fn: (s: S) => A) {
    const memo = new Map();
  
    return (s: S) => {
        if (!memo.get(s)) {
            memo.set(s, fn(s));
        }
  
       return memo.get(s);
    };
}