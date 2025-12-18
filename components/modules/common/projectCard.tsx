import { ProjectCardType } from "@/types";
import { MapPin } from "lucide-react";
import Image from "next/image";
import { getCountryNameFromCode } from "@/lib/countries";

interface ProjectCardProps extends ProjectCardType {
  onClick?: () => void;
}

export default function ProjectCard(props: ProjectCardProps) {
  const hasBio = props.bio && props.bio.trim().length > 0;
  const hasSkills = props.skills && props.skills.length > 0;
  
  // Convert location from country code to full name if needed
  const displayLocation = props.location ? (() => {
    const parts = props.location.split(',').map(p => p.trim());
    if (parts.length === 2) {
      // Format: "City, CountryCode" -> "City, CountryName"
      const city = parts[0];
      const countryCode = parts[1];
      const countryName = getCountryNameFromCode(countryCode);
      return `${city}, ${countryName}`;
    } else if (parts.length === 1) {
      // Just country code
      return getCountryNameFromCode(parts[0]);
    }
    return props.location;
  })() : 'Not specified';

  return (
    <div 
      className="w-full h-full min-h-[240px] bg-[#FAFAFA] shadow-md hover:shadow-lg transition-all duration-300 flex flex-col overflow-hidden rounded-[8.5px] cursor-pointer"
      onClick={props.onClick}
      data-testid="profile-card"
    >
      {/* Banner Image at top */}
      <div className="relative h-[80px] w-full flex-shrink-0">
        <Image
          src={props.banner || "/default-banner.png"}
          alt={`Banner image for ${props.name}`}
          fill
          sizes="(max-width: 768px) 50vw, 33vw"
          className="object-cover"
        />
      </div>

      {/* Profile Picture - Centered, overlapping banner */}
      <div className="flex justify-center items-center -mt-[30px] relative z-10">
        <div className="relative h-[60px] w-[60px] rounded-full overflow-hidden bg-gray-200 shadow-md flex-shrink-0 border-2 border-white">
          <Image
            src={props.image || "/default-profile.png"}
            alt={props.name}
            fill
            sizes="60px"
            className="object-cover"
          />
        </div>
      </div>

      {/* Content Area */}
      <div className="px-3 pt-2 pb-4 flex flex-col flex-1">
        {/* Name - Centered, bold */}
        <h1 className="text-sm font-bold text-gray-900 leading-tight mb-1 text-center">
          {props.name}
        </h1>

        {/* Location - Centered */}
        <div className="flex items-center justify-center gap-1 text-gray-600 mb-3">
          <MapPin strokeWidth={1.5} className="w-3 h-3 flex-shrink-0" />
          <p className="text-[11px] truncate max-w-full">{displayLocation}</p>
        </div>

        {/* Bio - Left-aligned, limited height */}
        <div className="w-full mb-3 text-center px-1">
          <p className="text-gray-600 text-[11px] leading-snug line-clamp-2">
            {hasBio ? props.bio : "No bio available"}
          </p>
        </div>

        {/* Skills/Roles - Left-aligned, wrapping layout */}
        <div className="w-full mt-auto">
          <div className="flex flex-wrap gap-1.5 justify-center">
            {hasSkills ? (
              props.skills.slice(0, 3).map((skill) => {
                // Truncate skill name if it's too long (more than 15 characters)
                const displaySkill = skill.length > 15 ? skill.substring(0, 15) + '...' : skill;
                return (
                  <span
                    key={skill}
                    className="text-[#31A7AC] bg-white border border-[#31A7AC] text-[10px] font-medium px-2 py-1 rounded-full max-w-[120px] truncate inline-block"
                    title={skill}
                  >
                    {displaySkill}
                  </span>
                );
              })
            ) : (
              <span className="text-gray-400 text-[10px] italic">No roles</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
