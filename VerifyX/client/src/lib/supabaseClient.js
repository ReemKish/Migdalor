import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://stxeyhqnikhkdfuaxfxc.supabase.co'
const supabaseAnonKey = 'sb_publishable_xDr7SOAxBPly03gR_sc6Fw_4Tvj_hQW'

export const supabase =
  supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null
