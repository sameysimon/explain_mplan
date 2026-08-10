import { useState, useEffect, type MouseEvent as ReactMouseEvent } from 'react';
import WinBox from 'react-winbox';
import { Attack, useSettings } from "../Settings.tsx";
import RenderPolicy from '../Renderers/RenderPolicy';
import RenderWorth from '../Renderers/RenderWorth.tsx';
import { RoundProb } from '../DisplayInfo/RenderProbability.js';


export default function PolicyHistories(props:{policyIdx:number, onClose?:()=>void}) {
    const [box, setBox] = useState({
        x: "center" as string | number,
        y: 30 as string | number,
        width: Math.min(window.innerWidth * 0.5,500),
        height: Math.min(window.innerHeight * 0.5,600),
    });
    const { jsonData, setJsonData, fetchHistories } = useSettings();
    const { highlightFn, highlights, setHighlights } = useSettings();


    const mouseEnter = (_e: ReactMouseEvent<HTMLElement>, pi:number, h:number, isProb=false) => {
        let hlt = {piIdx: pi, hIdx:h, value: true, setInState: false, isProb:isProb};
        highlightFn(hlt);
    }
    const mouseLeave = (_e: ReactMouseEvent<HTMLElement>, pi:number, h:number, isProb=false) => {
        let hlt = {piIdx: pi, hIdx:h, value: false, setInState: false, isProb:isProb};
        highlightFn(hlt);
    }
    const getHistoryHandlers = (piIdx:number, hIdx:number, isProb=false) => {
        let cName="highlighted";
        if (-1===highlights.findIndex((item:any) => item.piIdx===piIdx && item.hIdx===hIdx&& item.type==="history")) {
            cName="";
        }
        return {
            onMouseEnter: (e: ReactMouseEvent<HTMLElement>) => {mouseEnter(e, piIdx, hIdx, isProb)},
            onMouseLeave: (e: ReactMouseEvent<HTMLElement>) =>{mouseLeave(e, piIdx, hIdx, isProb)},
            className: cName};
    }

    let cumulative_prob = 0;
    let body = <></>;
    if (jsonData.Histories[props.policyIdx]===undefined) {
        fetchHistories([props.policyIdx]);
        body = <>Loading Trajectories...</>;
    } else {
    body = <div className='ContentBox'>
        <h2>What trajectories come from policy <RenderPolicy id={props.policyIdx} noClick />? </h2>
        <table className="myTable">
        <thead>
        <tr>
            <th>Worth</th>
            <th>Probability</th>
            <th>Cumulative<br/>Probability</th>
        </tr>
        </thead>
        <tbody>
            {[...jsonData.Histories[props.policyIdx].keys()]
            .sort((i,j)=>{return -1 * (jsonData.Histories[props.policyIdx][i].Probability - jsonData.Histories[props.policyIdx][j].Probability)})
            .map((idx) => {
                let h = jsonData.Histories[props.policyIdx][idx]
                cumulative_prob += h.Probability;
                return <tr 
                    id={`row_pi${props.policyIdx}_h${idx}`} 
                    style={{padding: "10px"}}
                    {...getHistoryHandlers(props.policyIdx, idx)} >
                    <td id={`row_pi${props.policyIdx}_h${idx}_cellProb`}>
                        <RenderWorth worth={h.Worth} />
                    </td>
                    <td id={`row_pi${props.policyIdx}_h${idx}_cellProb`}>
                        <RoundProb value={h.Probability} />
                    </td>
                    <td id={`row_pi${props.policyIdx}_h${idx}_cellCumProb`}>
                        <RoundProb value={cumulative_prob} />
                    </td>
                </tr>
            })}
        </tbody>
    </table>
    </div>;
    }
    
    return <WinBox title={`Policy ${props.policyIdx}`}
            x={box.x} y={box.y}
            width={box.width} height={box.height}
            onMove={(x, y) => {
                setBox(prev => ({...prev, x, y, }));
            }}
            onResize={(width, height) => {
                setBox(prev => ({...prev, width, height }));
            }}>
        {body}
    </WinBox>
};