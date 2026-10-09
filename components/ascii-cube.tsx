'use client';

import { useEffect, useRef } from 'react';
import { cubeMask } from './ascii-cube-mask';

/** Characters from faintest to boldest. */
const ramp = ' .·:-=+*#%@';
const rows = cubeMask.length;
const columns = cubeMask[0].length;
/** How long the cube keeps moving after it was last given a reason to, in milliseconds. */
const restAfter = 6000;

/** "#rrggbb" as three numbers. */
function channels(hex: string) {
  const value = Number.parseInt(hex.trim().slice(1), 16) || 0;
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

/**
 * Thaw's icon drawn in characters. A band of light crosses it slowly, as if
 * the cube were catching the sun and starting to melt, and the characters
 * near the pointer brighten. Every character is one of the logo's own colours.
 * It moves for a few seconds and then rests, so it does not pull at the eye for good. With reduced motion it is a single still frame.
 */
export function AsciiCube({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return;

    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let frame = 0;
    let visible = true;
    let pointer: { x: number; y: number } | null = null;
    let cell = { w: 0, h: 0 };

    function resize() {
      if (!canvas || !context) return;
      const scale = window.devicePixelRatio || 1;
      const width = canvas.clientWidth;
      // A character is about twice as tall as it is wide, so the grid is square.
      cell = { w: width / columns, h: (width / columns) * 2 };
      canvas.width = Math.round(width * scale);
      canvas.height = Math.round(cell.h * rows * scale);
      context.setTransform(scale, 0, 0, scale, 0, 0);
    }

    function draw(time: number) {
      if (!canvas || !context) return;
      const seconds = time / 1000;
      // Four tones from the logo, faintest to boldest, set per theme in global.css.
      const style = getComputedStyle(canvas);
      const tones = [1, 2, 3, 4].map((step) => style.getPropertyValue(`--cube-${step}`).trim());
      const floor = Number(style.getPropertyValue('--cube-floor')) || 0.4;
      // The two ends of the light icon's fill, when the theme asks for the filled drawing.
      const filled = style.getPropertyValue('--cube-fill-top').trim() !== '';
      const fill = {
        top: channels(style.getPropertyValue('--cube-fill-top')),
        bottom: channels(style.getPropertyValue('--cube-fill-bottom')),
      };
      // Heavier strokes where the tile is filled in, so it reads as a solid.
      context.font = `${filled ? 700 : 400} ${cell.h * 0.82}px ui-monospace, SFMono-Regular, Menlo, monospace`;
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.textBaseline = 'top';

      for (let row = 0; row < rows; row++) {
        for (let column = 0; column < columns; column++) {
          const mark = cubeMask[row][column];
          if (mark === ' ') continue;

          // How strongly the cube's lines show here, lifted so the fainter lower edges read.
          const line = (Number(mark) / 9) ** 0.55;
          // The band of light, moving down and across.
          const light = 0.5 + 0.5 * Math.sin(column * 0.16 + row * 0.34 - seconds * 1.1);
          // A slow shimmer in the body of the icon, different in every cell.
          const shimmer = 0.5 + 0.5 * Math.sin(column * 1.7 + row * 2.3 + seconds * 0.7);
          let level = line > 0.08 ? line * (0.5 + 0.5 * light) : 0.07 + 0.07 * shimmer * light;
          let reach = 0;
          if (pointer) {
            const dx = (column + 0.5) * cell.w - pointer.x;
            const dy = (row + 0.5) * cell.h - pointer.y;
            reach = 0.5 * Math.max(0, 1 - Math.hypot(dx, dy) / (cell.w * 9));
          }

          if (filled) {
            // On a light page the icon is drawn as the app's own light icon: the tile filled
            // in, yellow at the top to orange at the bottom, and the cube's lines left pale.
            // So the body takes the heavy characters and the lines the faint ones.
            level =
              line > 0.08
                ? Math.max(0, 0.22 * (1 - line) - reach * 0.3)
                : Math.min(1, 0.62 + 0.3 * light + 0.08 * shimmer + reach);
            const down = row / (rows - 1);
            context.globalAlpha = 1;
            context.fillStyle = `rgb(${fill.top.map((from, part) => Math.round(from + (fill.bottom[part] - from) * down)).join(' ')})`;
          } else {
            level = Math.min(1, level + reach);
            context.globalAlpha = floor + (1 - floor) * level;
            context.fillStyle = tones[Math.min(3, Math.floor(level * 4))];
          }
          context.fillText(
            ramp[Math.round(level * (ramp.length - 1))],
            column * cell.w,
            row * cell.h,
          );
        }
      }
      context.globalAlpha = 1;
    }

    // The light crosses for a few seconds after the page opens and whenever the
    // pointer is over the cube, then the picture holds still until it is touched again.
    let awakeUntil = performance.now() + restAfter;
    let running = false;

    // A phone draws the cube a dozen times a second: the light crosses slowly, and at full
    // rate the drawing is most of what a phone's processor does while the page opens.
    const pause = window.matchMedia('(pointer: coarse)').matches ? 1000 / 12 : 0;
    let drawn = 0;

    function loop(time: number) {
      if (visible && time - drawn >= pause) {
        drawn = time;
        draw(time);
      }
      if (time < awakeUntil) frame = requestAnimationFrame(loop);
      else running = false;
    }

    function wake() {
      awakeUntil = performance.now() + restAfter;
      if (running || still) return;
      running = true;
      frame = requestAnimationFrame(loop);
    }

    function onPointerMove(event: PointerEvent) {
      if (!canvas) return;
      const box = canvas.getBoundingClientRect();
      pointer = { x: event.clientX - box.left, y: event.clientY - box.top };
      if (still) draw(0);
      else wake();
    }
    function onPointerLeave() {
      pointer = null;
      if (still) draw(0);
      else wake();
    }

    const sized = new ResizeObserver(() => {
      resize();
      if (still) draw(0);
      else if (!running) draw(performance.now());
    });
    sized.observe(canvas);
    // The tones differ per theme, so a resting cube is drawn again when the theme changes.
    const themed = new MutationObserver(() => {
      if (still || !running) draw(still ? 0 : performance.now());
    });
    themed.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    // Nothing is drawn while the icon is scrolled out of view.
    const seen = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
    });
    seen.observe(canvas);
    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerleave', onPointerLeave);

    resize();
    if (still) draw(0);
    else {
      running = true;
      frame = requestAnimationFrame(loop);
    }

    return () => {
      cancelAnimationFrame(frame);
      sized.disconnect();
      themed.disconnect();
      seen.disconnect();
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerleave', onPointerLeave);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      role="img"
      aria-label="Thaw’s icon, an ice cube, drawn in text characters"
      className={className}
    />
  );
}
