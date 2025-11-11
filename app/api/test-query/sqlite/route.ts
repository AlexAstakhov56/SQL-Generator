import { NextRequest, NextResponse } from "next/server";
import { SQLiteTester } from "@/lib/utils/testing/sqlite-tester";

export async function POST(request: NextRequest) {
  try {
    const { sql } = await request.json();

    if (!sql) {
      return NextResponse.json(
        { error: "SQL query is required" },
        { status: 400 }
      );
    }

    const result = await SQLiteTester.testQuery(sql);

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
