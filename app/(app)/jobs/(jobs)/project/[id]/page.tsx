"use client"
import { use } from "react";
import ProjectDetails from "@/app/(app)/jobs/components/jobs/ProjectDetails";
export default function Jobs({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    console.log(id)
    const Job = {
        "id": 1,
        "name": "Dubai Fashion Week BTS",
        "title": "Film : NIGHTHAWK",
        "logo": "/logo.png",
        "description": "Behind-the-scenes documentary capturing the energy and creativity of Dubai Fashion Week 2024. We need a skilled team to document designers, models, and the fashion industry magic.",
        "location": " Dubai Design District +2",
        "date": "2024-10-01",
        "status": "Pre-Production",
        "skills": ["Producer", "Director", "Actor", "Production Assistant"],
        "projectDetails": {
            "projectName": "NIGHTHAWK",
            "projectType": "Film",
            "projectDuration": "3 months",
            "projectBudget": "$500,000",
            "projectLocation": "Dubai Design District +2",
            "projectDescription": "A thrilling short film set in a dystopian future where technology and humanity collide. The story follows a lone vigilante known as Nighthawk, who fights against a corrupt regime to restore justice and freedom.",
        },
        "projectTimeLine": {
            "Pre-Production": "2024-10-01 to 2024-11-01",
            "Production": "2024-11-02 to 2025-01-15",
            "Post-Production": "2025-01-16 to 2025-02-28",
            "Release": "2025-03-15"
        },
        "terms&Conditions": "We stand behind our products with a comprehensive 30-day return policy. If you&apos;re not completely satisfied, simply return the item in its original condition. Our hassle-free return process includes free return shipping and full refunds processed within 48 hours of receiving the returned item.",
        "location2": "Los Angeles, CA / Dubai, UAE",

    }
    return (
        <>
            <ProjectDetails job={Job} />
        </>
    )
}