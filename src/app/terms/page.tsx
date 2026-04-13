import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

export const metadata: Metadata = {
  title: "Terms of Service",
};

export default function TermsPage() {
  return (
    <>
      <Header />
      <main className="flex-1">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 py-16">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Terms of Service
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Last updated: April 12, 2026
          </p>

          <div className="mt-10 space-y-8 text-[15px] leading-relaxed text-foreground/90">
            <section>
              <h2 className="text-lg font-semibold text-foreground mb-3">
                1. Acceptance of Terms
              </h2>
              <p>
                By accessing or using LaunchPad
                (&quot;the Service&quot;), you agree to be bound by these Terms
                of Service. If you do not agree to these terms, do not use the
                Service.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground mb-3">
                2. Description of Service
              </h2>
              <p>
                LaunchPad is an AI-powered project management and launch
                execution platform. The Service allows you to create and manage
                projects, generate go-to-market strategies, track launch plans,
                and monitor progress through a web-based dashboard.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground mb-3">
                3. Account Registration
              </h2>
              <p>
                You must sign in using Google OAuth to use the Service. You are
                responsible for maintaining the security of your Google account
                and for all activities that occur under your LaunchPad account.
                You must provide accurate and complete information during
                registration.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground mb-3">
                4. Acceptable Use
              </h2>
              <p>You agree not to:</p>
              <ul className="list-disc pl-6 space-y-1.5 mt-3">
                <li>
                  Use the Service for any unlawful purpose or in violation of
                  any applicable laws
                </li>
                <li>
                  Attempt to gain unauthorized access to any part of the Service
                </li>
                <li>
                  Interfere with or disrupt the Service or its infrastructure
                </li>
                <li>
                  Upload or transmit malicious code, viruses, or harmful content
                </li>
                <li>
                  Use automated systems (bots, scrapers) to access the Service
                  without permission
                </li>
                <li>
                  Impersonate another person or misrepresent your affiliation
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground mb-3">
                5. Intellectual Property
              </h2>
              <p>
                The Service, including its design, code, and branding, is owned
                by LaunchPad. You retain ownership of all content you create
                within the Service, including projects, launch plans, and
                strategies. By using the Service, you grant us a limited license
                to store, process, and display your content solely to provide
                the Service to you.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground mb-3">
                6. AI-Generated Content
              </h2>
              <p>
                The Service uses AI to generate launch strategies, timelines,
                and recommendations. AI-generated content is provided as
                suggestions only. You are solely responsible for reviewing,
                editing, and using any AI-generated content. We make no
                guarantees about the accuracy, completeness, or suitability of
                AI-generated content for your specific needs.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground mb-3">
                7. Availability and Modifications
              </h2>
              <p>
                We strive to keep the Service available at all times but do not
                guarantee uninterrupted access. We reserve the right to modify,
                suspend, or discontinue any part of the Service at any time,
                with or without notice.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground mb-3">
                8. Limitation of Liability
              </h2>
              <p>
                To the maximum extent permitted by law, LaunchPad and its
                operators shall not be liable for any indirect, incidental,
                special, consequential, or punitive damages, including loss of
                profits, data, or business opportunities, arising from your use
                of or inability to use the Service.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground mb-3">
                9. Disclaimer of Warranties
              </h2>
              <p>
                The Service is provided &quot;as is&quot; and &quot;as
                available&quot; without warranties of any kind, whether express
                or implied. We disclaim all warranties, including but not
                limited to implied warranties of merchantability, fitness for a
                particular purpose, and non-infringement.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground mb-3">
                10. Termination
              </h2>
              <p>
                We may terminate or suspend your access to the Service at our
                sole discretion, with or without cause, and with or without
                notice. Upon termination, your right to use the Service will
                immediately cease. You may also delete your account at any time.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground mb-3">
                11. Changes to Terms
              </h2>
              <p>
                We reserve the right to update these Terms of Service at any
                time. We will notify you of significant changes by posting the
                updated terms on this page and updating the &quot;Last
                updated&quot; date. Continued use of the Service after changes
                constitutes acceptance of the new terms.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground mb-3">
                12. Governing Law
              </h2>
              <p>
                These Terms shall be governed by and construed in accordance
                with applicable law, without regard to conflict of law
                principles.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground mb-3">
                13. Contact
              </h2>
              <p>
                If you have any questions about these Terms of Service, please
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
