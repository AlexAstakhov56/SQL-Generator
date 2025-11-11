// components/testing/query-tester.tsx
"use client";

import { useState, useCallback } from "react";
import { SQLiteLoader } from "./sqlite-loader";
import {
  DatabaseType,
  TestResult,
  DatabaseSchema,
  TableSchema,
} from "@/lib/types";
import { TestResultCard } from "./test-result-card";
import { Button } from "../ui/button";

interface QueryTesterProps {
  sql: string; // CREATE
  selectSql?: string; // SELECT
  dbType: DatabaseType;
  databaseSchema: DatabaseSchema;
  onResultsChange?: (results: TestResult[]) => void;
}

export function QueryTester({
  sql,
  selectSql,
  dbType,
  databaseSchema,
  onResultsChange,
}: QueryTesterProps) {
  const [testing, setTesting] = useState(false);
  const [testingSelect, setTestingSelect] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);
  const [activeTestType, setActiveTestType] = useState<"create" | "select">(
    "create"
  );

  const testQuery = async (queryType: "create" | "select") => {
    const queryToTest = queryType === "create" ? sql : selectSql;

    if (!queryToTest?.trim()) return;

    if (queryType === "create") {
      setTesting(true);
    } else {
      setTestingSelect(true);
    }

    setActiveTestType(queryType);

    try {
      const response = await fetch("/api/test-query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sql: queryToTest.trim(),
          dbType,
          queryType,
        }),
      });

      const data = await response.json();

      if (data.results) {
        setResults(data.results);
        onResultsChange?.(data.results);

        data.results.forEach((result: TestResult, index: number) => {
          console.log(`📈 Результат ${index + 1}:`, {
            success: result.result.success,
            dataLength: result.result.data?.length,
            error: result.result.error,
            executionTime: result.result.executionTime,
          });
        });
      } else if (data.error) {
        console.error("❌ Ошибка от API:", data.error);
        setResults([
          {
            dbType,
            query: queryToTest,
            result: { success: false, error: data.error },
            validated: false,
            warnings: [],
          },
        ]);
      }
    } catch (error: any) {
      console.error("❌ Ошибка при тестировании:", error);
      setResults([
        {
          dbType,
          query: queryToTest,
          result: { success: false, error: error.message },
          validated: false,
          warnings: [],
        },
      ]);
    } finally {
      if (queryType === "create") {
        setTesting(false);
      } else {
        setTestingSelect(false);
      }
    }
  };

  const clearResults = () => {
    setResults([]);
    onResultsChange?.([]);
  };

  const canTestCreate = sql.trim().length > 0 && !testing && !testingSelect;
  const canTestSelect =
    selectSql !== undefined &&
    selectSql?.trim().length > 0 &&
    !testing &&
    !testingSelect;

  return (
    <SQLiteLoader>
      {(sqliteLoaded) => (
        <div className="space-y-4">
          <div className="bg-white border rounded-lg p-4">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-medium text-gray-900">
                  🧪 Тестирование запросов
                </h3>
                {results.length > 0 && (
                  <Button onClick={clearResults} variant="danger" size="sm">
                    Очистить результаты
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-700">
                      CREATE запрос:
                    </span>
                    {!sql.trim() && (
                      <span className="text-xs text-gray-500">
                        (недоступно)
                      </span>
                    )}
                  </div>
                  <Button
                    onClick={() => testQuery("create")}
                    disabled={
                      !canTestCreate || (!sqliteLoaded && dbType === "sqlite")
                    }
                    variant="primary"
                    className="w-full"
                  >
                    {testing ? "🔄 Тестирование..." : "🏗️ Тестировать CREATE"}
                  </Button>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-700">
                      SELECT запрос:
                    </span>
                    {!selectSql?.trim() && (
                      <span className="text-xs text-gray-500">
                        (недоступно)
                      </span>
                    )}
                  </div>
                  <Button
                    onClick={() => testQuery("select")}
                    disabled={
                      !canTestSelect || (!sqliteLoaded && dbType === "sqlite")
                    }
                    variant="success"
                    className="w-full"
                  >
                    {testingSelect
                      ? "🔄 Подготовка..."
                      : "🔍 Тестировать SELECT"}
                  </Button>
                </div>
              </div>

              {!sqliteLoaded && dbType === "sqlite" && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    ⚠️ SQLite загружается... Подождите немного перед
                    тестированием
                  </p>
                </div>
              )}
            </div>
          </div>

          {results.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-gray-900">
                  📊 Результаты тестирования ({activeTestType.toUpperCase()})
                </h3>
                <div className="flex items-center gap-2 text-sm">
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded-full ${
                      results.every((r) => r.result.success)
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {results.filter((r) => r.result.success).length}/
                    {results.length} успешно
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                {results.map((result, index) => (
                  <TestResultCard
                    key={index}
                    result={result}
                    showDetails={true}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </SQLiteLoader>
  );
}
