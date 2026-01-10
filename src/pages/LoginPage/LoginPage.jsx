import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { supabase } from 'lib/supabaseClient';

export default function LoginPage() {
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      // If the user is signed in, redirect them to a protected page (e.g., '/dashboard')
      if (event === 'SIGNED_IN' && session) {
        navigate('/home');
      } if (event === 'SIGNED_OUT' && session) {
        navigate('/login')
      }
    });

    // Unsubscribe from the listener when the component unmounts
    return () => subscription.unsubscribe();
  }, [navigate]);

  return (
    <Auth
      supabaseClient={supabase}
      // view="magic_link"
      appearance={{ theme: ThemeSupa }}
      providers={["google"]}
      redirectTo={`${window.location.origin}/auth/v1/callback`}
    />
  );
}
