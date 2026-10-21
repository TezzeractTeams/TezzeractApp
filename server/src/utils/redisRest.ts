/**
 * Minimal Upstash Redis REST client (HTTP only, no TCP).
 *
 * Used for state that must be shared across API instances: revoked session
 * ids and refresh single-flight locks. The command is sent as a JSON array,
 * so keys and values never need URL encoding.
 */

export function isRedisConfigured(): boolean {
  return Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
}

export async function redisCommand(command: (string | number)[]): Promise<unknown> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    throw new Error('redis_not_configured');
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(command),
  });

  if (!response.ok) {
    throw new Error(`redis_http_${response.status}`);
  }

  const body = (await response.json()) as { result?: unknown; error?: string };
  if (body.error) {
    throw new Error('redis_command_failed');
  }
  return body.result;
}
