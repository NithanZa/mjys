"use client";

import { useState } from "react";
import { UserCog } from "lucide-react";
import { StaffOverviewTab } from "@/components/admin/StaffOverviewTab";
import { StaffEditTab } from "@/components/admin/StaffEditTab";
import { cn } from "@/lib/cn";

type TabType = "overview" | "edit";

export default function AdminStaffPage() {
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [isLoading, setIsLoading] = useState(false);

  return (
    <div className="p-6 md:p-8 flex flex-col gap-6 max-w-7xl mx-auto font-sans">
      {/* Header */}
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-lg bg-primary-100 text-primary-700">
          <UserCog className="h-5 w-5" strokeWidth={1.75} />
        </span>
        <div>
          <h1 className="font-display text-h1 font-semibold text-neutral-ink">
            Staff Directory
          </h1>
          <p className="text-body-sm text-neutral-text-2">
            View instructor performance metrics and manage staff profiles
          </p>
        </div>
      </div>

      {/* Tab Selector */}
      <div className="flex border border-neutral-line rounded-sm p-1 bg-neutral-line/20 w-fit">
        <button
          onClick={() => setActiveTab("overview")}
          className={cn(
            "px-4 py-2 text-center rounded-sm font-sans text-body-sm font-medium transition-all duration-150",
            activeTab === "overview"
              ? "bg-neutral-card text-neutral-ink shadow-sm font-semibold"
              : "text-neutral-text-2 hover:text-primary-700"
          )}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab("edit")}
          className={cn(
            "px-4 py-2 text-center rounded-sm font-sans text-body-sm font-medium transition-all duration-150",
            activeTab === "edit"
              ? "bg-neutral-card text-neutral-ink shadow-sm font-semibold"
              : "text-neutral-text-2 hover:text-primary-700"
          )}
        >
          Edit Staff
        </button>
      </div>

      {/* Tab Content */}
      <div className={isLoading ? "opacity-60 pointer-events-none" : ""}>
        {activeTab === "overview" && (
          <StaffOverviewTab onLoading={setIsLoading} />
        )}
        {activeTab === "edit" && (
          <StaffEditTab onLoading={setIsLoading} />
        )}
      </div>
    </div>
  );
}
