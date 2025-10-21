import { TableSchema } from "../../lib/types";
import { generateTestData } from "../../lib/utils/data-utils";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";

interface TableDataProps {
  schema: TableSchema;
  onUpdate: (updates: Partial<TableSchema>) => void;
}

export function TableData({ schema, onUpdate }: TableDataProps) {
  // Для простоты будем генерировать тестовые данные
  const generateSampleData = () => {
    const sampleData = generateTestData(schema.columns, 3);
    // Здесь можно добавить логику для сохранения данных
    console.log("Sample data:", sampleData);
    alert("Данные сгенерированы! Проверьте консоль разработчика.");
  };

  return (
    <Card title="📊 Данные для вставки">
      <div className="space-y-4">
        <div className="text-gray-600">
          <p>Здесь вы можете ввести данные для INSERT запросов.</p>
          <p className="text-sm mt-1">
            На текущий момент поддерживается генерация тестовых данных.
          </p>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <span className="text-yellow-400">💡</span>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                Функция в разработке
              </h3>
              <div className="mt-1 text-sm text-yellow-700">
                <p>
                  Редактор данных для INSERT запросов будет добавлен в следующем
                  обновлении.
                </p>
              </div>
            </div>
          </div>
        </div>

        <Button onClick={generateSampleData} variant="secondary">
          🎲 Сгенерировать тестовые данные
        </Button>

        {/* Здесь позже будет полноценный редактор данных */}
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <p className="text-gray-500">Редактор данных появится здесь</p>
        </div>
      </div>
    </Card>
  );
}
