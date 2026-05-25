import { NextRequest, NextResponse } from "next/server";
import { isHttpError, requireAuth } from "@/lib/middleware";
import prisma from "@/lib/prisma";
import { repositoryService } from "@/lib/services/repositoryService";
import { apiError } from "@/lib/api-error";
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(request);
    const id = parseInt(params.id);

    if (isNaN(id)) {
      return apiError(400, "Invalid repository ID");
    }

    const repository = await repositoryService.getRepository(id, user.userId);

    if (!repository) {
      return apiError(404, "Repository not found");
    }

    const latestJob = await prisma.analysisJob.findFirst({
      where: { repositoryId: id, userId: user.userId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        status: true,
        type: true,
        attempts: true,
        maxAttempts: true,
        nextRunAt: true,
        progressPercent: true,
        progressMessage: true,
        startedAt: true,
        finishedAt: true,
        error: true,
        updatedAt: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ repository, latestJob });
  } catch (error: any) {
    console.error("Get repository error:", error);

    if (isHttpError(error)) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }

    return NextResponse.json(
      { error: "Failed to get repository" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(request);
    const id = parseInt(params.id);

    if (isNaN(id)) {
      return NextResponse.json(
        { error: "Invalid repository ID" },
        { status: 400 }
      );
    }

    await repositoryService.deleteRepository(id, user.userId);

    return NextResponse.json({ message: "Repository deleted successfully" });
  } catch (error: any) {
    console.error("Delete repository error:", error);

    if (isHttpError(error)) {
  return apiError(error.status, error.message);
}

    if (error.message === "Repository not found") {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return apiError(500, "Failed to get repository");
  }
}
