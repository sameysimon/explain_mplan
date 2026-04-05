import { useState, useEffect } from 'react';
import WinBox from 'react-winbox';
import { Attack, useSettings } from "../Settings.tsx";
import RenderPolicy from '../common/RenderPolicy.tsx';
import RenderWorth from '../common/RenderWorth.tsx';
import { RoundProb } from '../common/RenderProbability.js';


export default function PolicyHistories(props:{policyIdx:number}) {
    const { jsonData, setJsonData } = useSettings();
    let cumulative_prob = 0;
    return <WinBox title={`Policy ${props.policyIdx}`}>
        <h1>What histories from policy<RenderPolicy id={props.policyIdx} /> </h1>
        <table className="myTable">
        <thead>
        <tr>
            <th>History Idx</th>
            <th>Worth</th>
            <th>Probability</th>
            <th>Cumulative<br/>Probability</th>
        </tr>
        </thead>
        <tbody>
            {jsonData.Histories[props.policyIdx]
            .sort((i,j)=>{return i.Probability - j.Probability})
            .map((h, idx) => {
                cumulative_prob += h.Probability;
                return <tr id={`row_pi${props.policyIdx}_h${idx}`}>
                    <td id={`row_pi${props.policyIdx}_h${idx}_cellID`}>
                        {idx}
                    </td>
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

    </WinBox>
};