import {
  BitmaskLayer,
} from "@vitessce/gl";
import { project32, picking } from '@deck.gl/core'; // eslint-disable-line import/no-extraneous-dependencies

const GLSL_COLORMAPS = [
  'plasma',
  'viridis',
  'jet',
];
function padWithDefault(arr, defaultValue, padWidth) {
  const newArr = [...arr];
  for (let i = 0; i < padWidth; i += 1) {
    newArr.push(defaultValue);
  }
  return newArr;
}

const GLSL_COLORMAP_DEFAULT = 'plasma';
const COLORMAP_SHADER_PLACEHOLDER = 'COLORMAP_FUNC';

const colormaps = `#define GLSLIFY 1
vec4 plasma (float x_4) {
  const float e0 = 0.0;
  const vec4 v0 = vec4(0.050980392156862744,0.03137254901960784,0.5294117647058824,1);
  const float e1 = 0.13;
  const vec4 v1 = vec4(0.29411764705882354,0.011764705882352941,0.6313725490196078,1);
  const float e2 = 0.25;
  const vec4 v2 = vec4(0.49019607843137253,0.011764705882352941,0.6588235294117647,1);
  const float e3 = 0.38;
  const vec4 v3 = vec4(0.6588235294117647,0.13333333333333333,0.5882352941176471,1);
  const float e4 = 0.5;
  const vec4 v4 = vec4(0.796078431372549,0.27450980392156865,0.4745098039215686,1);
  const float e5 = 0.63;
  const vec4 v5 = vec4(0.8980392156862745,0.4196078431372549,0.36470588235294116,1);
  const float e6 = 0.75;
  const vec4 v6 = vec4(0.9725490196078431,0.5803921568627451,0.2549019607843137,1);
  const float e7 = 0.88;
  const vec4 v7 = vec4(0.9921568627450981,0.7647058823529411,0.1568627450980392,1);
  const float e8 = 1.0;
  const vec4 v8 = vec4(0.9411764705882353,0.9764705882352941,0.12941176470588237,1);
  float a0 = smoothstep(e0,e1,x_4);
  float a1 = smoothstep(e1,e2,x_4);
  float a2 = smoothstep(e2,e3,x_4);
  float a3 = smoothstep(e3,e4,x_4);
  float a4 = smoothstep(e4,e5,x_4);
  float a5 = smoothstep(e5,e6,x_4);
  float a6 = smoothstep(e6,e7,x_4);
  float a7 = smoothstep(e7,e8,x_4);
  return max(mix(v0,v1,a0)*step(e0,x_4)*step(x_4,e1),
    max(mix(v1,v2,a1)*step(e1,x_4)*step(x_4,e2),
    max(mix(v2,v3,a2)*step(e2,x_4)*step(x_4,e3),
    max(mix(v3,v4,a3)*step(e3,x_4)*step(x_4,e4),
    max(mix(v4,v5,a4)*step(e4,x_4)*step(x_4,e5),
    max(mix(v5,v6,a5)*step(e5,x_4)*step(x_4,e6),
    max(mix(v6,v7,a6)*step(e6,x_4)*step(x_4,e7),mix(v7,v8,a7)*step(e7,x_4)*step(x_4,e8)
  )))))));
}

vec4 viridis (float x_1) {
  const float e0 = 0.0;
  const vec4 v0 = vec4(0.26666666666666666,0.00392156862745098,0.32941176470588235,1);
  const float e1 = 0.13;
  const vec4 v1 = vec4(0.2784313725490196,0.17254901960784313,0.47843137254901963,1);
  const float e2 = 0.25;
  const vec4 v2 = vec4(0.23137254901960785,0.3176470588235294,0.5450980392156862,1);
  const float e3 = 0.38;
  const vec4 v3 = vec4(0.17254901960784313,0.44313725490196076,0.5568627450980392,1);
  const float e4 = 0.5;
  const vec4 v4 = vec4(0.12941176470588237,0.5647058823529412,0.5529411764705883,1);
  const float e5 = 0.63;
  const vec4 v5 = vec4(0.15294117647058825,0.6784313725490196,0.5058823529411764,1);
  const float e6 = 0.75;
  const vec4 v6 = vec4(0.3607843137254902,0.7843137254901961,0.38823529411764707,1);
  const float e7 = 0.88;
  const vec4 v7 = vec4(0.6666666666666666,0.8627450980392157,0.19607843137254902,1);
  const float e8 = 1.0;
  const vec4 v8 = vec4(0.9921568627450981,0.9058823529411765,0.1450980392156863,1);
  float a0 = smoothstep(e0,e1,x_1);
  float a1 = smoothstep(e1,e2,x_1);
  float a2 = smoothstep(e2,e3,x_1);
  float a3 = smoothstep(e3,e4,x_1);
  float a4 = smoothstep(e4,e5,x_1);
  float a5 = smoothstep(e5,e6,x_1);
  float a6 = smoothstep(e6,e7,x_1);
  float a7 = smoothstep(e7,e8,x_1);
  return max(mix(v0,v1,a0)*step(e0,x_1)*step(x_1,e1),
    max(mix(v1,v2,a1)*step(e1,x_1)*step(x_1,e2),
    max(mix(v2,v3,a2)*step(e2,x_1)*step(x_1,e3),
    max(mix(v3,v4,a3)*step(e3,x_1)*step(x_1,e4),
    max(mix(v4,v5,a4)*step(e4,x_1)*step(x_1,e5),
    max(mix(v5,v6,a5)*step(e5,x_1)*step(x_1,e6),
    max(mix(v6,v7,a6)*step(e6,x_1)*step(x_1,e7),mix(v7,v8,a7)*step(e7,x_1)*step(x_1,e8)
  )))))));
}

vec4 greys (float x_10) {
  const float e0 = 0.0;
  const vec4 v0 = vec4(0,0,0,1);
  const float e1 = 1.0;
  const vec4 v1 = vec4(1,1,1,1);
  float a0 = smoothstep(e0,e1,x_10);
  return mix(v0,v1,a0)*step(e0,x_10)*step(x_10,e1);
}

vec4 magma (float x_7) {
  const float e0 = 0.0;
  const vec4 v0 = vec4(0,0,0.01568627450980392,1);
  const float e1 = 0.13;
  const vec4 v1 = vec4(0.10980392156862745,0.06274509803921569,0.26666666666666666,1);
  const float e2 = 0.25;
  const vec4 v2 = vec4(0.30980392156862746,0.07058823529411765,0.4823529411764706,1);
  const float e3 = 0.38;
  const vec4 v3 = vec4(0.5058823529411764,0.1450980392156863,0.5058823529411764,1);
  const float e4 = 0.5;
  const vec4 v4 = vec4(0.7098039215686275,0.21176470588235294,0.47843137254901963,1);
  const float e5 = 0.63;
  const vec4 v5 = vec4(0.8980392156862745,0.3137254901960784,0.39215686274509803,1);
  const float e6 = 0.75;
  const vec4 v6 = vec4(0.984313725490196,0.5294117647058824,0.3803921568627451,1);
  const float e7 = 0.88;
  const vec4 v7 = vec4(0.996078431372549,0.7607843137254902,0.5294117647058824,1);
  const float e8 = 1.0;
  const vec4 v8 = vec4(0.9882352941176471,0.9921568627450981,0.7490196078431373,1);
  float a0 = smoothstep(e0,e1,x_7);
  float a1 = smoothstep(e1,e2,x_7);
  float a2 = smoothstep(e2,e3,x_7);
  float a3 = smoothstep(e3,e4,x_7);
  float a4 = smoothstep(e4,e5,x_7);
  float a5 = smoothstep(e5,e6,x_7);
  float a6 = smoothstep(e6,e7,x_7);
  float a7 = smoothstep(e7,e8,x_7);
  return max(mix(v0,v1,a0)*step(e0,x_7)*step(x_7,e1),
    max(mix(v1,v2,a1)*step(e1,x_7)*step(x_7,e2),
    max(mix(v2,v3,a2)*step(e2,x_7)*step(x_7,e3),
    max(mix(v3,v4,a3)*step(e3,x_7)*step(x_7,e4),
    max(mix(v4,v5,a4)*step(e4,x_7)*step(x_7,e5),
    max(mix(v5,v6,a5)*step(e5,x_7)*step(x_7,e6),
    max(mix(v6,v7,a6)*step(e6,x_7)*step(x_7,e7),mix(v7,v8,a7)*step(e7,x_7)*step(x_7,e8)
  )))))));
}

vec4 jet (float x_8) {
  const float e0 = 0.0;
  const vec4 v0 = vec4(0,0,0.5137254901960784,1);
  const float e1 = 0.125;
  const vec4 v1 = vec4(0,0.23529411764705882,0.6666666666666666,1);
  const float e2 = 0.375;
  const vec4 v2 = vec4(0.0196078431372549,1,1,1);
  const float e3 = 0.625;
  const vec4 v3 = vec4(1,1,0,1);
  const float e4 = 0.875;
  const vec4 v4 = vec4(0.9803921568627451,0,0,1);
  const float e5 = 1.0;
  const vec4 v5 = vec4(0.5019607843137255,0,0,1);
  float a0 = smoothstep(e0,e1,x_8);
  float a1 = smoothstep(e1,e2,x_8);
  float a2 = smoothstep(e2,e3,x_8);
  float a3 = smoothstep(e3,e4,x_8);
  float a4 = smoothstep(e4,e5,x_8);
  return max(mix(v0,v1,a0)*step(e0,x_8)*step(x_8,e1),
    max(mix(v1,v2,a1)*step(e1,x_8)*step(x_8,e2),
    max(mix(v2,v3,a2)*step(e2,x_8)*step(x_8,e3),
    max(mix(v3,v4,a3)*step(e3,x_8)*step(x_8,e4),mix(v4,v5,a4)*step(e4,x_8)*step(x_8,e5)
  ))));
}

vec4 bone (float x_11) {
  const float e0 = 0.0;
  const vec4 v0 = vec4(0,0,0,1);
  const float e1 = 0.376;
  const vec4 v1 = vec4(0.32941176470588235,0.32941176470588235,0.4549019607843137,1);
  const float e2 = 0.753;
  const vec4 v2 = vec4(0.6627450980392157,0.7843137254901961,0.7843137254901961,1);
  const float e3 = 1.0;
  const vec4 v3 = vec4(1,1,1,1);
  float a0 = smoothstep(e0,e1,x_11);
  float a1 = smoothstep(e1,e2,x_11);
  float a2 = smoothstep(e2,e3,x_11);
  return max(mix(v0,v1,a0)*step(e0,x_11)*step(x_11,e1),
    max(mix(v1,v2,a1)*step(e1,x_11)*step(x_11,e2),mix(v2,v3,a2)*step(e2,x_11)*step(x_11,e3)
  ));
}

vec4 copper (float x_6) {
  const float e0 = 0.0;
  const vec4 v0 = vec4(0,0,0,1);
  const float e1 = 0.804;
  const vec4 v1 = vec4(1,0.6274509803921569,0.4,1);
  const float e2 = 1.0;
  const vec4 v2 = vec4(1,0.7803921568627451,0.4980392156862745,1);
  float a0 = smoothstep(e0,e1,x_6);
  float a1 = smoothstep(e1,e2,x_6);
  return max(mix(v0,v1,a0)*step(e0,x_6)*step(x_6,e1),mix(v1,v2,a1)*step(e1,x_6)*step(x_6,e2)
  );
}

vec4 density (float x_5) {
  const float e0 = 0.0;
  const vec4 v0 = vec4(0.21176470588235294,0.054901960784313725,0.1411764705882353,1);
  const float e1 = 0.13;
  const vec4 v1 = vec4(0.34901960784313724,0.09019607843137255,0.3137254901960784,1);
  const float e2 = 0.25;
  const vec4 v2 = vec4(0.43137254901960786,0.17647058823529413,0.5176470588235295,1);
  const float e3 = 0.38;
  const vec4 v3 = vec4(0.47058823529411764,0.30196078431372547,0.6980392156862745,1);
  const float e4 = 0.5;
  const vec4 v4 = vec4(0.47058823529411764,0.44313725490196076,0.8352941176470589,1);
  const float e5 = 0.63;
  const vec4 v5 = vec4(0.45098039215686275,0.592156862745098,0.8941176470588236,1);
  const float e6 = 0.75;
  const vec4 v6 = vec4(0.5254901960784314,0.7254901960784313,0.8901960784313725,1);
  const float e7 = 0.88;
  const vec4 v7 = vec4(0.6941176470588235,0.8392156862745098,0.8901960784313725,1);
  const float e8 = 1.0;
  const vec4 v8 = vec4(0.9019607843137255,0.9450980392156862,0.9450980392156862,1);
  float a0 = smoothstep(e0,e1,x_5);
  float a1 = smoothstep(e1,e2,x_5);
  float a2 = smoothstep(e2,e3,x_5);
  float a3 = smoothstep(e3,e4,x_5);
  float a4 = smoothstep(e4,e5,x_5);
  float a5 = smoothstep(e5,e6,x_5);
  float a6 = smoothstep(e6,e7,x_5);
  float a7 = smoothstep(e7,e8,x_5);
  return max(mix(v0,v1,a0)*step(e0,x_5)*step(x_5,e1),
    max(mix(v1,v2,a1)*step(e1,x_5)*step(x_5,e2),
    max(mix(v2,v3,a2)*step(e2,x_5)*step(x_5,e3),
    max(mix(v3,v4,a3)*step(e3,x_5)*step(x_5,e4),
    max(mix(v4,v5,a4)*step(e4,x_5)*step(x_5,e5),
    max(mix(v5,v6,a5)*step(e5,x_5)*step(x_5,e6),
    max(mix(v6,v7,a6)*step(e6,x_5)*step(x_5,e7),mix(v7,v8,a7)*step(e7,x_5)*step(x_5,e8)
  )))))));
}

vec4 inferno (float x_3) {
  const float e0 = 0.0;
  const vec4 v0 = vec4(0,0,0.01568627450980392,1);
  const float e1 = 0.13;
  const vec4 v1 = vec4(0.12156862745098039,0.047058823529411764,0.2823529411764706,1);
  const float e2 = 0.25;
  const vec4 v2 = vec4(0.3333333333333333,0.058823529411764705,0.42745098039215684,1);
  const float e3 = 0.38;
  const vec4 v3 = vec4(0.5333333333333333,0.13333333333333333,0.41568627450980394,1);
  const float e4 = 0.5;
  const vec4 v4 = vec4(0.7294117647058823,0.21176470588235294,0.3333333333333333,1);
  const float e5 = 0.63;
  const vec4 v5 = vec4(0.8901960784313725,0.34901960784313724,0.2,1);
  const float e6 = 0.75;
  const vec4 v6 = vec4(0.9764705882352941,0.5490196078431373,0.0392156862745098,1);
  const float e7 = 0.88;
  const vec4 v7 = vec4(0.9764705882352941,0.788235294117647,0.19607843137254902,1);
  const float e8 = 1.0;
  const vec4 v8 = vec4(0.9882352941176471,1,0.6431372549019608,1);
  float a0 = smoothstep(e0,e1,x_3);
  float a1 = smoothstep(e1,e2,x_3);
  float a2 = smoothstep(e2,e3,x_3);
  float a3 = smoothstep(e3,e4,x_3);
  float a4 = smoothstep(e4,e5,x_3);
  float a5 = smoothstep(e5,e6,x_3);
  float a6 = smoothstep(e6,e7,x_3);
  float a7 = smoothstep(e7,e8,x_3);
  return max(mix(v0,v1,a0)*step(e0,x_3)*step(x_3,e1),
    max(mix(v1,v2,a1)*step(e1,x_3)*step(x_3,e2),
    max(mix(v2,v3,a2)*step(e2,x_3)*step(x_3,e3),
    max(mix(v3,v4,a3)*step(e3,x_3)*step(x_3,e4),
    max(mix(v4,v5,a4)*step(e4,x_3)*step(x_3,e5),
    max(mix(v5,v6,a5)*step(e5,x_3)*step(x_3,e6),
    max(mix(v6,v7,a6)*step(e6,x_3)*step(x_3,e7),mix(v7,v8,a7)*step(e7,x_3)*step(x_3,e8)
  )))))));
}

vec4 cool (float x_2) {
  const float e0 = 0.0;
  const vec4 v0 = vec4(0.49019607843137253,0,0.7019607843137254,1);
  const float e1 = 0.13;
  const vec4 v1 = vec4(0.4549019607843137,0,0.8549019607843137,1);
  const float e2 = 0.25;
  const vec4 v2 = vec4(0.3843137254901961,0.2901960784313726,0.9294117647058824,1);
  const float e3 = 0.38;
  const vec4 v3 = vec4(0.26666666666666666,0.5725490196078431,0.9058823529411765,1);
  const float e4 = 0.5;
  const vec4 v4 = vec4(0,0.8,0.7725490196078432,1);
  const float e5 = 0.63;
  const vec4 v5 = vec4(0,0.9686274509803922,0.5725490196078431,1);
  const float e6 = 0.75;
  const vec4 v6 = vec4(0,1,0.34509803921568627,1);
  const float e7 = 0.88;
  const vec4 v7 = vec4(0.1568627450980392,1,0.03137254901960784,1);
  const float e8 = 1.0;
  const vec4 v8 = vec4(0.5764705882352941,1,0,1);
  float a0 = smoothstep(e0,e1,x_2);
  float a1 = smoothstep(e1,e2,x_2);
  float a2 = smoothstep(e2,e3,x_2);
  float a3 = smoothstep(e3,e4,x_2);
  float a4 = smoothstep(e4,e5,x_2);
  float a5 = smoothstep(e5,e6,x_2);
  float a6 = smoothstep(e6,e7,x_2);
  float a7 = smoothstep(e7,e8,x_2);
  return max(mix(v0,v1,a0)*step(e0,x_2)*step(x_2,e1),
    max(mix(v1,v2,a1)*step(e1,x_2)*step(x_2,e2),
    max(mix(v2,v3,a2)*step(e2,x_2)*step(x_2,e3),
    max(mix(v3,v4,a3)*step(e3,x_2)*step(x_2,e4),
    max(mix(v4,v5,a4)*step(e4,x_2)*step(x_2,e5),
    max(mix(v5,v6,a5)*step(e5,x_2)*step(x_2,e6),
    max(mix(v6,v7,a6)*step(e6,x_2)*step(x_2,e7),mix(v7,v8,a7)*step(e7,x_2)*step(x_2,e8)
  )))))));
}

vec4 hot (float x_0) {
  const float e0 = 0.0;
  const vec4 v0 = vec4(0,0,0,1);
  const float e1 = 0.3;
  const vec4 v1 = vec4(0.9019607843137255,0,0,1);
  const float e2 = 0.6;
  const vec4 v2 = vec4(1,0.8235294117647058,0,1);
  const float e3 = 1.0;
  const vec4 v3 = vec4(1,1,1,1);
  float a0 = smoothstep(e0,e1,x_0);
  float a1 = smoothstep(e1,e2,x_0);
  float a2 = smoothstep(e2,e3,x_0);
  return max(mix(v0,v1,a0)*step(e0,x_0)*step(x_0,e1),
    max(mix(v1,v2,a1)*step(e1,x_0)*step(x_0,e2),mix(v2,v3,a2)*step(e2,x_0)*step(x_0,e3)
  ));
}

vec4 spring (float x_14) {
  const float e0 = 0.0;
  const vec4 v0 = vec4(1,0,1,1);
  const float e1 = 1.0;
  const vec4 v1 = vec4(1,1,0,1);
  float a0 = smoothstep(e0,e1,x_14);
  return mix(v0,v1,a0)*step(e0,x_14)*step(x_14,e1);
}

vec4 summer (float x_9) {
  const float e0 = 0.0;
  const vec4 v0 = vec4(0,0.5019607843137255,0.4,1);
  const float e1 = 1.0;
  const vec4 v1 = vec4(1,1,0.4,1);
  float a0 = smoothstep(e0,e1,x_9);
  return mix(v0,v1,a0)*step(e0,x_9)*step(x_9,e1);
}

vec4 autumn (float x_13) {
  const float e0 = 0.0;
  const vec4 v0 = vec4(1,0,0,1);
  const float e1 = 1.0;
  const vec4 v1 = vec4(1,1,0,1);
  float a0 = smoothstep(e0,e1,x_13);
  return mix(v0,v1,a0)*step(e0,x_13)*step(x_13,e1);
}

vec4 winter (float x_12) {
  const float e0 = 0.0;
  const vec4 v0 = vec4(0,0,1,1);
  const float e1 = 1.0;
  const vec4 v1 = vec4(0,1,0.5019607843137255,1);
  float a0 = smoothstep(e0,e1,x_12);
  return mix(v0,v1,a0)*step(e0,x_12)*step(x_12,e1);
}
`;


