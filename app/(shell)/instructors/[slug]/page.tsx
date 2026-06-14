import { TopBar } from "@/components/layout";
import { Avatar, Card, EmptyState } from "@/components/ui";
import { getInstructor, INSTRUCTORS } from "@/lib/mock/schedule";
import { Users } from "lucide-react";
import { notFound } from "next/navigation";

interface InstructorDetailPageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return INSTRUCTORS.map((i) => ({ slug: i.slug }));
}

export default async function InstructorDetailPage({
  params,
}: InstructorDetailPageProps) {
  const { slug } = await params;
  const instructor = getInstructor(slug);

  if (!instructor) {
    notFound();
  }

  return (
    <>
      <TopBar title={instructor.name} back="/instructors" />

      <div className="flex flex-col gap-4">
        <Card elevation="sm" className="flex flex-col items-center gap-3 py-6 text-center">
          <Avatar size="xl" alt={instructor.name} fallback={instructor.name} />
          <div className="flex flex-col items-center gap-1">
            <h1 className="font-display text-h1 font-semibold text-neutral-ink">
              {instructor.name}
            </h1>
            <span className="font-sans text-body-sm text-primary-700">
              {instructor.title}
            </span>
          </div>
        </Card>

        <Card>
          <h2 className="font-display text-h2 font-medium text-neutral-ink">
            About
          </h2>
          <p className="mt-2 font-sans text-body text-neutral-text-2">
            {instructor.bio}
          </p>
        </Card>

        <EmptyState
          icon={<Users strokeWidth={1.75} className="h-6 w-6" />}
          title="Upcoming classes"
          description="A per-instructor schedule view lands later. For now, browse the full schedule from the Book tab."
        />
      </div>
    </>
  );
}
