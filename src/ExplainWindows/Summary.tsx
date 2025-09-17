import { useState, useEffect } from 'react';
import WinBox from 'react-winbox';
import { Attack, useSettings } from "../Settings.tsx";
import RenderWorth from "../renderQValue.js"
import { Query } from '../Comms/generic.js';
import RenderPolicy from '../renderPolicy.tsx';
import RenderHistory from '../RenderHistory.tsx';

export default function Summary() {
    const { jsonData, setJsonData } = useSettings();
    const { port, setPort } = useSettings();
    const [ attacks, setAttacks] = useState<Attack[]>([]);
    const [ loadState, setLoadState ] = useState<'notStarted'|'done'|'loading'>('notStarted');
    if (jsonData.solutions[0].Acceptability===0 && loadState==='notStarted') {
        Query("GetPolicyAttacks",port,{policyIdx:0},
        (resp)=>{setAttacks(resp);},
        ()=>{setLoadState('loading');},
        ()=>{setLoadState('done')});
    }
    let attackedTheories= new Set<string>();
    let attackedHistories = new Set<number>();
    if (attacks.length>0) {
        attacks.map(att=> {
            attackedHistories.add(att.TargetHistoryIdx);
            attackedTheories.add(jsonData.theories[att.Theory].Name);
        });
    }
    let minNaccIdx=0;
    for (let i = 1; i < jsonData.solutions.length; i++) {
        if (jsonData.solutions[i].Acceptability < jsonData.solutions[minNaccIdx].Acceptability) {
            minNaccIdx = i;
        }
    }

    
    return <WinBox title='Summary' >
        <h2>What did the system decide?</h2>
        <p>Selected policy <RenderPolicy id={minNaccIdx}/> has {jsonData.solutions[minNaccIdx].Acceptability} non-acceptability and expected worth <RenderWorth worth={jsonData.solutions[0].Expectation}/></p>
        <p>
            The policy is visualised in the Graph Viewer window.
            Blue circles represent stats of the world; green triangles represent the policy's selected actions.
        </p>
        {(loadState==='notStarted' || attacks.length===0) && 
            <p>There are no attacks on this policy.</p>
        }
        {loadState==='loading' && 
            <p>Loading attacks...</p>
        }
        { attacks.length > 0 && 
            <ul>
                <li>Attacked by {attackedTheories.size} theories:
                    {attackedTheories.keys.toString()}
                </li>
                <li>Attacked for histories:
                    {Array.from(attackedHistories)
                        .sort((i,j)=>{return jsonData.Histories[0][i].Probability - jsonData.Histories[0][j].Probability})
                        .slice(0,4)
                        .map(v=>(<>
                            <RenderWorth worth={jsonData.Histories[0][v].Worth} />
                            with probability {jsonData.Histories[0][v].Probability}
                        </>))
                    }
                </li>
            </ul>
        }
        <table className="myTable">
            <thead>
                <tr>
                    <th>Policy</th>
                    <th>Worth</th>
                    <th>Non-Acceptability</th>
                </tr>
            </thead>
            <tbody>
                {jsonData.solutions_order.map((solIdx)=> (
                    <tr key={`solSumRow${solIdx}`}>
                        <td key={`solSumRow${solIdx}_pi`}><RenderPolicy id={solIdx}/></td>
                        <td key={`solSumRow${solIdx}_worth`}><RenderWorth worth={jsonData.solutions[solIdx].Expectation}/></td>
                        <td key={`solSumRow${solIdx}_acc`}>{jsonData.solutions[solIdx].Acceptability}</td>
                    </tr>
                ))}

                
            </tbody>
        </table>


    </WinBox>
}