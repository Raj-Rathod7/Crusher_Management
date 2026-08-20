import { LRUCache, type MetaOptions } from "#/integrations/cache";
import { useEffect, useRef } from "react"

export const useCache = <K, V>(capacity: number, options?: MetaOptions) => {
  const ref = useRef<LRUCache<K, V> | null>(null);

  useEffect(() => {
    if(!ref.current){
      ref.current = new LRUCache(3, options);
    }
  }, []);

  return ref.current;
}