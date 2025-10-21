"use server";
import { NextRequest, NextResponse } from "next/server";

let queryHistory: any[] = [];

export async function GET() {
  return NextResponse.json({
    success: true,
    data: queryHistory.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    ),
  });
}

export async function POST(request: NextRequest) {
  try {
    const { name, schema, sql, tags = [] } = await request.json();

    const historyItem = {
      id: `hist_${Date.now()}`,
      name: name || `Запрос от ${new Date().toLocaleDateString()}`,
      schema,
      sql,
      tags,
      createdAt: new Date(),
    };

    queryHistory.unshift(historyItem); // Добавляем в начало

    // Ограничиваем историю последними 50 запросами
    if (queryHistory.length > 50) {
      queryHistory = queryHistory.slice(0, 50);
    }

    return NextResponse.json({ success: true, data: historyItem });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
