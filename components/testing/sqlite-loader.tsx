"use client";

import { useState, useEffect } from "react";

interface SQLiteLoaderProps {
  children: (loaded: boolean) => React.ReactNode;
}

export function SQLiteLoader({ children }: SQLiteLoaderProps) {
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const loadSQLJs = async () => {
      if ((window as any).initSqlJs) {
        setLoaded(true);
        return;
      }

      setLoading(true);
      try {
        await new Promise((resolve, reject) => {
          const script = document.createElement("script");
          script.src = "https://sql.js.org/dist/sql-wasm.js";
          script.onload = () => resolve(true);
          script.onerror = () => reject(new Error("Failed to load SQL.js"));
          document.head.appendChild(script);
        });
        setLoaded(true);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadSQLJs();
  }, []);

  if (error) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-center">
          <div className="text-yellow-600 mr-2">⚠️</div>
          <div>
            <p className="text-yellow-800 font-medium">SQL.js не загружен</p>
            <p className="text-yellow-700 text-sm mt-1">
              Тестирование SQLite в браузере недоступно: {error}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Загрузка SQLite...</span>
      </div>
    );
  }

  return <>{children(loaded)}</>;
}
