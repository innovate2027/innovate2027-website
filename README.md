# INNOVATE 2027 Website — Updated Starter Package

Responsive Next.js event website for St. Joseph College of Engineering, organised by SJCE Innovation and Incubation Forum (SJIIF).

## Confirmed event configuration
- Event date: 11 February 2027
- Registration deadline: 31 January 2027
- Fee: ₹300 per team, per event (maximum three team members)
- Events: Innovation Challenge Hackathon; Idea Pitch; Project Expo; Student Startup Showcase
- Prize amounts are deliberately not displayed on the public website.
- Contact: iic@stjoseph.ac.in

## Event submission rules
| Event | Required submission | Limit |
|---|---|---|
| Innovation Challenge Hackathon | No file | — |
| Idea Pitch | PPT/PPTX | 5 MB |
| Project Expo | One-page PDF | 5 MB |
| Student Startup Showcase | E-poster PDF | 5 MB |

The registration form captures team name, participant category, institution, department and each member's name, phone and email. The team leader is selected from the member list. Registering for another event requires a separate form submission and ₹300 payment.

## Included in this starter package
- Public event landing page and event-wise upload rules
- Team registration for 1–3 members
- Event-specific file extension/type and 5 MB size checks
- Private Supabase Storage upload for submission files
- Razorpay order creation and server-side payment signature / capture / amount verification
- Razorpay webhook endpoint for payment captured/failed reconciliation
- Optional email confirmation to team leader and iic@stjoseph.ac.in via Resend
- Protected organiser dashboard with registration listing, payment status, signed submission download links, attendance verification, individual participation certificate PDF generation after attendance verification and Excel-compatible CSV export
- SQL schema and private storage bucket configuration

## Important: not live yet
This is a source package, not a deployed website. It does not contain live SJIIF credentials, merchant keys, bank details, database credentials, domain configuration or real registration records. Do not publish or accept live payments until the college authorises and tests the setup.

## Setup
1. Install Node.js 20 or later.
2. Create a Supabase project approved for the event.
3. Open Supabase SQL Editor and run `supabase/schema.sql`. This creates the registration table and a private `event-submissions` bucket with a 5 MB limit.
4. In `.env.example`, copy the values to `.env.local` and fill in the Supabase project URL and service-role key. Keep the service-role key on the server only.
5. Connect the authorised SJIIF Razorpay merchant account. Start with Razorpay Test Mode. Fill in the test key ID, key secret and webhook secret. Set `NEXT_PUBLIC_RAZORPAY_KEY_ID` to the same test key ID.
6. Keep `REGISTRATION_FEE_PAISE=30000`. Server-side order creation fixes the amount at ₹300 per event registration.
7. Set a long random `ADMIN_ACCESS_KEY`. Optional email requires a Resend API key and a verified institutional sender in `EMAIL_FROM`.
8. Run locally:
   ```bash
   npm install
   npm run dev
   ```
   Open http://localhost:3000. Admin dashboard: http://localhost:3000/admin.
9. In Razorpay, configure webhook URL `https://YOUR-DOMAIN/api/webhook/razorpay` and subscribe to `payment.captured` and `payment.failed`.
10. Test successful payment, failed payment, repeated webhook delivery, file uploads, admin login, CSV export and attendance verification using test credentials before go-live.

## Environment variables
See `.env.example`. Never expose Supabase service-role key, Razorpay secret, webhook secret or admin access key in any `NEXT_PUBLIC_` variable.

## Deployment and launch checklist
- Use an institution-approved hosting account and domain/subdomain.
- Obtain written authorisation to use the SJIIF bank settlement account and Razorpay merchant account.
- Complete Razorpay KYC and verify settlement destination before live mode.
- Confirm event rules, file submission specifications, privacy notice, refund/cancellation policy and registration closure behaviour with the college.
- Add approved college/SJIIF logos and final poster assets.
- Configure email sender/domain authentication.
- Restrict admin access to authorised organisers; rotate the access key if exposed.
- Set backups, retention rules and monitor hosting/storage limits.

## Scope notes
- Payment is one ₹300 charge per team-event registration. Multiple events require multiple registrations and charges.
- Prize amounts are intentionally omitted from the public site.
- Attendance can be marked by an administrator in the dashboard. Individual certificate PDF generation, QR certificate verification, jury scoring and automated Excel email attachments are not yet implemented and should be added/approved as a separate build phase before launch.
- Project Expo PDF upload is validated as exactly one page and no larger than 5 MB.
- No real payment can be accepted until valid SJIIF merchant keys and approved live-mode setup are configured.
