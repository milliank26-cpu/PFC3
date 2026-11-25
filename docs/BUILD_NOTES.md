# Build notes and product rules

## Operator authority

The operator experience is intended to provide central oversight of players, games, competitions, payment evidence, support and platform activity. Operator actions that affect a player's access must capture a reason and be auditable.

Account actions in this starter include active, restricted, suspended and banned states. In production, use a documented moderation policy, notice to the player, appeal/review process and role separation for high-impact actions.

## Game configuration

Each game stores:
- Public name, description, image URL and active status.
- Competition format.
- Rule text and rule version.
- Winner determination method.
- Match/round duration and time limits.
- Tie-breaker method.
- Evidence and score-verification requirements.
- Minimum and maximum player counts.

The rules editor is intentionally flexible. It does not execute arbitrary code supplied by operators. Game rules are data/configuration; executable scoring logic should be implemented and tested in trusted server-side code.

## Payment flow

The demo creates a reference code for each payment submission and displays it to the player and operator. The operator sees the player phone number, amount, reference and proof image status.

In production:
- A server function must create the payment intent/reference.
- A private Storage bucket must store proof images; the operator review screen uses short-lived signed URLs to view submitted images.
- Operator verification must be recorded in the database.
- Actual payment-provider confirmation should be authoritative wherever a provider integration exists.
- A screenshot alone is not proof of settled funds.
- Do not store full card data or mobile money PINs.

## Error handling

Players should receive safe, friendly messages and a support reference. Detailed technical errors should be logged privately for operators. Never display database errors, SQL details, stack traces, secrets or provider tokens to players.

## Known limitations

- The supplied app is a front-end review build with working local demo interactions.
- Supabase integration is scaffolded; the database schema is supplied, but environment credentials and project configuration must be added by the owner.
- Email/password authentication depends on enabling email confirmation, configuring the Site URL/Redirect URLs and setting up SMTP in Supabase.
- Password recovery uses Supabase email reset links and the PASSWORD_RECOVERY session event; test redirect URLs and email delivery before launch.
- Payment gateway and production SMTP delivery are not connected until configured in the Supabase project.
- Uploaded payment proof UI uses a demo placeholder until a private Supabase Storage bucket is configured.
- The starter includes basic admin workflows, not a full production moderation case-management system.