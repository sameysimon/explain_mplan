import WinBox from 'react-winbox';
import PolicyTable from '../common/PolicyTable.js';
import { useSettings } from '../Settings.tsx';
import { useState, useEffect } from "react";
import { RoundProb } from '../common/RenderProbability.js';

type DetailsProps = {
    spacing: [number, number];
    setSpacing: React.Dispatch<React.SetStateAction<[number, number]>>;
    horizon: number;
    setHorizon:  React.Dispatch<React.SetStateAction<number>>;
    maxHorizon: number;
}

export default function FileDetails(props:DetailsProps) {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const [horizon, setHorizon] = useState(props.maxHorizon);
        const auxScaleX = (e) => {props.setSpacing([e.target.value, props.spacing[1]])};
        const auxScaleY = (e) => {props.setSpacing([props.spacing[0], e.target.value])};
        const auxHorizon = (e) => {
            setHorizon(e.target.value);
            props.setHorizon(e.target.value);
        };

    const { jsonData } = useSettings();
    return <>
        <WinBox title="Details" height={h * 0.4} width={w * 0.5} y="center" x={w - (w*0.5)} min={true} noClose={true} noFull={true} >
        
        <div className='ContentBox'>
            <h2>MDP Metadata</h2>
            <table className='myTable'>
                
                <tbody>
                    <tr><td>Domain</td> <td>{jsonData.Domain}</td></tr>
                    <tr><td>Proper Pareto Coverage Set Policies</td> <td>{jsonData.SolutionTotal}</td></tr>
                    <tr><td>Minimal Non-Acceptability Policies</td> <td>{jsonData.Num_Min_Non_Acceptability}</td></tr>
                    <tr><td>State-time Pairs</td> <td>{jsonData.Total_states}</td></tr>
                    <tr><td>Horizon</td> <td>{jsonData.Horizon}</td></tr>
                    <tr><td>AO* Expansions</td> <td>{jsonData.Iterations}</td></tr>
                    <tr><td>Backups</td> <td>{jsonData.Backups}</td></tr>
                    <tr><td>Expanded States</td> <td>{jsonData.Expanded} (<RoundProb value={(jsonData.Expanded / jsonData.Total_states) * 100} decimal_places={2}/>%)</td></tr>
                </tbody>
            </table>
            <h2>Processing details</h2>
            <table className='myTable'>
                <thead>
                    <tr><th>Process Stage</th>
                    <th>Duration (mi s)</th>
                    <th>Duration (s)</th>
                    <th>Duration %</th></tr>
                </thead>
                <tbody>
                    <tr>
                        <td>Planning Time</td>
                        <td>{jsonData.Duration_Plan}</td>
                        <td><RoundProb value={jsonData.Duration_Plan/1_000_000}/></td>
                        <td><RoundProb value={100 * jsonData.Duration_Plan/jsonData.Duration_Total}/></td>
                    </tr>

                    <tr>
                        <td>Solution Extraction Time</td>
                        <td>{jsonData.Duration_Sols}</td>
                        <td><RoundProb value={jsonData.Duration_Sols/1_000_000}/></td>
                        <td><RoundProb value={100 * jsonData.Duration_Sols/jsonData.Duration_Total}/></td>
                    </tr>
                    <tr>
                        <td>MEHR Time</td>
                        <td>{jsonData.Duration_MEHR}</td>
                        <td><RoundProb value={jsonData.Duration_MEHR/1_000_000}/></td>
                        <td><RoundProb value={100 * jsonData.Duration_MEHR/jsonData.Duration_Total}/></td>
                    </tr>
                    <tr>
                        <td>Total Time</td>
                        <td>{jsonData.Duration_Total}</td>
                        <td><RoundProb value={jsonData.Duration_Total/1_000_000}/></td>
                        <td><RoundProb value={100}/></td>
                    </tr>
                </tbody>
            </table>
            
            <h2>Graph Settings</h2>
            <label htmlFor="scaleX">X Scale:</label>
            <input name="scaleX" type="range" min="0.25" max="3" step="0.1" value={props.spacing[0]} onChange={auxScaleX} />
            <br/>
            <label htmlFor="scaleY">Y Scale:</label>
            <input name="scaleY" type="range" min="0.25" max="4" step="0.1" value={props.spacing[1]} onChange={auxScaleY} />
            <br/>

            <label htmlFor="maxHeight">Max Horizon (0 to {props.maxHorizon}):</label>
            <input name="maxHeight" type="number" min="0" max={props.maxHorizon.toString()} onChange={auxHorizon} value={horizon} />
        </div>
        </WinBox>
        </>
}