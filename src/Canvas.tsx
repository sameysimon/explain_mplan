import * as d3 from "d3";
import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom"; // <-- Import createPortal
import { useSettings } from "./Settings.tsx";
import { TreeNode } from "./Utility.ts";
import FileDetails from "./windows/FileDetails.tsx";
import {RenderState} from "./Renderers/RenderState.tsx";
import { TransitionTable } from "./DisplayInfo/transitionTable.js";


export type CanvasNode = d3.HierarchyPointNode<TreeNode>;
export type CanvasEdge = d3.HierarchyPointLink<TreeNode>;
interface CanvasProps {
    tree: TreeNode;
    treeDepth: number;
    nodeClicked: (e: MouseEvent, d: TreeNode) => void;
    scrColors : { [srcIdx: string] : { [tarIdx: string] : {norm: number, is_pos: boolean} }};
}

const SetEdgeLabels = (d: { target: { data: { edgeLabel: any; }; }; }) => {
    return d.target.data.edgeLabel || "";
};

export default function Canvas(props : CanvasProps) {
    const ref = useRef<SVGSVGElement | null>(null);
    const [spacing, setSpacing] = useState<[number,number]>([1,1]);
    const [node, setNode] = useState<CanvasNode | null>(null);
    const [horizon, setHorizon] = useState<number>(props.treeDepth);
    const { currentPolicyIdx } = useSettings();

    // Tooltip State
    const [hoveredNode, setHoveredNode] = useState<CanvasNode | null>(null);
    const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

    // Node Event handlers
    const nodeClicked = (e:MouseEvent, d:CanvasNode) => {
        setNode(d);
        props.nodeClicked(e,d);        
    };
    
    const nodeHovered = (e: MouseEvent, d: CanvasNode) => {
        setHoveredNode(d);
        // Use clientX/Y instead of pageX/Y for fixed positioning
        setTooltipPos({ x: e.clientX, y: e.clientY }); 
    };

    const nodeHoverMoved = (e: MouseEvent) => {
        setTooltipPos({ x: e.clientX, y: e.clientY });
    };

    const nodeUnhovered = () => {
        setHoveredNode(null); // <-- Make sure to uncomment this so it hides!
    };

    const edgeClicked = (e:MouseEvent, d:CanvasEdge) => {
        // console.log("Edge Clicked:", d);
    };

    // Helper to prune tree to only show:true nodes
    function pruneTree(node:TreeNode) {
        if (!node.show) return null;
        let pruned = { ...node };
        if (pruned.children) {
            pruned.children = pruned.children
                .map(pruneTree)
                .filter(child => child !== null);
        }
        return pruned;
    }

    // Handles initial graph construction + zoom, scope change etc.
    useEffect(() => {
        const svgSelection = d3.select(ref.current);
        let svg = svgSelection.select("g.zoomGroup");

        // Create the master group if it doesn't exist
        if (svg.empty()) {
            svgSelection.selectAll("*").remove();

            const zoomGroup = svgSelection
                .append("g")
                .attr("class", "zoomGroup");

            const zoom = d3.zoom()
                .scaleExtent([0.5, 3])
                .on("zoom", (e: { transform: any; }) => {
                    zoomGroup.attr("transform", e.transform);
                });

            svgSelection.call(zoom);
        }

        const width = (window.innerWidth-200);
        const height = (window.innerHeight-200);

        const prunedRoot = pruneTree(props.tree);
        if (!prunedRoot) {
            console.error("No visible nodes found!");
            return;
        }

        let root;
        try {
            root = d3.hierarchy(prunedRoot);
        } catch (error) {
            console.error("Error in hierarchy:", error);
            return;
        }
        if (!root) {
            console.error("Root is null, hierarchy failed!");
            return;
        }

        const treeLayout = d3.tree().size([width*spacing[0], height*spacing[1]]);
        const treeData = treeLayout(root);

        const inHorizonNodes = treeData.descendants().filter((d: { depth: number; }) => d.depth <= horizon);
        const inHorizonLinks = treeData.links().filter((l: { target: { depth: number; }; }) => l.target.depth <= horizon);

        const zoomGroup = d3.select(ref.current).select(".zoomGroup");
        
        const linkKey = (d: CanvasEdge) => `${d.source.data.pathKey ?? `${d.source.depth}:${d.source.data.id}`}->${d.target.data.pathKey ?? `${d.target.depth}:${d.target.data.id}`}`;
        const nodeKey = (d: CanvasNode) => d.data.pathKey ?? `${d.depth}:${d.data.type}:${d.data.id}`;

        const links = zoomGroup.selectAll('.link')
            .data(inHorizonLinks, linkKey);

        links.enter()
            .append("line")
            .attr("class", "link")
            .attr('style', function(d: { source: { data: { source_state: string | number; }; }; target: { data: { id: string | number; }; }; }) {
                const x = props.scrColors?.[d.source.data.source_state]?.[d.target.data.id]?.norm;
                let r = `stroke-width : ${x!=null ? '4px' : '2px'}; `;
                r += `stroke : ${x != null ? `hsl(${120 * (1-x)}, 80%, 45%)` : "black"}; `;
                return r;
            })
            .merge(links)
            .attr("x1", (d: { source: { x: number; }; }) => d.source.x * spacing[0])
            .attr("y1", (d: { source: { y: number; }; }) => d.source.y * spacing[1])
            .attr("x2", (d: { target: { x: number; }; }) => d.target.x * spacing[0])
            .attr("y2", (d: { target: { y: number; }; }) => d.target.y * spacing[1])
            .on('click', (e: MouseEvent,d: any) => edgeClicked(e,d))
            .attr('style', function(d: { source: { data: { source_state: string | number; highlight: any; id: any; }; }; target: { data: { id: string | number; highlight: any; }; }; }) {
                const x = props.scrColors?.[d.source.data.source_state]?.[d.target.data.id]?.norm;
                let col = "black";
                let str = "2px";
                if (d.source.data.highlight && d.target.data.highlight) {
                    col = "#C27AFF";
                    str = "4px";
                }
                else if (x!= null) {
                    col = `hsl(${120 * (1-x)}, 80%, 45%)`;
                    str = "5px";
                }
                
                else if (node && (d.source.data.id === node.data.id || d.target.data.id === node.data.id)) {
                    col = "cyan";
                    str = "5px";
                } 
                
                return `stroke : ${col}; stroke-width: ${str};`;
            });
        links.exit().remove();// Remove old links
            
    
        const edgeLabels = zoomGroup.selectAll('.edge-label')
            .data(inHorizonLinks, linkKey);

        edgeLabels.enter()
            .append("text")
            .attr("class", "edge-label")
            .attr("text-anchor", "middle")
            .attr("dy", -5) 
            .attr("font-weight", "bold")
            .attr("font-size", "15px")
            .attr("stroke", "black")
            .attr("stroke-width", "3px")
            .attr("stroke-linejoin", "round")
            .attr("paint-order", "stroke")
            .merge(edgeLabels)
            .attr("fill", "white")
            .attr("x", (d: { source: { x: any; }; target: { x: any; }; }) => ((d.source.x + d.target.x) / 2) * spacing[0])
            .attr("y", (d: { source: { y: any; }; target: { y: any; }; }) => ((d.source.y + d.target.y) / 2) * spacing[1])
            .text(SetEdgeLabels);

        edgeLabels.exit()
            .remove();

        const nodes = zoomGroup.selectAll(".node")
            .data(inHorizonNodes, nodeKey);
        
        const nodeEnter = nodes.enter()
            .append("g")
            .attr("class", "node")
            .attr("transform", (d: { x: number; y: number; }) => `translate(${d.x * spacing[0]},${d.y * spacing[1]})`);

        nodeEnter.each(function (this: SVGGElement, d: { data: { type: string; isGoal: any; }; }) {
                if (d.data.type === 'state') {
                    d3.select(this).append('circle')
                        .attr('r', 15)
                        .on('click', (e: MouseEvent, d: any) => nodeClicked(e,d)) 
                        .on('mouseover', (e: MouseEvent, d: any) => nodeHovered(e,d)) 
                        .on('mousemove', (e: MouseEvent) => nodeHoverMoved(e))
                        .on('mouseout', () => nodeUnhovered());
                    d3.select(this).append('text')
                        .attr('text-anchor', 'middle')
                        .attr('dominant-baseline', 'middle')
                        .attr('pointer-events', 'none')
                        .attr("font-size", "15px")
                        .attr("fill", "white")
                        .attr("stroke", "black")
                        .attr("stroke-width", "2px")
                        .attr("stroke-linejoin", "round")
                        .attr("paint-order", "stroke")
                        .text((d: { data: { label: any; }; }) => d.data.label);
                } else if (d.data.type === 'action') {
                    d3.select(this).append('polygon')
                        .attr('points', '-15,15 15,15 0,-15')
                        .on('click', (e: MouseEvent, d: any) => nodeClicked(e,d))
                        .on('mouseover', (e: MouseEvent, d: any) => nodeHovered(e,d)) 
                        .on('mousemove', (e: MouseEvent) => nodeHoverMoved(e))
                        .on('mouseout', () => nodeUnhovered());;
                    d3.select(this).append('text')
                        .attr('text-anchor', 'middle')
                        .attr('dominant-baseline', 'middle')
                        .attr('pointer-events', 'none')
                        .attr("font-size", "15px")
                        .attr("fill", "white")
                        .attr("stroke", "black")
                        .attr("stroke-width", "3px")
                        .attr("stroke-linejoin", "round")
                        .attr("paint-order", "stroke")
                        .text((d: { data: { label: any; }; }) => d.data.label);
                }
            });

        nodes.merge(nodeEnter)
            .attr("transform", (d: { x: number; y: number; }) => `translate(${d.x * spacing[0]},${d.y * spacing[1]})`)
            .attr('fill', (d: { data: { type:string, isGoal:boolean, id: any, policyAction: any; counterAction: any; }; }) => {
                if (d.data.type==='action') {
                    if (d.data.policyAction) {
                        return "green";
                    } else if (d.data.counterAction) {
                        return "magenta"
                    }
                    return "red";
                }
                if (d.data.type==='state') {
                    return d.data.isGoal ? 'gold' : 'steelblue'
                }
            })
            ;
    
        nodes.exit().remove();

        zoomGroup.selectAll(".node").raise();

    }, [horizon, node, props.tree, spacing, props.scrColors]);

    useEffect(() => {
        const zoomGroup = d3.select(ref.current).select(".zoomGroup");
        if (!node || node === "none") {
            zoomGroup.selectAll(".link").attr("stroke", "black");
            return;
        }
        zoomGroup.selectAll(".link")
            
    });

    return (
        <>
            <svg id="canvas" className="canvas" width="100%" height="100%" ref={ref}></svg>
            
            {/* Using createPortal to render the tooltip at the top level of the document */}
            {hoveredNode && createPortal(
                <div style={{
                        position: "fixed", // Changed to fixed to map perfectly to e.clientX/Y
                        top: tooltipPos.y + 15, // Added +15 offset so it doesn't get trapped under the mouse pointer
                        left: tooltipPos.x + 15,
                        pointerEvents: "none", 
                        zIndex: 999999, // Super high z-index to stay above WinBox
                        backgroundColor: "white",
                        boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.3)",
                        borderRadius: "8px",
                        padding: "12px",
                        border: "1px solid #ddd",
                        maxHeight: "90vh", // Prevent it from getting larger than the screen
                        overflowY: "auto"
                    }}
                >
                    {console.log('hovered node', hoveredNode) === null && <>s</>}
                    {hoveredNode.data.type==='state' &&
                        <RenderState nodeData={hoveredNode} small/>
                    }
                    {hoveredNode.data.type==='action' &&
                        <>
                            <h4>{hoveredNode.data.label}</h4>
                            <TransitionTable 
                                source_state={hoveredNode.data.source_state}
                                action_label={hoveredNode.data.label}
                            />
                        </>
                    }
                </div>,
                document.body
            )}

            <FileDetails 
                spacing={spacing}
                setSpacing={setSpacing}
                horizon={horizon}
                setHorizon={setHorizon}
                maxHorizon={props.treeDepth}
            />
        </>
    );
}