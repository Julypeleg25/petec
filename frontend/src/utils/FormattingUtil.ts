export const getFormattedDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${day}/${month}/${year}`;
};

export const getFormattedDateFromDBdate = (date: string | null): string => {
  if (!date) return "";
  const [year, month, day] = date.split("-");
  return `${day}/${month}/${year}`;
};

export const getDateForInput = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const getDateForInputFromDBTimeStamp = (timestamp: string | null): string | null => {
  if (timestamp === null) return null;
  const [datePart] = timestamp.split("T");
  const [year, month, day] = datePart.split("-");
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
};
