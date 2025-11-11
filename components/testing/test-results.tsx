"use client";

import { useState } from "react";
import { Button } from "../ui/button";

interface TestResultsProps {
  sql: string;
  dbType: string;
}

export function TestResults({ sql, dbType }: TestResultsProps) {
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);

  const testQuery = async () => {
    if (!sql) return;

    setIsTesting(true);
    try {
      const response = await fetch("/api/test-query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sql, dbType }),
      });

      const result = await response.json();
      setTestResult(result);
    } catch (error) {
      setTestResult({
        success: false,
        error: "Failed to test query",
      });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="space-y-4">
      <Button
        onClick={testQuery}
        disabled={isTesting || !sql}
        variant="primary"
      >
        {isTesting ? "Testing..." : "Test Query"}
      </Button>

      {testResult && (
        <div
          className={`p-4 rounded-lg ${
            testResult.success
              ? "bg-green-50 border border-green-200"
              : "bg-red-50 border border-red-200"
          }`}
        >
          <h4
            className={`font-medium ${
              testResult.success ? "text-green-800" : "text-red-800"
            }`}
          >
            {testResult.success
              ? "✅ Query executed successfully"
              : "❌ Query failed"}
          </h4>

          {testResult.error && (
            <pre className="mt-2 text-sm text-red-600 whitespace-pre-wrap">
              Error: {testResult.error}
            </pre>
          )}

          {testResult.results && testResult.results.length > 0 && (
            <div className="mt-3">
              <p className="text-sm text-gray-600">
                Results: {testResult.results.length} rows
                {testResult.executionTime && ` (${testResult.executionTime}ms)`}
              </p>
              <pre className="mt-2 text-xs bg-white p-2 rounded border overflow-x-auto">
                {JSON.stringify(testResult.results, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
