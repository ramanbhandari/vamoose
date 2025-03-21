import { useState, useEffect } from "react";
import maplibre, { Map as MapType } from "maplibre-gl";
import { SvgIconProps } from "@mui/material";
import ReactDOMServer from "react-dom/server";

interface MarkerProps {
  map: MapType | null;
  position: [number, number];
  color?: string;
  size?: number;
  onClick?: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  icon: React.ReactElement<SvgIconProps>;
  isSaved?: boolean;
}

export default function Marker({
  map,
  position,
  color = "red",
  size = 32,
  onClick,
  onMouseEnter,
  onMouseLeave,
  icon,
  isSaved = false,
}: MarkerProps) {
  const [marker, setMarker] = useState<maplibre.Marker | null>(null);

  useEffect(() => {
    if (!map) return;

    //custom element for the marker
    const el = document.createElement("div");
    el.className = "custom-marker";
    el.style.width = `${size}px`;
    el.style.height = `${size}px`;
    el.style.display = "flex";
    el.style.alignItems = "center";
    el.style.justifyContent = "center";
    el.style.backgroundColor = color;
    el.style.borderRadius = "50%";

    // Add a different border style for saved locations
    if (isSaved) {
      el.style.border = "3px solid gold";
      el.style.boxShadow = "0 2px 6px rgba(255, 215, 0, 0.6)";
    } else {
      el.style.border = "2px solid white";
      el.style.boxShadow = "0 2px 4px rgba(0,0,0,0.3)";
    }

    el.style.cursor = "pointer";

    // container for the icon
    const iconContainer = document.createElement("div");
    iconContainer.style.width = `${size * 0.6}px`;
    iconContainer.style.height = `${size * 0.6}px`;
    iconContainer.style.display = "flex";
    iconContainer.style.alignItems = "center";
    iconContainer.style.justifyContent = "center";
    iconContainer.style.color = "white";

    // Convert React icon element to HTML string and insert it
    const iconHtml = ReactDOMServer.renderToString(icon);
    iconContainer.innerHTML = iconHtml;
    el.appendChild(iconContainer);

    // Attach click and hover events if provided
    if (onClick) {
      el.addEventListener("click", onClick);
    }
    if (onMouseEnter) {
      el.addEventListener("mouseenter", onMouseEnter);
    }

    if (onMouseLeave) {
      el.addEventListener("mouseleave", onMouseLeave);
    }

    // Create and add the marker to the map
    const newMarker = new maplibre.Marker({ element: el })
      .setLngLat(position)
      .addTo(map);

    setMarker(newMarker);

    return () => {
      if (onClick) {
        el.removeEventListener("click", onClick);
      }
      if (onMouseEnter) {
        el.removeEventListener("mouseenter", onMouseEnter);
      }
      if (onMouseLeave) {
        el.removeEventListener("mouseleave", onMouseLeave);
      }
      newMarker.remove();
    };
  }, [
    map,
    color,
    size,
    onClick,
    onMouseEnter,
    onMouseLeave,
    position,
    icon,
    isSaved,
  ]);

  // Update marker position on change
  useEffect(() => {
    if (marker) {
      marker.setLngLat(position);
    }
  }, [marker, position]);

  return null;
}
