export const CABINET_COLORS = [
    {
        value: 'steel_grey',
        label: 'Steel grey',
        paint: '#acb3b7',
        front: '#b4bbbf',
    },
    {
        value: 'warm_ivory',
        label: 'Warm ivory',
        paint: '#c9bfa6',
        front: '#d8ceb7',
    },
] as const;

export type CabinetColor = (typeof CABINET_COLORS)[number]['value'];

export function cabinetColor(value?: string) {
    return (
        CABINET_COLORS.find((color) => color.value === value) ??
        CABINET_COLORS[0]
    );
}
