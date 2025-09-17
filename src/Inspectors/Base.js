import WinBox from 'react-winbox';
import { StateInfo } from './StateInfo.js';
import { EdgeInfo } from './EdgeInfo';
import { ActionInfo } from './ActionInfo';

export default function Inspector(props) {
    const width = 350;
    const height = window.innerHeight - (window.innerHeight/9);
    const xPos = window.innerWidth - width;
    if (props.edge !== "none") {
        return <WinBox id="InspectorEdge" title="Inspector" y="center" x={xPos} min={props.minimised} width={width} height={height} noClose >
            <EdgeInfo edgeData={props.edge} />
        </WinBox>
    }
    if (props.node === "none") {
        return <></>
    }
    if (props.node.data.type==="state") {
        return <WinBox id="InspectorState" title="Inspector" y="center" x={xPos} min={props.minimised} width={width} height={height} noClose >
            <StateInfo nodeData={props.node} />
        </WinBox>
    }
    if (props.node.data.type==="action") {
        return <WinBox id="InspectorAction" title="Inspector" y="center" x={xPos} min={props.minimised} width={width} height={height}  noClose >
            <ActionInfo nodeData={props.node} expHandler={props.expHandler} />
        </WinBox>
    }
}
