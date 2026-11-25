# Supabase setup — PFC email authentication

PFC uses **email + password** through Supabase Auth. Email is the login identity. A public username is collected after verification and is used for the player's PFC identity, not as a direct Supabase password-login credential.

## 1. Configure email authentication

1. Open your Supabase project → **Authentication → Sign In / Providers → Email**.
2. Enable Email provider and **Confirm email**.
3. Configure the project's Site URL and Redirect URLs to include the exact URL where PFC will be hosted (for local testing, include your local static-server URL too).
4. For reliable delivery to real users, configure a trusted custom SMTP provider under **Authentication → SMTP Settings**. Supabase's default email service is rate-limited and intended for testing.
5. Keep password recovery enabled. PFC uses Supabase's `resetPasswordForEmail` flow and updates the password after the user opens the secure email link.

## 2. Apply the database

- For a brand-new database, run `schema.sql` in Supabase SQL Editor.
- If you already installed the previous PFC phone-auth schema, run `email-auth-migration.sql` instead. Do not blindly rerun the complete schema over an existing database.

The auth trigger creates a minimal profile and player role. After email verification and first sign-in, PFC asks the player for full name, unique username and phone number. RLS and column-level grants allow players to update only those profile fields; moderation status remains protected.

## 3. Connect the browser app

Edit the root `config.js` file:

```js
window.PFC_CONFIG = {
  supabaseUrl: "https://YOUR-PROJECT.supabase.co",
  supabaseAnonKey: "YOUR_SUPABASE_ANON_OR_PUBLISHABLE_KEY",
  demoMode: false
};
```

Only the project URL and anon/publishable key belong in browser code. Never expose the service-role key, SMTP password, payment secret or other private credential.

## 4. Password reset and verification test

1. Register with an email address you can access.
2. Confirm the email using the link received.
3. Return to PFC and sign in with email and password.
4. Complete the one-time player profile.
5. Sign out, use **Forgot password?**, and request a reset link.
6. Open the link in the same browser/site origin, set a new password, then sign in again.
7. Test **Resend verification email** for a registration that has not yet been confirmed.

If links return to the wrong page, check the Supabase Site URL and Redirect URLs. If emails do not arrive, check spam and SMTP configuration.

## 5. Other platform setup

Continue with the root `README.md` and the storage instructions in this folder. Create a private `payment-proofs` Storage bucket and test all RLS policies using separate player and operator accounts before any public launch.
