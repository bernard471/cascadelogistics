import { registerOTel } from "@vercel/otel";

export function register() {
  registerOTel({ serviceName: "cascade-logistics" });
}

export function onRequestError(error: Error, request: { path: string }, context: { routerKind?: string; routeType?: string }) {
  console.error("Unhandled application request error", {
    error: error.name,
    digest: (error as Error & { digest?: string }).digest,
    path: request.path,
    routerKind: context.routerKind,
    routeType: context.routeType,
  });
}
