"use server";
import { QueryTester } from "@/lib/utils";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const tester = new QueryTester();
    const isDockerAvailable = await tester.checkDockerAvailability();

    return NextResponse.json({
      success: true,
      data: {
        dockerAvailable: isDockerAvailable,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
