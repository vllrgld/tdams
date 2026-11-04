import type { FlyerPose } from '../shared/book-world-pose';

/** Keep the folder rigid and turn around its volume center, rather than
 * interpolating matrix entries (which shrinks its faces during a turn). */
export function folderMotionTransform(
    transform: string,
    size: Pick<FlyerPose, 'width' | 'height' | 'depth'>,
): string {
    const matrix = new DOMMatrix(transform);
    const sx = Math.hypot(matrix.m11, matrix.m12, matrix.m13) || 1;
    const sy = Math.hypot(matrix.m21, matrix.m22, matrix.m23) || 1;
    const sz = Math.hypot(matrix.m31, matrix.m32, matrix.m33) || 1;
    const y = Math.asin(Math.max(-1, Math.min(1, matrix.m31 / sz)));
    const regular = Math.abs(matrix.m31 / sz) < 0.9999999;
    const x = regular
        ? Math.atan2(-matrix.m32 / sz, matrix.m33 / sz)
        : Math.atan2(matrix.m23 / sy, matrix.m22 / sy);
    const z = regular ? Math.atan2(-matrix.m21 / sy, matrix.m11 / sx) : 0;
    const center = new DOMPoint(
        size.width / 2,
        size.height / 2,
        -size.depth / 2,
    );
    const world = center.matrixTransform(matrix);
    const degrees = 180 / Math.PI;
    // Avoid scientific notation from matrix-inversion noise: Motion's transform
    // string interpolation can misread its exponent as a unit.
    const value = (number: number) => number.toFixed(8);

    return `translate3d(${value(world.x)}px, ${value(world.y)}px, ${value(world.z)}px) rotateX(${value(x * degrees)}deg) rotateY(${value(y * degrees)}deg) rotateZ(${value(z * degrees)}deg) scale3d(${value(sx)}, ${value(sy)}, ${value(sz)}) translate3d(${value(-center.x)}px, ${value(-center.y)}px, ${value(-center.z)}px)`;
}
