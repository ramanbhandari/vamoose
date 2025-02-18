/*
	jsrepo 1.36.0
	Installed from https://reactbits.dev/ts/tailwind/
	2-16-2025
*/

"use client";

import {
  motion,
  MotionValue,
  useMotionValue,
  useSpring,
  useTransform,
  type SpringOptions,
  AnimatePresence,
} from "framer-motion";
import React, {
  Children,
  cloneElement,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

// Extend your DockItemData if needed
export type DockItemData = {
  icon: React.ReactNode;
  label: React.ReactNode;
  onClick: () => void;
  className?: string;
};

export type DockProps = {
  items: DockItemData[];
  className?: string;
  distance?: number;
  panelHeight?: number;
  baseItemSize?: number;
  dockHeight?: number;
  magnification?: number;
  spring?: SpringOptions;
  // activeIndex (0-based) for the active item
  activeIndex?: number;
  isDarkMode?: boolean;
};

// -------------------------------------------------------------
// Update DockItem to forward its ref so the parent can scroll it into view
// -------------------------------------------------------------
export type DockItemProps = {
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
  mouseX: MotionValue;
  spring: SpringOptions;
  distance: number;
  baseItemSize: number;
  magnification: number;
  isDarkMode: boolean;
};

const DockItem = React.forwardRef<HTMLDivElement, DockItemProps>(
  (
    {
      children,
      className = "",
      onClick,
      mouseX,
      spring,
      distance,
      magnification,
      baseItemSize,
      isDarkMode,
    },
    ref
  ) => {
    // Create a local ref.
    const localRef = useRef<HTMLDivElement>(null);
    // Combine the forwarded ref and local ref using a callback ref.
    const combinedRef = (node: HTMLDivElement | null) => {
      localRef.current = node;
      if (ref) {
        if (typeof ref === "function") {
          ref(node);
        } else {
          (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
        }
      }
    };

    const isHovered = useMotionValue(0);

    // Compute mouse distance relative to the center of the item.
    const mouseDistance = useTransform(mouseX, (val) => {
      const rect = localRef.current?.getBoundingClientRect() ?? {
        x: 0,
        width: baseItemSize * 2,
      };
      return val - rect.x - baseItemSize / 2;
    });

    // Animate the height: at rest it's baseItemSize; on hover it scales up.
    const targetSize = useTransform(
      mouseDistance,
      [-distance, 0, distance],
      [baseItemSize, magnification, baseItemSize]
    );
    const size = useSpring(targetSize, spring);

    // Animate the width: at rest it's baseItemSize*2; on hover it scales up.
    const targetWidth = useTransform(
      mouseDistance,
      [-distance, 0, distance],
      [baseItemSize * 2, magnification * 2.0, baseItemSize * 2]
    );
    const width_size = useSpring(targetWidth, spring);

    return (
      <motion.div
        ref={combinedRef}
        style={{
          width: width_size,
          height: size,
          scrollSnapAlign: "center", // enables snapping behavior on scroll
          backgroundColor: isDarkMode
            ? "#171717" // Active background
            : "#ffffff",
        }}
        onHoverStart={() => isHovered.set(1)}
        onHoverEnd={() => isHovered.set(0)}
        onFocus={() => isHovered.set(1)}
        onBlur={() => isHovered.set(0)}
        onClick={onClick}
        // "flex-shrink-0" prevents the item from shrinking in the flex container.
        className={`flex-shrink-0 relative inline-flex items-center justify-center rounded-md ${isDarkMode ? "border-[#171717]" : "border-[#3A4F6C]"} border shadow-md ${className}`}
        tabIndex={0}
        role="button"
        aria-haspopup="true"
      >
        {Children.map(children, (child) =>
          cloneElement(child as React.ReactElement, { isHovered })
        )}
      </motion.div>
    );
  }
);
DockItem.displayName = "DockItem";

// type DockLabelProps = {
//   className?: string;
//   children: React.ReactNode;
// };

// function DockLabel({ children, className = "", ...rest }: DockLabelProps) {
//   const { isHovered } = rest as { isHovered: MotionValue<number> };
//   const [isVisible, setIsVisible] = useState(false);

//   useEffect(() => {
//     const unsubscribe = isHovered.on("change", (latest) => {
//       setIsVisible(latest === 1);
//     });
//     return () => unsubscribe();
//   }, [isHovered]);

//   return (
//     <AnimatePresence>
//       {isVisible && (
//         <motion.div
//           initial={{ opacity: 0, y: 0 }}
//           animate={{ opacity: 1, y: -10 }}
//           exit={{ opacity: 0, y: 0 }}
//           transition={{ duration: 0.2 }}
//           className={`${className} absolute -bottom-6 left-1/2 w-fit whitespace-pre rounded-md border border-neutral-700 bg-[#060606] px-2 py-0.5 text-xs text-white`}
//           role="tooltip"
//           style={{ x: "-50%" }}
//         >
//           {children}
//         </motion.div>
//       )}
//     </AnimatePresence>
//   );
// }

type DockIconProps = {
  className?: string;
  children: React.ReactNode;
  isActive?: boolean;
  isDarkMode?: boolean;
};

function DockIcon({
  children,
  className = "",
  isActive = false,
  isDarkMode = false,
}: DockIconProps) {
  return (
    <div
      className={`flex items-center justify-center ${className}`}
      style={{
        color: isActive
          ? "#FF5A5F" // Active icon color
          : isDarkMode
            ? "#ededed" // Inactive icon color (dark mode)
            : "#3A4F6C", // Inactive icon color (light mode)
      }}
    >
      {children}
    </div>
  );
}

export default function Dock({
  items,
  className = "",
  spring = { mass: 0.1, stiffness: 150, damping: 12 },
  magnification = 70,
  distance = 200,
  panelHeight = 64,
  dockHeight = 256,
  baseItemSize = 50,
  activeIndex, // active index passed from parent (optional)
  isDarkMode = false,
}: DockProps) {
  const mouseX = useMotionValue(Infinity);
  const isHovered = useMotionValue(0);

  const maxHeight = useMemo(
    () => Math.max(dockHeight, magnification + magnification / 2 + 4),
    [magnification]
  );
  const heightRow = useTransform(isHovered, [0, 1], [panelHeight, maxHeight]);
  const height = useSpring(heightRow, spring);

  // Create a ref array to hold references to each DockItem.
  const itemsRef = useRef<(HTMLDivElement | null)[]>([]);

  // When activeIndex changes, scroll the corresponding item into view.
  useEffect(() => {
    if (
      activeIndex !== undefined &&
      itemsRef.current[activeIndex] &&
      itemsRef.current[activeIndex]!.scrollIntoView
    ) {
      itemsRef.current[activeIndex]!.scrollIntoView({
        behavior: "smooth",
        inline: "center",
        block: "nearest",
      });
    }
  }, [activeIndex]);

  // NEW: Listen for window resize and re-scroll the active item into view.
  useEffect(() => {
    const handleResize = () => {
      if (
        activeIndex !== undefined &&
        itemsRef.current[activeIndex] &&
        itemsRef.current[activeIndex]!.scrollIntoView
      ) {
        itemsRef.current[activeIndex]!.scrollIntoView({
          behavior: "smooth",
          inline: "center",
          block: "nearest",
        });
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [activeIndex]);

  return (
    <motion.div
      style={{ height, scrollbarWidth: "none" }}
      className="mx-auto flex max-w-full items-center"
    >
      <div
        className="absolute top-20 left-1/2 transform -translate-x-1/2"
        style={{
          width: "100vw",
          overflowX: "auto",
          WebkitOverflowScrolling: "touch",
          display: "grid",
          placeItems: "center",
        }}
      >
        {/*
          INNER FLEX CONTAINER:
          - Uses inline-flex with a gap so its width is determined by its content.
          - Will scroll horizontally if the content exceeds 100vw.
        */}
        <motion.div
          onMouseMove={({ pageX }) => {
            isHovered.set(1);
            mouseX.set(pageX);
          }}
          onMouseLeave={() => {
            isHovered.set(0);
            mouseX.set(Infinity);
          }}
          className={`${className} inline-flex items-start gap-4 pb-2 px-4`}
          style={{
            height: panelHeight,
            whiteSpace: "nowrap",
            scrollSnapType: "x mandatory", // optional snap behavior
          }}
          role="toolbar"
          aria-label="Application dock"
        >
          {items.map((item, index) => (
            <DockItem
              key={index}
              onClick={item.onClick}
              className={`${item.className} ${
                index === activeIndex ? "active" : ""
              }`}
              mouseX={mouseX}
              spring={spring}
              distance={distance}
              magnification={magnification}
              baseItemSize={baseItemSize}
              isDarkMode={isDarkMode}
              // Pass a ref callback to capture the element reference.
              ref={(el) => (itemsRef.current[index] = el)}
            >
              <DockIcon
                isActive={index === activeIndex}
                isDarkMode={isDarkMode}
              >
                {item.icon} {item.label}
              </DockIcon>

              {/* <DockLabel>{item.label}</DockLabel> */}
            </DockItem>
          ))}
        </motion.div>
      </div>
    </motion.div>
  );
}
