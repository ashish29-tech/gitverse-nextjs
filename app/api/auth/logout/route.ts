import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/middleware";
import { apiError } from "@/lib/api-error";
export async function POST(request: NextRequest) {
  const user = await getAuthUser(request);

 if (!user) {
  return apiError(401, "Not authenticated");
}

  // In a stateless JWT setup, logout is handled client-side by removing the token
  // We can optionally implement token blacklisting here if needed
  return NextResponse.json({ message: "Logged out successfully" });
}
