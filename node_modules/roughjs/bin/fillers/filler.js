import { HachureFiller } from './hachure-filler.js';
import { ZigZagFiller } from './zigzag-filler.js';
import { HatchFiller } from './hatch-filler.js';
import { DotFiller } from './dot-filler.js';
import { DashedFiller } from './dashed-filler.js';
import { ZigZagLineFiller } from './zigzag-line-filler.js';
const fillers = {};
export function getFiller(o, helper) {
    let fillerName = o.fillStyle || 'hachure';
    if (!fillers[fillerName]) {
        switch (fillerName) {
            case 'zigzag':
                if (!fillers[fillerName]) {
                    fillers[fillerName] = new ZigZagFiller(helper);
                }
                break;
            case 'cross-hatch':
                if (!fillers[fillerName]) {
                    fillers[fillerName] = new HatchFiller(helper);
                }
                break;
            case 'dots':
                if (!fillers[fillerName]) {
                    fillers[fillerName] = new DotFiller(helper);
                }
                break;
            case 'dashed':
                if (!fillers[fillerName]) {
                    fillers[fillerName] = new DashedFiller(helper);
                }
                break;
            case 'zigzag-line':
                if (!fillers[fillerName]) {
                    fillers[fillerName] = new ZigZagLineFiller(helper);
                }
                break;
            case 'hachure':
            default:
                fillerName = 'hachure';
                if (!fillers[fillerName]) {
                    fillers[fillerName] = new HachureFiller(helper);
                }
                break;
        }
    }
    return fillers[fillerName];
}
