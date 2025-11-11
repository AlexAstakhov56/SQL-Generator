import { NextRequest, NextResponse } from "next/server";
import { QueryTester } from "@/lib/utils/testing/query-tester";

export async function GET() {
  try {
    const status = await QueryTester.getContainersStatus();
    return NextResponse.json(status);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json();

    if (action === "start") {
      const result = await QueryTester.startContainers();
      return NextResponse.json(result);
    } else if (action === "stop") {
      const result = await QueryTester.stopContainers();
      return NextResponse.json(result);
    } else {
      return NextResponse.json(
        { error: 'Invalid action. Use "start" or "stop"' },
        { status: 400 }
      );
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
