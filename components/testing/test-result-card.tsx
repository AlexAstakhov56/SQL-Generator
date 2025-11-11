import { TestResult } from "@/lib/types";

interface TestResultCardProps {
  result: TestResult;
  showDetails?: boolean;
}

export function TestResultCard({
  result,
  showDetails = true,
}: TestResultCardProps) {
  const { dbType, result: queryResult, validated, warnings } = result;

  const getDBIcon = (type: string) => {
    switch (type) {
      case "sqlite":
        return "🗃️";
      case "mysql":
        return "🐬";
      case "postgresql":
        return "🐘";
      default:
        return "🗃️";
    }
  };

  const getDBName = (type: string) => {
    switch (type) {
      case "sqlite":
        return "SQLite";
      case "mysql":
        return "MySQL";
      case "postgresql":
        return "PostgreSQL";
      default:
        return type;
    }
  };

  const getConnectionDetails = (type: string) => {
    switch (type) {
      case "mysql":
        return { host: "localhost:3306", user: "test", database: "test_db" };
      case "postgresql":
        return {
          host: "localhost:5432",
          user: "postgres",
          database: "test_db",
        };
      case "sqlite":
        return { type: "in-memory", database: "virtual" };
      default:
        return {};
    }
  };

  const getQueryType = () => {
    const command = queryResult.meta?.command;
    if (command) return command;

    const sql = result.query || "";
    if (sql.trim().toUpperCase().startsWith("SELECT")) return "SELECT";
    if (sql.trim().toUpperCase().startsWith("INSERT")) return "INSERT";
    if (sql.trim().toUpperCase().startsWith("UPDATE")) return "UPDATE";
    if (sql.trim().toUpperCase().startsWith("DELETE")) return "DELETE";
    if (sql.trim().toUpperCase().startsWith("CREATE")) return "CREATE";
    if (sql.trim().toUpperCase().startsWith("DROP")) return "DROP";
    if (sql.trim().toUpperCase().startsWith("ALTER")) return "ALTER";
    return "UNKNOWN";
  };

  const queryType = getQueryType();

  const renderDefaultResult = () => {
    return (
      <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
        ✅ <strong>Запрос выполнен успешно</strong>
        {queryType === "CREATE" && (
          <div className="mt-1">Запрос не возвращает данные</div>
        )}
      </div>
    );
  };

  const connectionDetails = getConnectionDetails(dbType);

  return (
    <div
      className={`border rounded-lg p-4 ${
        queryResult.success
          ? "bg-green-50 border-green-200"
          : "bg-red-50 border-red-200"
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{getDBIcon(dbType)}</span>
          <h4 className="font-medium text-xl text-gray-900">
            {getDBName(dbType)}
          </h4>
          <span
            className={`inline-flex items-center px-2 py-1 rounded-full text-md font-medium ${
              queryResult.success
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {queryResult.success ? (
              <span className="text-md">✅ Успех</span>
            ) : (
              <span className="text-md">❌ Ошибка</span>
            )}
          </span>
          <span className="inline-flex items-center px-2 py-1 rounded-full text-md font-medium bg-gray-100 text-gray-800">
            {queryType}
          </span>
          {validated && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-md font-medium bg-blue-100 text-blue-800">
              ✓ Валидирован
            </span>
          )}
        </div>

        {queryResult.executionTime && (
          <span className="text-md text-gray-500">
            {queryResult.executionTime}ms
          </span>
        )}
      </div>

      {queryResult.success ? (
        <>
          <div className="mb-4">
            <p className="text-lg text-green-600 font-medium">
              {queryType === "SELECT" &&
                queryResult.data &&
                queryResult.data.length > 0 &&
                `✅ Найдено ${queryResult.data.length} строк`}
              {queryType === "SELECT" &&
                (!queryResult.data || queryResult.data.length === 0) &&
                "✅ Запрос выполнен"}
              {queryType === "INSERT" && "✅ Данные успешно добавлены"}
              {queryType === "UPDATE" && "✅ Данные успешно обновлены"}
              {queryType === "DELETE" && "✅ Данные успешно удалены"}
              {queryType === "CREATE" && "✅ Таблица успешно создана"}
              {queryType === "DROP" && "✅ Таблица успешно удалена"}
              {queryType === "ALTER" && "✅ Структура успешно изменена"}
              {![
                "SELECT",
                "INSERT",
                "UPDATE",
                "DELETE",
                "CREATE",
                "DROP",
                "ALTER",
              ].includes(queryType) && "✅ Запрос выполнен успешно"}
            </p>
          </div>

          {showDetails && (
            <div className="space-y-4">
              <div className="text-sm text-gray-600 bg-white p-3 rounded border">
                <div className="font-medium mb-2">🔌 Подключение к СУБД:</div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <strong>Тип:</strong> {getDBName(dbType)}
                  </div>
                  {connectionDetails.host && (
                    <div>
                      <strong>Хост:</strong> {connectionDetails.host}
                    </div>
                  )}
                  {connectionDetails.user && (
                    <div>
                      <strong>Пользователь:</strong> {connectionDetails.user}
                    </div>
                  )}
                  {connectionDetails.database && (
                    <div>
                      <strong>База данных:</strong> {connectionDetails.database}
                    </div>
                  )}
                </div>
              </div>

              {queryResult.meta && (
                <div className="text-sm text-gray-600 bg-white p-3 rounded border">
                  <div className="font-medium mb-2">
                    📊 Системная информация:
                  </div>
                  <div className="space-y-1">
                    {queryResult.meta.version && (
                      <div>
                        <strong>Версия СУБД:</strong>
                        <code className="ml-1 bg-gray-100 px-1 rounded">
                          {queryResult.meta.version}
                        </code>
                      </div>
                    )}
                    {queryResult.meta.command && (
                      <div>
                        <strong>Тип запроса:</strong> {queryResult.meta.command}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {queryResult.executionTime && (
                <div className="text-sm text-blue-600 bg-blue-50 p-2 rounded">
                  ⏱️ <strong>Время выполнения:</strong>{" "}
                  {queryResult.executionTime}ms
                </div>
              )}
              {renderDefaultResult()}
            </div>
          )}
        </>
      ) : (
        <div>
          <p className="text-sm text-red-600 font-medium mb-2">
            Ошибка выполнения:
          </p>
          <pre className="text-sm text-red-600 bg-white p-3 rounded border overflow-x-auto">
            {queryResult.error}
          </pre>
          {queryResult.sqlState && (
            <div className="mt-2 text-xs text-gray-600 bg-gray-50 p-2 rounded">
              <strong>SQL State:</strong> {queryResult.sqlState}
            </div>
          )}
        </div>
      )}

      {warnings && warnings.length > 0 && (
        <div className="mt-4 pt-4 border-t border-yellow-200">
          <h5 className="text-sm font-medium text-yellow-800 mb-2">
            ⚠️ Предупреждения:
          </h5>
          <ul className="text-sm text-yellow-700 space-y-1">
            {warnings.map((warning, index) => (
              <li key={index}>• {warning}</li>
            ))}
          </ul>
        </div>
      )}

      {showDetails && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-green-600">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
              <span>
                <strong>Реальное тестирование</strong> в {getDBName(dbType)}
              </span>
            </div>
            <div className="text-gray-500">
              {queryResult.meta?.version && (
                <span>Версия: {queryResult.meta.version.split(",")[0]}</span>
              )}
              {queryResult.executionTime && (
                <span className="ml-2">• {queryResult.executionTime}ms</span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
