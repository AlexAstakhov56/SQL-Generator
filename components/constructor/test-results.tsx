import { SelectedDBTestResult, DatabaseType } from "../../lib/types";

interface TestResultsProps {
  results: SelectedDBTestResult;
}

export function TestResults({ results }: TestResultsProps) {
  const { selectedDB, results: dbResults, executionTime } = results;

  const renderDBResult = (dbType: DatabaseType, result: any) => {
    if (!result) return null;

    const isSuccess = result.result?.success;

    return (
      <div key={dbType} className="border rounded-lg overflow-hidden">
        <div
          className={`px-4 py-2 font-medium flex items-center justify-between ${
            isSuccess
              ? "bg-green-100 border-green-200"
              : "bg-red-100 border-red-200"
          }`}
        >
          <div className="flex items-center gap-2">
            <span
              className={
                dbType === "mysql"
                  ? "text-orange-500"
                  : dbType === "postgresql"
                  ? "text-blue-500"
                  : "text-purple-500"
              }
            >
              {dbType === "mysql"
                ? "🐬"
                : dbType === "postgresql"
                ? "🐘"
                : "💾"}
              {dbType.toUpperCase()}
            </span>
            {isSuccess ? (
              <span className="text-green-600 text-sm">✓ Успешно</span>
            ) : (
              <span className="text-red-600 text-sm">✗ Ошибка</span>
            )}
          </div>
          <span className="text-sm text-gray-500">
            {result.result?.executionTime}ms
          </span>
        </div>

        <div className="p-4 bg-white">
          {isSuccess ? (
            <div className="space-y-2">
              {result.result?.data && result.result.data.length > 0 && (
                <div>
                  <div className="text-sm font-medium text-gray-700 mb-1">
                    Данные:
                  </div>
                  <pre className="text-xs bg-gray-50 p-2 rounded overflow-x-auto">
                    {JSON.stringify(result.result.data, null, 2)}
                  </pre>
                </div>
              )}
              {result.result?.rowsAffected !== undefined && (
                <div className="text-sm text-gray-600">
                  Затронуто строк: <strong>{result.result.rowsAffected}</strong>
                </div>
              )}
            </div>
          ) : (
            <div className="text-red-600 text-sm">{result.result?.error}</div>
          )}

          {result.warnings && result.warnings.length > 0 && (
            <div className="mt-2 text-yellow-600 text-sm">
              ⚠ {result.warnings.join(", ")}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">📊 Результаты тестирования</h3>

      <div className="text-sm text-gray-600">
        Общее время выполнения: <strong>{executionTime}ms</strong>
      </div>

      <div className="space-y-3">
        {dbResults[selectedDB] &&
          renderDBResult(selectedDB, dbResults[selectedDB])}
      </div>
    </div>
  );
}
