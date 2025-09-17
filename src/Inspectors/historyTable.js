import RenderWorth from "../renderQValue";
import { useSettings } from "../Settings";
import { getAction } from "../Utility.ts";



export function HistoryTable(props) {
    const { jsonData } = useSettings();
    console.log("policy history idx", props.policyIdx, props.historyIdx);

    let st = [0];
    let transitions = [];
    while (st.length > 0) {
        const state = st.pop();
        const a = getAction(props.policyIdx, state, jsonData);
        const tr = jsonData.state_transitions[state][a].filter((t)=> t[1] === jsonData.Histories[props.policyIdx][props.historyIdx].Path[transitions.length+1])[0];
        transitions.push(tr);
    }
    let p = 1;
    return <table className={"myTable"}>
        <thead>
            <tr>
                <th>Probability</th>
                <th>State ID</th>
                <th>Worth</th>
            </tr>
        </thead>
        <tbody>
            {transitions.map((v,i) => (
                <tr key={`tranTab_tr${i}`}>
                    <th key={`tranTab_tr${i}_prob`}>{p = p * v[0]}</th>
                    <th key={`tranTab_tr${i}_scr`}>{v[1]}</th>
                    <th key={`tranTab_tr${i}_worth`}>
                        <RenderWorth worth={v.slice(2)}/>
                    </th>
                </tr>
            ))}
            <tr>
                <th>"</th>
                <th>Total</th>
                <th><RenderWorth worth={jsonData.Histories[props.policyIdx][props.historyIdx].Worth}/> </th>
            </tr>
            
        </tbody>
    </table>
}