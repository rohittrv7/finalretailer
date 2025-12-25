import { useState, useEffect } from "react";

function useDebouncedSearch(initialValue: string = "", delay: number = 300) {
  const [query, setQuery] = useState<string>(initialValue);
  const [debouncedQuery, setDebouncedQuery] = useState<string>(initialValue);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, delay);

    return () => clearTimeout(timer);
  }, [query, delay]);

  return [query, setQuery, debouncedQuery] as const;
}

export default useDebouncedSearch;
