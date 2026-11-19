import {
    Matrix4,
    Mesh,
    type BufferGeometry,
    type Group,
    type Material,
    type Object3D,
} from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import {
    createProceduralCabinet,
    disposeProceduralCabinet,
    type CabinetModelDrawer,
    type ProceduralCabinetModel,
} from './procedural-cabinet-model.ts';

type SharedCabinet = { template: ProceduralCabinetModel; users: number };
const cabinetTemplates = new Map<number, SharedCabinet>();
const cabinetInstances = new WeakMap<ProceduralCabinetModel, SharedCabinet>();

/** Acquire during a committed effect; only immutable geometry and paint grain are shared. */
export function acquireProceduralCabinet(
    drawers: readonly CabinetModelDrawer[],
): ProceduralCabinetModel {
    let shared = cabinetTemplates.get(drawers.length);
    if (!shared) {
        shared = {
            template: batchProceduralCabinet(
                createProceduralCabinet(
                    drawers.map((_, index) => ({
                        id: String(index),
                        label: '',
                    })),
                ),
            ),
            users: 0,
        };
        cabinetTemplates.set(drawers.length, shared);
    }
    shared.users++;
    const template = shared.template;
    const root = template.root.clone(true);
    type CabinetMaterial = ProceduralCabinetModel['materials'][number];
    const materials = new Map<Material, CabinetMaterial>();
    const copyMaterial = (source: Material) => {
        let copy = materials.get(source);
        if (!copy) {
            copy = source.clone() as CabinetMaterial;
            materials.set(source, copy);
        }
        return copy;
    };
    template.materials.forEach(copyMaterial);
    const copies = new Map<number, Object3D>();
    const indexCopies = (source: Object3D, copy: Object3D) => {
        copies.set(source.id, copy);
        if (source instanceof Mesh && copy instanceof Mesh) {
            copy.material = Array.isArray(source.material)
                ? source.material.map(copyMaterial)
                : copyMaterial(source.material);
        }
        source.children.forEach((child, index) =>
            indexCopies(child, copy.children[index]),
        );
    };
    indexCopies(template.root, root);
    const model: ProceduralCabinetModel = {
        root,
        height: template.height,
        drawers: new Map(),
        slides: new Map(),
        highlights: new Map(),
        labels: new Map(),
        textures: [],
        materials: [...materials.values()],
    };
    drawers.forEach((drawer, index) => {
        const key = String(index);
        const group = copies.get(template.drawers.get(key)!.id) as Group;
        group.name = `drawer-${drawer.id}`;
        group.userData.drawerId = drawer.id;
        model.drawers.set(drawer.id, group);
        const slide = copies.get(template.slides.get(key)!.id) as Group;
        slide.name = `telescoping-slide-${drawer.id}`;
        model.slides.set(drawer.id, slide);
        model.highlights.set(
            drawer.id,
            copies.get(template.highlights.get(key)!.id) as Group,
        );
        const label = template.labels.get(key)!;
        model.labels.set(drawer.id, copies.get(label.id) as typeof label);
    });
    cabinetInstances.set(model, shared);
    return model;
}

export function releaseProceduralCabinet(model: ProceduralCabinetModel) {
    const shared = cabinetInstances.get(model);
    if (!shared) return;
    cabinetInstances.delete(model);
    model.materials.forEach((material) => material.dispose());
    shared.users--;
    // A Strict Mode effect remount can acquire the same template before this microtask runs.
    queueMicrotask(() => {
        if (
            shared.users !== 0 ||
            cabinetTemplates.get(shared.template.drawers.size) !== shared
        )
            return;
        cabinetTemplates.delete(shared.template.drawers.size);
        disposeProceduralCabinet(shared.template);
    });
}

/** Batch opaque parts within each rigid assembly; drawer pivots and labels stay independent. */
export function batchProceduralCabinet(model: ProceduralCabinetModel) {
    if (model.root.userData.renderBatched) return model;
    const originals = new Set<BufferGeometry>();
    model.root.traverse((object) => {
        if (object instanceof Mesh) originals.add(object.geometry);
    });
    model.root.updateWorldMatrix(true, true);
    const highlights = new Set(model.highlights.values());
    const assemblies = [
        model.root,
        ...model.drawers.values(),
        ...model.slides.values(),
    ];

    for (const assembly of assemblies) {
        if (!assembly.visible) continue;
        const buckets = new Map<string, Mesh[]>();
        const collect = (group: Group) => {
            for (const child of group.children) {
                if (!child.visible || highlights.has(child as Group)) continue;
                if (child instanceof Mesh) {
                    if (
                        Array.isArray(child.material) ||
                        child.material.transparent
                    )
                        continue;
                    const key = `${child.material.id}:${child.castShadow}:${child.receiveShadow}:${child.renderOrder}:${child.layers.mask}`;
                    const bucket = buckets.get(key) ?? [];
                    bucket.push(child);
                    buckets.set(key, bucket);
                } else if (assembly !== model.root) {
                    collect(child as Group);
                }
            }
        };
        collect(assembly);
        const inverse = new Matrix4().copy(assembly.matrixWorld).invert();
        for (const parts of buckets.values()) {
            if (parts.length < 2) continue;
            const transformed = parts.map((part) => {
                const geometry = part.geometry.index
                    ? part.geometry.toNonIndexed()
                    : part.geometry.clone();
                return geometry.applyMatrix4(
                    new Matrix4().multiplyMatrices(inverse, part.matrixWorld),
                );
            });
            const geometry = mergeGeometries(transformed, false);
            transformed.forEach((part) => part.dispose());
            if (!geometry) continue;
            const first = parts[0];
            const batch = new Mesh(geometry, first.material);
            batch.name = 'cabinet-rigid-batch';
            batch.castShadow = first.castShadow;
            batch.receiveShadow = first.receiveShadow;
            batch.renderOrder = first.renderOrder;
            batch.layers.mask = first.layers.mask;
            assembly.add(batch);
            parts.forEach((part) => part.removeFromParent());
        }
    }
    const retained = new Set<BufferGeometry>();
    model.root.traverse((object) => {
        if (object instanceof Mesh) retained.add(object.geometry);
    });
    originals.forEach((geometry) => {
        if (!retained.has(geometry)) geometry.dispose();
    });
    model.root.userData.renderBatched = true;
    return model;
}
