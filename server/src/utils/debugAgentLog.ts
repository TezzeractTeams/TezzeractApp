import fs from 'fs';

const DEBUG_LOG_PATH =
  '/Users/wehan/Documents/Tezzeract/Tezzeract AI/.cursor/debug-42535a.log';

export function debugAgentLog(
  location: string,
  message: string,
  data: Record<string, unknown>,
  hypothesisId: string,
  runId = 'pre-fix',
): void {
  // #region agent log
  try {
    const line = JSON.stringify({
      sessionId: '42535a',
      runId,
      hypothesisId,
      location,
      message,
      data,
      timestamp: Date.now(),
    });
    fs.appendFileSync(DEBUG_LOG_PATH, `${line}\n`);
  } catch {
    // ignore
  }
  // #endregion
}
