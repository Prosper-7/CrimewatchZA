// Repo path: supabase/functions/send-alerts/index.ts
// Fires from a Database Webhook on INSERT into public.incidents.
// @ts-nocheck
import { serve } from 'https://deno.land/std@0.190.0/http/server.ts' // @ts-nocheck
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import webpush from 'npm:web-push@3.6.7' 

const RADIUS_KM = 2

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

webpush.setVapidDetails(
  Deno.env.get('VAPID_SUBJECT') ?? 'mailto:you@example.com', // set VAPID_SUBJECT secret to a real email
  Deno.env.get('VAPID_PUBLIC_KEY')!,
  Deno.env.get('VAPID_PRIVATE_KEY')!
)

serve(async (req: Request) => {
  try {
    const payload = await req.json()
    const incident = payload.record

    // Column names: adjust if your incidents table uses different ones
    const lat = incident.latitude ?? incident.lat
    const lng = incident.longitude ?? incident.lng ?? incident.lon

    if (lat == null || lng == null) {
      console.error('Incident has no coordinates', incident.id)
      return new Response('no coordinates', { status: 200 })
    }

    const { data: subscribers, error } = await supabase.rpc('nearby_alert_subscribers', {
      lat,
      lng,
      radius_km: RADIUS_KM,
    })

    if (error) {
      console.error('Failed to fetch nearby subscribers:', error)
      return new Response('error fetching subscribers', { status: 500 })
    }

    const title = incident.title ?? incident.category ?? 'New incident'
    let pushSent = 0
    let smsSent = 0

    for (const sub of subscribers ?? []) {
      // ---- Web push ----
      if (sub.push_subscription) {
        try {
          await webpush.sendNotification(
            sub.push_subscription,
            JSON.stringify({
              title: 'Incident reported near you',
              body: `${title} was reported within ${RADIUS_KM}km of your watch area.`,
              incidentId: incident.id,
            })
          )
          pushSent++
     } catch (err) {
  await logFailure(sub.id, 'push', err)
  const status = (err as { statusCode?: number })?.statusCode
  // 404/410 = subscription expired or revoked: clear it so we stop trying
  if (status === 404 || status === 410) {
    await supabase.from('profiles').update({ push_subscription: null }).eq('id', sub.id)
  }
}
      }

      // ---- SMS ----
      if (sub.phone) {
        try {
          await sendSms(sub.phone, `CrimeWatch ZA: ${title} reported within ${RADIUS_KM}km of your watch area.`)
          smsSent++
        } catch (err) {
          await logFailure(sub.id, 'sms', err)
        }
      }
    }

    return new Response(
      JSON.stringify({ checked: subscribers?.length ?? 0, pushSent, smsSent }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error('send-alerts crashed:', err)
    return new Response('internal error', { status: 500 })
  }
})

async function sendSms(rawPhone: string, body: string) {
  const sid = Deno.env.get('TWILIO_ACCOUNT_SID')!
  const token = Deno.env.get('TWILIO_AUTH_TOKEN')!
  const from = Deno.env.get('TWILIO_FROM_NUMBER')!

  // Supabase stores phones without "+", Twilio needs E.164
  const to = rawPhone.startsWith('+') ? rawPhone : `+${rawPhone}`

  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: 'POST',
    headers: {
      Authorization: 'Basic ' + btoa(`${sid}:${token}`),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({ To: to, From: from, Body: body }),
  })

  if (!res.ok) {
    throw new Error(`Twilio ${res.status}: ${await res.text()}`)
  }
}

async function logFailure(profileId: string, channel: 'push' | 'sms', err: unknown) {
  console.error(`${channel} failed for ${profileId}:`, err)
  try {
    await supabase.from('alert_delivery_failures').insert({
      profile_id: profileId,
      channel,
      error: String((err as Error)?.message ?? err),
    })
  } catch (logErr) {
    console.error('Could not write failure log:', logErr)
  }
}