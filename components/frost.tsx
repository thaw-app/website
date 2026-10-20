'use client';

import { useEffect, useRef } from 'react';
import { onThemeChange } from '@/lib/on-theme-change';

/** The cube's characters, faintest to boldest (components/ascii-cube.tsx). */
const ramp = ' .·:-=+*#%@';
/** How wide a character is, in pixels, and how tall: twice as tall, as a character is. */
const cellWidth = 9;
const cellHeight = cellWidth * 2;
/** How far around the pointer the frost melts, in characters across. */
const reach = 7;
/** How long melted frost takes to come back, in seconds. */
const refreeze = 3.5;

/** A number from 0 to 1 that is always the same for the same cell. */
function hash(column: number, row: number) {
  const value = Math.sin(column * 127.1 + row * 311.7) * 43758.5453;
  return value - Math.floor(value);
}

/**
 * Frost in the cube's characters over the ground behind the not-found page's words, thickest
 * at the edges as frost on a window is. It melts where the pointer goes and comes back a
 * few seconds later: a page that is not there, thawing. It is drawn behind the words and
 * faintly, so they read through it, and takes no clicks. With reduced motion it is frost
 * that stays as it is.
 */
export function Frost() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const area = canvas?.parentElement;
    const context = canvas?.getContext('2d');
    if (!canvas || !area || !context) return;
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let columns = 0;
    let rows = 0;
    let ice: Float32Array = new Float32Array();
    let melt: Float32Array = new Float32Array();
    let frame = 0;
    let last = 0;
    let running = false;

    function resize() {
      if (!canvas || !context) return;
      const scale = window.devicePixelRatio || 1;
      columns = Math.ceil(canvas.clientWidth / cellWidth);
      rows = Math.ceil(canvas.clientHeight / cellHeight);
      canvas.width = Math.round(canvas.clientWidth * scale);
      canvas.height = Math.round(canvas.clientHeight * scale);
      context.setTransform(scale, 0, 0, scale, 0, 0);
      // Thick at the edges and thin towards the middle, broken up cell by cell.
      ice = new Float32Array(columns * rows);
      melt = new Float32Array(columns * rows);
      for (let row = 0; row < rows; row++) {
        for (let column = 0; column < columns; column++) {
          const edge = Math.min(column / columns, 1 - column / columns, row / rows, 1 - row / rows);
          const grain = hash(column, row);
          ice[row * columns + column] = Math.max(0, 1 - edge * 5 - grain * 0.5) ** 1.4;
        }
      }
    }

    function draw() {
      if (!canvas || !context) return;
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.font = `${cellHeight * 0.82}px ui-monospace, SFMono-Regular, Menlo, monospace`;
      context.textBaseline = 'top';
      context.fillStyle = getComputedStyle(canvas).color;
      for (let row = 0; row < rows; row++) {
        for (let column = 0; column < columns; column++) {
          const index = row * columns + column;
          const level = ice[index] * (1 - melt[index]);
          const mark = ramp[Math.round(level * (ramp.length - 1))];
          if (mark === ' ') continue;
          context.globalAlpha = 0.25 + 0.75 * level;
          context.fillText(mark, column * cellWidth, row * cellHeight);
        }
      }
      context.globalAlpha = 1;
    }

    function loop(time: number) {
      const seconds = Math.min(0.1, (time - last) / 1000);
      last = time;
      let melting = false;
      for (let index = 0; index < melt.length; index++) {
        if (melt[index] > 0) {
          melt[index] = Math.max(0, melt[index] - seconds / refreeze);
          melting = true;
        }
      }
      draw();
      if (melting) frame = requestAnimationFrame(loop);
      else running = false;
    }

    function onPointerMove(event: PointerEvent) {
      if (!canvas || still) return;
      const box = canvas.getBoundingClientRect();
      const x = (event.clientX - box.left) / cellWidth;
      const y = (event.clientY - box.top) / cellHeight;
      for (
        let row = Math.max(0, Math.floor(y - reach / 2));
        row < Math.min(rows, y + reach / 2);
        row++
      ) {
        for (
          let column = Math.max(0, Math.floor(x - reach));
          column < Math.min(columns, x + reach);
          column++
        ) {
          // Rows are twice as tall as columns are wide, so half as many make a round patch.
          const distance = Math.hypot(column + 0.5 - x, (row + 0.5 - y) * 2) / reach;
          const index = row * columns + column;
          melt[index] = Math.max(melt[index], 1 - distance);
        }
      }
      if (!running) {
        running = true;
        last = performance.now();
        frame = requestAnimationFrame(loop);
      }
    }

    const sized = new ResizeObserver(() => {
      resize();
      draw();
    });
    sized.observe(canvas);
    const unthemed = onThemeChange(draw);
    area.addEventListener('pointermove', onPointerMove);

    return () => {
      cancelAnimationFrame(frame);
      sized.disconnect();
      unthemed();
      area.removeEventListener('pointermove', onPointerMove);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none absolute inset-0 size-full text-fd-foreground/25"
    />
  );
}
