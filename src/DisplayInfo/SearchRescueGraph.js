import React from "react";


export function SearchRescueGraph({
  info,
  width = 300,
  height = 450,
  nodeRadius = 18,
  strokeWidth = 2,
  labelOffsetY = 5,
  labelOffsetX = 0,
  rx: rxProp, // optional: custom ellipse radii
  ry: ryProp,
}) {
  let adjEdge = info['adjEdge'];

  const nodeSet = new Set(
    Object.keys(adjEdge)
      .map((k) => Number(k))
      .concat(
        ...Object.values(adjEdge).map((arr) => arr.map((v) => Number(v)))
      )
  );

  const nodes = Array.from(nodeSet).sort((a, b) => a - b);
  const N = nodes.length;

  const cx = width / 2;
  const cy = height / 2;
  const rx = rxProp ?? Math.max(0, cx - nodeRadius - 20);
  const ry = ryProp ?? Math.max(0, cy - nodeRadius - 20);

  
  // Compute positions around the oval
  const positions = [];
  const colours = [];
  const labels = [];
  nodes.forEach((node, i) => {
    const theta = (2 * Math.PI * i) / N - Math.PI / 2; // start at top
    const x = cx + rx * Math.cos(theta);
    const y = cy + ry * Math.sin(theta);
    positions.push({ x, y, theta });
    let lab = "black";
    if (info["curr_tile"]===node) {
      lab = "green";
    }
    colours.push(lab);
    labels.push(info["tile_state"][node]);
  });

  // Helper to create a slight curved path via the center using a quadratic curve
  function edgePath(u, v) {
    const pu = positions[u];
    const pv = positions[v];
    if (!pu || !pv) return "";

    // Shorten the path ends so the line meets the circle tangentially
    const dx = pv.x - pu.x;
    const dy = pv.y - pu.y;
    const len = Math.hypot(dx, dy) || 1;
    const ux = dx / len;
    const uy = dy / len;

    const startX = pu.x + ux * nodeRadius;
    const startY = pu.y + uy * nodeRadius;
    const endX = pv.x - ux * nodeRadius;
    const endY = pv.y - uy * nodeRadius;

    return `M ${startX} ${startY} ${endX} ${endY}`;
  }

  // Build a flat list of edges (u -> v)
  const edges = [];
  for (const [uStr, vs] of Object.entries(adjEdge)) {
    const u = Number(uStr);
    vs.forEach((v) => edges.push([u, Number(v)]));
  }

  return (<>
  <p>
    Visual representation of search and rescue domain.
    Each circle represents a position on the map.
    White text indicates the known status of the position.
    The green tile is the robot's current position.
  </p>
    <div className="w-full flex items-center justify-center">
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{"backgroundColor": "gray"}}>
        <defs>
          <marker
            id="arrow"
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" />
          </marker>
        </defs>

        {/* edges */}
        <g strokeWidth={strokeWidth} stroke="black" fill="none" markerEnd="url(#arrow)">
          {edges.map(([u, v], i) => (
            <path key={`e-${i}`} d={edgePath(u, v)} />
          ))}
        </g>

        {/* nodes */}
        <g filter="url(#softShadow)">
          {nodes.map((node) => {
            const p = positions[node];
            const col = colours[node];
            const label = labels[node];
            return (
              <g key={node} transform={`translate(${p.x}, ${p.y})`}>
                <circle r={nodeRadius} fill={col} />
                <text
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize={nodeRadius * 0.9}
                  y={labelOffsetY}
                  x={labelOffsetX}
                  fill="white"
                >
                  {label}
                </text>
              </g>
            );
          })}
        </g>


      </svg>
    </div>
  </>);
}
