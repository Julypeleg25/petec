import type { CalendarPatientItemDTO } from "@petec/shared";
import {
  getPatientImageSrc,
  handlePatientImageLoadError,
} from "../../../../features/patients";
import {
  BADGE_LABELS,
  getBadgeIcon,
  getPrimaryBadge,
} from "../constants/calendar.constants";

type CalendarCompactPatientCardProps = {
  date: Date;
  patient: CalendarPatientItemDTO;
  onOpenDetails: (date: Date, patient: CalendarPatientItemDTO) => void;
};

function CalendarCompactPatientCard({
  date,
  patient,
  onOpenDetails,
}: CalendarCompactPatientCardProps) {
  const primaryBadge = getPrimaryBadge(patient);

  return (
    <button
      type="button"
      className={`calendar-case-compact${
        primaryBadge ? ` calendar-case-compact-status-${primaryBadge}` : ""
      }`}
      onClick={() => onOpenDetails(date, patient)}
    >
      <img
        src={getPatientImageSrc(patient.photoName ?? undefined)}
        onError={handlePatientImageLoadError}
        alt={patient.patientName}
        className="calendar-case-compact-image"
      />
      <div className="calendar-case-compact-text">
        <strong>{patient.patientName}</strong>
        <span>תיק {patient.serialId}</span>
      </div>
      <div className="calendar-case-compact-badges">
        {patient.badges.map((badge) => (
          <span
            key={`${patient.caseId}-${badge}`}
            className={`calendar-case-compact-badge calendar-case-compact-badge-${badge}`}
            title={BADGE_LABELS[badge]}
          >
            {getBadgeIcon(badge)}
          </span>
        ))}
      </div>
    </button>
  );
}

export default CalendarCompactPatientCard;
