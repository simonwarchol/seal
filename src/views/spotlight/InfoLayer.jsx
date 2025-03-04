import { OrthographicView, COORDINATE_SYSTEM, Layer, project32, picking, CompositeLayer } from '@deck.gl/core';
import {
    deck,
    viv,
    getSelectionLayer,
    ScaledExpressionExtension,
    GLSL_COLORMAPS,
    DEFAULT_GL_OPTIONS,
    SELECTION_TYPE,
} from "@vitessce/gl";

import { LineLayer } from '@deck.gl/layers';
import { DEFAULT_FONT_FAMILY } from "@vivjs/constants";

import { makeBoundingBox } from "@vivjs/layers";

const TARGETS = [1, 2, 3, 4, 5, 10, 20, 25, 50, 100, 200, 250, 500, 1e3];
const MIN_TARGET = TARGETS[0];
const MAX_TARGET = TARGETS[TARGETS.length - 1];
const defaultProps = {
    pickable: { type: "boolean", value: true, compare: true },
    viewState: {
        type: "object",
        value: { zoom: 0, target: [0, 0, 0] },
        compare: true
    },
    unit: { type: "string", value: "", compare: true },
    size: { type: "number", value: 1, compare: true },
    position: { type: "string", value: "bottom-left", compare: true },
    length: { type: "number", value: 0.085, compare: true },
    snap: { type: "boolean", value: false, compare: true }
};



function getPosition(boundingBox, position, length) {
    const viewWidth = boundingBox[2][0] - boundingBox[0][0];
    const viewHeight = boundingBox[2][1] - boundingBox[0][1];
    const yCoord = boundingBox[0][1] + viewHeight * length;
      const xLeftCoord = boundingBox[2][0] - viewWidth * length;
    // Bottom Right
    // const yCoord = boundingBox[2][1] - viewHeight * length;
    // const xLeftCoord = boundingBox[2][0] - viewWidth * length;
    // Bottom Left
    // const yCoord = boundingBox[2][1] - viewHeight * length;
    // const xLeftCoord = boundingBox[0][0] + viewWidth * length;
    return [yCoord, xLeftCoord];

}

const SI_PREFIXES = [
    { symbol: "Y", exponent: 24 },
    { symbol: "Z", exponent: 21 },
    { symbol: "E", exponent: 18 },
    { symbol: "P", exponent: 15 },
    { symbol: "T", exponent: 12 },
    { symbol: "G", exponent: 9 },
    { symbol: "M", exponent: 6 },
    { symbol: "k", exponent: 3 },
    { symbol: "h", exponent: 2 },
    { symbol: "da", exponent: 1 },
    { symbol: "", exponent: 0 },
    { symbol: "d", exponent: -1 },
    { symbol: "c", exponent: -2 },
    { symbol: "m", exponent: -3 },
    { symbol: "\xB5", exponent: -6 },
    { symbol: "n", exponent: -9 },
    { symbol: "p", exponent: -12 },
    { symbol: "f", exponent: -15 },
    { symbol: "a", exponent: -18 },
    { symbol: "z", exponent: -21 },
    { symbol: "y", exponent: -24 }
];

function sizeToMeters(size, unit) {
    if (!unit || unit === "m") {
        return size;
    }
    if (unit.length > 1) {
        let unitPrefix = unit.substring(0, unit.length - 1);
        if (unitPrefix === "u") {
            unitPrefix = "\xB5";
        }
        const unitObj = SI_PREFIXES.find((p) => p.symbol === unitPrefix);
        if (unitObj) {
            return size * 10 ** unitObj.exponent;
        }
    }
    throw new Error("Received unknown unit");
}

function snapValue(value) {
    let magnitude = 0;
    if (value < MIN_TARGET || value > MAX_TARGET) {
        magnitude = Math.floor(Math.log10(value));
    }
    let snappedUnit = SI_PREFIXES.find(
        (p) => p.exponent % 3 === 0 && p.exponent <= magnitude
    );
    let adjustedValue = value / 10 ** snappedUnit.exponent;
    if (adjustedValue > 500 && adjustedValue <= 1e3) {
        snappedUnit = SI_PREFIXES.find(
            (p) => p.exponent % 3 === 0 && p.exponent <= magnitude + 3
        );
        adjustedValue = value / 10 ** snappedUnit.exponent;
    }
    const targetNewUnits = TARGETS.find((t) => t > adjustedValue);
    const targetOrigUnits = targetNewUnits * 10 ** snappedUnit.exponent;
    return [targetOrigUnits, targetNewUnits, snappedUnit.symbol];
}

function range(len) {
    return [...Array(len).keys()];
}
export const InfoLayer = class extends viv.ScaleBarLayer {
    constructor(props) {
        super(props);
        this.channelNames = props?.channelNames;
        this.channelColors = props?.channelColors;
    }
    renderLayers() {
        // return super.renderLayers();
        const { id, position, viewState, length, channelNames, channelColors } = this.props;
        const boundingBox = makeBoundingBox(viewState);
        const { zoom } = viewState;
        const viewLength = boundingBox[2][0] - boundingBox[0][0];
        const barLength = viewLength * 0.05;
        const barHeight = Math.max(
            2 ** (-zoom + 1.5),
            (boundingBox[2][1] - boundingBox[0][1]) * 7e-3
        );
        const [yCoord, xLeftCoord] = getPosition(boundingBox, position, length);

        const textLayers = (channelNames || []).map((channelName, index) => {
            // Repalce "Autofluorescence-" with "AF-" and "Control-" with "Cont-" in channelName
            const text = channelName.replace("Autofluorescence-", "AF-").replace("Control-", "Cont-");
            const textColor = channelColors?.[index] || [255, 255, 255];
            return {
                text: `${text.substring(0, 8)}`,
                position: [
                    xLeftCoord + barLength/2,
                    yCoord + ((-1+index) * barHeight * 4)
                ],
                color: textColor,
            };
        });

        try {
            const textLayer = new deck.TextLayer({
                id: `info-layer-${id}`,
                coordinateSystem: COORDINATE_SYSTEM.CARTESIAN,
                data: textLayers,
                getColor: d => d.color,
                getSize: 12,
                fontFamily: DEFAULT_FONT_FAMILY,
                sizeUnits: "meters",
                sizeScale: 2 ** -zoom,
            });
            return [textLayer];
        } catch (error) {
            console.error("Error creating text layer", error);
            return [];
        }
    };
}
InfoLayer.defaultProps = defaultProps;
InfoLayer.layerName = "InfoLayer";

