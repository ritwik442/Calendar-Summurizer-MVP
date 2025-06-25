import { supabase } from '../lib/supabaseClient';

export default function Login() {
  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
    });
    if (error) console.error('OAuth error', error.message);
  };

  return (
    <div className="flex flex-col items-center mt-32">
      <h1 className="text-3xl font-bold mb-6">Calendar Summarizer MVP</h1>
      <button
        onClick={signInWithGoogle}
        className="px-4 py-2 bg-blue-600 text-white rounded"
      >
        Sign in with Google
      </button>
    </div>
  );
}
