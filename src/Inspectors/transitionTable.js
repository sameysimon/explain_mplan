import RenderWorth from "../renderQValue";

export function TransitionTable(props) {
    
    return <table className={"myTable"}>
        <thead>
            <tr>
                <th>Probability</th>
                <th>SuccessorID</th>
                <th>Worth</th>
            </tr>
        </thead>
        <tbody>
            {props.transitions.map((v,i) => (
                <tr key={`tranTab_tr${i}`}>
                    <th key={`tranTab_tr${i}_prob`}>{v[0]}</th>
                    <th key={`tranTab_tr${i}_scr`}>{v[1]}</th>
                    <th key={`tranTab_tr${i}_worth`}>
                        <RenderWorth worth={v.slice(2)}/>
                    </th>
                </tr>
            ))}
        </tbody>
    </table>
}