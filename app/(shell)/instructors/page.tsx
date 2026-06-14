import { redirect } from "next/navigation";

export default function InstructorsPage() {
    redirect("/about?tab=instructors");
}
