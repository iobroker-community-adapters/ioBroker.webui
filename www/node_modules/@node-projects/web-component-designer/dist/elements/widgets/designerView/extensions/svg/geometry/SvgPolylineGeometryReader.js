import { SegmentType } from './IGeometry.js';
export class SvgPolylineGeometryReader {
    read(element) {
        const poly = element;
        const points = poly.points;
        const segments = [];
        for (let i = 0; i < points.numberOfItems; i++) {
            const pt = points.getItem(i);
            if (i === 0) {
                segments.push({ type: SegmentType.Move, relative: false, point: { x: pt.x, y: pt.y } });
            }
            else {
                segments.push({ type: SegmentType.Line, relative: false, point: { x: pt.x, y: pt.y } });
            }
        }
        return { segments, closed: false };
    }
    serialize(geometry) {
        const pts = geometry.segments.filter(s => s.type !== SegmentType.Close);
        const pointsStr = pts.map(s => `${s.point.x},${s.point.y}`).join(' ');
        return [{ attribute: 'points', value: pointsStr }];
    }
}
//# sourceMappingURL=SvgPolylineGeometryReader.js.map