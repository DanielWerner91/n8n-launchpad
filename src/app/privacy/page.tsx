import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

export const metadata: Metadata = {
  title: "Privacy Policy",
};

export default function PrivacyPage() {
  return (
    <>
      <Header />
      <main className="flex-1">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 py-16">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Privacy Policy
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Last updated: April 12, 2026
          </p>

          <div className="mt-10 space-y-8 text-[15px] leading-relaxed text-foreground/90">
            <section>
              <h2 className="text-lg font-semibold text-foreground mb-3">
                1. Introduction
              </h2>
              <p>
                LaunchPad (&quot;we&quot;, &quot;our&quot;, &quot;us&quot;)
                provides an AI-powered project management and launch execution
                platform. This Privacy Policy explains how we collect, use, and
                protect your personal information when you use our service at
                launchpad-six-tau.vercel.app.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground mb-3">
                2. Information We Collect
              </h2>
              <p className="mb-3">
                When you sign in with Google OAuth, we receive and store:
              </p>
              <ul className="list-disc pl-6 space-y-1.5">
                <li>Your name</li>
                <li>Your email address</li>
                <li>Your profile photo URL</li>
              </ul>
              <p className="mt-3">
                We also collect data you create within the app, including
                projects, launch plans, timelines, and related content.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground mb-3">
                3. How We Use Your Information
              </h2>
              <ul className="list-disc pl-6 space-y-1.5">
                <li>To authenticate you and manage your account</li>
                <li>To provide and improve the LaunchPad service</li>
                <li>
                  To generate AI-powered launch strategies based on your project
                  data
                </li>
                <li>To send important service-related communications</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground mb-3">
                4. Data Storage and Security
              </h2>
              <p>
                Your data is stored securely using Supabase (database and
                authentication) and hosted on Vercel. We use industry-standard
                security measures including encrypted connections (HTTPS), secure
                authentication tokens, and row-level security policies on our
                database.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground mb-3">
                5. Analytics
              </h2>
              <p>
                We use PostHog for product analytics to understand how our
                service is used and to improve the user experience. PostHog may
                collect anonymized usage data such as page views, feature usage,
                and session information. No personally identifiable information
                is shared with PostHog beyond what is necessary for analytics.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground mb-3">
                6. Third-Party Services
              </h2>
              <p>We use the following third-party services:</p>
              <ul className="list-disc pl-6 space-y-1.5 mt-3">
                <li>
                  <strong>Google OAuth</strong> for authentication
                </li>
                <li>
                  <strong>Supabase</strong> for database and authentication
                  infrastructure
                </li>
                <li>
                  <strong>Vercel</strong> for hosting and deployment
                </li>
                <li>
                  <strong>PostHog</strong> for product analytics
                </li>
              </ul>
              <p className="mt-3">
                Each of these services has its own privacy policy. We encourage
                you to review them.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground mb-3">
                7. Data Sharing
              </h2>
              <p>
                We do not sell, trade, or otherwise transfer your personal
                information to third parties. We may share data only when
                required by law or to protect our rights.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground mb-3">
                8. Your Rights
              </h2>
              <p>You have the right to:</p>
              <ul className="list-disc pl-6 space-y-1.5 mt-3">
                <li>Access the personal data we hold about you</li>
                <li>Request correction of inaccurate data</li>
                <li>Request deletion of your account and associated data</li>
                <li>Export your data</li>
              </ul>
              <p className="mt-3">
                To exercise any of these rights, please contact us at the email
                below.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground mb-3">
                9. Cookies
              </h2>
              <p>
                We use essential cookies for authentication and session
                management. These cookies are necessary for the service to
                function and cannot be disabled.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground mb-3">
                10. Changes to This Policy
              </h2>
              <p>
                We may update this Privacy Policy from time to time. We will
                notify you of any changes by posting the new policy on this page
                and updating the &quot;Last updated&quot; date.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground mb-3">
                11. Contact
              </h2>
              <p>
                If you have any questions about this Privacy Policy, please
                reach out via the contact information on our website.
              </p>
            </section>
          </div>

          <div className="mt-12 pt-6 border-t border-border">
            <Link
              href="/"
              className="text-sm text-accent hover:underline"
            >
              Back to home
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
