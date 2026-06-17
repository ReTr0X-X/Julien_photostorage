import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import crypto from 'crypto';

export default async function RootPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('ems_vault_token');

  let isAuthenticated = false;

  if (token) {
    const value = token.value;
    const parts = value.split(':');
    if (parts.length === 2) {
      const [username, hmac] = parts;
      const expectedHmac = crypto.createHmac('sha256', 'ems_vault_jwt_secret_2026').update(username).digest('hex');
      if (hmac === expectedHmac) {
        isAuthenticated = true;
      }
    }
  }

  if (isAuthenticated) {
    redirect('/portal');
  } else {
    redirect('/login');
  }
}
