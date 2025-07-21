import { useState, useEffect, useRef } from "react";

export const useScale = () => {
  const [scale, setScale] = useState({ x: 1, y: 1 });
  const containerRef = useRef(null);

  useEffect(() => {
    const updateScale = () => {
      if (!containerRef.current) return;

      const { width, height } = containerRef.current.getBoundingClientRect();

      const worldWidth = 600; // x: -300 do 300
      const worldHeight = 430; // y: -215 do 215

      const scaleX = width / worldWidth;
      const scaleY = height / worldHeight;

      setScale({ x: scaleX, y: scaleY });
    };

    updateScale();
    window.addEventListener("resize", updateScale);

    return () => window.removeEventListener("resize", updateScale);
  }, []);

  return { scale, containerRef };
};