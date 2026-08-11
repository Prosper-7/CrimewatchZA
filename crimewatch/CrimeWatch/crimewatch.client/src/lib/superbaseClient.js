// src/lib/supabaseClient.js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.https://tvycvnqsotghcmpfdnbr.supabase.co
const supabaseAnonKey = import.meta.env.sb_secret_aMfyNiaVwkEf4vrNtPI1Qw_CF61XUTr0

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
