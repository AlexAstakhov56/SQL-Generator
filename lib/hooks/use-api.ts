import { useState } from "react";

interface UseApiOptions {
  onSuccess?: (data: any) => void;
  onError?: (error: string) => void;
}

export function useApi() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const callApi = async (
    url: string,
    options: RequestInit = {},
    apiOptions: UseApiOptions = {}
  ) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(url, {
        headers: {
          "Content-Type": "application/json",
          ...options.headers,
        },
        ...options,
      });

      const result = await response.json();

      if (result.success) {
        apiOptions.onSuccess?.(result.data);
        return result.data;
      } else {
        const errorMsg = result.error || "Произошла ошибка";
        setError(errorMsg);
        apiOptions.onError?.(errorMsg);
        return null;
      }
    } catch (err: any) {
      const errorMsg = err.message || "Ошибка сети";
      setError(errorMsg);
      apiOptions.onError?.(errorMsg);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    callApi,
    clearError: () => setError(null),
  };
}
