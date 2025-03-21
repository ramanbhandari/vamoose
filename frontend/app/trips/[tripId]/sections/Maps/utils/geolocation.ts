/**
 * Utility function for handling geolocation with fallback
 * Used for both automatic and manual location detection
 */
export const getGeolocation = (
  onSuccess: (longitude: number, latitude: number) => void,
  onError: (errorMessage: string) => void,
  setIsLocating?: (isLocating: boolean) => void
) => {
  if (!navigator.geolocation) {
    onError("Geolocation is not supported by your browser");
    setIsLocating?.(false);
    return;
  }

  // Try high accuracy first, then fall back to less accurate
  const tryGeolocation = (highAccuracy = true) => {
    console.log(`Trying geolocation with highAccuracy=${highAccuracy}`);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        console.log("Successfully got user location:", position.coords);
        const { longitude, latitude } = position.coords;
        onSuccess(longitude, latitude);
      },
      (error) => {
        // If high accuracy fails with timeout or position unavailable, try with lower accuracy
        if (highAccuracy && (error.code === 2 || error.code === 3)) {
          console.log(
            "High accuracy location failed, trying with lower accuracy"
          );
          tryGeolocation(false);
          return;
        }

        // Specific error messages
        const errorMessages: Record<number, string> = {
          1: "Location access was denied. Please check your browser permissions.",
          2: "Location information is unavailable. Try again later.",
          3: "Location request timed out. Check your connection and try again.",
        };

        const errorMessage =
          errorMessages[error.code] || "Location detection failed";
        onError(errorMessage);
        console.error("Geolocation error:", error.code, error.message);

        setIsLocating?.(false);
      },
      {
        enableHighAccuracy: highAccuracy,
        timeout: highAccuracy ? 10000 : 15000,
        maximumAge: highAccuracy ? 0 : 60000, // No cached position for high accuracy
      }
    );
  };

  tryGeolocation();
};
