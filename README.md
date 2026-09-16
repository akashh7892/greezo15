# Greezo — Frontend

A Next.js (App Router) frontend with three self-contained sections: the main
customer-facing website, the vendor portal, and the admin portal.

## Project structure

```
src/
  app/
    page.tsx                 # Main Greezo website (single-page: home/juices/plans/about/contact)
    layout.tsx                # Root layout + SEO metadata
    context/
      Authcontext.tsx         # Customer auth context (used by the main website)
      actions.ts
    admin/                     # Admin portal — routes under /admin
      page.tsx                 # /admin → redirects to /admin/orders or /admin/login
      layout.tsx                # Wraps everything below in AdminAuthProvider
      login/page.tsx             # /admin/login
      orders/page.tsx            # /admin/orders
      commissions/page.tsx       # /admin/commissions
      components/AdminShell.tsx  # Shared admin nav/shell
      context/AdminAuthContext.tsx
    vendor/                     # Vendor portal — routes under /vendor
      page.tsx                  # /vendor → redirects to /vendor/dashboard or /vendor/login
      layout.tsx                 # Wraps everything below in VendorAuthProvider
      login/page.tsx              # /vendor/login
      register/page.tsx           # /vendor/register
      dashboard/page.tsx          # /vendor/dashboard
      profile/page.tsx            # /vendor/profile
      components/VendorShell.tsx  # Shared vendor nav/shell (sidebar + bottom nav)
      context/VendorAuthContext.tsx

  components/
    ui/                        # shadcn/ui primitives, shared across all three sections
    user/                      # Components for the main customer website (Header, HomeSection,
                                 # JuicesSection, PlansSection, AboutSection, ContactSection,
                                 # AccountPage, CheckoutDialog, modals, etc.)

  hooks/                      # Shared hooks (use-toast, use-mobile)
  lib/                        # Shared utilities, constants, Supabase/Sheets clients
  ai/                         # Genkit AI flow scaffolding (WhatsApp message generation)

public/
  images/                     # All live image assets, grouped by feature
    greezo-logo.png
    meals/, non-egg/, juices/, fresh-juices/, splash/
```

## What was cleaned up

This project previously had a flat, duplicated copy of the entire vendor
module sitting at the repo root (`/dashboard`, `/login`, `/register`,
`/profile`, `/components`, `/context`, plus a stray root `layout.tsx` and
`page.tsx`). None of that was reachable by Next.js routing (only `src/app/**`
is), so it was dead weight — it has been removed in favor of the real,
working copies under `src/app/vendor/**`.

Also removed:
- Duplicate image folders that doubled the repo size for no reason:
  `public/juice_images` (duplicate of `public/images/juices`) and
  `public/vegimages` (duplicate of `public/images/non-egg`), plus the
  unused root-level `newimages/`, `juice_images/`, `vegimages/`, and
  `splash_screen/` folders (outside `public/`, so Next.js could never have
  served them anyway).
- `src/components/greezo/Account.tsx` — an unused, superseded duplicate of
  `AccountPage.tsx` (the one actually used on the site).
- `src/components/greezo/SpinWheelModal.tsx` — an empty (0 byte), unused file.
- `src/components/greezo/document.tsx` — a leftover Pages-Router
  `_document.tsx`, incompatible with the App Router and never imported. Its
  SEO meta tags were merged into the real `metadata` export in
  `src/app/layout.tsx`.
- `src/app/account/Apage.tsx` — an orphaned, unroutable file (Next.js route
  files must be named exactly `page.tsx`) that duplicated `AccountPage.tsx`
  and was never imported anywhere.
- `.modified` — an empty marker file.

Renamed `src/components/greezo/` → `src/components/user/` so the three
sections read consistently: **user** (main website), **vendor**, **admin**.

Added `src/app/admin/page.tsx` so `/admin` redirects to the right place
instead of 404ing, matching the pattern `/vendor` already used.

## Getting started

```bash
npm install
npm run dev
```

