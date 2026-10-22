import type { Metadata } from "next";
import { STUDIO } from "../studio";

export const metadata: Metadata = {
    title: "Privacy Policy · MiTR Journey Yoga Studio",
};

export default function PrivacyPage() {
    return (
        <article>
            <h1>Privacy Policy</h1>
            <p className="text-caption text-neutral-text-3">Last updated {STUDIO.policyDate}</p>

            <p>
                {STUDIO.legalName} (&quot;we&quot;) runs this member app for booking yoga classes,
                buying class packages and checking in at the studio. This policy explains what
                personal data we collect, why, and who we share it with. We handle personal data
                under Thailand&apos;s Personal Data Protection Act B.E. 2562 (PDPA).
            </p>

            <h2>What we collect</h2>
            <ul>
                <li>
                    <strong>From your LINE account</strong>, when you sign in with LINE: your LINE
                    user ID and display name. We do not receive your LINE password, friends or chats.
                </li>
                <li>
                    <strong>Your member profile</strong>: name, email address, phone number, date of
                    birth and address.
                </li>
                <li>
                    <strong>Your activity</strong>: class bookings, attendance, class packages, purchases
                    and the milestones you reach.
                </li>
                <li>
                    <strong>Payment slips</strong>: images of bank transfer or PromptPay slips you upload
                    to pay for packages or special classes. We do not collect card or bank login details.
                </li>
                <li>
                    <strong>Technical data</strong>: your IP address, used to limit repeated sign-in
                    attempts.
                </li>
            </ul>

            <h2>Why we use it</h2>
            <ul>
                <li>To create your member account and recognise you when you return.</li>
                <li>To take bookings, track your class balance and check you in with your member pass.</li>
                <li>To confirm your payments.</li>
                <li>To contact you about your bookings and account.</li>
                <li>To keep the service secure.</li>
            </ul>
            <p>
                We rely on our contract with you to provide the service, and on our legitimate interest
                in keeping it secure. We do not sell your data or use it for advertising.
            </p>

            <h2>Who we share it with</h2>
            <p>We share personal data only with the providers that run this service for us:</p>
            <ul>
                <li>
                    <strong>LY Corporation</strong> (LINE), which provides LINE Login and the LINE MINI
                    App platform. LY Corporation receives the data described in its own LINE terms when
                    you sign in.
                </li>
                <li>
                    <strong>Supabase Inc.</strong>, which hosts our database, payment slip storage and
                    sign-in emails.
                </li>
                <li>
                    <strong>Upstash Inc.</strong>, which processes IP addresses and email addresses to
                    limit repeated sign-in attempts.
                </li>
                <li>Our website hosting provider, which serves the app.</li>
            </ul>
            <p>
                Some of these providers store data outside Thailand. They process it only on our
                instructions.
            </p>

            <h2>How long we keep it</h2>
            <p>
                We keep your data while your account is active. When you delete your account from your
                profile page, we delete your member profile, bookings, attendance, packages and purchase
                records. Uploaded payment slip images are kept as payment records. Contact us to have
                them removed.
            </p>

            <h2>Your rights</h2>
            <p>
                You can ask to see, correct, export or delete your data, object to how we use it, or
                withdraw consent. You can delete your account yourself from the profile page. For
                anything else, contact us below. You can also complain to Thailand&apos;s Personal Data
                Protection Committee.
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
