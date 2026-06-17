import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import crypto from 'crypto';
import DashboardClient from './DashboardClient';
import { isAdmin } from '@/lib/db';

export default async function DashboardPage({ params }) {
  const { env, category } = await params;

  // Verify auth
  const cookieStore = await cookies();
  const token = cookieStore.get('ems_vault_token');

  let isAuthenticated = false;
  let operatorName = 'officer';

  if (token) {
    const value = token.value;
    const parts = value.split(':');
    if (parts.length === 2) {
      const [username, hmac] = parts;
      const expectedHmac = crypto.createHmac('sha256', 'ems_vault_jwt_secret_2026').update(username).digest('hex');
      if (hmac === expectedHmac) {
        isAuthenticated = true;
        operatorName = username;
      }
    }
  }

  if (!isAuthenticated) {
    redirect('/login');
  }

  const userIsAdmin = await isAdmin(operatorName);

  return <DashboardClient env={env} category={category} operatorName={operatorName} isAdmin={userIsAdmin} />;
}
