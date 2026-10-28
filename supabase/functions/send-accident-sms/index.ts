import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface RequestBody {
  recipients?: string[];
  message?: string;
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function uniqueRecipients(values: string[]) {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const value of values) {
    const clean = value.replace(/[^\d+]/g, '').trim();
    const key = clean.replace(/\D/g, '');
    if (!clean || seen.has(key)) continue;
    seen.add(key);
    out.push(clean);
  }
  return out.slice(0, 10);
}

serve(async request => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return json({ success: false, message: 'POST only.' }, 405);

  const authHeader = request.headers.get('Authorization');
  if (!authHeader) return json({ success: false, message: 'Authentication required.' }, 401);

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
  if (!supabaseUrl || !supabaseAnonKey) {
    return json({ success: false, message: 'Supabase function environment is not configured.' }, 503);
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) return json({ success: false, message: 'Invalid session.' }, 401);

  const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
  const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');
  const fromNumber = Deno.env.get('TWILIO_FROM_NUMBER');

  if (!accountSid || !authToken || !fromNumber) {
    return json({ success: false, message: 'Twilio environment variables are not configured.' }, 503);
  }

  let body: RequestBody;
  try {
    body = await request.json();
  } catch {
    return json({ success: false, message: 'Invalid JSON body.' }, 400);
  }

  const recipients = uniqueRecipients(Array.isArray(body.recipients) ? body.recipients.filter(value => typeof value === 'string') : []);
  const message = typeof body.message === 'string' ? body.message.trim() : '';

  if (!recipients.length || !message) return json({ success: false, message: 'Recipients and message are required.' }, 400);
  if (message.length > 1200) return json({ success: false, message: 'Message is too long.' }, 400);

  const basic = btoa(`${accountSid}:${authToken}`);
  const results: Array<{ to: string; ok: boolean; error?: string }> = [];

  for (const to of recipients) {
    const params = new URLSearchParams();
    params.set('From', fromNumber);
    params.set('To', to);
    params.set('Body', message);

    try {
      const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${basic}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      });

      if (!response.ok) {
        const errorText = await response.text();
        results.push({ to, ok: false, error: errorText.slice(0, 300) });
      } else {
        results.push({ to, ok: true });
      }
    } catch (error) {
      results.push({ to, ok: false, error: String(error) });
    }
  }

  const successCount = results.filter(item => item.ok).length;
  return json(
    {
      success: successCount > 0,
      sent: successCount,
      total: results.length,
      results,
    },
    successCount > 0 ? 200 : 502,
  );
});
