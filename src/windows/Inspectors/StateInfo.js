import { useSettings } from "../../Settings.tsx";
import { SearchRescueGraph } from "../../common/SearchRescueGraph.js";
import { RenderState } from "../../common/RenderState.tsx";

export function StateInfo(props) {
    return <div className="ContentBox">
        <h3>State {props.nodeData.data.id.toString()}</h3>
        <RenderState nodeData={props.nodeData} />
    </div>


};