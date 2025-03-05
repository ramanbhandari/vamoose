import { format, parseISO } from "date-fns";

// helper to print in Apr 8, 2025 format (no Time)
export const formatDate = (dateString?: string) => {
  if (!dateString) return "No date provided";

  const date = parseISO(dateString);
  const localDate = new Date(date.getTime() + date.getTimezoneOffset() * 60000);

  return format(localDate, "MMM dd, yyyy");
};

export const formatDateTime = (dateString?: string) => {
  if (!dateString) return "No date provided";

  try {
    const date = parseISO(dateString);

    return format(date, "MMM dd, yyyy h:mm a");
  } catch (error) {
    console.error("Error formatting date:", error);
    return "Invalid date";
  }
};

// to parse Date dealing with offset so it remains in local - no time
export const parseLocalDate = (
  dateString: string | null,
  includeTime: boolean = false
) => {
  if (!dateString) return null;

  const cleanDate = dateString.split("T")[0];
  // if we need time included like in polls, use the whole date string without time split
  const date = includeTime ? parseISO(dateString) : parseISO(cleanDate);

  const parsedDate = new Date(
    date.getTime() + date.getTimezoneOffset() * 60000
  );

  if (isNaN(parsedDate.getTime())) {
    console.error("Invalid date parsed:", parsedDate);
    return null;
  }

  return parsedDate;
};

// to parse Date dealing with offset so it remains in local with Time
export const parseLocalDateWithTime = (
  dateString: string | null
): Date | null => {
  if (!dateString) return null;

  try {
    const [datePart, timePart] = dateString.split("T");

    // Parse as local date (ignoring timezone offset since we don't care)
    const [year, month, day] = datePart.split("-").map(Number);
    const parsedDate = new Date(year, month - 1, day);

    // Parse time components
    const [time] = timePart.split(/([+-]\d{2}:\d{2})/);
    const [hours, minutes, seconds] = time.split(":").map(Number);
    parsedDate.setHours(hours, minutes, seconds || 0);

    return parsedDate;
  } catch (error) {
    console.error("Error parsing date:", error);
    return null;
  }
};

// sent to backend for the string date where we need to include Time as well
export const formatDateTimeForAPI = (date: Date): string => {
  const pad = (n: number) => n.toString().padStart(2, "0");

  const dateString = [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
  ].join("-");

  const timeString = [
    pad(date.getHours()),
    pad(date.getMinutes()),
    pad(date.getSeconds()),
  ].join(":");

  return `${dateString}T${timeString}`;
};
