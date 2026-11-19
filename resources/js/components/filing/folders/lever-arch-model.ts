import {
    BoxGeometry,
    Box3,
    CanvasTexture,
    DataTexture,
    ExtrudeGeometry,
    Group,
    Matrix4,
    Mesh,
    MeshStandardMaterial,
    Path,
    PerspectiveCamera,
    PlaneGeometry,
    RepeatWrapping,
    RGBAFormat,
    Shape,
    SRGBColorSpace,
    TorusGeometry,
    TubeGeometry,
    CatmullRomCurve3,
    Vector2,
    Vector3,
    type BufferGeometry,
    type Material,
} from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

// Reference dimensions in metres: 318 mm high, 285 mm cover, 75 mm spine.
export const LEVER_ARCH_SIZE = {
    width: 0.285,
    height: 0.318,
    depth: 0.075,
} as const;

export function fitLeverArchCamera(
    camera: PerspectiveCamera,
    root: Group,
    size: { width: number; height: number },
) {
    root.updateWorldMatrix(true, true);
    const bounds = new Box3().setFromObject(root);
    const center = bounds.getCenter(new Vector3());
    const span = bounds.getSize(new Vector3());
    camera.aspect = Math.max(1, size.width) / Math.max(1, size.height);
    const tangent = Math.tan((camera.fov * Math.PI) / 360);
    const distance =
        Math.max(
            span.y / (2 * tangent),
            span.x / (2 * tangent * camera.aspect),
        ) *
            1.2 +
        span.z / 2;
    camera.position.set(center.x, center.y, center.z + distance);
    camera.lookAt(center);
    camera.updateProjectionMatrix();
    camera.updateMatrixWorld(true);
}

function rectangle(width: number, height: number, radius = 0.001) {
    const s = new Shape(),
        x = -width / 2,
        y = -height / 2,
        r = radius;
    s.moveTo(x + r, y);
    s.lineTo(x + width - r, y);
    s.quadraticCurveTo(x + width, y, x + width, y + r);
    s.lineTo(x + width, y + height - r);
    s.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
    s.lineTo(x + r, y + height);
    s.quadraticCurveTo(x, y + height, x, y + height - r);
    s.lineTo(x, y + r);
    s.quadraticCurveTo(x, y, x + r, y);
    return s;
}

function laminate() {
    const size = 64,
        data = new Uint8Array(size * size * 4);
    for (let y = 0; y < size; y++)
        for (let x = 0; x < size; x++) {
            const i = (y * size + x) * 4,
                grain = 118 + ((x * 37 + y * 19 + x * y * 13) % 31);
            data[i] = data[i + 1] = data[i + 2] = grain;
            data[i + 3] = 255;
        }
    const texture = new DataTexture(data, size, size, RGBAFormat);
    texture.wrapS = texture.wrapT = RepeatWrapping;
    texture.repeat.set(22, 25);
    texture.needsUpdate = true;
    return texture;
}

/** Combine rigid parts by material while retaining the cover hinge. */
function mergeAssembly(group: Group) {
    group.updateMatrixWorld(true);
    const buckets = new Map<Material, Mesh[]>();
    group.traverse((o) => {
        if (o instanceof Mesh && !Array.isArray(o.material)) {
            const parts = buckets.get(o.material) ?? [];
            parts.push(o);
            buckets.set(o.material, parts);
        }
    });
    const inverse = new Matrix4().copy(group.matrixWorld).invert();
    for (const [material, parts] of buckets) {
        const geometries = parts.map((p) => {
            const g = p.geometry.index
                ? p.geometry.toNonIndexed()
                : p.geometry.clone();
            return g.applyMatrix4(
                new Matrix4().multiplyMatrices(inverse, p.matrixWorld),
            );
        });
        const geometry = mergeGeometries(geometries, false);
        geometries.forEach((g) => g.dispose());
        if (!geometry) continue;
        parts.forEach((p) => {
            p.geometry.dispose();
            p.removeFromParent();
        });
        const mesh = new Mesh(geometry, material);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        group.add(mesh);
    }
}

