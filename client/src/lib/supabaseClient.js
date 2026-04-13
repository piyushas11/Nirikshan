
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://bhdzpncpyhxmgjqqrfhx.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJoZHpwbmNweWh4bWdqcXFyZmh4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQxNzI1ODcsImV4cCI6MjA4OTc0ODU4N30.BG93_sDgsi2Cw2qFW9GsVXAN-aU9L3SJ7GvonBrXSl8";

export const supabase = createClient(supabaseUrl, supabaseKey);