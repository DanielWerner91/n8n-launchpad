import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    name: "LaunchPad API",
    version: "v1",
    docs: "https://launchpad-six-tau.vercel.app/docs/api",
    authentication: {
      type: "bearer",
      header: "Authorization: Bearer lp_...",
      get_keys: "Create keys at /dashboard/settings#api-keys",
    },
    endpoints: [
      { method: "GET", path: "/api/v1", description: "This index." },
      { method: "GET", path: "/api/v1/projects", description: "List projects. Query: ?stage=&health=&limit=" },
      { method: "POST", path: "/api/v1/projects", description: "Create a project." },
      { method: "GET", path: "/api/v1/projects/:slug", description: "Get a project by slug." },
      { method: "PATCH", path: "/api/v1/projects/:slug", description: "Update a project." },
      { method: "GET", path: "/api/v1/projects/:slug/features", description: "List features. Query: ?status=" },
      { method: "POST", path: "/api/v1/projects/:slug/features", description: "Create a feature." },
      { method: "GET", path: "/api/v1/launches", description: "List launches." },
    ],
    webhook_events: [
      "project.created",
      "project.updated",
      "project.stage_changed",
      "feature.created",
      "feature.updated",
      "launch.created",
    ],
    webhook_signature: {
      header: "X-LaunchPad-Signature: sha256=<hex>",
      algorithm: "HMAC-SHA256",
      payload: "<timestamp>.<body>",
      timestamp_header: "X-LaunchPad-Timestamp",
    },
  });
}
