import { NextRequest, NextResponse } from "next/server";
import { SQLGenerator } from "@/lib/utils/generators/sql-generator";

export async function POST(request: NextRequest) {
  try {
    const { schema, selectedDB } = await request.json();
    console.log("🔍 API получил:", { schema, selectedDB });

    // Валидация входных данных
    if (!schema || !selectedDB) {
      return NextResponse.json(
        { error: "Missing required fields: schema and selectedDB" },
        { status: 400 }
      );
    }

    if (!schema.name || !schema.columns || schema.columns.length === 0) {
      return NextResponse.json(
        {
          error: "Invalid table schema: name and at least one column required",
        },
        { status: 400 }
      );
    }

    // Генерация SQL
    const sql = SQLGenerator.generateCreateTable(schema, selectedDB);
    console.log("🔍 API сгенерировал SQL:", sql);

    const response = {
      success: true,
      sql: sql,
      dbType: selectedDB,
      timestamp: new Date().toISOString(),
    };

    console.log("📤 API отправляет:", response);

    return NextResponse.json(response);
  } catch (error: any) {
    console.error("Generate SQL API error:", error);
    return NextResponse.json(
      {
        error: error.message || "Internal server error",
        success: false,
      },
      { status: 500 }
    );
  }
}
