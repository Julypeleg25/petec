export const getFormattedDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${day}/${month}/${year}`;
};

export const getFormattedDateFromDBdate = (date: string | null) => {
  if (!date || date == null) return "";
  const [year, month, day] = date.split("-");
  return `${day}/${month}/${year}`;
};

export const getDateForInput = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const getDateForInputFromDBTimeStamp = (timestamp: string) => {
  if (timestamp == null) return null;
  let [year, month, day] = timestamp.split("T")[0].split("-");
  month = String(month).padStart(2, "0");
  day = String(day).padStart(2, "0");
  return `${year}-${month}-${day}`;
};
