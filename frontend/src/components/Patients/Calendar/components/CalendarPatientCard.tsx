import type { CalendarPatientItemDTO } from "@petec/shared";
import {
  formatOwnerPhone,
  getPatientImageSrc,
  handlePatientImageLoadError,
} from "../../../../features/patients";
import { BADGE_LABELS, getPrimaryBadge } from "../constants/calendar.constants";

type CalendarPatientCardProps = {
  badgeKeyPrefix: string;
  date: Date;
  patient: CalendarPatientItemDTO;
  onOpenDetails: (date: Date, patient: CalendarPatientItemDTO) => void;
};

function CalendarPatientCard({
  badgeKeyPrefix,
  date,
  patient,
  onOpenDetails,
}: CalendarPatientCardProps) {
  const primaryBadge = getPrimaryBadge(patient);

  return (
    <button
      type="button"
      className={`calendar-patient-card${
        primaryBadge ? ` calendar-patient-card-status-${primaryBadge}` : ""
      }`}
      onClick={() => onOpenDetails(date, patient)}
    >
      <div className="calendar-patient-card-header">
        <img
          src={getPatientImageSrc(patient.photoName ?? undefined)}
          onError={handlePatientImageLoadError}
          alt={patient.patientName}
          className="calendar-patient-image"
        />
        <div className="calendar-patient-text">
          <strong>{patient.patientName}</strong>
          <span>תיק {patient.serialId}</span>
        </div>
      </div>
      <div className="calendar-patient-meta">
        <span>{patient.ownerName}</span>
        <span>{formatOwnerPhone(patient.ownerPhoneNumber)}</span>
      </div>
      <div className="calendar-patient-badges">
        {patient.badges.map((badge) => (
          <span
            key={`${badgeKeyPrefix}-${patient.caseId}-${badge}`}
            className={`calendar-patient-badge calendar-patient-badge-${badge}`}
          >
            {BADGE_LABELS[badge]}
          </span>
        ))}
      </div>
    </button>
  );
}

export default CalendarPatientCard;
