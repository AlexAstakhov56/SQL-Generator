"use client";

import { useState } from "react";

import { TestResult } from "@/lib/types";
import { QueryTester } from "../testing/query-tester";
import { DockerManager } from "../testing/docker-manager";

interface SqlPreviewProps {
  sql: string;
  dbType: string;
}

export function SQLPreview({ sql, dbType }: SqlPreviewProps) {
  const [activeTab, setActiveTab] = useState<"sql" | "test" | "docker">("sql");
  const [testResults, setTestResults] = useState<TestResult[]>([]);

  const tabs = [
    { id: "sql" as const, name: "SQL Запрос", icon: "📝" },
    {
      id: "test" as const,
      name: "Тестирование в выбранной СУБД",
      icon: "🧪",
    },
    {
      id: "docker" as const,
      name: "Управление Docker",
      icon: "🐳",
    },
  ];

  const lineCount = sql ? sql.split("\n").length : 0;

  return (
    <div className="bg-white border rounded-lg overflow-hidden">
      <div className="border-b">
        <nav className="flex -mb-px">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 cursor-pointer py-3 px-4 text-md font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-600 hover:text-black hover:border-gray-300"
              }`}
            >
              <span>{tab.icon}</span>
              {tab.name}
              {tab.id === "test" && testResults.length > 0 && (
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs ${
                    testResults.some((r) => !r.result.success)
                      ? "bg-red-100 text-red-800"
                      : "bg-green-100 text-green-800"
                  }`}
                >
                  {testResults.filter((r) => r.result.success).length}/
                  {testResults.length}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      <div className="p-4">
        {activeTab === "sql" && (
          <div>
            <div className="bg-gray-900 rounded-lg shadow-sm border border-gray-700">
              <div className="flex justify-between items-center p-4 border-b border-gray-700">
                <div className="flex items-center gap-2">
                  <span className="text-lg font-medium text-gray-300 bg-gray-800 px-2 py-1 rounded">
                    {dbType.toUpperCase()}
                  </span>
                  {sql && (
                    <span className="text-md text-gray-500">
                      {lineCount} lines
                    </span>
                  )}
                </div>
                {sql && (
                  <button
                    onClick={() => navigator.clipboard.writeText(sql)}
                    className="text-md cursor-pointer text-gray-400 hover:text-white bg-gray-800 px-3 py-1 rounded transition-colors"
                  >
                    📋 Копировать
                  </button>
                )}
              </div>
              <div className="p-4">
                <pre className="text-green-400 font-mono text-md whitespace-pre-wrap overflow-x-auto">
                  {sql || "// SQL будет сгенерирован здесь"}
                </pre>
              </div>
            </div>
          </div>
        )}

        {activeTab === "test" && (
          <div className="space-y-4">
            <QueryTester
              sql={sql}
              dbType={dbType as any}
              onResultsChange={setTestResults}
            />
          </div>
        )}

        {activeTab === "docker" && (
          <div>
            <DockerManager />
          </div>
        )}
      </div>
    </div>
  );
}
