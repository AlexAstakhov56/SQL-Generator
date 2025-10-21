"use client";

import { useState } from "react";
import { TableSchema, GeneratedSQL, DatabaseType } from "../lib/types";
import { TableForm } from "../components/forms/table-form";
import { DBSelector } from "../components/testing/db-selector";
import { SQLPreview } from "../components/constructor/sql-preview";

export default function Home() {
  const [selectedDB, setSelectedDB] = useState<DatabaseType>("sqlite");
  const [generatedSQL, setGeneratedSQL] = useState<
    Partial<Record<DatabaseType, GeneratedSQL>>
  >({});
  const [isTesting, setIsTesting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateSQL = async (schema: TableSchema) => {
    setIsGenerating(true);
    console.log("📤 Отправляемые данные:", { schema, selectedDB });
    try {
      const response = await fetch("/api/generate-sql", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ schema, selectedDB }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log("📦 Полученные данные от API:", data);
        const sqlString = data.sql?.sql;
        console.log("🔍 Извлеченный SQL:", sqlString);
        if (sqlString) {
          setGeneratedSQL((prev) => ({
            ...prev,
            [selectedDB]: { sql: sqlString }, // Сохраняем как объект с полем sql
          }));
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate SQL");
      }
    } catch (error: any) {
      console.error("Generate SQL error:", error);
      alert("Ошибка при генерации SQL: " + error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleTestTable = async (schema: TableSchema) => {
    setIsTesting(true);
    try {
      // Сначала генерируем SQL
      const generateResponse = await fetch("/api/generate-sql", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ schema, selectedDB }),
      });

      if (!generateResponse.ok) {
        const errorData = await generateResponse.json();
        throw new Error(
          errorData.error || "Failed to generate SQL for testing"
        );
      }

      const sqlData = await generateResponse.json();
      const query = sqlData[selectedDB]?.sql || sqlData.sql || sqlData;

      if (query) {
        // Обновляем отображение SQL
        setGeneratedSQL((prev) => ({
          ...prev,
          [selectedDB]: typeof query === "string" ? { sql: query } : query,
        }));

        // Тестируем запрос
        const testResponse = await fetch("/api/test-query", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ query, selectedDB }),
        });

        if (testResponse.ok) {
          const results = await testResponse.json();
          console.log("Test results:", results);

          if (results.success) {
            alert(
              "✅ Тестирование завершено успешно! Проверьте консоль разработчика для деталей."
            );
          } else {
            alert(
              "❌ Тестирование завершено с ошибкой: " +
                (results.error || "Unknown error")
            );
          }
        } else {
          const errorData = await testResponse.json();
          throw new Error(errorData.error || "Testing failed");
        }
      } else {
        alert("Не удалось сгенерировать SQL запрос для тестирования.");
      }
    } catch (error: any) {
      console.error("Test error:", error);
      alert("❌ Ошибка при тестировании: " + error.message);
    } finally {
      setIsTesting(false);
    }
  };

  // Получаем текущий SQL для выбранной БД
  const currentSQL = generatedSQL[selectedDB]?.sql || "";

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            🏗️ SQL Конструктор
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Визуальное создание SQL запросов для создания таблиц в MySQL,
            PostgreSQL и SQLite
          </p>
        </div>

        <div className="mb-8 flex justify-center">
          <DBSelector selectedDB={selectedDB} onDBChange={setSelectedDB} />
        </div>

        <div>
          <TableForm
            onSubmit={handleGenerateSQL}
            onTest={handleTestTable}
            isGenerating={isGenerating}
            isTesting={isTesting}
          />
        </div>

        {currentSQL && (
          <h2 className="text-center font-bold text-xl mb-4">
            Сгенерированный SQL:
          </h2>
        )}

        <div>
          {currentSQL ? (
            <SQLPreview sql={currentSQL} selectedDB={selectedDB} />
          ) : (
            <div className="bg-white rounded-lg shadow-sm border p-6 text-center">
              <div className="text-gray-400 mb-2">
                <svg
                  className="w-12 h-12 mx-auto"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1}
                    d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                SQL будет здесь
              </h3>
              <p className="text-gray-500 text-sm">
                Сгенерируйте SQL запрос для просмотра
              </p>
            </div>
          )}
        </div>

        {/* Статистика */}
        {/* <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg p-4 text-center shadow-sm border">
          <div className="text-2xl font-bold text-blue-600">
            {Object.keys(generatedSQL).length}
          </div>
          <div className="text-sm text-gray-600">Сгенерировано SQL</div>
        </div>
        <div className="bg-white rounded-lg p-4 text-center shadow-sm border">
          <div className="text-2xl font-bold text-green-600">
            {selectedDB.toUpperCase()}
          </div>
          <div className="text-sm text-gray-600">Текущая БД</div>
        </div>
        <div className="bg-white rounded-lg p-4 text-center shadow-sm border">
          <div className="text-2xl font-bold text-purple-600">
            {currentSQL ? "✓" : "—"}
          </div>
          <div className="text-sm text-gray-600">Активный SQL</div>
        </div>
      </div> */}
      </div>
    </div>
  );
}
