import { useSettings } from './Settings.tsx';


export default function PolicyTable(props) {
    const { jsonData } = useSettings();
    //jsonData.solutions[i].Expectation[val.Name]
    return <>
        <div className='policyTable'>
            <table className='myTable'>
            <thead>
                <tr >
                <th >Rank</th>
                {jsonData.theories.map((val, i) => (
                    <th key={i} >{val.Name}</th>
                ))}
                <th >Non-Acceptability</th>
                </tr>
            </thead>
            <tbody>
                {jsonData.solutions.map((val, sol_idx) => (
                    <tr key={"row" + sol_idx}>
                    <th key={sol_idx} >{sol_idx}</th>
                    {jsonData.theories.map((t, th_i) => (
                        <th key={"th" + th_i} >{val.Expectation[t.Name]}</th>
                    ))}
                    <th key={"na" + sol_idx} >{val["Non-Acceptability"]}</th>
                    </tr>
                ))}
                
            </tbody>
         </table>
        </div>
        </>
}