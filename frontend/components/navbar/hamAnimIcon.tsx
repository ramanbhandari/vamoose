const AnimatedMenuIcon = ({
  isOpen,
  onClick,
}: {
  isOpen: boolean;
  onClick: (event: React.MouseEvent<HTMLElement>) => void; // Accept the event
}) => {
  return (
    <div
      className="w-4 h-4 p-1 cursor-pointer relative flex items-center justify-center gap-1"
      onClick={onClick}
    >
      <span
        className={`block absolute h-0.5 w-5 bg-current transition duration-500 ease-in-out ${
          isOpen ? "rotate-45 top-1/2 -translate-y-1/3" : "top-0"
        }`}
      ></span>
      <span
        className={`block absolute h-0.5 w-5 bg-current transition duration-500 ease-in-out ${
          isOpen ? "opacity-0" : "top-1/2 -translate-y-1/3"
        }`}
      ></span>
      <span
        className={`block absolute h-0.5 w-5 bg-current transition duration-500 ease-in-out ${
          isOpen ? "-rotate-45 top-1/2 -translate-y-1/3" : "bottom-0"
        }`}
      ></span>
    </div>
  );
};

export default AnimatedMenuIcon;
