import { jwtVerify, type JWTPayload } from 'jose';
import { getJwks, oidcConfig } from '../config/oidc.js';

const BACKCHANNEL_LOGOUT_EVENT =
  'http://schemas.openid.net/event/backchannel-logout';

export async function verifyLogoutToken(token: string): Promise<JWTPayload> {
  const { payload } = await jwtVerify(token, getJwks(), {
    issuer: oidcConfig.issuer,
    audience: oidcConfig.clientId,
  });

  if (payload.nonce !== undefined) {
    throw new Error('invalid_logout_token');
  }

  const events = payload.events;
  if (
    typeof events !== 'object' ||
    events === null ||
    !(BACKCHANNEL_LOGOUT_EVENT in events)
  ) {
    throw new Error('invalid_logout_token');
  }

  return payload;
}
