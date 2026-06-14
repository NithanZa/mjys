"use client";

import { TopBar } from "@/components/layout";
import {
    AboutTab,
    AboutTabs,
    ContactForm,
    InstructorGrid,
    MapEmbed,
    StaffList,
} from "@/components/about";
import { STAFF } from "@/lib/mock/about";
import { INSTRUCTORS } from "@/lib/mock/schedule";
import { useState } from "react";

export default function AboutPage() {
    const [activeTab, setActiveTab] = useState<AboutTab>("instructors");

    return (
        <>
            <TopBar title="About Us" />
            <div className="flex flex-col gap-4">
                <AboutTabs active={activeTab} onChange={setActiveTab} />

                {activeTab === "instructors" && (
                    <InstructorGrid instructors={INSTRUCTORS} />
                )}

                {activeTab === "staff" && (
                    <div className="flex flex-col gap-6">
                        <StaffList staff={STAFF} />
                        <ContactForm />
                    </div>
                )}

                {activeTab === "map" && <MapEmbed />}
            </div>
        </>
    );
}
