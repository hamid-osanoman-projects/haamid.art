'use client';

import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

export default function ShyProfilePicture({ children }: { children: React.ReactNode }) {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Calculate distance between mouse and center of the element
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const distanceX = e.clientX - centerX;
    const distanceY = e.clientY - centerY;
    const distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY);
    
    // If mouse gets within 100px, run away!
    if (distance < 100) {
      // Move in opposite direction
      const angle = Math.atan2(distanceY, distanceX);
      const pushDistance = 150 - distance;
      
      const newX = position.x - Math.cos(angle) * pushDistance;
      const newY = position.y - Math.sin(angle) * pushDistance;
      
      // Limit how far it can run
      const clampX = Math.max(-200, Math.min(200, newX));
      const clampY = Math.max(-200, Math.min(200, newY));
      
      setPosition({ x: clampX, y: clampY });
    }
  };

  // Slowly return to center when mouse leaves the vicinity
  useEffect(() => {
    if (position.x === 0 && position.y === 0) return;
    
    const timer = setTimeout(() => {
      setPosition({ x: 0, y: 0 });
    }, 2000);
    
    return () => clearTimeout(timer);
  }, [position]);

  return (
    <motion.div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      animate={{ x: position.x, y: position.y }}
      transition={{ type: 'spring', stiffness: 200, damping: 15 }}
      style={{ display: 'inline-block' }}
    >
      {children}
    </motion.div>
  );
}