const vs = `
#define SHADER_NAME bitmask-layer-vertex-shader

attribute vec2 texCoords;
attribute vec3 positions;
attribute vec3 positions64Low;
attribute vec3 instancePickingColors;

varying vec2 vTexCoord;

void main(void) {
  geometry.worldPosition = positions;
  geometry.uv = texCoords;
  geometry.pickingColor = instancePickingColors;
  gl_Position = project_position_to_clipspace(positions, positions64Low, vec3(0.0), geometry.position);
  DECKGL_FILTER_GL_POSITION(gl_Position, geometry);
  vTexCoord = texCoords;
  vec4 color = vec4(0.0);
  DECKGL_FILTER_COLOR(color, geometry);
}
`;

const fs = `
#define SHADER_NAME bitmask-layer-fragment-shader
precision highp float;

${colormaps}

// Data (mask) texture
uniform sampler2D channel0;
uniform sampler2D channel1;
uniform sampler2D channel2;
uniform sampler2D channel3;
uniform sampler2D channel4;
uniform sampler2D channel5;

// Color texture
uniform sampler2D colorTex;
uniform float colorTexHeight;
uniform float colorTexWidth;
uniform float hovered;
// range
uniform bool channelsVisible[6];

// Expression mapping
uniform vec2 uColorScaleRange;
uniform bool uIsExpressionMode;
uniform sampler2D expressionTex;

// opacity
uniform float opacity;

// test
uniform bool selectedBackground;
uniform bool backgroundColorWhite;
uniform bool spotlightSelection;
uniform bool outlineSelection;

varying vec2 vTexCoord;
// Check if a pixel is part of the outline by sampling neighboring pixels



bool isCellInSelection(vec4 sampledColor) {
  return sampledColor.r >= 1.0 && 
        sampledColor.g >= 1.0 && 
        sampledColor.b >= 1.0;
}

bool isSpotlightOutline(sampler2D dataTex, vec2 coord) {
    float pixelSize = 1.0 / 2048.0; // Adjust based on your texture size
    
    // Only check background pixels
    float center = texture(dataTex, coord).r;
    if (center > 0.0) {
        return false; // This is a cell pixel, not a border
    }
    
    // Check for selected cells in vertical and horizontal directions
    for(int i=1; i<= 4; ++i) {
      float dist = float(i) * pixelSize;
      
      // Sample neighboring pixels to get their cell IDs
      float left = texture(dataTex, coord + vec2(-dist, 0.0)).r;
      // If any neighboring pixel has a cell ID, check if it's a selected cell
      if (left > 0.0) {
          vec2 leftColorCoord = vec2(mod(left, colorTexWidth) / colorTexWidth, 
                                   floor(left / colorTexWidth) / (colorTexHeight - 1.0));
          vec4 leftColor = vec4(texture(colorTex, leftColorCoord).rgb, 1.0);
          if (isCellInSelection(leftColor)) {
              return true;
          }
      }
      float right = texture(dataTex, coord + vec2(dist, 0.0)).r;
      
      
      // Repeat for other directions
      if (right > 0.0) {
          vec2 rightColorCoord = vec2(mod(right, colorTexWidth) / colorTexWidth, 
                                    floor(right / colorTexWidth) / (colorTexHeight - 1.0));
          vec4 rightColor = vec4(texture(colorTex, rightColorCoord).rgb, 1.0);
          if (isCellInSelection(rightColor)) {
              return true;
          }
      }
      float up = texture(dataTex, coord + vec2(0.0, -dist)).r;
      
      if (up > 0.0) {
          vec2 upColorCoord = vec2(mod(up, colorTexWidth) / colorTexWidth, 
                                 floor(up / colorTexWidth) / (colorTexHeight - 1.0));
          vec4 upColor = vec4(texture(colorTex, upColorCoord).rgb, 1.0);
          if (isCellInSelection(upColor)) {
              return true;
          }
      }
      float down = texture(dataTex, coord + vec2(0.0, dist)).r;      
      if (down > 0.0) {
          vec2 downColorCoord = vec2(mod(down, colorTexWidth) / colorTexWidth, 
                                   floor(down / colorTexWidth) / (colorTexHeight - 1.0));
          vec4 downColor = vec4(texture(colorTex, downColorCoord).rgb, 1.0);
          if (isCellInSelection(downColor)) {
              return true;
          }
      }
      float diagonalDist = sqrt(2.0) * dist;
      float upLeft = texture(dataTex, coord + vec2(-diagonalDist, -diagonalDist)).r;
      if (upLeft > 0.0) {
        vec2 upLeftColorCoord = vec2(mod(upLeft, colorTexWidth) / colorTexWidth, 
                                   floor(upLeft / colorTexWidth) / (colorTexHeight - 1.0));
        vec4 upLeftColor = vec4(texture(colorTex, upLeftColorCoord).rgb, 1.0);
        if (isCellInSelection(upLeftColor)) {
          return true;
        }
      }
      float upRight = texture(dataTex, coord + vec2(diagonalDist, -diagonalDist)).r;
      if (upRight > 0.0) {
        vec2 upRightColorCoord = vec2(mod(upRight, colorTexWidth) / colorTexWidth, 
                                   floor(upRight / colorTexWidth) / (colorTexHeight - 1.0));
        vec4 upRightColor = vec4(texture(colorTex, upRightColorCoord).rgb, 1.0);
        if (isCellInSelection(upRightColor)) {
          return true;
        }
      }
      float downLeft = texture(dataTex, coord + vec2(-diagonalDist, diagonalDist)).r;
      if (downLeft > 0.0) {
        vec2 downLeftColorCoord = vec2(mod(downLeft, colorTexWidth) / colorTexWidth, 
                                   floor(downLeft / colorTexWidth) / (colorTexHeight - 1.0));
        vec4 downLeftColor = vec4(texture(colorTex, downLeftColorCoord).rgb, 1.0);
        if (isCellInSelection(downLeftColor)) {
          return true;
        }
      }
      float downRight = texture(dataTex, coord + vec2(diagonalDist, diagonalDist)).r;
      if (downRight > 0.0) {
        vec2 downRightColorCoord = vec2(mod(downRight, colorTexWidth) / colorTexWidth, 
                                   floor(downRight / colorTexWidth) / (colorTexHeight - 1.0));
        vec4 downRightColor = vec4(texture(colorTex, downRightColorCoord).rgb, 1.0);
        if (isCellInSelection(downRightColor)) {
          return true;
        }
      }

    }
    

    
    return false;
}


bool isExteriorBorder(sampler2D dataTex, vec2 coord) {
    float pixelSize = 1.0 / 2048.0; // Adjust based on your texture size
    
    // Only check background pixels
    float center = texture(dataTex, coord).r;
    if (center > 0.0) {
        return false; // This is a cell pixel, not a border
    }
    
    // Check for selected cells in vertical and horizontal directions
    for(int i=1; i<= 2; ++i) {
      float dist = float(i) * pixelSize;
      
      // Sample neighboring pixels to get their cell IDs
      float left = texture(dataTex, coord + vec2(-dist, 0.0)).r;

      
      // If any neighboring pixel has a cell ID, check if it's a selected cell
      if (left > 0.0) {
          vec2 leftColorCoord = vec2(mod(left, colorTexWidth) / colorTexWidth, 
                                   floor(left / colorTexWidth) / (colorTexHeight - 1.0));
          vec4 leftColor = vec4(texture(colorTex, leftColorCoord).rgb, 1.0);
          if (isCellInSelection(leftColor)) {
              return true;
          }
      }
      float right = texture(dataTex, coord + vec2(dist, 0.0)).r;

      
      // Repeat for other directions
      if (right > 0.0) {
          vec2 rightColorCoord = vec2(mod(right, colorTexWidth) / colorTexWidth, 
                                    floor(right / colorTexWidth) / (colorTexHeight - 1.0));
          vec4 rightColor = vec4(texture(colorTex, rightColorCoord).rgb, 1.0);
          if (isCellInSelection(rightColor)) {
              return true;
          }
      }
      float up = texture(dataTex, coord + vec2(0.0, -dist)).r;
      
      if (up > 0.0) {
          vec2 upColorCoord = vec2(mod(up, colorTexWidth) / colorTexWidth, 
                                 floor(up / colorTexWidth) / (colorTexHeight - 1.0));
          vec4 upColor = vec4(texture(colorTex, upColorCoord).rgb, 1.0);
          if (isCellInSelection(upColor)) {
              return true;
          }
      }
      float down = texture(dataTex, coord + vec2(0.0, dist)).r;
      
      if (down > 0.0) {
          vec2 downColorCoord = vec2(mod(down, colorTexWidth) / colorTexWidth, 
                                   floor(down / colorTexWidth) / (colorTexHeight - 1.0));
          vec4 downColor = vec4(texture(colorTex, downColorCoord).rgb, 1.0);
          if (isCellInSelection(downColor)) {
              return true;
          }
      }
    }
    
    return false;
}




bool isInteriorBorder(sampler2D dataTex, vec2 coord) {
    float pixelSize = 1.0 / 2048.0; // Adjust based on your texture size
    float center = texture(dataTex, coord).r;
    
    // Sample the 8 neighboring pixels
    float left = texture(dataTex, coord + vec2(-pixelSize, 0.0)).r;
    float right = texture(dataTex, coord + vec2(pixelSize, 0.0)).r;
    float up = texture(dataTex, coord + vec2(0.0, pixelSize)).r;
    float down = texture(dataTex, coord + vec2(0.0, -pixelSize)).r;
    
    // If any neighboring pixel is different from the center, this is an edge
    return (center > 0.0) && (left != center || right != center || up != center || down != center);
}

bool isCellOutOfSelection(vec4 sampledColor) {
  return sampledColor.r == 0.7843137254901961 && 
        sampledColor.g == 0.7843137254901961 && 
        sampledColor.b == 0.7843137254901961;
}


bool isBackground(vec4 sampledColor) {
  return sampledColor.r == 0. && sampledColor.g == 0. && sampledColor.b == 0.;
}

vec4 sampleAndGetColor(sampler2D dataTex, vec2 coord, bool isOn) {
    if (!isOn) return vec4(0.0);
    
    float sampledData = texture(dataTex, coord).r;
    vec4 hoveredColor = float(sampledData == hovered && sampledData > 0. && hovered > 0.) * vec4(0., 0., 1., 1.);
    vec2 colorTexCoord = vec2(mod(sampledData, colorTexWidth) / colorTexWidth, 
                             floor(sampledData / colorTexWidth) / (colorTexHeight - 1.));
    
    vec4 sampledColor = vec4(texture(colorTex, colorTexCoord).rgb, 1.);
    vec4 resultColor = vec4(0.0);
    if (isCellInSelection(sampledColor)) {
      if (isInteriorBorder(dataTex, coord) && outlineSelection){
          resultColor = vec4(1.0);
      } else {
        resultColor = vec4(0.0);
      }
    }
    else if  ( outlineSelection && isExteriorBorder(dataTex, coord)) {
      resultColor = vec4(1.0);
    }  
    else if (isCellOutOfSelection(sampledColor) && spotlightSelection) {
      resultColor = vec4(0.0000001, 0.0, 0.0, 1.0);
    } else if (selectedBackground) {
      resultColor = vec4(0.00000001, 0.0, 0.0, 1.0);
    } else if (spotlightSelection) {
      resultColor = vec4(0.0,0.0,0.0,1.0);
    } else {
      resultColor = vec4(0.0,0.0,0.0,1.0);
    }
    
    // Only apply background color if we have valid data
    if (sampledData == 0.0 && isBackground(sampledColor)) {
      resultColor = !backgroundColorWhite ? vec4(0.0) : vec4(1.0, 1.0, 1.0, 1.0);
    }
   
    return resultColor + hoveredColor;
}

void main() {
    // Initialize with transparent black
    gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
    
    bool hasVisibleChannel = false;
    for (int i = 0; i < 6; i++) {
        if (channelsVisible[i]) {
            hasVisibleChannel = true;
            break;
        }
    }
    
    // Only process if we have visible channels
    if (hasVisibleChannel) {
        gl_FragColor = sampleAndGetColor(channel0, vTexCoord, channelsVisible[0]);

        vec4 sampledColor;
        sampledColor = sampleAndGetColor(channel1, vTexCoord, channelsVisible[1]);
        gl_FragColor = (sampledColor == gl_FragColor || sampledColor == vec4(0.)) ? gl_FragColor : sampledColor;
        sampledColor = sampleAndGetColor(channel2, vTexCoord, channelsVisible[2]);
        gl_FragColor = (sampledColor == gl_FragColor || sampledColor == vec4(0.)) ? gl_FragColor : sampledColor;
        sampledColor = sampleAndGetColor(channel3, vTexCoord, channelsVisible[3]);
        gl_FragColor = (sampledColor == gl_FragColor || sampledColor == vec4(0.)) ? gl_FragColor : sampledColor;
        sampledColor = sampleAndGetColor(channel4, vTexCoord, channelsVisible[4]);
        gl_FragColor = (sampledColor == gl_FragColor || sampledColor == vec4(0.)) ? gl_FragColor : sampledColor;
        sampledColor = sampleAndGetColor(channel5, vTexCoord, channelsVisible[5]);
        gl_FragColor = (sampledColor == gl_FragColor || sampledColor == vec4(0.)) ? gl_FragColor : sampledColor;

        // Apply opacity
        float alpha = opacity;
        if (gl_FragColor.rgb == vec3(0., 0., 0.)) {
            alpha = 0.0;
        }
        gl_FragColor = vec4(gl_FragColor.rgb, alpha);
    }

    geometry.uv = vTexCoord;
    DECKGL_FILTER_COLOR(gl_FragColor, geometry);
}
`;

