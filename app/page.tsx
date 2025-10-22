"use client";

import { useState, useEffect } from "react";
import { DatabaseSchema, DatabaseType, TableSchema } from "../lib/types";
import { MultiTableUtils } from "../lib/utils/multi-table-utils";
import { MultiTableGenerator } from "../lib/utils/generators/multi-table-generator";
import { DatabaseSchemaEditor } from "../components/tables/database-schema-editor";
import { DBSelector } from "../components/db-selector";
import { SQLPreview } from "../components/constructor/sql-preview";
import { DatabaseSchemaVisualization } from "@/components/database-schema-visualization";

export default function Home() {
  const [selectedDB, setSelectedDB] = useState<DatabaseType>("sqlite");
  const [databaseSchema, setDatabaseSchema] = useState<DatabaseSchema>(
    MultiTableUtils.createDatabaseSchema("my_database")
  );
  const [generatedSQL, setGeneratedSQL] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  useEffect(() => {
    const initialSchema = MultiTableUtils.createDatabaseSchema("my_database");

    const exampleTable: TableSchema = {
      id: `table_${Date.now()}`,
      name: "users",
      columns: [
        {
          id: `col_${Date.now()}_1`,
          name: "user_id",
          type: "INTEGER",
          nullable: false,
          constraints: ["PRIMARY_KEY", "AUTO_INCREMENT"],
          defaultValue: "",
          dbSpecific: {
            mysql: {},
            postgresql: {},
            sqlite: {},
          },
        },
        {
          id: `col_${Date.now()}_2`,
          name: "username",
          type: "VARCHAR",
          nullable: false,
          constraints: ["NOT_NULL"],
          defaultValue: "",
          dbSpecific: {
            mysql: {},
            postgresql: {},
            sqlite: {},
          },
        },
        {
          id: `col_${Date.now()}_3`,
          name: "email",
          type: "VARCHAR",
          nullable: false,
          constraints: [],
          defaultValue: "",
          dbSpecific: {
            mysql: {},
            postgresql: {},
            sqlite: {},
          },
        },
      ],
      indexes: [],
      relationships: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      // dbSpecific: {
      //   mysql: {},
      //   postgresql: {},
      //   sqlite: {},
      // },
    };

    setDatabaseSchema({
      ...initialSchema,
      tables: [exampleTable],
    });
  }, []);

  const handleGenerateSQL = async (schema: DatabaseSchema) => {
    setIsGenerating(true);
    console.log("📤 Отправляемые данные:", { schema, selectedDB });

    try {
      // Генерация SQL для всей схемы
      const sql = MultiTableGenerator.generateDatabaseSchema(
        schema,
        selectedDB
      );
      console.log("🔧 Сгенерированный SQL:", sql);

      setGeneratedSQL(sql);
    } catch (error: any) {
      console.error("Generate SQL error:", error);
      alert("Ошибка при генерации SQL: " + error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleTestSchema = async (schema: DatabaseSchema) => {
    setIsTesting(true);

    try {
      // Генерация SQL для тестирования
      const sql = MultiTableGenerator.generateDatabaseSchema(
        schema,
        selectedDB
      );
      console.log("🧪 SQL для тестирования:", sql);

      if (!sql) {
        alert("Не удалось сгенерировать SQL для тестирования.");
        return;
      }

      // Тестируем запрос
      const testResponse = await fetch("/api/test-query", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: sql,
          selectedDB,
        }),
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
    } catch (error: any) {
      console.error("Test error:", error);
      alert("❌ Ошибка при тестировании: " + error.message);
    } finally {
      setIsTesting(false);
    }
  };

  // Валидация схемы перед генерацией
  const validateSchema = (schema: DatabaseSchema): boolean => {
    const validation = MultiTableUtils.validateSchema(schema);

    if (!validation.isValid) {
      alert("Ошибки валидации:\n" + validation.errors.join("\n"));
      return false;
    }

    return true;
  };

  const handleGenerateWithValidation = async (schema: DatabaseSchema) => {
    if (!validateSchema(schema)) {
      return;
    }

    await handleGenerateSQL(schema);
  };

  const handleTestWithValidation = async (schema: DatabaseSchema) => {
    if (!validateSchema(schema)) {
      return;
    }

    await handleTestSchema(schema);
  };

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            🗃️ SQL Конструктор (Многотабличный)
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Создавайте сложные схемы баз данных с несколькими связанными
            таблицами
          </p>
        </div>

        <div className="mb-8 flex justify-center">
          <DBSelector selectedDB={selectedDB} onDBChange={setSelectedDB} />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Основной редактор схемы */}
          <div className="xl:col-span-2">
            <DatabaseSchemaEditor
              schema={databaseSchema}
              onSchemaChange={setDatabaseSchema}
              onGenerateSQL={handleGenerateWithValidation}
              onTestSQL={handleTestWithValidation}
              isGenerating={isGenerating}
              isTesting={isTesting}
            />
          </div>

          {/* Панель предпросмотра SQL */}
          <div className="xl:col-span-1">
            <div className="sticky top-8">
              <SQLPreview sql={generatedSQL} selectedDB={selectedDB} />
            </div>
          </div>
          <div className="mt-8">
            <DatabaseSchemaVisualization schema={databaseSchema} />
          </div>
        </div>
      </div>
    </div>
  );
}
