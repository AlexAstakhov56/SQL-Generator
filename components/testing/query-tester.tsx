"use client";

import { useState } from "react";
import { SQLiteLoader } from "./sqlite-loader";
import { DatabaseType, TestResult } from "@/lib/types";
import { TestResultCard } from "./test-result-card";
import { Button } from "../ui/button";

interface QueryTesterProps {
  sql: string;
  dbType: DatabaseType;
  onResultsChange?: (results: TestResult[]) => void;
}

export function QueryTester({
  sql,
  dbType,
  onResultsChange,
}: QueryTesterProps) {
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);

  const testQuery = async () => {
    if (!sql.trim()) return;

    setTesting(true);
    try {
      const response = await fetch("/api/test-query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sql: sql.trim(),
          dbType,
        }),
      });

      const data = await response.json();

      if (data.results) {
        setResults(data.results);
        onResultsChange?.(data.results);
      } else if (data.error) {
        setResults([
          {
            dbType,
            query: sql,
            result: { success: false, error: data.error },
            validated: false,
            warnings: [],
          },
        ]);
      }
    } catch (error: any) {
      setResults([
        {
          dbType,
          query: sql,
          result: { success: false, error: error.message },
          validated: false,
          warnings: [],
        },
      ]);
    } finally {
      setTesting(false);
    }
  };

  const clearResults = () => {
    setResults([]);
    onResultsChange?.([]);
  };

  const canTest = sql.trim().length > 0 && !testing;

  return (
    <SQLiteLoader>
      {(sqliteLoaded) => (
        <div className="space-y-4">
          <div className="bg-white border rounded-lg p-4">
            <div
              className={`flex ${
                results.length == 0 ? "justify-center" : "justify-between"
              } gap-2`}
            >
              <Button
                onClick={testQuery}
                disabled={!canTest || (!sqliteLoaded && dbType === "sqlite")}
                variant="primary"
              >
                {testing ? "Тестирование..." : "🧪 Тестировать запрос"}
              </Button>

              {results.length > 0 && (
                <Button onClick={clearResults} variant="danger">
                  Очистить результаты
                </Button>
              )}
            </div>

            {!sqliteLoaded && dbType === "sqlite" && (
              <p className="text-sm text-yellow-600 mt-2">
                ⚠️ SQLite загружается... Подождите немного
              </p>
            )}
          </div>

          {results.length > 0 && (
            <div className="space-y-3">
              {results.map((result, index) => (
                <TestResultCard key={index} result={result} />
              ))}
            </div>
          )}
        </div>
      )}
    </SQLiteLoader>
  );
}
