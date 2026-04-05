import RenderWorth from "./RenderWorth.tsx";
import { useSettings } from "../Settings.tsx";
import { getAction } from "../Utility.ts";
import { RoundProb } from "./RenderProbability.js";

export function HistoryTable(props) {
    const { jsonData } = useSettings();
    let st = [0];
    let visited = [];
    let transitions = [];
    while (st.length > 0) {
        const state = st.pop();
        visited.push(state);
        const a = getAction(props.policyIdx, state, jsonData);
        const tr = jsonData.State_transitions[state]?.[a]?.filter((t)=> jsonData.Histories[props.policyIdx][props.historyIdx].Path.includes(t[1]))[0];
        if (tr) {
            transitions.push(tr);
            st.push(tr[1]);
        }
    }
    let p = 1;
    let prevState = 0;
    return <table className={"myTable"}>
        <thead>
            <tr>
                <th>Source</th>
                <th>Probability</th>
                <th>Target</th>
                <th>Worth</th>
            </tr>
        </thead>
        <tbody>
            {transitions.map((v,i) => {
                let r = <tr key={`tranTab_tr${i}`}>
                    <th key={`tranTab_tr${i}_src`}> {prevState} </th>
                    <th key={`tranTab_tr${i}_prob`}><RoundProb value={p = p * v[0]}/> </th>
                    <th key={`tranTab_tr${i}_scr`}>{v[1]}</th>
                    <th key={`tranTab_tr${i}_worth`}>
                        <RenderWorth worth={v.slice(2)}/>
                    </th>
                </tr>
                prevState = v[1];
                return r;
            })}
            <tr>
                <th>Total</th>
                <th></th>
                <th>Total</th>
                <th><RenderWorth worth={jsonData.Histories[props.policyIdx][props.historyIdx].Worth}/> </th>
            </tr>
            
        </tbody>
    </table>
}