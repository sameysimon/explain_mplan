import WinBox from 'react-winbox';
import { useState, useEffect } from "react";

export default function GraphSettings(props) {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const [horizon, setHorizon] = useState(props.maxHorizon);
    const auxScaleX = (e) => {props.setSpacing([e.target.value, props.spacing[1]])};
    const auxScaleY = (e) => {props.setSpacing([props.spacing[0], e.target.value])};
    const auxHorizon = (e) => {
        setHorizon(e.target.value);
        props.setHorizon(e.target.value);
    };

    return <>
        <WinBox title="Graph Settings" y="center" x="center" min noClose noFull  >
            <h2>Graph Settings</h2>
            
            <label htmlFor="scaleX">X Scale:</label>
            <input name="scaleX" type="range" min="0.25" max="3" step="0.1" value={props.spacing[0]} onChange={auxScaleX} />
            <br/>
            <label htmlFor="scaleY">Y Scale:</label>
            <input name="scaleY" type="range" min="0.25" max="4" step="0.1" value={props.spacing[1]} onChange={auxScaleY} />
            <br/>

            <label htmlFor="maxHeight">Max Horizon (0 to {props.maxHorizon}):</label>
            <input name="maxHeight" type="number" min="0" max={props.maxHorizon.toString()} onChange={auxHorizon} value={horizon} />
        </WinBox>
        </>
}