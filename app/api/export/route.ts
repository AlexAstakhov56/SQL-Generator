"use server";
import { NextRequest, NextResponse } from "next/server";
import { SelectedDBService } from "../../../lib/services/selected-db-service";
import { TableSchema, DatabaseType } from "../../../lib/types";

export async function POST(request: NextRequest) {
  try {
    const {
      schema,
      dbTypes,
    }: { schema: TableSchema; dbTypes: DatabaseType[] } = await request.json();

    if (!schema || !dbTypes || !Array.isArray(dbTypes)) {
      return NextResponse.json(
        { success: false, error: "Необходимы schema и dbTypes массив" },
        { status: 400 }
      );
    }

    const dbService = await SelectedDBService.createForServer();
    const exports: Record<string, string> = {};

    // Генерируем SQL для каждой СУБД
    for (const dbType of dbTypes) {
      const result = await dbService.generateSQL(schema, dbType);
      if (result[dbType]?.sql) {
        exports[dbType] = result[dbType]!.sql;
      }
    }

    // Создаем файл для скачивания
    const exportData = {
      schema,
      generated_at: new Date().toISOString(),
      sql: exports,
    };

    return new NextResponse(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="sql_export_${Date.now()}.json"`,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
