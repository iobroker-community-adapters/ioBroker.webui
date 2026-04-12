/**
 * Segment types supported by the geometry model.
 */
export var SegmentType;
(function (SegmentType) {
    SegmentType["Move"] = "M";
    SegmentType["Line"] = "L";
    SegmentType["CubicBezier"] = "C";
    SegmentType["QuadraticBezier"] = "Q";
    SegmentType["Arc"] = "A";
    SegmentType["Close"] = "Z";
    SegmentType["HorizontalLine"] = "H";
    SegmentType["VerticalLine"] = "V";
    SegmentType["SmoothCubic"] = "S";
    SegmentType["SmoothQuadratic"] = "T";
})(SegmentType || (SegmentType = {}));
//# sourceMappingURL=IGeometry.js.map