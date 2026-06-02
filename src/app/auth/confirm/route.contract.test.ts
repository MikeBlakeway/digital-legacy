import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import type { NextRequest } from "next/server";

type AuthConfirmRouteModule = {
  GET: (request: NextRequest) => Promise<Response>;
};

const routePath = join(process.cwd(), "src/app/auth/confirm/route.ts");

assert.equal(existsSync(routePath), true, "src/app/auth/confirm/route.ts should exist.");

async function main() {
  const { GET } = (await import(
    pathToFileURL(routePath).href
  )) as AuthConfirmRouteModule;
  const handler: (request: NextRequest) => Promise<Response> = GET;

  void handler;
}

void main();
