import { useState } from "react";
import WinBox from 'react-winbox';
import { getAction } from './Utility.ts';
import { InlineMath } from 'react-katex';
import 'katex/dist/katex.min.css';

export default function RenderProb(props) {
    const [ pWind, setPWind ] = useState(false);
    return <>
        <span className="probability" onClick={()=>{setPWind(!pWind)}} style={{color: props?.color ?? "inherit"}}>
            {props.jsonData.Histories[props.piIdx][props.hIdx]["Probability"]}
        </span>
        {pWind &&
            <ProbabilityWindow jsonData={props.jsonData} piIdx={props.piIdx} hIdx={props.hIdx} closeHandler={()=>{setPWind(false)}}/>
        }
        </>
        
}

function ProbabilityWindow(props) {

    let tab = [];
    let path = props.jsonData.Histories[props.piIdx][props.hIdx]["Path"]
    let c = 1;
    
    for (let i = 0; i < path.length - 1; i++) {
        let action = getAction(props.piIdx, path[i], props.jsonData);
        let p = props.jsonData.state_transitions[path[i]][action].find(tr => tr[1]===path[i+1])[0];
        c *= p;
        tab.push({
            src: path[i],
            tar: path[i+1],
            prb: p,
            cpr: c
        });
    }

    return <WinBox title={`Probability of h_${props.hIdx} | pi_${props.piIdx}`} onClose={props.closeHandler} className="probWindow">
        <p>Probability distribution over transitions in history <InlineMath math={`h_${props.hIdx}`}/> given <InlineMath math={`\\pi_${props.piIdx}`} /></p>
        <table className="myTable">
            <thead>
                <tr className="border-t">
                    <th>Source State</th>
                    <th>Target State</th>
                    <th>Probability</th>
                    <th>Cumulative Probability</th>
                </tr>
            </thead>
            <tbody>
                {tab.map((val,i) => (
                    <tr key={"tr_" + i}>
                        <td key={"td_1" + i}>
                            {val.src}
                        </td>
                        <td key={"td_2" + i}>
                            {val.tar}
                        </td> 
                        <td key={"td_3" + i}>
                            {val.prb}
                        </td>
                        <td key={"td_4" + i}>
                            {val.cpr}
                        </td>
                    </tr>

                ))}
            </tbody>
        </table>
    </WinBox>
}