export class SpotlightBitmaskLayer extends BitmaskLayer {
  initializeState() {
    super.initializeState();
    const { gl } = this.context;
    
    // Set initial state
    this.setState({
      model: this._getModel(gl),
      channelsVisible: new Array(6).fill(false),
      backgroundColorWhite: false,
      opacity: 1.0
    });
  }

  getShaders() {
    const { colormap } = this.props;
    return {
      fs,
      vs,
      modules: [project32, picking],
      defines: {
        [COLORMAP_SHADER_PLACEHOLDER]: GLSL_COLORMAPS.includes(colormap)
          ? colormap
          : GLSL_COLORMAP_DEFAULT,
      },
    };
  }

  draw(opts) {
    const { uniforms } = opts;
    const {
      model,
      channelsVisible,
      backgroundColorWhite,
      opacity
    } = this.state;

    const spotlightSelection = this?.props?.spotlightSelection ?? false;
    const outlineSelection = this?.props?.outlineSelection ?? false;
    const selectedBackground = this?.props?.selectedBackground === 'show';
    const currentBackgroundColorWhite = this?.props?.backgroundColorWhite ?? false;

    // Update state if needed
    if (currentBackgroundColorWhite !== backgroundColorWhite) {
      this.setState({ backgroundColorWhite: currentBackgroundColorWhite });
    }

    // Call parent class draw first
    super.draw(opts);
    
    // Render with our uniforms
    model
      .setUniforms(
        Object.assign({}, uniforms, {
          selectedBackground,
          spotlightSelection,
          outlineSelection,
          backgroundColorWhite: currentBackgroundColorWhite,
          opacity
        })
      )
      .draw();
  }

  // Override updateState to handle state changes
  updateState({ props, oldProps, changeFlags }) {
    super.updateState({ props, oldProps, changeFlags });
    
    if (changeFlags.propsChanged) {
      const { backgroundColorWhite } = props;
      if (backgroundColorWhite !== oldProps.backgroundColorWhite) {
        this.setState({ backgroundColorWhite });
      }
    }
  }
}

