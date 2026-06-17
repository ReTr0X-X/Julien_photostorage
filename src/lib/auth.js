import crypto from 'crypto';

export function verifyAuth(request) {
  const cookie = request.cookies.get('ems_vault_token');
  if (!cookie) return null;

  const value = cookie.value;
  const parts = value.split(':');
  if (parts.length !== 2) return null;

  const [username, hmac] = parts;
  const expectedHmac = crypto.createHmac('sha256', 'ems_vault_jwt_secret_2026').update(username).digest('hex');

  if (hmac === expectedHmac) {
    return { username };
  }
  return null;
}
