import type React from "react";

export type SavePatientInputChangeEvent =
  React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>;

export type SavePatientInputChangeHandler = (
  valOrEvent: string | Date | null | SavePatientInputChangeEvent,
  nameParams?: string | number | object,
) => void;

export type SavePatientActionEvent =
  | React.MouseEvent
  | React.ChangeEvent<HTMLInputElement>;
