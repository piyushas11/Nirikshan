import { useState, useEffect } from "react";

/**
 * useGeolocation()
 *
 * Returns the device's current GPS coordinates using the browser Geolocation API.
 *
 * @returns {{ location: {latitude, longitude, accuracy} | null, error: string | null, loading: boolean }}
 */
export const useGeolocation = () => {
  const [location, setLocation] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!("geolocation" in navigator)) {
      setError("Geolocation is not supported by your browser");
      setLoading(false);
      return;
    }

    const onSuccess = (position) => {
      setLocation({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
      });
      setError(null);
      setLoading(false);
    };

    const onError = (err) => {
      const messages = {
        1: "Location access denied. Please enable GPS permissions.",
        2: "Location unavailable. Check your GPS signal.",
        3: "Location request timed out.",
      };
      setError(messages[err.code] || "Unknown GPS error");
      setLoading(false);
    };

    const options = {
      enableHighAccuracy: true,
      timeout: 10_000,
      maximumAge: 60_000, // cache for 1 minute
    };

    navigator.geolocation.getCurrentPosition(onSuccess, onError, options);
  }, []);

  return { location, error, loading };
};