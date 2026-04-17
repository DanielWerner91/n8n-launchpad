import { NextResponse } from "next/server";
import { authenticateBearer } from "@/lib/api/bearer";
import { listMcpTools, callMcpTool } from "@/lib/mcp/tools";

export const runtime = "nodejs";
export const maxDuration = 60;

const PROTOCOL_VERSION = "2025-06-18";
const SERVER_INFO = {
  name: "launchpad",
  version: "1.0.0",
};

type JsonRpcRequest = {
  jsonrpc: "2.0";
  id?: number | string | null;
  method: string;
  params?: Record<string, unknown>;
};

type JsonRpcResponse = {
  jsonrpc: "2.0";
  id: number | string | null;
  result?: unknown;
  error?: { code: number; message: string; data?: unknown };
};

function rpcError(id: number | string | null, code: number, message: string): JsonRpcResponse {
  return { jsonrpc: "2.0", id, error: { code, message } };
}

function rpcOk(id: number | string | null, result: unknown): JsonRpcResponse {
  return { jsonrpc: "2.0", id, result };
}

async function handleOne(
  req: JsonRpcRequest,
  userId: string,
): Promise<JsonRpcResponse | null> {
  const id = req.id ?? null;

  switch (req.method) {
    case "initialize":
      return rpcOk(id, {
        protocolVersion: PROTOCOL_VERSION,
        capabilities: { tools: {} },
        serverInfo: SERVER_INFO,
      });

    case "notifications/initialized":
    case "notifications/cancelled":
      return null;

    case "ping":
      return rpcOk(id, {});

    case "tools/list":
      return rpcOk(id, { tools: listMcpTools() });

    case "tools/call": {
      const params = req.params ?? {};
      const name = typeof params.name === "string" ? params.name : "";
      const args = (params.arguments ?? {}) as Record<string, unknown>;
      if (!name) return rpcError(id, -32602, "Missing tool name");
      const out = await callMcpTool(userId, name, args);
      if (out.ok) {
        return rpcOk(id, {
          content: [{ type: "text", text: JSON.stringify(out.result, null, 2) }],
          isError: false,
        });
      }
      return rpcOk(id, {
        content: [{ type: "text", text: out.error }],
        isError: true,
      });
    }

    default:
      return rpcError(id, -32601, `Method not found: ${req.method}`);
  }
}

export async function GET() {
  return NextResponse.json({
    name: "LaunchPad MCP",
    transport: "streamable_http",
    protocol: PROTOCOL_VERSION,
    auth: "Authorization: Bearer lp_...",
    tools: listMcpTools().map((t) => t.name),
    how_to_connect: {
      claude_desktop_config: {
        mcpServers: {
          launchpad: {
            type: "http",
            url: "https://launchpad-six-tau.vercel.app/api/mcp",
            headers: { Authorization: "Bearer lp_YOUR_KEY_HERE" },
          },
        },
      },
      get_key_at: "/dashboard/settings/developer",
    },
  });
}

export async function POST(req: Request) {
  const auth = await authenticateBearer(req);
  if (!auth.ok) return auth.response;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(rpcError(null, -32700, "Parse error"), { status: 400 });
  }

  const isBatch = Array.isArray(body);
  const requests: JsonRpcRequest[] = isBatch
    ? (body as JsonRpcRequest[])
    : [body as JsonRpcRequest];

  const responses: JsonRpcResponse[] = [];
  for (const r of requests) {
    if (!r || r.jsonrpc !== "2.0" || typeof r.method !== "string") {
      responses.push(rpcError(null, -32600, "Invalid Request"));
      continue;
    }
    const res = await handleOne(r, auth.ctx.userId);
    if (res) responses.push(res);
  }

  if (responses.length === 0) {
    return new Response(null, { status: 204 });
  }

  return NextResponse.json(isBatch ? responses : responses[0]);
}
