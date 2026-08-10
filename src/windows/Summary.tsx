import { useState, useEffect } from 'react';
import WinBox from 'react-winbox';
import { Attack, useSettings } from "../Settings.tsx";
import RenderWorth from '../Renderers/RenderWorth.tsx';
import { Query } from '../generic.js';
import RenderPolicy from '../Renderers/RenderPolicy';
import RenderHistory from '../Renderers/RenderHistory.tsx';
import PolicyHistories from './ShowHistories.tsx';
import { RoundProb } from '../DisplayInfo/RenderProbability.js';

export default function Summary(props:{ setPolicy:(a:number)=>void}) {
    const [box, setBox] = useState({
        x: "center" as string | number,
        y: 30 as string | number,
        width: window.innerWidth * 0.5,
        height: 'fit-content',
    });
    const { jsonData, setJsonData, userType } = useSettings();
    const [ showHistories, setShowHistories ] = useState(-1);

    
    return <WinBox title={"General Summary"}
        x={'center'} y={50}
        width={Math.min(window.innerWidth, 720) } height={620}
        >
        <div className="ContentBox">
        <h2>What did the system decide?</h2>
        <p>
            This {jsonData.Domain && ` ${jsonData.Domain}`} problem has {jsonData.Total_states} state-time pairs and a horizon of {jsonData.Horizon}.
        </p>
        <p>
            The stakeholder has credence in {jsonData.Theories.length} moral theories
            {jsonData.Total_Ranks > 1 ?
                <> ordered by {jsonData.Total_Ranks} <i>weak lexicographic ranks</i>. </> 
                : 
                ". "
            }
            {jsonData.Non_Moral !== -1 ?
                `
                The moral theories are informed by ${jsonData.Considerations.length - 1} moral considerations.
                There is also a non-moral consideration with ${jsonData.Goals?.length ?? 0} goal states and a budget of ${jsonData.Considerations[jsonData.Non_Moral].Budget}.`
                :
                `The moral theories are informed by ${jsonData.Considerations.length} moral considerations.`
            }
        </p>
        <table className="myTable">
        <thead>
            <tr>
                <th>Moral Theory</th>
                <th>Rank</th>
                <th>Moral Consideration</th>
                <th>Consideration Type</th>
            </tr>
        </thead>
        <tbody>
            {jsonData.Theories.slice().sort((a,b) => a.Rank - b.Rank).map((mt, thIdx) => {
                const cons = jsonData.Considerations.filter(c => c.Component_of.includes(mt.Name));
                const rowCount = cons.length;

                const groupBg = thIdx % 2 === 0 ? '#ffffff' : '#f2f7ff';

                return cons.map((c, conIdx) => (
                    <tr key={`thy${thIdx}_conRow${conIdx}`} style={{backgroundColor:groupBg}}>
                        {/* Only render these cells for the first consideration in the group */}
                        {conIdx === 0 && (
                            <>
                                <td rowSpan={rowCount}>{String(mt.Name)}</td>
                                <td rowSpan={rowCount}>{mt.Rank}</td>
                            </>
                        )}
                        
                        {/* These cells render for every single row */}
                        <td>{c.Name}</td>
                        <td>{c.Type}</td>
                    </tr>
                ));
            })}
        </tbody>
    </table>
        <p>
            The MMMDP is visualised in the <i>Graph Viewer</i> window.
            Blue circles represent states of the world; green triangles represent the current policy's selected actions; red triangles represent alternate actions.
            Select a policy with the dropdown or by clicking show in the table below.
        </p>
        
        <p>
            {jsonData.Min_non_accept > 0 &&
            <>There is <i>no completely accepted solution</i> to this problem. This is a generalised case of a <i>moral dilemma</i>. </>
            }
            {jsonData.Num_Min_Non_Acceptability > 1 &&
                <>There were {jsonData.Num_Min_Non_Acceptability} minimal non-acceptability policies. </>
            }
            Minimal non-acceptability policies are viewed in the table below.
        </p>
        {userType==='User' ?
        <p>
            <b>Note:</b> the set of moral policies is not complete.
            Policies that were expected to be no more preferable by all moral considerations were excluded.
            Policies with the same probabilities and outcomes in their histories may be excluded too.
        </p>
        :
        <p>
            <b>Note:</b> minimal non-acceptability is calculated from the Pareto Coverage Set of policies.
            Some policies with equal expected moral worth may be excluded.
        </p>
        }
        
        <table className="myTable">
            <thead>
                <tr>
                    <th>Policy</th>
                    <th>Worth</th>
                    <th>Non-<br/>Accept</th>
                    <th>Visualise</th>
                </tr>
            </thead>
            <tbody>
                {jsonData.Solutions_Order.slice(0, jsonData.Num_Min_Non_Acceptability).map((sol, solIdx)=> (
                    <tr key={`solSumRow${solIdx}`}>
                        <td key={`solSumRow${solIdx}_pi`}><RenderPolicy html_key={`solSumRow_${solIdx}_renderPolicy`} id={sol}/></td>
                        <td key={`solSumRow${solIdx}_worth`}><RenderWorth key={`solSumRow_${solIdx})renderPolicyExp`} worth={jsonData.Solutions[sol].Expectation}/></td>
                        <td key={`solSumRow${solIdx}_acc`}><RoundProb key={`solSumRow_${solIdx})roundProb`} value={jsonData.Solutions[sol].Acceptability} /></td>
                        <td key={`solSumRow${solIdx}_vis`}>
                            <button onClick={() => {props.setPolicy(sol);}}>Show</button>
                        </td>
                    </tr>
                ))}

                
            </tbody>
        </table>
        {userType==="Domain designer" &&
            <>
                <h3>Proper PF Policies:</h3>
                <table className="myTable">
                <thead>
                    <tr>
                        <th>Policy</th>
                        <th>Worth</th>
                        <th>Non-<br/>Accept</th>
                        <th>Visualise</th>
                    </tr>
                </thead>
                <tbody>
                {jsonData.Solutions_Order.slice(jsonData.Num_Min_Non_Acceptability)
                    .map((sol) => {
                    return <tr key={`pfSumRow${sol}`}>
                        <td key={`pfSumRow${sol}_pi`}><RenderPolicy html_key={`pfSumRow_${sol}_renderPolicy`} id={sol}/></td>
                        <td key={`pfSumRow${sol}_worth`}><RenderWorth key={`pfSumRow_${sol})renderPolicyExp`} worth={jsonData.Solutions[sol].Expectation}/></td>
                        <td key={`pfSumRow${sol}_acc`}><RoundProb key={`pfSumRow_${sol})roundProb`} value={jsonData.Solutions[sol].Acceptability} /></td>
                        <td key={`pfSumRow${sol}_vis`}>
                            <button onClick={() => {props.setPolicy(sol);}}>Show</button>
                        </td>
                    </tr>
                })}
                </tbody>
                </table>
            </>
        }


        {showHistories !== -1 &&
            <PolicyHistories policyIdx={showHistories} />
        }
        
    </div>
    </WinBox>
}