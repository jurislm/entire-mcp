import { execFile } from "child_process";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

export interface CliResult {
  stdout: string;
  stderr: string;
}

export async function runEntire(
  args: string[],
  options?: { cwd?: string; timeout?: number }
): Promise<CliResult> {
  try {
    const { stdout, stderr } = await execFileAsync("entire", args, {
      timeout: options?.timeout ?? 30_000,
      cwd: options?.cwd,
    });
    return { stdout, stderr };
  } catch (error: unknown) {
    const err = error as NodeJS.ErrnoException & {
      stdout?: string;
      stderr?: string;
      code?: number;
    };
    const detail = err.stderr?.trim() || err.message;
    throw new Error(`entire ${args.join(" ")} failed: ${detail}`, { cause: error });
  }
}

export function repoPath(override?: string): string | undefined {
  return override ?? process.env.ENTIRE_REPO_PATH;
}
