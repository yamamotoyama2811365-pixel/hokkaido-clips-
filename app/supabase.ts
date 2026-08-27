import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://cnbhnxujgkgnjodnshvs.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNuYmhueHVqZ2tnbmpvZG5zaHZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc3MjUzODIsImV4cCI6MjEwMzMwMTM4Mn0.VwP7ujNoyoZ4IUMyw4aO7DA4QdNbSJnnKhuZMSgwKW8";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);