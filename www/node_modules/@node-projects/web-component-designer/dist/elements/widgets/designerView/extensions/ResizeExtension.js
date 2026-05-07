import { EventNames } from '../../../../enums/EventNames.js';
import { getContentBoxContentOffsets } from '../../../helper/ElementHelper.js';
import { getElementLocalToCanvasMatrix } from '../../../helper/GridHelper.js';
import { roundValue } from '../../../helper/LayoutHelper.js';
import { getElementSize } from '../../../helper/getBoxQuads.js';
import { AbstractExtension } from './AbstractExtension.js';
export function normalizeToAbsolutePosition(element, normalizeProperty) {
    switch (normalizeProperty) {
        case "left":
            let left = getComputedStyle(element).left;
            element.style.removeProperty('right');
            element.style.left = left;
            return left;
        case "top":
            let top = getComputedStyle(element).top;
            element.style.removeProperty('bottom');
            element.style.top = top;
            return top;
    }
}
//TODO: use PlacementService, size is not always width/height could also be margin etc...
//      also when elment aligned to bottom, will it later also be?
export class ResizeExtension extends AbstractExtension {
    resizeAllSelected;
    _initialSizes = null;
    _actionModeStarted;
    _initialPoint = null;
    _offsetPoint;
    _circle1;
    _circle2;
    _circle3;
    _circle4;
    _circle5;
    _circle6;
    _circle7;
    _circle8;
    _initialHandleCanvasPoint = null;
    _initialLocalToCanvasMatrix = null;
    _initialBorderBoxSize = null;
    _initialFixedResizeAnchor = null;
    constructor(extensionManager, designerCanvas, extendedItem, resizeAllSelected) {
        super(extensionManager, designerCanvas, extendedItem);
        this.resizeAllSelected = resizeAllSelected;
    }
    extend(cache, event) {
        this.refresh(cache, event);
    }
    refresh(cache, event) {
        let transformedCornerPoints = this.extendedItem.element.getBoxQuads({ box: 'border', relativeTo: this.designerCanvas.canvas })[0];
        if (!transformedCornerPoints)
            return;
        if (isNaN(transformedCornerPoints.p1.x) || isNaN(transformedCornerPoints.p1.x)) {
            this.remove();
            return;
        }
        if (this._valuesHaveChanges(this.designerCanvas.zoomFactor, transformedCornerPoints.p1.x, transformedCornerPoints.p1.y, transformedCornerPoints.p2.x, transformedCornerPoints.p2.y, transformedCornerPoints.p3.x, transformedCornerPoints.p3.y, transformedCornerPoints.p4.x, transformedCornerPoints.p4.y)) {
            this._circle1 = this._drawResizerOverlay(transformedCornerPoints.p1.x, transformedCornerPoints.p1.y, 'nw-resize', this._circle1);
            this._circle2 = this._drawResizerOverlay((transformedCornerPoints.p1.x + (transformedCornerPoints.p2.x - transformedCornerPoints.p1.x) / 2), (transformedCornerPoints.p1.y + (transformedCornerPoints.p2.y - transformedCornerPoints.p1.y) / 2), 'n-resize', this._circle2);
            this._circle3 = this._drawResizerOverlay(transformedCornerPoints.p2.x, transformedCornerPoints.p2.y, 'ne-resize', this._circle3);
            this._circle4 = this._drawResizerOverlay((transformedCornerPoints.p1.x + (transformedCornerPoints.p4.x - transformedCornerPoints.p1.x) / 2), (transformedCornerPoints.p1.y + (transformedCornerPoints.p4.y - transformedCornerPoints.p1.y) / 2), 'w-resize', this._circle4);
            this._circle5 = this._drawResizerOverlay(transformedCornerPoints.p4.x, transformedCornerPoints.p4.y, 'sw-resize', this._circle5);
            this._circle6 = this._drawResizerOverlay((transformedCornerPoints.p4.x + (transformedCornerPoints.p3.x - transformedCornerPoints.p4.x) / 2), (transformedCornerPoints.p4.y + (transformedCornerPoints.p3.y - transformedCornerPoints.p4.y) / 2), 's-resize', this._circle6);
            this._circle8 = this._drawResizerOverlay((transformedCornerPoints.p2.x + (transformedCornerPoints.p3.x - transformedCornerPoints.p2.x) / 2), (transformedCornerPoints.p2.y + (transformedCornerPoints.p3.y - transformedCornerPoints.p2.y) / 2), 'e-resize', this._circle8);
            this._circle7 = this._drawResizerOverlay(transformedCornerPoints.p3.x, transformedCornerPoints.p3.y, 'se-resize', this._circle7);
        }
    }
    _drawResizerOverlay(x, y, cursor, oldCircle) {
        let circle = this._drawCircle(x, y, this.designerCanvas.serviceContainer.options.resizerPixelSize / this.designerCanvas.zoomFactor, 'svg-primary-resizer', oldCircle);
        circle.style.strokeWidth = (1 / this.designerCanvas.zoomFactor).toString();
        if (!oldCircle) {
            circle.addEventListener(EventNames.PointerDown, event => this._pointerActionTypeResize(circle, event, cursor));
            circle.addEventListener(EventNames.PointerMove, event => this._pointerActionTypeResize(circle, event, cursor));
            circle.addEventListener(EventNames.PointerUp, event => this._pointerActionTypeResize(circle, event, cursor));
        }
        circle.style.cursor = cursor;
        return circle;
    }
    _pointerActionTypeResize(circle, event, actionMode) {
        event.stopPropagation();
        const currentPoint = this.designerCanvas.getNormalizedEventCoordinates(event);
        //TODO: calculate new position and size in the extension
        //aply the values with the position service
        //don't switch from left positioning to right and so on...
        switch (event.type) {
            case EventNames.PointerDown:
                const cx = parseFloat(circle.getAttribute('cx') ?? '0');
                const cy = parseFloat(circle.getAttribute('cy') ?? '0');
                this._offsetPoint = { x: cx - currentPoint.x, y: cy - currentPoint.y };
                event.target.setPointerCapture(event.pointerId);
                this._initialPoint = currentPoint;
                this._initialHandleCanvasPoint = new DOMPoint(cx, cy);
                this._initialLocalToCanvasMatrix = getElementLocalToCanvasMatrix(this.extendedItem);
                this._initialBorderBoxSize = getElementSize(this.extendedItem.element);
                this._initialFixedResizeAnchor = this._getFixedResizeAnchor(this.extendedItem.element.getBoxQuads({ box: 'border', relativeTo: this.designerCanvas.canvas, iframes: this.designerCanvas.iframes })[0], actionMode);
                this._initialSizes = [];
                this._actionModeStarted = actionMode;
                this._initialSizes.push(this._getInitialSize(this.extendedItem.element));
                if (this.resizeAllSelected) {
                    for (const designItem of this.designerCanvas.instanceServiceContainer.selectionService.selectedElements) {
                        this._initialSizes.push(this._getInitialSize(designItem.element));
                    }
                }
                if (this.designerCanvas.alignOnSnap)
                    this.designerCanvas.snapLines.calculateSnaplines(this.designerCanvas.instanceServiceContainer.selectionService.selectedElements);
                this.prepareResize(this.extendedItem, this._actionModeStarted);
                if (this.resizeAllSelected) {
                    for (const designItem of this.designerCanvas.instanceServiceContainer.selectionService.selectedElements) {
                        if (designItem !== this.extendedItem) {
                            this.prepareResize(designItem, this._actionModeStarted);
                        }
                    }
                }
                break;
            case EventNames.PointerMove:
                if (this._initialPoint) {
                    if (!this._initialSizes || !this._initialHandleCanvasPoint || !this._initialLocalToCanvasMatrix || !this._initialBorderBoxSize) {
                        return;
                    }
                    const containerStyle = getComputedStyle(this.extendedItem.parent.element);
                    const containerService = this.designerCanvas.serviceContainer.getLastServiceWhere('containerService', x => x.serviceForContainer(this.extendedItem.parent, containerStyle));
                    const diff = containerService.placePoint(event, this.designerCanvas, this.extendedItem.parent, this._initialPoint, { x: 0, y: 0 }, currentPoint, this.designerCanvas.instanceServiceContainer.selectionService.selectedElements);
                    const currentHandleCanvasPoint = new DOMPoint(diff.x + this._offsetPoint.x, diff.y + this._offsetPoint.y);
                    const localHandleDelta = this._getLocalHandleDelta(currentHandleCanvasPoint);
                    if (!localHandleDelta) {
                        return;
                    }
                    let deltaX = localHandleDelta.x;
                    let deltaY = localHandleDelta.y;
                    if (event.shiftKey) {
                        deltaX = deltaX < deltaY ? deltaX : deltaY;
                        deltaY = deltaX;
                    }
                    let i = 0;
                    let width = null;
                    let height = null;
                    switch (this._actionModeStarted) {
                        case 'e-resize':
                            width = (this._initialSizes[i].width + deltaX);
                            this.extendedItem.element.style.width = roundValue(this.extendedItem, width) + 'px';
                            if (this.resizeAllSelected) {
                                i++;
                                for (const designItem of this.designerCanvas.instanceServiceContainer.selectionService.selectedElements) {
                                    if (designItem !== this.extendedItem) {
                                        designItem.element.style.width = roundValue(this.extendedItem, this._initialSizes[i].width + deltaX) + 'px';
                                    }
                                }
                            }
                            break;
                        case 'se-resize':
                            width = (this._initialSizes[i].width + deltaX);
                            this.extendedItem.element.style.width = roundValue(this.extendedItem, width) + 'px';
                            height = (this._initialSizes[i].height + deltaY);
                            this.extendedItem.element.style.height = roundValue(this.extendedItem, height) + 'px';
                            if (this.resizeAllSelected) {
                                i++;
                                for (const designItem of this.designerCanvas.instanceServiceContainer.selectionService.selectedElements) {
                                    if (designItem !== this.extendedItem) {
                                        designItem.element.style.width = roundValue(this.extendedItem, this._initialSizes[i].width + deltaX) + 'px';
                                        designItem.element.style.height = roundValue(this.extendedItem, this._initialSizes[i].height + deltaY) + 'px';
                                    }
                                }
                            }
                            break;
                        case 's-resize':
                            height = (this._initialSizes[i].height + deltaY);
                            this.extendedItem.element.style.height = roundValue(this.extendedItem, height) + 'px';
                            if (this.resizeAllSelected) {
                                i++;
                                for (const designItem of this.designerCanvas.instanceServiceContainer.selectionService.selectedElements) {
                                    if (designItem !== this.extendedItem) {
                                        designItem.element.style.height = roundValue(this.extendedItem, this._initialSizes[i].height + deltaY) + 'px';
                                    }
                                }
                            }
                            break;
                        case 'sw-resize':
                            width = (this._initialSizes[i].width - deltaX);
                            this.extendedItem.element.style.width = roundValue(this.extendedItem, width) + 'px';
                            height = (this._initialSizes[i].height + deltaY);
                            this.extendedItem.element.style.height = roundValue(this.extendedItem, height) + 'px';
                            if (this.resizeAllSelected) {
                                i++;
                                for (const designItem of this.designerCanvas.instanceServiceContainer.selectionService.selectedElements) {
                                    if (designItem !== this.extendedItem) {
                                        designItem.element.style.width = roundValue(this.extendedItem, this._initialSizes[i].width - deltaX) + 'px';
                                        designItem.element.style.height = roundValue(this.extendedItem, this._initialSizes[i].height + deltaY) + 'px';
                                    }
                                }
                            }
                            break;
                        case 'w-resize':
                            width = (this._initialSizes[i].width - deltaX);
                            this.extendedItem.element.style.width = roundValue(this.extendedItem, width) + 'px';
                            if (this.resizeAllSelected) {
                                i++;
                                for (const designItem of this.designerCanvas.instanceServiceContainer.selectionService.selectedElements) {
                                    if (designItem !== this.extendedItem) {
                                        designItem.element.style.width = roundValue(this.extendedItem, this._initialSizes[i].width - deltaX) + 'px';
                                    }
                                }
                            }
                            break;
                        case 'nw-resize':
                            width = (this._initialSizes[i].width - deltaX);
                            this.extendedItem.element.style.width = roundValue(this.extendedItem, width) + 'px';
                            height = (this._initialSizes[i].height - deltaY);
                            this.extendedItem.element.style.height = roundValue(this.extendedItem, height) + 'px';
                            if (this.resizeAllSelected) {
                                i++;
                                for (const designItem of this.designerCanvas.instanceServiceContainer.selectionService.selectedElements) {
                                    if (designItem !== this.extendedItem) {
                                        designItem.element.style.width = roundValue(this.extendedItem, this._initialSizes[i].width - deltaX) + 'px';
                                        designItem.element.style.height = roundValue(this.extendedItem, this._initialSizes[i].height - deltaY) + 'px';
                                    }
                                }
                            }
                            break;
                        case 'n-resize':
                            height = (this._initialSizes[i].height - deltaY);
                            this.extendedItem.element.style.height = roundValue(this.extendedItem, height) + 'px';
                            if (this.resizeAllSelected) {
                                i++;
                                for (const designItem of this.designerCanvas.instanceServiceContainer.selectionService.selectedElements) {
                                    if (designItem !== this.extendedItem) {
                                        designItem.element.style.height = roundValue(this.extendedItem, this._initialSizes[i].height - deltaY) + 'px';
                                    }
                                }
                            }
                            break;
                        case 'ne-resize':
                            width = (this._initialSizes[i].width + deltaX);
                            this.extendedItem.element.style.width = roundValue(this.extendedItem, width) + 'px';
                            height = (this._initialSizes[i].height - deltaY);
                            this.extendedItem.element.style.height = roundValue(this.extendedItem, height) + 'px';
                            if (this.resizeAllSelected) {
                                i++;
                                for (const designItem of this.designerCanvas.instanceServiceContainer.selectionService.selectedElements) {
                                    if (designItem !== this.extendedItem) {
                                        designItem.element.style.width = roundValue(this.extendedItem, this._initialSizes[i].width + deltaX) + 'px';
                                        designItem.element.style.height = roundValue(this.extendedItem, this._initialSizes[i].height - deltaY) + 'px';
                                    }
                                }
                            }
                            break;
                    }
                    const currentBorderBoxSize = this._getCurrentBorderBoxSize(deltaX, deltaY);
                    if (!currentBorderBoxSize) {
                        return;
                    }
                    this._applyAnchorCorrection(currentBorderBoxSize);
                    const resizedElements = [this.extendedItem, this.extendedItem.parent];
                    if (this.resizeAllSelected)
                        resizedElements.push(...this.designerCanvas.instanceServiceContainer.selectionService.selectedElements);
                    this.extensionManager.refreshExtensions(resizedElements);
                    this.designerCanvas?.raiseDesignItemsChanged(resizedElements, 'resize', false);
                }
                break;
            case EventNames.PointerUp:
                event.target.releasePointerCapture(event.pointerId);
                if (!this._initialPoint) {
                    return;
                }
                let cg = this.extendedItem.openGroup((this.resizeAllSelected && this.designerCanvas.instanceServiceContainer.selectionService.selectedElements.length > 1) ? "Resize Elements" : "Resize &lt;" + this.extendedItem.name + "&gt;");
                try {
                    const element = this.extendedItem.element;
                    this.extendedItem.setStyle('width', this.extendedItem.element.style.width);
                    this.extendedItem.setStyle('height', this.extendedItem.element.style.height);
                    let left = parseFloat(normalizeToAbsolutePosition(element, 'left'));
                    let top = parseFloat(normalizeToAbsolutePosition(element, 'top'));
                    const anchorCorrection = this._getAnchorCorrectionInParent(getElementSize(this.extendedItem.element));
                    if (anchorCorrection) {
                        left += anchorCorrection.x;
                        top += anchorCorrection.y;
                        element.style.left = roundValue(this.extendedItem, left) + 'px';
                        element.style.top = roundValue(this.extendedItem, top) + 'px';
                    }
                    this.extendedItem.setStyle('left', roundValue(this.extendedItem, left) + 'px');
                    this.extendedItem.setStyle('top', roundValue(this.extendedItem, top) + 'px');
                    if (this.resizeAllSelected) {
                        for (const designItem of this.designerCanvas.instanceServiceContainer.selectionService.selectedElements) {
                            if (designItem !== this.extendedItem) {
                                designItem.setStyle('width', designItem.element.style.width);
                                designItem.setStyle('height', designItem.element.style.height);
                                designItem.setStyle('left', roundValue(this.extendedItem, parseFloat(normalizeToAbsolutePosition(designItem.element, 'left'))) + 'px');
                                designItem.setStyle('top', roundValue(this.extendedItem, parseFloat(normalizeToAbsolutePosition(designItem.element, 'top'))) + 'px');
                            }
                        }
                        this.designerCanvas?.raiseDesignItemsChanged(this.designerCanvas.instanceServiceContainer.selectionService.selectedElements, 'resize', true);
                    }
                    else {
                        this.designerCanvas?.raiseDesignItemsChanged([this.extendedItem], 'resize', true);
                    }
                    cg.commit();
                }
                catch (err) {
                    cg.abort();
                    console.error(err);
                }
                this._initialSizes = null;
                this._initialPoint = null;
                this._initialHandleCanvasPoint = null;
                this._initialLocalToCanvasMatrix = null;
                this._initialBorderBoxSize = null;
                this._initialFixedResizeAnchor = null;
                break;
        }
    }
    _getLocalHandleDelta(currentHandleCanvasPoint) {
        if (!this._initialHandleCanvasPoint || !this._initialLocalToCanvasMatrix) {
            return null;
        }
        const localToCanvasMatrix = new DOMMatrix([
            this._initialLocalToCanvasMatrix.a,
            this._initialLocalToCanvasMatrix.b,
            this._initialLocalToCanvasMatrix.c,
            this._initialLocalToCanvasMatrix.d,
            0,
            0,
        ]);
        if (!localToCanvasMatrix.is2D) {
            return null;
        }
        const canvasDelta = new DOMPoint(currentHandleCanvasPoint.x - this._initialHandleCanvasPoint.x, currentHandleCanvasPoint.y - this._initialHandleCanvasPoint.y);
        return localToCanvasMatrix.inverse().transformPoint(canvasDelta);
    }
    _getCurrentBorderBoxSize(deltaX, deltaY) {
        if (!this._initialBorderBoxSize) {
            return null;
        }
        let width = this._initialBorderBoxSize.width;
        let height = this._initialBorderBoxSize.height;
        switch (this._actionModeStarted) {
            case 'e-resize':
            case 'se-resize':
            case 'ne-resize':
                width += deltaX;
                break;
            case 'w-resize':
            case 'sw-resize':
            case 'nw-resize':
                width -= deltaX;
                break;
        }
        switch (this._actionModeStarted) {
            case 's-resize':
            case 'se-resize':
            case 'sw-resize':
                height += deltaY;
                break;
            case 'n-resize':
            case 'ne-resize':
            case 'nw-resize':
                height -= deltaY;
                break;
        }
        return { width, height };
    }
    _getInitialSize(element) {
        const size = getElementSize(element);
        let contentBoxOffset = { x: 0, y: 0 };
        if (getComputedStyle(element).boxSizing == 'content-box') {
            contentBoxOffset = getContentBoxContentOffsets(element);
        }
        return { width: size.width - contentBoxOffset.x, height: size.height - contentBoxOffset.y };
    }
    _getFixedResizeAnchor(quad, mode) {
        if (!quad) {
            return null;
        }
        switch (mode) {
            case 'e-resize':
                return new DOMPoint((quad.p1.x + quad.p4.x) / 2, (quad.p1.y + quad.p4.y) / 2);
            case 'se-resize':
                return new DOMPoint(quad.p1.x, quad.p1.y);
            case 's-resize':
                return new DOMPoint((quad.p1.x + quad.p2.x) / 2, (quad.p1.y + quad.p2.y) / 2);
            case 'sw-resize':
                return new DOMPoint(quad.p2.x, quad.p2.y);
            case 'w-resize':
                return new DOMPoint((quad.p2.x + quad.p3.x) / 2, (quad.p2.y + quad.p3.y) / 2);
            case 'nw-resize':
                return new DOMPoint(quad.p3.x, quad.p3.y);
            case 'n-resize':
                return new DOMPoint((quad.p4.x + quad.p3.x) / 2, (quad.p4.y + quad.p3.y) / 2);
            case 'ne-resize':
                return new DOMPoint(quad.p4.x, quad.p4.y);
            default:
                return null;
        }
    }
    _getFixedResizeAnchorLocal(size, mode) {
        switch (mode) {
            case 'e-resize':
                return new DOMPoint(0, size.height / 2);
            case 'se-resize':
                return new DOMPoint(0, 0);
            case 's-resize':
                return new DOMPoint(size.width / 2, 0);
            case 'sw-resize':
                return new DOMPoint(size.width, 0);
            case 'w-resize':
                return new DOMPoint(size.width, size.height / 2);
            case 'nw-resize':
                return new DOMPoint(size.width, size.height);
            case 'n-resize':
                return new DOMPoint(size.width / 2, size.height);
            case 'ne-resize':
                return new DOMPoint(0, size.height);
            default:
                return null;
        }
    }
    _getAnchorCorrectionInParent(currentBorderBoxSize) {
        if (!this._initialFixedResizeAnchor) {
            return null;
        }
        const currentAnchorLocal = this._getFixedResizeAnchorLocal(currentBorderBoxSize, this._actionModeStarted);
        if (!currentAnchorLocal) {
            return null;
        }
        const initialAnchorInParent = this.extendedItem.parent.element.convertPointFromNode(this._initialFixedResizeAnchor, this.designerCanvas.canvas, { iframes: this.designerCanvas.iframes });
        const currentAnchor = this.designerCanvas.canvas.convertPointFromNode(currentAnchorLocal, this.extendedItem.element, { iframes: this.designerCanvas.iframes });
        const currentAnchorInParent = this.extendedItem.parent.element.convertPointFromNode(currentAnchor, this.designerCanvas.canvas, { iframes: this.designerCanvas.iframes });
        return {
            x: initialAnchorInParent.x - currentAnchorInParent.x,
            y: initialAnchorInParent.y - currentAnchorInParent.y
        };
    }
    _applyAnchorCorrection(currentBorderBoxSize) {
        const anchorCorrection = this._getAnchorCorrectionInParent(currentBorderBoxSize);
        if (!anchorCorrection) {
            return;
        }
        const element = this.extendedItem.element;
        const left = parseFloat(normalizeToAbsolutePosition(element, 'left')) + anchorCorrection.x;
        const top = parseFloat(normalizeToAbsolutePosition(element, 'top')) + anchorCorrection.y;
        element.style.left = roundValue(this.extendedItem, left) + 'px';
        element.style.top = roundValue(this.extendedItem, top) + 'px';
    }
    prepareResize(designItem, mode) {
        let top = null;
        let bottom = null;
        let left = null;
        let right = null;
        switch (this._actionModeStarted) {
            case 'e-resize':
                left = getComputedStyle(designItem.element).left;
                designItem.element.style.removeProperty('right');
                designItem.element.style.left = left;
                //(<HTMLElement>designItem.element).style.transformOrigin = this._initialComputedTransformOrigins[i].x + 'px ' + this._initialComputedTransformOrigins[i].y + 'px';
                break;
            case 'se-resize':
                top = getComputedStyle(designItem.element).top;
                designItem.element.style.removeProperty('bottom');
                designItem.element.style.top = top;
                left = getComputedStyle(designItem.element).left;
                designItem.element.style.removeProperty('right');
                designItem.element.style.left = left;
                //(<HTMLElement>designItem.element).style.transformOrigin = this._initialComputedTransformOrigins[i].x + 'px ' + this._initialComputedTransformOrigins[i].y + 'px';
                break;
            case 's-resize':
                top = getComputedStyle(designItem.element).top;
                designItem.element.style.removeProperty('bottom');
                designItem.element.style.top = top;
                //(<HTMLElement>designItem.element).style.transformOrigin = this._initialComputedTransformOrigins[i].x + 'px ' + this._initialComputedTransformOrigins[i].y + 'px';
                break;
            case 'sw-resize':
                top = getComputedStyle(designItem.element).top;
                designItem.element.style.removeProperty('bottom');
                designItem.element.style.top = top;
                right = getComputedStyle(designItem.element).right;
                designItem.element.style.removeProperty('left');
                designItem.element.style.right = right;
                //(<HTMLElement>designItem.element).style.transformOrigin = 'calc(100% - ' + this._initialComputedTransformOrigins[i].x + 'px) ' + this._initialComputedTransformOrigins[i].y + 'px';
                break;
            case 'w-resize':
                right = getComputedStyle(designItem.element).right;
                designItem.element.style.removeProperty('left');
                designItem.element.style.right = right;
                //(<HTMLElement>designItem.element).style.transformOrigin = 'calc(100% - ' + this._initialComputedTransformOrigins[i].x + 'px) ' + this._initialComputedTransformOrigins[i].y + 'px';
                break;
            case 'nw-resize':
                bottom = getComputedStyle(designItem.element).bottom;
                designItem.element.style.removeProperty('top');
                designItem.element.style.bottom = bottom;
                right = getComputedStyle(designItem.element).right;
                designItem.element.style.removeProperty('left');
                designItem.element.style.right = right;
                //(<HTMLElement>designItem.element).style.transformOrigin = 'calc(100% - ' + this._initialComputedTransformOrigins[i].x + 'px) ' + 'calc(100% - ' + this._initialComputedTransformOrigins[i].y + 'px)';
                break;
            case 'n-resize':
                bottom = getComputedStyle(designItem.element).bottom;
                designItem.element.style.removeProperty('top');
                designItem.element.style.bottom = bottom;
                //(<HTMLElement>designItem.element).style.transformOrigin = 'calc(100% - ' + this._initialComputedTransformOrigins[i].x + 'px) ' + 'calc(100% - ' + this._initialComputedTransformOrigins[i].y + 'px)';
                break;
            case 'ne-resize':
                bottom = getComputedStyle(designItem.element).bottom;
                designItem.element.style.removeProperty('top');
                designItem.element.style.bottom = bottom;
                left = getComputedStyle(designItem.element).left;
                designItem.element.style.removeProperty('right');
                designItem.element.style.left = left;
                //(<HTMLElement>designItem.element).style.transformOrigin = this._initialComputedTransformOrigins[i].x + 'px ' + 'calc(100% - ' + this._initialComputedTransformOrigins[i].y + 'px)';
                break;
        }
    }
    dispose() {
        this._removeAllOverlays();
    }
}
//# sourceMappingURL=ResizeExtension.js.map