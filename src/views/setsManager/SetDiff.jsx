import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { SetIntersectionSVG } from '@vitessce/icons';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Grow from '@mui/material/Grow';
import './SetDiff.css';
import useStore from '../../store';
import CategorySharpIcon from '@mui/icons-material/CategorySharp';
import CircleSharpIcon from '@mui/icons-material/CircleSharp';

import { booleanPointInPolygon, helpers } from '@turf/turf';

function SetDiff(props) {
    const { cellSetSelection } = props;
    const [checked, setChecked] = useState(false);
    const [mode, setMode] = useState("category");
    const [hoveredShape, setHoveredShape] = useState({});
    const hoveredClusters = useStore((state) => state.hoveredClusters);
    const setHoveredClusters = useStore((state) => state.setHoveredClusters);
    const setFeatures = useStore((state) => state.setFeatures);
    const [polygons, setPolygons] = useState([]);
    const svgRef = useRef(null);

    useEffect(() => {
        console.log('hoveredShape', hoveredShape);

        setHoveredClusters(hoveredShape);
    }, [hoveredShape])


    useEffect(() => {
        if (checked && svgRef.current) {
            const concaveData = (cellSetSelection || []).map((cellSet) => {
                const setFeature = setFeatures?.[cellSet[0]]?.[cellSet[1]] || {};
                return { ...setFeature?.hulls, path: cellSet };
            }).filter((hull) => hull);
            const desiredSize = 100;

            const svg = d3.select(svgRef.current);

            const trimmedConcaveData = concaveData.slice(0, 2);

            const svgWidth = svgRef.current.clientWidth;
            const svgHeight = svgRef.current.clientHeight;
            let _polygons = []

            const groups = svg.selectAll('g')
                .data(trimmedConcaveData, d => `${JSON.stringify(d.path)}-${mode}`)
                .join('g')
                .attr('transform', (d, i) => `translate(${(svgWidth / 3) + ((-1 + i * 2) * desiredSize / 6)}, ${-desiredSize / 2 + svgHeight / 2})`)
                .each((d, i, elem) => {
                    const group = d3.select(elem[i]);

                    group.selectAll('path')
                        .data(d => [d])
                        .join('path')
                        .attr('d', (dd) => {
                            const hull = dd?.embedding?.concave_hull;
                            if (!hull) return '';
                            if (mode === "category") {
                                const xRange = d3.extent(hull, (point) => point[0]);
                                const yRange = d3.extent(hull, (point) => point[1]);

                                const dataWidth = xRange[1] - xRange[0];
                                const dataHeight = yRange[1] - yRange[0];

                                const scaleFactor = Math.min(desiredSize / dataWidth, desiredSize / dataHeight);

                                const scaledWidth = dataWidth * scaleFactor;
                                const scaledHeight = dataHeight * scaleFactor;

                                const xOffset = (desiredSize - scaledWidth) / 2;
                                const yOffset = (1.25 * desiredSize - scaledHeight) / 2;

                                const xScale = d3.scaleLinear()
                                    .domain([xRange[0], xRange[1]])
                                    .range([xOffset, xOffset + scaledWidth]);

                                const yScale = d3.scaleLinear()
                                    .domain([yRange[0], yRange[1]])
                                    .range([yOffset, yOffset + scaledHeight]);

                                const points = hull.map((point) => [xScale(point[0]), yScale(point[1])]);

                                const line = d3.line()
                                    .x((point) => point[0])
                                    .y((point) => point[1])
                                    .curve(d3.curveLinearClosed);
                                points.push(points[0]);
                                const transformedPoints = points.map((point) => {
                                    return [point[0] + (svgWidth / 3) + ((-1 + i * 2) * desiredSize / 7), point[1] + (-desiredSize / 2 + svgHeight / 2)];
                                });
                                _polygons.push({ path: d.path, polygon: transformedPoints });

                                return line(points);
                            } else {
                                const fixedRadius = desiredSize / 2;
                                const xOffset = (svgWidth / 6);
                                const yOffset = (2 * svgHeight / 5);

                                const points = [];
                                for (let i = 0; i < 100; i++) {
                                    const angle = (i * 2 * Math.PI) / 100;
                                    const x = Math.cos(angle) * fixedRadius;
                                    const y = Math.sin(angle) * fixedRadius;
                                    points.push([x + xOffset, y + yOffset]);
                                }
                                const line = d3.line()
                                    .x((point) => point[0])
                                    .y((point) => point[1])
                                    .curve(d3.curveLinearClosed);
                                points.push(points[0]);
                                const transformedPoints = points.map((point) => {
                                    return [point[0] + (svgWidth / 3) + ((-1 + i * 2) * desiredSize / 7), point[1] + (-desiredSize / 2 + svgHeight / 2)];
                                });
                                _polygons.push({ path: d.path, polygon: transformedPoints });

                                return line(points);
                            }
                        })
                        .attr('fill', hoveredShape[JSON.stringify(d.path)] ? 'gray' : 'none')
                        .attr('stroke', 'black')
                        .attr('stroke-width', 2)
                        .attr('opacity', hoveredShape[JSON.stringify(d.path)] ? 0.7 : 1);

                    group.selectAll('text')
                        .data(d => [d])
                        .join('text')
                        .attr('x', (dd, ii) => ((-1 + (i * 2)) * 80 + 60))
                        .attr('y', 0)
                        .attr('text-anchor', 'middle')
                        .text(d => JSON.stringify(d.path))
                        .attr('font-size', 10)
                        .attr('fill', 'black');
                });
            setPolygons(_polygons);

        }
    }, [setFeatures, cellSetSelection, checked, mode, hoveredShape]);

    useEffect(() => {
        const svg = d3.select(svgRef.current);
        svg.on('mousemove', (event) => {
            const [x, y] = d3.pointer(event);
            polygons.forEach(({ path, polygon }) => {
                const pt = helpers.point([x, y]);
                const poly = helpers.polygon([polygon]);
                const inPolygon = booleanPointInPolygon(pt, poly);
                setHoveredShape(prev => ({ ...prev, [JSON.stringify(path)]: inPolygon }));
            });
        });
    }, [polygons]);

    return (
        <>
        
            <Box sx={{
                display: 'flex', width: '100%', pointerEvents: checked ? 'auto' : 'none'
            }}>
                <Grow in={checked}>
                    <Paper
                        className={'vennPaper'}
                        elevation={4}
                        sx={{
                            margin: 0,
                            padding: 0,
                            width: '100%',
                            height: '150px',
                        }}
                    >
                        <div style={{ width: '100%', height: '100%' }}>
                            <svg ref={svgRef} width="100%" height="100%"></svg>
                        </div>
                        <div style={{ position: 'absolute', left: '10px', bottom: '10px' }}>
                            <CategorySharpIcon
                                onClick={() => setMode("category")}
                                color={mode === "category" ? 'primary' : 'inherit'}
                                style={{ cursor: 'pointer' }}
                            />
                            <CircleSharpIcon
                                onClick={() => setMode("circle")}
                                color={mode === "circle" ? 'primary' : 'inherit'}
                                style={{ cursor: 'pointer' }}
                            />
                        </div>
                    </Paper>
                </Grow>
            </Box>

            <div className={checked ? 'setIntersectIcon selectedSetIntersect' : 'setIntersectIcon unselectedSetIntersect'}
                style={{
                    pointerEvents: 'auto'
                }}>
                <SetIntersectionSVG
                    style={{
                        width: '30px',
                        height: '30px',
                    }}
                    onClick={() => { setChecked(!checked); }} />
            </div>
        </>
    );
}

export default SetDiff;