export function createLeverArchFile() {
    const root = new Group();
    root.name = 'lever-arch-file';
    const bump = laminate();
    const blue = new MeshStandardMaterial({
        color: '#164084',
        roughness: 0.73,
        metalness: 0.02,
        bumpMap: bump,
        bumpScale: 0.00015,
    });
    const lining = new MeshStandardMaterial({
        color: '#d0cec6',
        roughness: 0.96,
    });
    const metal = new MeshStandardMaterial({
        color: '#c0c6ca',
        metalness: 0.88,
        roughness: 0.26,
    });
    const dark = new MeshStandardMaterial({
        color: '#17202a',
        roughness: 0.72,
        metalness: 0.2,
    });
    function add(
        group: Group,
        geometry: BufferGeometry,
        material: Material,
        x = 0,
        y = 0,
        z = 0,
    ) {
        const mesh = new Mesh(geometry, material);
        mesh.position.set(x, y, z);
        group.add(mesh);
        return mesh;
    }
    const W = 0.285,
        H = 0.318,
        D = 0.075,
        T = 0.0025;
    const back = add(
        root,
        new BoxGeometry(W, H, T),
        blue,
        0,
        0,
        -D / 2 + T / 2,
    );
    back.name = 'back-cover';
    add(
        root,
        new BoxGeometry(W - 0.006, H - 0.006, 0.0006),
        lining,
        0,
        0,
        -D / 2 + T + 0.0003,
    );
    const spine = rectangle(D, H);
    const finger = new Path();
    finger.absarc(0, -0.101, 0.0125, 0, Math.PI * 2, true);
    spine.holes.push(finger);
    const spineMesh = add(
        root,
        new ExtrudeGeometry(spine, {
            depth: T,
            bevelEnabled: false,
            curveSegments: 16,
        }),
        blue,
        -W / 2 + T,
        0,
        0,
    );
    spineMesh.rotation.y = -Math.PI / 2;
    const ring = add(
        root,
        new TorusGeometry(0.0127, 0.0014, 6, 32),
        metal,
        -W / 2 - 0.0005,
        -0.101,
        0,
    );
    ring.rotation.y = Math.PI / 2;
    // A dark recessed opening retains depth rather than reading as a printed dot.
    const hole = add(
        root,
        new PlaneGeometry(0.022, 0.022),
        dark,
        -W / 2 + 0.007,
        -0.101,
        0,
    );
    hole.rotation.y = -Math.PI / 2;
    const cover = new Group();
    cover.name = 'front-cover-hinge';
    cover.position.set(-W / 2, 0, D / 2 - T);
    root.add(cover);
    const face = rectangle(W, H);
    for (const y of [0.043, -0.043]) {
        const slot = rectangle(0.034, 0.006, 0.003);
        // Shape holes use local points so the two steel slots are true cutouts.
        const h = new Path(
            slot.getPoints(8).map((p) => new Vector2(p.x - 0.102, p.y + y)),
        );
        face.holes.push(h);
    }
    add(
        cover,
        new ExtrudeGeometry(face, {
            depth: T,
            bevelEnabled: false,
            curveSegments: 8,
        }),
        blue,
        W / 2,
    );
    add(
        cover,
        new BoxGeometry(W - 0.006, H - 0.006, 0.0005),
        lining,
        W / 2,
        0,
        -0.0004,
    );
    for (const y of [0.043, -0.043]) {
        const surround = rectangle(0.038, 0.01, 0.005);
        surround.holes.push(
            new Path(rectangle(0.032, 0.0055, 0.0027).getPoints(8)),
        );
        add(
            cover,
            new ExtrudeGeometry(surround, {
                depth: 0.0012,
                bevelEnabled: false,
                curveSegments: 8,
            }),
            metal,
            0.0405,
            y,
            T,
        );
    }
    // Fold seams along the two boards and the spine.
    for (const z of [-D / 2 + 0.004, D / 2 - 0.004])
        add(
            root,
            new BoxGeometry(0.001, H - 0.002, 0.001),
            dark,
            -W / 2 + 0.004,
            0,
            z,
        );
    // Nickel-plated lever arch mechanism on the inside back board.
    add(root, new BoxGeometry(0.036, 0.139, 0.002), metal, -0.104, 0, -0.032);
    for (const y of [-0.044, 0.044]) {
        const points = [
            new Vector3(-0.12, y, -0.029),
            new Vector3(-0.12, y, 0.012),
            new Vector3(-0.108, y, 0.025),
            new Vector3(-0.084, y, 0.013),
            new Vector3(-0.084, y, -0.029),
        ];
        add(
            root,
            new TubeGeometry(
                new CatmullRomCurve3(points),
                20,
                0.0015,
                6,
                false,
            ),
            metal,
        );
        add(
            root,
            new BoxGeometry(0.039, 0.008, 0.003),
            dark,
            -0.103,
            y,
            -0.029,
        );
    }
    const lever = add(
        root,
        new BoxGeometry(0.007, 0.076, 0.0025),
        metal,
        -0.077,
        -0.022,
        -0.026,
    );
    lever.rotation.z = -0.24;
    mergeAssembly(cover);
    root.remove(cover);
    mergeAssembly(root);
    root.add(cover);
    return { root, cover };
}

