import { RenderState } from "../Renderers/RenderState.tsx";

export function StateInfo(props) {
    return <div className="ContentBox">
        <h3>State {props.nodeData.data.id.toString()}</h3>
        <RenderState nodeData={props.nodeData} />
    </div>


};