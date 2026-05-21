import { useSettings } from "../../Settings";
import { SearchRescueGraph } from "./SearchRescueGraph.js";

export function StateInfo(props) {
    const { jsonData } = useSettings();
    let info;
    let isTags = true;
    try {
        let jsonString = props.nodeData.data.info
            .replace(/'/g, '"')
            .replace(/True/g, 'true')
            .replace(/False/g, 'false');
        info = JSON.parse(jsonString);
    } catch (e) {
        console.error("Failed to parse info as JSON", e);
        isTags = false;
    }
    let parentInfo = null;
    
    if (
    props.nodeData.parent &&
    props.nodeData.parent.parent &&
    props.nodeData.parent.parent.data &&
    props.nodeData.parent.parent.data.info
    ) {
    try {
        let parentInfoString = props.nodeData.parent.parent.data.info
        .replace(/'/g, '"')
        .replace(/True/g, 'true')
        .replace(/False/g, 'false');
        parentInfo = JSON.parse(parentInfoString);
    } catch (e) {
        parentInfo = null;
    }
    }

    let r = <h3>State {props.nodeData.data.id.toString()}</h3>
    if (jsonData.Domain==="SearchRescue" && isTags) {
        
        r = <>{r}
            <SearchRescueGraph info={info} />
        </>;
    }

    if (jsonData.Domain==="Titanic" && isTags) {
        let xRange = [...Array(5).keys().map(v => v - 2)];
        let yRange = [...Array(6).keys().map(v => v - 4)].reverse();
        r = <>{r}
            <p>Grid representation of titanic problem. Grey squares represent front (F) and back (B) of titanic.
                Red squares show the Titanic's location in the previous state. 
                White squares (I) show location of iceberg.
                White squares with an asterisk (*) show where the Titanic has hit the iceberg.</p>
            <ul>
                <li>Time={info['time']}</li>
                <li>Titanic bow (front) ({info['x-front']}, {info['y-front']})</li>
                <li>Titanic stern (back) ({info['x-back']}, {info['y-back']})</li>
            </ul>
            <table className="TitanicTable">
                <tbody>
                    <tr>
                        <td key={`state_origin`}>y\x</td>
                        {xRange.map(x => (<td key={`state_x_idx${x}`}>
                            {x}
                        </td>))}
                    </tr>
                {yRange.map(y => {
                    return <tr key={`state_row(${y})`}>
                         <td key={`state_y_idx(${y})`}>
                            {y}
                         </td>
                    {xRange.map(x => {
                        let colour = "blue";
                        let label = "-";
                        if (parentInfo && parentInfo["x-front"]===x && parentInfo["y-front"]===y) {
                            colour = "red";
                        }
                        if (parentInfo && parentInfo["x-back"]===x && parentInfo["y-back"]===y) {
                            colour = "red";
                        }
                        if (info["x-front"]===x && info["y-front"]===y) {
                            colour = "grey";
                            label="F";
                        }
                        if (info["x-back"]===x && info["y-back"]===y) {
                            colour = "grey";
                            label="B";
                        }
                        info['iceberg'].forEach(c => {
                            if (x===c[0] && y===c[1]) {
                                colour = "white";
                                if (label==="F" || label==="B") {
                                    label="*"
                                } else {
                                    label="I";
                                }
                            }
                            
                        });

                        
                        return <td key={`state_cell(${x},${y})`} style={{backgroundColor: colour}}>
                            {label}
                        </td>
                    })}
                    </tr>
                })}
                </tbody>
            </table>
        
        </>
    }

    return <div className="ContentBox">{r}
        {isTags &&
            <table>
            <thead>
                <tr className="bg-gray-100">
                <th className="border px-4 py-2 text-left">Feature</th>
                <th className="border px-4 py-2 text-left">Value</th>
                </tr>
            </thead>
            <tbody>
                {Object.entries(info).map(([key, value]) => (
                    <tr key={key} className="border-t">
                    <td className="border px-4 py-2 font-semibold">{key}</td>
                    <td className="border px-4 py-2"
                        style={{
                            color:
                            parentInfo && String(value) !== String(parentInfo[key])
                                ? 'red'
                                : 'black'
                        }}
                        >
                        {String(value)}
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    }
    {!isTags && <p>There are no state tags.</p>}
    </div>
};