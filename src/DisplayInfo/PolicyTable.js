import { useSettings } from '../Settings.tsx';


export default function PolicyTable(props) {
    const { jsonData } = useSettings();
    //jsonData.Solutions[i].Expectation[val.Name]
    return <>
        <div className='policyTable'>
            <table className='myTable'>
            <thead>
                <tr>
                <th>Rank</th>
                {jsonData.Considerations.map((val, i) => (
                    <th key={i} >{val.Name}</th>
                ))}
                <th>Non-<br/>Accept</th>
                </tr>
            </thead>
            <tbody>
                {jsonData.Solutions.map((val, sol_idx) => (
                    <tr key={"row" + sol_idx}>
                    <th key={sol_idx} >{sol_idx}</th>
                    {jsonData.Considerations.map((c, cIdx) => (
                        <th key={"th" + cIdx} >{val.Expectation[c.Name]}</th>
                    ))}
                    <th key={"na" + sol_idx} >{val["Non-Acceptability"]}</th>
                    </tr>
                ))}
                
            </tbody>
         </table>
        </div>
        </>
}