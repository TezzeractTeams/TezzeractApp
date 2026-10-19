export type OidcClaims = Record<string, unknown> & {
  sub?: string;
  email?: string;
  name?: string;
  preferred_username?: string;
  picture?: string;
};
