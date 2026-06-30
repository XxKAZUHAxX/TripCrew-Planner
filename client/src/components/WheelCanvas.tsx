import { useState, useRef, useEffect } from 'react';
import type { ScoredDestination } from '@tripcrew/shared';

const SLICE_COLORS = [
    '#0d9488',
    '#f59e0b',
    '#e11d48',
    '#3b82f6',
    '#16a34a',
    '#a855f7',
    '#fb7185',
    '#14b8a6',
];

interface WheelCanvasProps {
    slices: ScoredDestination[];
    // Set before the animation starts; the wheel lands on this index.
    winnerIndex: number | null;
    onSpinEnd: () => void;
    // Parent toggles this to kick off the animation.
    spinning: boolean;
}

export default function WheelCanvas({
    slices,
    winnerIndex,
    onSpinEnd,
    spinning,
}: WheelCanvasProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const rotationRef = useRef(0);
    const [cssRotation, setCssRotation] = useState(0);
    const hasSpun = useRef(false);

    const size = 320;
    const cx = size / 2;
    const cy = size / 2;
    const r = cx - 6;

    // Draw static wheel on canvas whenever slices change.
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || slices.length === 0) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const N = slices.length;
        const sliceAngle = (2 * Math.PI) / N;
        ctx.clearRect(0, 0, size, size);
        slices.forEach((s, i) => {
            const start = i * sliceAngle - Math.PI / 2;
            const end = start + sliceAngle;
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.arc(cx, cy, r, start, end);
            ctx.fillStyle = SLICE_COLORS[i % SLICE_COLORS.length]!;
            ctx.fill();
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.stroke();
            // Label
            const midAngle = start + sliceAngle / 2;
            const lx = cx + r * 0.65 * Math.cos(midAngle);
            const ly = cy + r * 0.65 * Math.sin(midAngle);
            ctx.save();
            ctx.translate(lx, ly);
            ctx.rotate(midAngle + Math.PI / 2);
            ctx.fillStyle = '#fff';
            ctx.font = `bold ${Math.min(14, 80 / N)}px system-ui`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            const label = s.name.length > 10 ? s.name.slice(0, 9) + '…' : s.name;
            ctx.fillText(label, 0, 0);
            ctx.restore();
        });
    }, [slices, size, cx, cy, r]);

    // Trigger the animation when `spinning` flips to true.
    useEffect(() => {
        if (!spinning || winnerIndex === null || hasSpun.current) return;
        hasSpun.current = true;

        const N = slices.length;
        const sliceDeg = 360 / N;
        const FULL_SPINS = 6;
        // Position winner under the top pointer (pointer is at 0°/top = 270° in canvas coords).
        const targetDeg = FULL_SPINS * 360 + (360 - winnerIndex * sliceDeg - sliceDeg / 2);
        rotationRef.current += targetDeg;
        setCssRotation(rotationRef.current);
    }, [spinning, winnerIndex, slices.length]);

    function handleTransitionEnd() {
        if (spinning) {
            onSpinEnd();
        }
    }

    return (
        <div className="wheel-wrapper">
            <div className="wheel-pointer" />
            <canvas
                ref={canvasRef}
                width={size}
                height={size}
                className="wheel"
                style={{ transform: `rotate(${cssRotation}deg)` }}
                onTransitionEnd={handleTransitionEnd}
            />
        </div>
    );
}
