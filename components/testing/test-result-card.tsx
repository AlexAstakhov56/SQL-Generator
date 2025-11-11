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

  // Функция для отображения результата в зависимости от типа запроса
  const renderQueryResult = () => {
    switch (queryType) {
      case "SELECT":
        return renderSelectResult();
      case "INSERT":
        return renderInsertResult();
      case "UPDATE":
      case "DELETE":
        return renderUpdateDeleteResult();
      case "CREATE":
      case "DROP":
      case "ALTER":
        return renderDDLResult();
      default:
        return renderDefaultResult();
    }
  };

  const renderSelectResult = () => {
    if (!queryResult.data || queryResult.data.length === 0) {
      return (
        <div className="text-sm text-gray-500 bg-gray-50 p-3 rounded">
          📭 SELECT запрос вернул 0 строк
        </div>
      );
    }

    return (
      <div className="border rounded-lg overflow-hidden">
        <div className="bg-gray-50 px-3 py-2 border-b flex justify-between items-center">
          <strong>📋 Результаты SELECT запроса:</strong>
          <span className="text-xs text-gray-500">
            {queryResult.data.length} строк
            {queryResult.columns && ` × ${queryResult.columns.length} колонок`}
          </span>
        </div>
        <div className="max-h-48 overflow-auto">
          <div className="p-3 space-y-2">
            <div className="text-xs text-gray-600">
              <strong>Структура:</strong>{" "}
              {queryResult.columns?.join(", ") || "Неизвестно"}
            </div>
            <details className="text-xs">
              <summary className="cursor-pointer text-blue-600 hover:text-blue-800">
                Показать данные ({queryResult.data.length} строк)
              </summary>
              <pre className="mt-2 p-2 bg-gray-50 rounded overflow-x-auto">
                {JSON.stringify(queryResult.data, null, 2)}
              </pre>
            </details>
          </div>
        </div>
      </div>
    );
  };

  const renderInsertResult = () => {
    return (
      <div className="text-sm text-green-600 bg-green-50 p-3 rounded">
        ✅ <strong>INSERT выполнен успешно</strong>
        {queryResult.meta?.rowCount !== undefined && (
          <div className="mt-1">
            Добавлено строк: {queryResult.meta.rowCount}
          </div>
        )}
        {queryResult.meta?.insertId !== undefined && (
          <div className="mt-1">
            ID последней вставки: {queryResult.meta.insertId}
          </div>
        )}
      </div>
    );
  };

  const renderUpdateDeleteResult = () => {
    return (
      <div className="text-sm text-blue-600 bg-blue-50 p-3 rounded">
        ✅ <strong>{queryType} выполнен успешно</strong>
        {queryResult.rowsAffected !== undefined && (
          <div className="mt-1">
            Затронуто строк: {queryResult.rowsAffected}
          </div>
        )}
        {queryResult.meta?.rowCount !== undefined && (
          <div className="mt-1">
            Затронуто строк: {queryResult.meta.rowCount}
          </div>
        )}
      </div>
    );
  };

  const renderDDLResult = () => {
    return (
      <div className="text-sm text-purple-600 bg-purple-50 p-3 rounded">
        ✅ <strong>{queryType} выполнен успешно</strong>
        <div className="mt-1">Структура базы данных изменена</div>
        {queryType === "CREATE" && (
          <div className="text-xs text-purple-700 mt-1">
            🏗️ Создана новая таблица/структура
          </div>
        )}
        {queryType === "ALTER" && (
          <div className="text-xs text-purple-700 mt-1">
            🔧 Структура таблицы изменена
          </div>
        )}
        {queryType === "DROP" && (
          <div className="text-xs text-purple-700 mt-1">
            🗑️ Таблица/структура удалена
          </div>
        )}
      </div>
    );
  };

  const renderDefaultResult = () => {
    return (
      <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
        ✅ <strong>Запрос выполнен успешно</strong>
        {queryResult.data && queryResult.data.length > 0 ? (
          <div className="mt-2">
            Возвращено данных: {queryResult.data.length} строк
          </div>
        ) : (
          <div className="mt-1">Запрос не возвращает данные</div>
        )}
      </div>
    );
  };

  // Функция для форматирования данных
  const formatDataPreview = (data: any[]) => {
    if (!data || data.length === 0) return null;

    const firstRow = data[0];
    const columns = Object.keys(firstRow);

    return (
      <div className="text-xs">
        <div className="text-gray-600 mb-1">
          <strong>Структура:</strong> {columns.join(", ")}
        </div>
        <div className="text-gray-600">
          <strong>Первая строка:</strong> {JSON.stringify(firstRow)}
        </div>
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
          <div className="space-y-3">
            <p className="text-lg text-green-600">
              {queryType === "SELECT" &&
                queryResult.data &&
                queryResult.data.length > 0 &&
                `SELECT выполнен успешно. Найдено строк: ${queryResult.data.length}`}
              {queryType === "SELECT" &&
                (!queryResult.data || queryResult.data.length === 0) &&
                "SELECT выполнен успешно. Данные не найдены"}
              {queryType === "INSERT" && "INSERT выполнен успешно"}
              {queryType === "UPDATE" && "UPDATE выполнен успешно"}
              {queryType === "DELETE" && "DELETE выполнен успешно"}
              {queryType === "CREATE" && "CREATE выполнен успешно"}
              {queryType === "DROP" && "DROP выполнен успешно"}
              {queryType === "ALTER" && "ALTER выполнен успешно"}
              {![
                "SELECT",
                "INSERT",
                "UPDATE",
                "DELETE",
                "CREATE",
                "DROP",
                "ALTER",
              ].includes(queryType) && "Запрос выполнен успешно"}
            </p>

            {queryResult.data && queryResult.data.length > 0 && (
              <p className="text-lg text-green-600">
                Возвращено строк: {queryResult.data.length}
              </p>
            )}
          </div>

          {showDetails && (
            <div className="mt-4 space-y-3">
              {/* Информация о подключении */}
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
                  {dbType === "sqlite" && (
                    <div>
                      <strong>Режим:</strong> In-memory база
                    </div>
                  )}
                </div>
              </div>

              {/* Мета-информация СУБД */}
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
                    {queryResult.meta.affectedRows !== undefined && (
                      <div>
                        <strong>Затронуто строк:</strong>{" "}
                        {queryResult.meta.affectedRows}
                      </div>
                    )}
                    {queryResult.meta.rowCount !== undefined && (
                      <div>
                        <strong>Возвращено строк:</strong>{" "}
                        {queryResult.meta.rowCount}
                      </div>
                    )}
                    {queryResult.meta.insertId !== undefined && (
                      <div>
                        <strong>ID вставки:</strong> {queryResult.meta.insertId}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Производительность */}
              <div className="grid grid-cols-2 gap-2">
                {queryResult.executionTime && (
                  <div className="text-sm text-blue-600 bg-blue-50 p-2 rounded">
                    ⏱️ <strong>Время выполнения:</strong>{" "}
                    {queryResult.executionTime}ms
                  </div>
                )}
              </div>
              {queryResult.data && queryResult.data.length > 0 && (
                <div className="border rounded-lg overflow-hidden">
                  <div className="bg-gray-50 px-3 py-2 border-b flex justify-between items-center">
                    <strong>📋 Результаты запроса:</strong>
                    <span className="text-xs text-gray-500">
                      {queryResult.data.length} строк
                      {queryResult.columns &&
                        ` × ${queryResult.columns.length} колонок`}
                    </span>
                  </div>
                  <div className="max-h-48 overflow-auto">
                    <div className="p-3 space-y-2">
                      {formatDataPreview(queryResult.data)}
                      <details className="text-xs">
                        <summary className="cursor-pointer text-blue-600 hover:text-blue-800">
                          Показать полные данные ({queryResult.data.length}{" "}
                          строк)
                        </summary>
                        <pre className="mt-2 p-2 bg-gray-50 rounded overflow-x-auto">
                          {JSON.stringify(queryResult.data, null, 2)}
                        </pre>
                      </details>
                    </div>
                  </div>
                </div>
              )}

              {/* Информация о выполнении */}
              {queryResult.rowsAffected !== undefined &&
                queryResult.rowsAffected > 0 && (
                  <div className="text-sm text-green-600 bg-green-50 p-2 rounded">
                    📝 <strong>Операция выполнена:</strong> Затронуто{" "}
                    {queryResult.rowsAffected} строк
                  </div>
                )}

              {renderQueryResult()}
              {/* Информация о колонках */}
              {queryResult.columns && queryResult.columns.length > 0 && (
                <div className="text-sm text-purple-600 bg-purple-50 p-2 rounded">
                  🗂️ <strong>Структура результата:</strong>{" "}
                  {queryResult.columns.length} колонок
                  <div className="text-xs mt-1 text-purple-700">
                    {queryResult.columns.join(", ")}
                  </div>
                </div>
              )}
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
        <div className="mt-3 pt-3 border-t border-yellow-200">
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
        <div className="mt-3 pt-3 border-t border-gray-200">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-green-600">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
              <span>
                <strong>Тестирование</strong> в {getDBName(dbType)}
              </span>
            </div>
            <div className="text-gray-500">
              {queryResult.executionTime && (
                <span className="ml-2">• {queryResult.executionTime}ms</span>
              )}
            </div>
          </div>

          <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-gray-500">
            <div>✓ Подключение к реальной СУБД</div>
            <div>✓ Выполнение настоящих запросов</div>
            <div>✓ Возврат реальных данных</div>
            <div>✓ Измерение времени выполнения</div>
          </div>
        </div>
      )}
    </div>
  );
}
