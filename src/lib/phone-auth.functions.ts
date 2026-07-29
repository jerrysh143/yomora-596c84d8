import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const requestPhoneOtpFn = createServerFn({ method: "POST" })
  .inputValidator((data) => z.object({ phone: z.string().min(6) }).parse(data))
  .handler(async ({ data }) => {
    const {
      normalisePhone,
      hashCode,
      generateCode,
      sendWhatsAppCode,
      OTP_TTL_MINUTES,
    } = await import("./phone-auth.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const phone = normalisePhone(data.phone);

    // Simple throttle: max 3 codes per number per 10 minutes.
    const since = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const { count } = await supabaseAdmin
      .from("phone_otps")
      .select("id", { count: "exact", head: true })
      .eq("phone", phone)
      .gte("created_at", since);
    if ((count ?? 0) >= 3) {
      throw new Error("Too many codes requested. Please try again in a few minutes.");
    }

    const code = generateCode();
    const { error } = await supabaseAdmin.from("phone_otps").insert({
      phone,
      code_hash: hashCode(phone, code),
      expires_at: new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000).toISOString(),
    });
    if (error) throw new Error(error.message);

    const sent = await sendWhatsAppCode(phone, code);
    return {
      phone,
      sent,
      // Only surfaced when no WhatsApp provider is configured yet.
      devCode: sent ? null : code,
    };
  });

export const verifyPhoneOtpFn = createServerFn({ method: "POST" })
  .inputValidator((data) =>
    z.object({ phone: z.string().min(6), code: z.string().length(6) }).parse(data),
  )
  .handler(async ({ data }) => {
    const { normalisePhone, hashCode, phoneEmail, generatePassword, MAX_ATTEMPTS } =
      await import("./phone-auth.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const phone = normalisePhone(data.phone);
    const { data: rows, error } = await supabaseAdmin
      .from("phone_otps")
      .select("id,code_hash,expires_at,attempts,consumed")
      .eq("phone", phone)
      .eq("consumed", false)
      .order("created_at", { ascending: false })
      .limit(1);
    if (error) throw new Error(error.message);
    const row = rows?.[0];
    if (!row) throw new Error("Request a new code to continue.");
    if (new Date(row.expires_at).getTime() < Date.now()) throw new Error("This code has expired.");
    if (row.attempts >= MAX_ATTEMPTS) throw new Error("Too many wrong attempts. Request a new code.");

    if (row.code_hash !== hashCode(phone, data.code)) {
      await supabaseAdmin
        .from("phone_otps")
        .update({ attempts: row.attempts + 1 })
        .eq("id", row.id);
      throw new Error("That code is incorrect.");
    }

    await supabaseAdmin.from("phone_otps").update({ consumed: true }).eq("id", row.id);

    const email = phoneEmail(phone);
    const password = generatePassword();

    // Find the existing auth user for this number, or create it.
    const { data: list } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    const existing = list?.users?.find((u) => u.email === email);

    if (existing) {
      const { error: upErr } = await supabaseAdmin.auth.admin.updateUserById(existing.id, {
        password,
        phone_confirmed: true as never,
      });
      if (upErr) throw new Error(upErr.message);
    } else {
      const { error: createErr } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { phone, login_method: "whatsapp_otp" },
      });
      if (createErr) throw new Error(createErr.message);
    }

    // One-time credentials the browser immediately exchanges for a session.
    return { email, password };
  });
