import { useState } from "react";
import { TableSchema, GeneratedSQL, DatabaseType } from "../../lib/types";
import { SelectedDBService } from "../../lib/services/selected-db-service";
import { DBSelector } from "../testing/db-selector";
import { SQLPreview } from "./sql-preview";
import { TestResults } from "./test-results";
import { TableBuilder } from "./table-builder";
import { createDefaultTable } from "../../lib/utils/schema-utils";

export function QueryConstructor() {
  const [selectedDB, setSelectedDB] = useState<DatabaseType>("sqlite");
  const [schema, setSchema] = useState<TableSchema>(createDefaultTable());
  const [generatedSQL, setGeneratedSQL] = useState<
    Partial<Record<DatabaseType, GeneratedSQL>>
  >({});
  const [testResults, setTestResults] = useState<any>(null);
  const [isTesting, setIsTesting] = useState(false);

  const dbService = SelectedDBService.createForClient();

  // Генерация SQL при изменении схемы или выбора СУБД
  const handleGenerateSQL = async () => {
    if (!schema) return;

    const sql = await dbService.generateSQL(schema, selectedDB);
    setGeneratedSQL(sql);
  };

  // Тестирование запроса
  const handleTestQuery = async () => {
    if (!schema) return;

    setIsTesting(true);

    try {
      let queryToTest = "";

      const results = await dbService.testQuery(queryToTest, selectedDB);
      setTestResults(results);
    } catch (error) {
      console.error("Ошибка тестирования:", error);
    } finally {
      setIsTesting(false);
    }
  };

  const handleSchemaChange = (newSchema: TableSchema) => {
    setSchema(newSchema);
  };

  return (
    <div className="space-y-6">
      {/* Выбор СУБД */}
      <DBSelector selectedDB={selectedDB} onDBChange={setSelectedDB} />

      {/* Конструктор таблиц */}
      <TableBuilder schema={schema} onChange={handleSchemaChange} />

      {/* Кнопки действий */}
      <div className="flex gap-4">
        <button
          onClick={handleGenerateSQL}
          disabled={!schema}
          className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          🚀 Сгенерировать SQL
        </button>

        <button
          onClick={handleTestQuery}
          disabled={!schema || !generatedSQL[selectedDB] || isTesting}
          className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          {isTesting ? "🧪 Тестируем..." : "🔍 Протестировать запрос"}
        </button>
      </div>

      {/* Превью SQL */}
      {generatedSQL[selectedDB] && (
        <SQLPreview sql={generatedSQL} selectedDB={selectedDB} />
      )}

      {/* Результаты тестирования */}
      {testResults && <TestResults results={testResults} />}
    </div>
  );
}
