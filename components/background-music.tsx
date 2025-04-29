"use client";

import { useEffect, useRef } from "react";

export function BackgroundMusic() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const hasInteracted = useRef(false);

  useEffect(() => {
    // Initialize audio element
    audioRef.current = new Audio("/music/background.mp3");
    audioRef.current.loop = true;
    audioRef.current.volume = 0.3; // Set a comfortable volume level

    // Function to start playing
    const startPlaying = () => {
      if (audioRef.current && !hasInteracted.current) {
        audioRef.current.play()
          .then(() => {
            hasInteracted.current = true;
          })
          .catch((error) => {
            console.error("Error playing background music:", error);
          });
      }
    };

    // Try to start playing immediately
    startPlaying();

    // Add event listeners for user interaction
    const events = ['click', 'touchstart', 'keydown'];
    events.forEach(event => {
      document.addEventListener(event, startPlaying, { once: true });
    });

    // Cleanup on unmount
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, startPlaying);
      });
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  return null; // No visible component
}
