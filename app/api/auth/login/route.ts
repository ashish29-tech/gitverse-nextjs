import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { generateToken } from "@/lib/auth";

import { parseJsonBody, validateEmail, validatePassword } from "@/lib/validateAuth";
import { badRequestResponse } from "@/lib/middleware";

export async function POST(request: NextRequest) {
  try {
    const parsed = await parseJsonBody(request);
    if ("error" in parsed) return badRequestResponse(parsed.error);
    const { body } = parsed;

    const emailCheck = validateEmail(body.email);
    if (!emailCheck.valid) return badRequestResponse(emailCheck.error!);

    const passwordCheck = validatePassword(body.password);
    if (!passwordCheck.valid) return badRequestResponse(passwordCheck.error!);

    const email = body.email as string;
    const password = body.password as string;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Security: never allow password login for Google-only accounts.
    // A "Google-only" account is a user without a local password, but with a linked Google OAuth account.
    if (!user.passwordHash) {
      const hasGoogleAccount =
        (await prisma.account.count({
          where: { userId: user.id, provider: "google" },
        })) > 0;

      if (hasGoogleAccount) {
        return NextResponse.json(
          { error: "Email already exists. Please sign in with Google." },
          { status: 401 }
        );
      }
    }

    // Verify password
    const passwordHash = user.passwordHash || (user as any).password;
    if (!passwordHash) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    const isValidPassword = await bcrypt.compare(password, passwordHash);

    if (!isValidPassword) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Generate JWT token
    const token = generateToken({ userId: user.id, email: user.email });

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: (user as any).image,
      },
      token,
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
