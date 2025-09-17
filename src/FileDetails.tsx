import WinBox from 'react-winbox';
import PolicyTable from './PolicyTable.js';
import { useSettings } from './Settings.tsx';

export default function FileDetails() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const { jsonData } = useSettings();
    return <>
        <WinBox title="File Details" height={h * 0.4} width={w * 0.5} y="center" x={w - (w*0.5)} min={true} noClose={true} noFull={true} >
        <div className='fileDetails'>
            <p>Planning Time: {jsonData.duration_Plan}.</p>
            <p>Solution Extraction Time: {jsonData.duration_Sols}.</p>
            <p>Outcome Extraction Time: {jsonData.duration_Outs}.</p>
            <p>MEHR Time: {jsonData.duration_MEHR}.</p>
            <p>Total Time: {jsonData.duration_Total}</p>
            <br/>
            <p>Horizon: {jsonData.horizon}</p>
            <p>Iterations: {jsonData.Iterations}</p>
            <p>Backups: {jsonData.Backups}</p>
            <p>Expanded: {jsonData.Expanded}</p>
            <br/>
            <p>Minimum Non-Acceptability: {jsonData.min_non_accept}</p>
            
            <p>Total States: {jsonData.total_states}</p>
        </div>
        
        </WinBox>
        </>
}