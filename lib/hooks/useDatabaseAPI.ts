"use client";

import { useState } from "react";
import { TableSchema, DatabaseType, GeneratedSQL } from "../types";

export function useDatabaseAPI() {
  const [loading, setLoading] = useState(false);

  const generateSQL = async (
    schema: TableSchema,
    selectedDB: DatabaseType
  ): Promise<string> => {
    // Изменяем возвращаемый тип на string
    setLoading(true);
    try {
      const response = await fetch("/api/generate-sql", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ schema, selectedDB }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate SQL");
      }

      const data = await response.json();

      // Извлекаем SQL для выбранной СУБД
      if (typeof data === "string") {
        return data; // Если API возвращает напрямую строку
      } else if (data.sql) {
        return data.sql; // Если API возвращает { sql: string }
      } else if (data[selectedDB]) {
        return data[selectedDB].sql || data[selectedDB]; // Если возвращает объект по СУБД
      } else {
        throw new Error("Invalid response format from server");
      }
    } catch (error) {
      console.error("Generate SQL error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const testQuery = async (
    query: string,
    selectedDB: DatabaseType
  ): Promise<any> => {
    setLoading(true);
    try {
      const response = await fetch("/api/test-query", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query, selectedDB }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Testing failed");
      }

      return await response.json();
    } catch (error) {
      console.error("Test query error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    generateSQL,
    testQuery,
    loading,
  };
}
