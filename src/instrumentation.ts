import { assertRuntimeEnv } from "@/lib/env";

// Runs once when the server starts. Refuses to boot in production with
// placeholder secrets (skipped automatically during `next build`).
export async function register() {
  assertRuntimeEnv();
}
