import { useThree } from '@react-three/fiber';
import { useEffect, useMemo } from 'react';
import { Group, InstancedMesh, Matrix4, Mesh } from 'three';
import type { DrawerItemSlot } from '../cabinets/procedural-drawer-layout';
import type { CabinetFilingItem } from '@/types/filing';
import {
    createClosedLeverArchFile,
    createLeverArchLabel,
    disposeLeverArchFile,
} from './lever-arch-model';

export default function LeverArchDrawerContents({
    slots,
    hoveredId,
    openedItemId,
    lift,
    onHover,
    onOpenItem,
}: {
    slots: DrawerItemSlot[];
    hoveredId: string | null;
    openedItemId: string | null;
    lift: number;
    onHover: (id: string | null) => void;
    onOpenItem: (item: CabinetFilingItem) => void;
}) {
    const { gl, invalidate } = useThree();
    const model = useMemo(() => {
        const prototype = createClosedLeverArchFile(),
            root = new Group();
        root.name = 'lever-arch-drawer-contents';
        const meshes = prototype.children.filter(
            (o): o is Mesh => o instanceof Mesh,
        );
        const batches = meshes.map((p) => {
            const mesh = new InstancedMesh(
                p.geometry,
                p.material,
                slots.length,
            );
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            root.add(mesh);
            return mesh;
        });
        const labels = slots.map((slot) => {
            const label = createLeverArchLabel(
                slot.item.label,
                slot.item.coverTitle,
                true,
            );
            label.raycast = () => undefined;
            const holder = new Group();
            holder.add(label);
            root.add(holder);
            return holder;
        });
        return { prototype, root, batches, labels };
    }, [slots]);
    useEffect(
        () => () => {
            // Instances share the prototype's resources; dispose them once through the rendered root.
            disposeLeverArchFile(model.root);
            model.batches.forEach((mesh) => mesh.dispose());
        },
        [model],
    );
    useEffect(() => {
        slots.forEach((slot, index) => {
            const holder = model.labels[index];
            holder.position.set(
                slot.x,
                slot.y + (hoveredId === slot.item.id ? lift : 0),
                slot.frontZ - slot.depth / 2,
            );
            holder.rotation.set(0, Math.PI / 2, -Math.PI / 2);
            holder.scale.setScalar(
                slot.item.id === openedItemId ? 0 : slot.width / 0.075,
            );
            holder.updateMatrix();
            model.batches.forEach((mesh) =>
                mesh.setMatrixAt(index, new Matrix4().copy(holder.matrix)),
            );
        });
        model.batches.forEach((mesh) => {
            mesh.instanceMatrix.needsUpdate = true;
            mesh.computeBoundingSphere();
        });
        gl.shadowMap.needsUpdate = true;
        invalidate();
    }, [model, slots, hoveredId, openedItemId, lift, gl, invalidate]);
    return (
        <primitive
            object={model.root}
            dispose={null}
            onPointerOver={(e: {
                instanceId?: number;
                stopPropagation: () => void;
            }) => {
                e.stopPropagation();
                if (e.instanceId !== undefined) {
                    gl.domElement.style.cursor = 'pointer';
                    onHover(slots[e.instanceId].item.id);
                }
            }}
            onPointerOut={() => {
                gl.domElement.style.cursor = '';
                onHover(null);
            }}
            onClick={(e: {
                instanceId?: number;
                stopPropagation: () => void;
            }) => {
                e.stopPropagation();
                if (e.instanceId !== undefined)
                    onOpenItem(slots[e.instanceId].item);
            }}
        />
    );
}
