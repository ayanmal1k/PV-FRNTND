import { createClient } from "@supabase/supabase-js";
import type { Session, User as SupabaseUser } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export type AppUser = {
  id: string;
  email?: string | null;
  phone?: string | null;
  firstName: string;
  lastName: string;
  role: string;
  avatar?: string | null;
};

export function mapSupabaseUser(user: SupabaseUser): AppUser {
  const metadata = user.user_metadata ?? {};
  const fullName = typeof metadata.full_name === "string" ? metadata.full_name : "";
  const [fallbackFirstName = "User", ...fallbackLastName] = fullName.split(" ").filter(Boolean);

  return {
    id: user.id,
    email: user.email,
    phone: user.phone,
    firstName: typeof metadata.firstName === "string" ? metadata.firstName : fallbackFirstName,
    lastName: typeof metadata.lastName === "string" ? metadata.lastName : fallbackLastName.join(" "),
    role: typeof metadata.role === "string" ? metadata.role : "USER",
    avatar: typeof metadata.avatar === "string" ? metadata.avatar : null,
  };
}

export function mapSupabaseSession(session: Session) {
  return {
    user: mapSupabaseUser(session.user),
    accessToken: session.access_token,
    refreshToken: session.refresh_token,
  };
}
