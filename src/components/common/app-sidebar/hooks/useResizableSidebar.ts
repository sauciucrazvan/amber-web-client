import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
} from "react";

type UseResizableSidebarParams = {
  minWidth?: number;
  maxWidth?: number;
};

export function useResizableSidebar({
  minWidth = 320,
  maxWidth = 400,
}: UseResizableSidebarParams = {}) {
  const storedSidebarPos = localStorage.getItem("amber.sidebarPos");
  const sidebarSide: "left" | "right" =
    storedSidebarPos === "right" ? "right" : "left";

  const tooltipSide: "left" | "right" =
    sidebarSide === "left" ? "right" : "left";
  const tabsDirectionClass =
    sidebarSide === "left" ? "flex-row" : "flex-row-reverse";
  const railPaddingClass = sidebarSide === "left" ? "pl-1" : "pr-1";
  const panelChromeClass =
    sidebarSide === "left"
      ? "rounded-tl-md border-l border-t"
      : "rounded-tr-md border-r border-t";

  const [sidebarWidth, setSidebarWidth] = useState<number>(() => {
    const storedWidth = Number(localStorage.getItem("amber.sidebarWidth"));
    if (!Number.isFinite(storedWidth)) return 256;
    return Math.min(maxWidth, Math.max(minWidth, storedWidth));
  });

  const resizeStateRef = useRef<{ startX: number; startWidth: number } | null>(
    null,
  );

  useEffect(() => {
    localStorage.setItem("amber.sidebarWidth", String(sidebarWidth));
  }, [sidebarWidth]);

  useEffect(() => {
    const sidebarWrapper = document.querySelector(
      '[data-slot="sidebar-wrapper"]',
    ) as HTMLElement | null;
    if (!sidebarWrapper) return;
    sidebarWrapper.style.setProperty("--sidebar-width", `${sidebarWidth}px`);
  }, [sidebarWidth]);

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (!resizeStateRef.current) return;

      const { startX, startWidth } = resizeStateRef.current;
      const deltaX = event.clientX - startX;
      const nextWidth =
        sidebarSide === "left" ? startWidth + deltaX : startWidth - deltaX;
      const clampedWidth = Math.min(maxWidth, Math.max(minWidth, nextWidth));

      setSidebarWidth(clampedWidth);
    };

    const handleMouseUp = () => {
      if (!resizeStateRef.current) return;
      resizeStateRef.current = null;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [maxWidth, minWidth, sidebarSide]);

  const handleResizeStart = (event: ReactMouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    resizeStateRef.current = {
      startX: event.clientX,
      startWidth: sidebarWidth,
    };
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  };

  const resizeHandleClass = useMemo(
    () =>
      `absolute inset-y-0 z-20 hidden w-2 cursor-col-resize transition-colors hover:bg-border/60 active:bg-border md:block ${
        sidebarSide === "left"
          ? "right-0 translate-x-1/2"
          : "left-0 -translate-x-1/2"
      }`,
    [sidebarSide],
  );

  return {
    sidebarSide,
    tooltipSide,
    tabsDirectionClass,
    railPaddingClass,
    panelChromeClass,
    resizeHandleClass,
    handleResizeStart,
  };
}
