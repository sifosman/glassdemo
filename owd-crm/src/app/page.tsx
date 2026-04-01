import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase';

export default async function Home() {
  const supabase = await createClient();
  
  // Check if user is authenticated
  const { data: { session } } = await supabase.auth.getSession();
  
  if (session) {
    // User is logged in, redirect to dashboard
    redirect('/dashboard');
  } else {
    // User is not logged in, redirect to login
    redirect('/login');
  }
}
