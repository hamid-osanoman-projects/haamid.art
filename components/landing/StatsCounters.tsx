'use client';

import React, { useEffect, useRef, useState } from 'react';

interface StatItemProps {
  label: string;
  endValue: number;
  suffix?: string;
  duration?: number;
}

function Counter({ endValue, duration = 1500 }: { endValue: number; duration?: number }) {
  const [count, setCount] = useState(0);
  const elementRef = useRef<HTMLSpanElement>(null);
  const [hasStarted, setHasStarted] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setHasStarted(true);
          observer.disconnect(); // Trigger animation once
        }
      },
      { threshold: 0.2 }
    );

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!hasStarted) return;

    let startTimestamp: number | null = null;
    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      
      // Easing function (easeOutQuad)
      const easeProgress = progress * (2 - progress);
      setCount(Math.floor(easeProgress * endValue));

      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };

    window.requestAnimationFrame(step);
  }, [hasStarted, endValue, duration]);

  return <span ref={elementRef}>{count.toLocaleString()}</span>;
}

function StatItem({ label, endValue, suffix = '', duration }: StatItemProps) {
  return (
    <div className="flex flex-col items-center justify-center p-6 rounded-2xl border border-zinc-800 bg-zinc-900/10 backdrop-blur-sm shadow-xl">
      <div className="text-4xl md:text-5xl font-extrabold text-white tracking-tight">
        <Counter endValue={endValue} duration={duration} />
        <span className="text-purple-400 font-bold ml-0.5">{suffix}</span>
      </div>
      <p className="text-xs md:text-sm font-semibold uppercase tracking-wider text-zinc-400 mt-3 text-center">
        {label}
      </p>
    </div>
  );
}

interface StatsCountersProps {
  shippedCount?: number;
  experienceYears?: number;
  githubCommits?: number;
  clientsCount?: number;
}

export default function StatsCounters({
  shippedCount = 28,
  experienceYears = 5,
  githubCommits = 1482,
  clientsCount = 15,
}: StatsCountersProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 w-full">
      <StatItem label="Projects Shipped" endValue={shippedCount} suffix="+" />
      <StatItem label="Years Experience" endValue={experienceYears} suffix="+" />
      <StatItem label="GitHub Commits" endValue={githubCommits} suffix="" />
      <StatItem label="Happy Clients" endValue={clientsCount} suffix="+" />
    </div>
  );
}
