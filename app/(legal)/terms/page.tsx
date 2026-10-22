import type { Metadata } from "next";
import Link from "next/link";
import { STUDIO } from "../studio";

export const metadata: Metadata = {
    title: "Terms & Conditions · MiTR Journey Yoga Studio",
};

export default function TermsPage() {
    return (
        <article>
            <h1>Terms &amp; Conditions</h1>
            <p className="text-caption text-neutral-text-3">Last updated {STUDIO.policyDate}</p>

            <p>
                These terms apply when you use the {STUDIO.legalName} member app to book classes and
                buy class packages. By creating a member profile you agree to them.
            </p>

            <h2>Your account</h2>
            <ul>
                <li>Give accurate details when you register, and keep them up to date.</li>
                <li>Your account and member pass are for you only. Do not share them.</li>
                <li>You can browse the schedule without an account. Booking and buying need one.</li>
            </ul>

            <h2>Bookings</h2>
            <ul>
                <li>A regular class booking uses one class from your package. Special classes are paid for separately.</li>
                <li>Classes have limited places. A booking is confirmed only when the app shows it.</li>
                <li>
                    You can cancel a regular class booking in the app. Paid special classes cannot be
                    cancelled in the app. Contact us instead.
                </li>
            </ul>

            <h2>Packages and payment</h2>
            <ul>
                <li>Pay by PromptPay or bank transfer, then upload your payment slip in the app.</li>
                <li>Your package or special class place starts once we have checked your slip.</li>
                <li>Each package has an expiry date shown in the app. Unused classes expire on that date.</li>
                <li>Prices are in Thai baht.</li>
            </ul>

            <h2>Health and safety</h2>
            <p>
                Yoga is physical exercise. Tell your instructor about any injury, pregnancy or health
                condition before class, and practise within your own limits.
            </p>

            <h2>Your data</h2>
            <p>
                Our <Link href="/privacy" className="font-medium text-primary-700 underline underline-offset-2">Privacy Policy</Link>{" "}
                explains how we handle your personal data.
            </p>

            <h2>Changes</h2>
            <p>
                We may update these terms. The date at the top shows the latest version. Continuing to
                use the app after a change means you accept the updated terms.
            </p>

            <h2>Contact us</h2>
            <ul>
                <li>{STUDIO.legalName}</li>
                <li>{STUDIO.address}</li>
                <li>Phone {STUDIO.phone}</li>
                <li>LINE {STUDIO.lineId}</li>
            </ul>
        </article>
    );
}
