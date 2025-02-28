import { format, parseISO } from "date-fns";

export const formatDate = (dateString?: string) => {
  if (!dateString) return "No date provided";

  const date = parseISO(dateString);
  const localDate = new Date(date.getTime() + date.getTimezoneOffset() * 60000);

  return format(localDate, "MMM dd, yyyy");
};

export const parseLocalDate = (dateString: string | null) => {
  if (!dateString) return null;

  const cleanDate = dateString.split("T")[0];
  const date = parseISO(cleanDate);

  const parsedDate = new Date(
    date.getTime() + date.getTimezoneOffset() * 60000
  );

  if (isNaN(parsedDate.getTime())) {
    console.error("Invalid date parsed:", parsedDate);
    return null;
  }

  return parsedDate;
};
