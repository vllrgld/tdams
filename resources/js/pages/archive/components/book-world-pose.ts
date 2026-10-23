export type FlyerPose = {
    x: number;
    y: number;
    rotateX: number;
    rotateY: number;
    rotateZ: number;
    width: number;
    height: number;
    depth: number;
    origin: string;
    transform: string;
};

export const SLOT_ORIGIN = '0px 0px 0px';

type BoxQuadElement = HTMLElement & {
    getBoxQuads?: (options?: { relativeTo?: Element }) => DOMQuad[];
};

function findPerspectiveRoot(element: HTMLElement): HTMLElement {
    let node = element.parentElement;

    while (node) {
        const perspective =
            node.ownerDocument.defaultView?.getComputedStyle(node).perspective;

        if (
            perspective &&
            perspective !== 'none' &&
            Number.parseFloat(perspective) > 0
        ) {
            return node;
        }

        node = node.parentElement;
    }

    return element.ownerDocument.documentElement;
}

function parseOrigin(origin: string | undefined): {
    x: number;
    y: number;
    z: number;
} {
    const parts = origin?.split(' ') ?? [];

    return {
        x: Number.parseFloat(parts[0] ?? '') || 0,
        y: Number.parseFloat(parts[1] ?? '') || 0,
        z: Number.parseFloat(parts[2] ?? '') || 0,
    };
}

function matrixFromBoxQuads(
    element: BoxQuadElement,
    root: HTMLElement,
): DOMMatrix | null {
    if (typeof element.getBoxQuads !== 'function') {
        return null;
    }

    try {
        const [quad] = element.getBoxQuads({ relativeTo: root });

        if (!quad) {
            return null;
        }

        const width = element.offsetWidth || 1;
        const height = element.offsetHeight || 1;
        const { p1, p2, p4 } = quad;
        const az = (p2.z - p1.z) / width;
        const bz = (p4.z - p1.z) / height;

        if (
            Math.abs(az) < 1e-3 &&
            Math.abs(bz) < 1e-3 &&
            Math.abs(p1.z) < 1e-3
        ) {
            return null;
        }

        const ax = (p2.x - p1.x) / width;
        const ay = (p2.y - p1.y) / width;
        const bx = (p4.x - p1.x) / height;
        const by = (p4.y - p1.y) / height;
        const cx = ay * bz - az * by;
        const cy = az * bx - ax * bz;
        const cz = ax * by - ay * bx;

        return new DOMMatrix([
            ax,
            ay,
            az,
            0,
            bx,
            by,
            bz,
            0,
            cx,
            cy,
            cz,
            0,
            p1.x,
            p1.y,
            p1.z,
            1,
        ]);
    } catch {
        return null;
    }
}

function offsetParentChain(
    element: HTMLElement,
    root: HTMLElement,
): HTMLElement[] {
    const chain: HTMLElement[] = [];

    for (
        let node: HTMLElement | null = element;
        node && node !== root && root.contains(node);
        node =
            node.offsetParent instanceof HTMLElement ? node.offsetParent : null
    ) {
        chain.push(node);
    }

    return chain;
}

function cumulativeFromOffsetParents(
    element: HTMLElement,
    root: HTMLElement,
): DOMMatrix {
    const chain = offsetParentChain(element, root);
    const matrix = new DOMMatrix();

    for (let index = chain.length - 1; index >= 0; index -= 1) {
        const node = chain[index];
        const view = node.ownerDocument.defaultView;
        const style = view?.getComputedStyle(node);
        const origin = parseOrigin(style?.transformOrigin);
        const transform = style?.transform;

        matrix.translateSelf(node.offsetLeft, node.offsetTop, 0);

        if (!transform || transform === 'none') {
            continue;
        }

        matrix.translateSelf(origin.x, origin.y, origin.z);
        matrix.multiplySelf(new DOMMatrix(transform));
        matrix.translateSelf(-origin.x, -origin.y, -origin.z);
    }

    return matrix;
}

function cumulativeTransform(
    element: HTMLElement,
    root: HTMLElement,
): DOMMatrix {
    return (
        matrixFromBoxQuads(element, root) ??
        cumulativeFromOffsetParents(element, root)
    );
}

function decompose(matrix: DOMMatrix): {
    x: number;
    y: number;
    rotateX: number;
    rotateZ: number;
} {
    return {
        x: matrix.e,
        y: matrix.f,
        rotateX: Math.atan2(-matrix.m23, matrix.m33) * (180 / Math.PI),
        rotateZ: Math.atan2(matrix.m12, matrix.m11) * (180 / Math.PI),
    };
}

export function poseFromMatrix(
    matrix: DOMMatrix,
    size: Pick<FlyerPose, 'width' | 'height' | 'depth' | 'rotateY'>,
): FlyerPose {
    const { x, y, rotateX, rotateZ } = decompose(matrix);

    return {
        x,
        y,
        rotateX,
        rotateY: size.rotateY,
        rotateZ,
        width: size.width,
        height: size.height,
        depth: size.depth,
        origin: SLOT_ORIGIN,
        transform: matrix.toString(),
    };
}

export function translatePose(
    pose: FlyerPose,
    x: number,
    y: number,
): FlyerPose {
    const matrix = new DOMMatrix()
        .translateSelf(x, y)
        .multiply(new DOMMatrix(pose.transform));

    return poseFromMatrix(matrix, pose);
}

export function measureLiftedSlotPose(
    element: HTMLElement,
    lift: number,
    depth: number,
): FlyerPose {
    const previous = element.style.transform;
    const computed =
        element.ownerDocument.defaultView?.getComputedStyle(element)
            .transform ?? 'none';
    const base = !computed || computed === 'none' ? '' : computed;
    element.style.transform = `translateY(${-lift}px)${base ? ` ${base}` : ''}`;
    const pose = measureSlotPose(element, depth);
    element.style.transform = previous;

    return pose;
}

export function measureSlotPose(
    element: HTMLElement,
    depth: number,
): FlyerPose {
    const root = findPerspectiveRoot(element);
    const matrix = cumulativeTransform(element, root);

    return poseFromMatrix(matrix, {
        width: element.offsetWidth,
        height: element.offsetHeight,
        depth,
        rotateY: 0,
    });
}

export function measureHoverAndRestPose(
    element: HTMLElement,
    restTransform: string,
    depth: number,
): { hover: FlyerPose; rest: FlyerPose } {
    const hover = measureSlotPose(element, depth);
    const previous = element.style.transform;
    element.style.transform = restTransform;
    const rest = measureSlotPose(element, depth);
    element.style.transform = previous;

    return { hover, rest };
}