export function createClosedLeverArchFile() {
    const file = createLeverArchFile();
    mergeAssembly(file.root);
    return file.root;
}

/** The spine card is unique per filing; the board and hardware resources can be shared. */
export function createLeverArchLabel(
    label: string,
    title: string,
    drawer = false,
) {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 768;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#d5dae0';
    ctx.fillRect(0, 0, 256, 768);
    ctx.fillStyle = '#f4f3ed';
    ctx.fillRect(13, 15, 230, 738);
    ctx.strokeStyle = '#b7babf';
    ctx.lineWidth = 2;
    for (let y = 360; y < 720; y += 64) {
        ctx.beginPath();
        ctx.moveTo(30, y);
        ctx.lineTo(226, y);
        ctx.stroke();
    }
    ctx.fillStyle = '#202a3b';
    ctx.textAlign = 'center';
    const words = label.split(/\s+/),
        lines: string[] = [];
    let line = '';
    ctx.font = '600 31px Arial';
    for (const word of words) {
        if (ctx.measureText((line + ' ' + word).trim()).width > 192 && line) {
            lines.push(line);
            line = word;
        } else line = (line + ' ' + word).trim();
    }
    if (line) lines.push(line);
    lines.slice(0, 4).forEach((text, i) => {
        ctx.fillText(text, 128, 85 + i * 40, 196);
    });
    ctx.font = '22px Arial';
    ctx.fillStyle = '#535d69';
    ctx.fillText(title, 128, 292, 192);
    if (drawer) {
        ctx.fillStyle = '#f4f3ed';
        ctx.fillRect(13, 15, 230, 738);
        ctx.translate(128, 384);
        ctx.rotate(-Math.PI / 2);
        ctx.fillStyle = '#202a3b';
        ctx.font = '700 66px Arial';
        ctx.fillText(label, 0, -10, 690);
        ctx.fillStyle = '#535d69';
        ctx.font = '30px Arial';
        ctx.fillText(title, 0, 50, 690);
    }
    const texture = new CanvasTexture(canvas);
    texture.colorSpace = SRGBColorSpace;
    texture.anisotropy = 4;
    const material = new MeshStandardMaterial({
        map: texture,
        roughness: 0.85,
    });
    const mesh = new Mesh(new PlaneGeometry(0.054, 0.174), material);
    mesh.rotation.y = -Math.PI / 2;
    mesh.position.set(-0.1441, 0.03, 0);
    mesh.name = 'spine-label';
    return mesh;
}

export function disposeLeverArchFile(root: Group) {
    const geometries = new Set<BufferGeometry>(),
        materials = new Set<Material>();
    root.traverse((o) => {
        if (o instanceof Mesh) {
            geometries.add(o.geometry);
            (Array.isArray(o.material) ? o.material : [o.material]).forEach(
                (m) => materials.add(m),
            );
        }
    });
    geometries.forEach((g) => g.dispose());
    materials.forEach((m) => {
        if (m instanceof MeshStandardMaterial) {
            m.map?.dispose();
            m.bumpMap?.dispose();
        }
        m.dispose();
    });
}
