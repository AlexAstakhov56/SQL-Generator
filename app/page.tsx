"use client";

import { useState, useEffect } from "react";
import { DatabaseSchema, DatabaseType, TableSchema } from "../lib/types";
import { MultiTableUtils } from "../lib/utils/multi-table-utils";
import { MultiTableGenerator } from "../lib/utils/generators/multi-table-generator";
import { DBSelector } from "../components/database/db-selector";
import { SQLPreview } from "../components/database/sql-preview";
import { DatabaseSchemaEditor } from "@/components/schema/database-schema-editor";
import { DatabaseSchemaVisualization } from "@/components/schema/database-schema-visualization";

export default function Home() {
  const [selectedDB, setSelectedDB] = useState<DatabaseType>("sqlite");
  const [databaseSchema, setDatabaseSchema] = useState<DatabaseSchema>(
    MultiTableUtils.createDatabaseSchema("my_database")
  );
  const [generatedSQL, setGeneratedSQL] = useState<string>("");
  const [selectSql, setSelectSql] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

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
          constraints: ["NOT_NULL"],
          defaultValue: "",
          dbSpecific: {
            mysql: {},
            postgresql: {},
            sqlite: {},
          },
        },
      ],
      relationships: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    setDatabaseSchema({
      ...initialSchema,
      tables: [exampleTable],
    });
  }, []);

  const handleGenerateSQL = async (schema: DatabaseSchema) => {
    setIsGenerating(true);

    try {
      // Генерация SQL для всей схемы
      const sql = MultiTableGenerator.generateDatabaseSchema(
        schema,
        selectedDB
      );

      setGeneratedSQL(sql);
    } catch (error: any) {
      console.error("Generate SQL error:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSelectQueryGenerated = (sql: string) => {
    setSelectSql(sql);
  };

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

        <DatabaseSchemaEditor
          schema={databaseSchema}
          selectedDB={selectedDB}
          onSchemaChange={setDatabaseSchema}
          onGenerateSQL={handleGenerateWithValidation}
          isGenerating={isGenerating}
          onSelectQueryGenerated={handleSelectQueryGenerated}
        />
        <div className="my-8">
          <SQLPreview
            sql={generatedSQL}
            selectSql={selectSql}
            databaseSchema={databaseSchema}
            dbType={selectedDB}
            onSelectSqlChange={setSelectSql}
          />
        </div>
        <div>
          <DatabaseSchemaVisualization schema={databaseSchema} />
        </div>
      </div>
    </div>
  );
}
