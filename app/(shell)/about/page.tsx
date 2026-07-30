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
import { fetchInstructors, Instructor } from "@/lib/api/instructors";
import { useEffect, useState } from "react";

export default function AboutPage() {
    const [activeTab, setActiveTab] = useState<AboutTab>("instructors");
    const [instructors, setInstructors] = useState<Instructor[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchInstructors()
            .then(setInstructors)
            .catch((err) => console.error("Failed to load instructors:", err))
            .finally(() => setIsLoading(false));
    }, []);

    return (
        <>
            <TopBar title="About Us" />
            <div className="flex flex-col gap-4">
                <AboutTabs active={activeTab} onChange={setActiveTab} />

                {activeTab === "instructors" && (
                    <InstructorGrid instructors={instructors} isLoading={isLoading} />
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
