import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '../lib/supabaseClient';



export default function LoginPage() {
    return (
        <Auth
      supabaseClient={supabase}
      // view="magic_link"
    appearance={{ theme: ThemeSupa }}
      providers={["google"]}
      redirectTo={`${window.location.origin}/auth/callback`}
    />
    );
}