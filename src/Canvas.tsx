import * as d3 from "d3";
import { useState, useEffect, useRef } from "react";
import { useSettings } from "./Settings.tsx";
import { TreeNode } from "./Utility.ts";
import FileDetails from "./windows/FileDetails.tsx";

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


    // Node Event handlers
    const nodeClicked = (e:MouseEvent, d:CanvasNode) => {
        setNode(d);
        props.nodeClicked(e,d);        
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
            // Remove any previous content (optional, for safety)
            svgSelection.selectAll("*").remove();

            // Create a group for zoom/pan
            const zoomGroup = svgSelection
                .append("g")
                .attr("class", "zoomGroup");

            // Setup zoom behavior on the SVG
            const zoom = d3.zoom()
                .scaleExtent([0.5, 3])
                .on("zoom", (e: { transform: any; }) => {
                    zoomGroup.attr("transform", e.transform);
                });

            svgSelection.call(zoom);
        }

        const width = (window.innerWidth-200);
        const height = (window.innerHeight-200);

        // Prune the tree to only show:true nodes
        const prunedRoot = pruneTree(props.tree);
        if (!prunedRoot) {
            console.error("No visible nodes found!");
            return;
        }

        // Use d3.hierarchy on the pruned tree
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

        // Scale tree
        const treeLayout = d3.tree().size([width*spacing[0], height*spacing[1]]);
        const treeData = treeLayout(root);

        // Filter out nodes that are not in horizon
        const inHorizonNodes = treeData.descendants().filter((d: { depth: number; }) => d.depth <= horizon);
        const inHorizonLinks = treeData.links().filter((l: { target: { depth: number; }; }) => l.target.depth <= horizon);

        const zoomGroup = d3.select(ref.current).select(".zoomGroup");
        
        // --- Render Links ---
        const links = zoomGroup.selectAll('.link')
            .data(inHorizonLinks, (d: { target: { id: any; }; })=> d.target.id);

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
            .on('click', (e: MouseEvent,d: any) => edgeClicked(e,d));
        links.exit().remove();
    
        const edgeLabels = zoomGroup.selectAll('.edge-label')
            .data(inHorizonLinks, (d: { target: { id: any; }; }) => d.target.id);

        edgeLabels.enter()
            .append("text")
            .attr("class", "edge-label")
            .attr("text-anchor", "middle")
            .attr("dy", -5) // adjust as needed
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
            .data(inHorizonNodes, (d: { id: any; }) => d.id);
        
        const nodeEnter = nodes.enter()
            .append("g")
            .attr("class", "node")
            .attr("transform", (d: { x: number; y: number; }) => `translate(${d.x * spacing[0]},${d.y * spacing[1]})`);

        nodeEnter.each(function (d: { data: { type: string; isGoal: any; }; }) {
                if (d.data.type === 'state') {
                    d3.select(this).append('circle')
                        .attr('r', 15)
                        .attr('fill', d.data.isGoal ? 'gold' : 'steelblue')
                        .on('click', (e: MouseEvent, d: any) => nodeClicked(e,d));
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
                        .attr('fill', (d: { data: { id: any, policyAction: any; counterAction: any; }; }) => {
                            if (d.data.policyAction) {
                                return "green";
                            } else if (d.data.counterAction) {
                                return "magenta"
                            }
                            return "red";
                        })
                        .on('click', (e: MouseEvent, d: any) => nodeClicked(e,d));
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
            .attr("transform", (d: { x: number; y: number; }) => `translate(${d.x * spacing[0]},${d.y * spacing[1]})`);
    
        nodes.exit().remove(); // Remove extra nodes

        // Bring nodes group to the front so they appear above edges
        zoomGroup.selectAll(".node").raise();

    }, [horizon, props.tree, spacing, currentPolicyIdx, props.scrColors]);

    useEffect(() => {
        const zoomGroup = d3.select(ref.current).select(".zoomGroup");
        if (!node || node === "none") {
            zoomGroup.selectAll(".link").attr("stroke", "black");
            return;
        }
        // Highlight links 
        zoomGroup.selectAll(".link")
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
                else if (d.source.data.id === node.data.id || d.target.data.id === node.data.id) {
                    col = "cyan";
                    str = "5px";
                } 
                
                return `stroke : ${col}; stroke-width: ${str};`;
            });
    });

    return <>
        <svg id="canvas" className="canvas" width="100%" height="100%" ref={ref}></svg>
        <FileDetails 
            spacing={spacing}
            setSpacing={setSpacing}
            horizon={horizon}
            setHorizon={setHorizon}
            maxHorizon={props.treeDepth}
        />
        
    </>
}
