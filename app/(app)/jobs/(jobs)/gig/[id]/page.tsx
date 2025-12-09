/** @format */

"use client";
import { use } from "react";
import GigDetails from "@/app/(app)/jobs/components/jobs/GigDetails";

export default function Jobs({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    console.log(id);
    const Job = {
        id: 1,
        name: "Dubai Fashion Week BTS",
        title: "Film : NIGHTHAWK",
        logo: "/logo.png",
        expiryDate: "2024-10-15",
        description:
            "Behind-the-scenes documentary capturing the energy and creativity of Dubai Fashion Week 2024. We need a skilled team to document designers, models, and the fashion industry magic.",
        location: " Dubai Design District +2",
        requiredPositions: 5,
        date: "2024-10-01",
        status: "Pre-Production",
        postedfor: "MARVEL STUDIOS",
        rate: "AED 2000$ per day",
        skills: ["Producer", "Director", "Actor", "Production Assistant"],
        projectTimeLine: {
            "Pre-Production": "2024-10-01 to 2024-11-01",
            Production: "2024-11-02 to 2025-01-15",
            "Post-Production": "2025-01-16 to 2025-02-28",
            Release: "2025-03-15",
        },
    };
    return (
        <>
            <GigDetails job={Job} />
        </>
    );
}
