import { RoundProb } from "./RenderProbability.js";
import RenderWorth from "../Renderers/RenderWorth.tsx";
import { useSettings } from "../Settings.tsx";


export function TransitionTable(props) {
    const { jsonData } = useSettings();
    let transitions = jsonData.State_transitions[props.source_state][props.action_label]
    return <table className={"myTable"}>
        <thead>
            <tr>
                <th>Probability</th>
                <th>Successor</th>
                <th>Worth</th>
            </tr>
        </thead>
        <tbody>
            {transitions.map((v,i) => (
                <tr key={`tranTab_tr${i}`}>
                    <th key={`tranTab_tr${i}_prob`}><RoundProb value={v[0]} /></th>
                    <th key={`tranTab_tr${i}_scr`}>{v[1]}</th>
                    <th key={`tranTab_tr${i}_worth`}>
                        <RenderWorth worth={v.slice(2)}/>
                    </th>
                </tr>
            ))}
        </tbody>
    </table>
}