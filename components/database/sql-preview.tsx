"use client";

import { useState } from "react";

import { DatabaseSchema, TestResult } from "@/lib/types";
import { QueryTester } from "../testing/query-tester";
import { DockerManager } from "../testing/docker-manager";

interface SqlPreviewProps {
  sql: string; // CREATE
  selectSql?: string; // SELECT
  dbType: string;
  databaseSchema: DatabaseSchema;
  onSelectSqlChange?: (sql: string) => void;
}

export function SQLPreview({
  sql,
  dbType,
  selectSql,
  databaseSchema,
  onSelectSqlChange,
}: SqlPreviewProps) {
  const [activeTab, setActiveTab] = useState<
    "create" | "select" | "test" | "docker"
  >("create");
  const [testResults, setTestResults] = useState<TestResult[]>([]);

  const tabs = [
    { id: "create" as const, name: "CREATE Запрос", icon: "📝" },
    { id: "select" as const, name: "SELECT Запрос", icon: "🔍" },
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

  const createLineCount = sql ? sql.split("\n").length : 0;
  const selectLineCount = selectSql ? selectSql.split("\n").length : 0;

  const getCurrentSql = () => {
    switch (activeTab) {
      case "create":
        return sql;
      case "select":
        return selectSql || "";
      case "test":
        return selectSql || sql;
      default:
        return "";
    }
  };

  return (
    <div className="bg-white border rounded-lg overflow-hidden">
      <div className="border-b overflow-x-auto">
        <nav className="flex -mb-px min-w-max md:min-w-0">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 md:gap-2 cursor-pointer py-2.5 md:py-3 px-3 md:px-4 text-sm md:text-md font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-600 hover:text-black hover:border-gray-300"
              }`}
            >
              <span className="text-base md:text-lg">{tab.icon}</span>
              <span className="hidden md:inline">{tab.name}</span>
              {tab.id === "test" && testResults.length > 0 && (
                <span
                  className={`inline-flex items-center px-1.5 md:px-2 py-0.5 rounded-full text-xs font-medium ${
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

      <div className="p-3 md:p-4 lg:p-5">
        {activeTab === "create" && (
          <div>
            <div className="bg-gray-900 rounded-lg shadow-sm border border-gray-700">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 p-3 md:p-4 border-b border-gray-700">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm md:text-base lg:text-lg font-medium text-gray-300 bg-gray-800 px-2 py-1 rounded">
                    {dbType.toUpperCase()}
                  </span>
                  {sql && (
                    <span className="text-xs md:text-sm text-gray-500">
                      {createLineCount} lines
                    </span>
                  )}
                </div>
                {sql && (
                  <button
                    onClick={() => navigator.clipboard.writeText(sql)}
                    className="text-sm md:text-base cursor-pointer text-gray-400 hover:text-white bg-gray-800 px-3 md:px-4 py-1.5 md:py-2 rounded transition-colors w-full sm:w-auto text-center"
                  >
                    📋 Копировать
                  </button>
                )}
              </div>
              <div className="p-3 md:p-4">
                <pre className="text-green-400 font-mono text-xs md:text-sm lg:text-base whitespace-pre-wrap overflow-x-auto">
                  {sql || "// SQL будет сгенерирован здесь"}
                </pre>
              </div>
            </div>
          </div>
        )}

        {activeTab === "select" && (
          <div>
            <div className="bg-gray-900 rounded-lg shadow-sm border border-gray-700">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 p-3 md:p-4 border-b border-gray-700">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm md:text-base lg:text-lg font-medium text-gray-300 bg-gray-800 px-2 py-1 rounded">
                    {dbType.toUpperCase()}
                  </span>
                  {sql && (
                    <span className="text-xs md:text-sm text-gray-500">
                      {selectLineCount} lines
                    </span>
                  )}
                </div>
                {selectSql && (
                  <button
                    onClick={() => navigator.clipboard.writeText(selectSql)}
                    className="text-sm md:text-base cursor-pointer text-gray-400 hover:text-white bg-gray-800 px-3 md:px-4 py-1.5 md:py-2 rounded transition-colors w-full sm:w-auto text-center"
                  >
                    📋 Копировать
                  </button>
                )}
              </div>
              <div className="p-3 md:p-4">
                <pre className="text-green-400 font-mono text-xs md:text-sm lg:text-base whitespace-pre-wrap overflow-x-auto">
                  {selectSql || "// SQL будет сгенерирован здесь"}
                </pre>
              </div>
            </div>
          </div>
        )}

        {activeTab === "test" && (
          <div className="space-y-3 md:space-y-4">
            <QueryTester
              sql={sql}
              selectSql={selectSql}
              dbType={dbType as any}
              databaseSchema={databaseSchema}
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
