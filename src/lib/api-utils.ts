import { NextResponse } from "next/server";

type RouteHandler = (
  req: Request,
  context?: { params: Promise<Record<string, string | string[]>> }
) => Promise<Response>;

export function withErrorHandling(handler: (...args: never[]) => Promise<Response>): RouteHandler {
  return async (req, context) => {
    try {
      return await (handler as RouteHandler)(req, context);
    } catch (error) {
      if (error instanceof SyntaxError) {
        return NextResponse.json(
          { error: "Invalid JSON in request body" },
          { status: 400 }
        );
      }

      console.error(`Unhandled error in ${req.method} ${req.url}:`, error);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  };
}
