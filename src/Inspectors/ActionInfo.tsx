import { useEffect, useState } from "react";
import { Query } from  "../Comms/generic";
import { Solution, Attack, useSettings } from "../Settings";
import RenderWorth from "../renderQValue";
import RenderPolicy from "../renderPolicy";
import { TransitionTable } from "./transitionTable";
import { findPolicyWithState, findPolicyWithStateAction, getAction, TreeNode } from "../Utility";
import { CanvasNode } from '../Canvas';



interface ExplanationResponse {
    FoilSolutions:Solution[];
    Histories:{[key: string]: History[]};
    Attacks:Attack[];
    Duration_Plan:number;
    Duration_MEHR:number;
    Duration_Total:number;
    Duration_Outs:number;
    Duration_Sols:number;
}

interface ActionInfoProps {
    nodeData: CanvasNode;
    expHandler: (data: ExplanationResponse, piIdx:number, stateID:number, actionLabel:string) => void
}


export function ActionInfo(props: ActionInfoProps) {
    const { currentPolicyIdx } = useSettings();
    const { jsonData } = useSettings();
    const { port } = useSettings();
    const { userType } = useSettings();
    
    const bestAction = getAction(currentPolicyIdx,props.nodeData.data.source_state,jsonData);
    // Is the source state in this policy (or any policy)
    const polsWithState:number[] = findPolicyWithState(props.nodeData.data.source_state, jsonData);
    const unDomPolsWithState = polsWithState.filter((piIdx)=>piIdx<jsonData.SolutionTotal);
    // The indices of policies with this action.
    const polsWithAction = findPolicyWithStateAction(props.nodeData.data.label, props.nodeData.data.source_state, jsonData);
    const unDomPolsWithAction = polsWithAction.filter((piIdx)=>piIdx<jsonData.SolutionTotal);  
    // Query for QValues
    const [actionsQValues, setActionsQValues] = useState(null);
    const [MEHR, setMEHR] = useState(null);
    const [explain, setExplain] = useState(null);
    const [loadingQValues, setLoadingQValues] = useState(false);
    const [loadingExplain, setLoadingExplain] = useState(false);
    const [error, setError] = useState(null);

    let expWorthPhrase = "Q-value";
    let paretoDomPhrase = "Pareto dominated with respect to all moral considerations";
    let paretoUnDomPhrase = "Pareto undominated with respect to all moral considerations";
    if (userType==="User") {
        expWorthPhrase = "expected worth";
        paretoDomPhrase = "worse by all moral considerations"
        paretoUnDomPhrase = "at least as good for some moral consideration"
    }

    useEffect(()=>{setActionsQValues(null); },[props.nodeData])

    const queryMEHR = async (piIDs) => {
        setLoadingQValues(true);
        setError(null);
        try {
            const request = {policy_ids: polsWithAction};
            const response = await fetch('http://localhost:18080/MEHR', {
                method: 'POST',
                headers: {
                'Content-Type': 'application/json'
                },
                body: JSON.stringify(request)
            });
            if (!response.ok) {
                throw new Error(`Server error: ${response.status}`);
            }
            const data = await response.json();
            setMEHR(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoadingQValues(false);
        }
    };
    const queryQValues = async () => {
        setLoadingQValues(true);
        setError(null);
        try {
            const request = {state_id: props.nodeData.data.source_state};
            const response = await fetch('http://localhost:18080/QValues', {
                method: 'POST',
                headers: {
                'Content-Type': 'application/json'
                },
                body: JSON.stringify(request)
            });
            if (!response.ok) {
                //throw new Error(`Server error: ${response.status}`);
            }
            const data = await response.json();
            setActionsQValues(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoadingQValues(false);
        }
    };
    
    const listPolicies = (piList:number[]) => {
        return piList.map((idx, i)=> <>
            <RenderPolicy id={idx}/>
            {i<piList.length-1 && ","}
        </>);
    }


    // Start with transitions
    let body = <>
        <h2>Action '{props.nodeData.data.label}' on State s_{props.nodeData.data.source_state}</h2>
        <h3>Action outcomes</h3>
        <TransitionTable transitions={jsonData.state_transitions[props.nodeData.data.source_state][props.nodeData.data.label]}/>
    </>;
    
    // header. Is action selected by current policy message
    body = <>{body}{ props.nodeData.data.policyAction==true ?
            <p>Action is selected by current policy <RenderPolicy id={currentPolicyIdx}/>.</p>
            :<p>The current policy <RenderPolicy id={currentPolicyIdx}/> selects {bestAction}, not this action.</p>
        }</>;
    
    body = <>{body}
        <h3>Use in policies</h3>
    </> 


    // No policies with ancestor state message
    if (polsWithState.length===0) {
        body = <> {body}
            <p>No policies reach this action's parent state s_{props.nodeData.data.source_state}.</p>
            <p>To find out why, query an earlier, ancestor action.</p>
        </>;
    } 
    else if (polsWithAction.length === 0) {
        body = <> {body}
            <p>The parent state s_{props.nodeData.data.source_state} is used by {polsWithState.length} policies: 
                ({listPolicies(polsWithState)}).</p>
            <p>No such policies use this action.</p>
        </>
    }
    else {
        body = <> {body}
            <p>The parent state s_{props.nodeData.data.source_state} appears in {polsWithState.length} policies: ({listPolicies(polsWithState)}).</p>
            <p>Of those policies, {unDomPolsWithState.length} of them are {paretoUnDomPhrase}: ({listPolicies(unDomPolsWithState)})</p>
            <p>{polsWithAction.length} policies use this action ({listPolicies(polsWithAction)}).</p>
            <p>{unDomPolsWithAction.length} are {paretoUnDomPhrase}: ({listPolicies(unDomPolsWithAction)})</p>

        </>
    }

    if (bestAction !== props.nodeData.data.label)
    body = <>{body}
        <button onClick={queryQValues} disabled={!!actionsQValues}>
                Why action <RenderPolicy id={currentPolicyIdx} noClick={true}/>(s_0)={bestAction}  on state s_{props.nodeData.data.source_state} rather than action '{props.nodeData.data.label}'?
        </button>
    </>


    if (actionsQValues) {
        if (unDomPolsWithState.length===0) {
            body=<>{body}Some ancestor action's {expWorthPhrase} was {paretoDomPhrase}.</>
        }
        else if (unDomPolsWithAction.length===0) {
            body=<>{body}The agent did not explore this action as its {expWorthPhrase} was {paretoDomPhrase}.</>
        } else {
            body=<>{body}This action's {expWorthPhrase} was not {paretoDomPhrase}. Action {bestAction} was selected by MEHR.</>
        }
        body = <>{body}
            <h4>{expWorthPhrase} selection for source state s_{props.nodeData.data.source_state}:</h4>
            <table className="myTable">
                <thead>
                <tr>
                    <th>Action</th>
                    <th>Worth</th>
                    <th>Undominated?</th>
                </tr>
                </thead>
                <tbody>
                { Object.keys(actionsQValues).map((act_id) => (
                    <tr key={'row_' + act_id} className="border-t">
                        <td key={'action_' + act_id}>{act_id}</td>
                        <td key={'qval_' + act_id}>
                            {Object.keys(actionsQValues[act_id]["QValues"]).map(qv => (<>
                                <RenderWorth worth={actionsQValues[act_id]["QValues"][qv]["Value"]}/>
                            </>))}
                        </td>
                        <td key={'isUnDom_' + act_id}>{actionsQValues[act_id]["containsUndominated"] ? "true" : "false"}</td>
                    </tr>
                ))}
                </tbody>
            </table>
        </>;
    }
    
    // Add MEHR button
    if (polsWithState.includes(currentPolicyIdx) && actionsQValues && !explain) {
        body = <>{body}
            <button onClick={()=>{
                    let req = {state_id: props.nodeData.data.source_state, actionLabel: props.nodeData.data.label, factPolicyIdx: currentPolicyIdx};
                    let handleResp = (data)=>{props.expHandler(data, currentPolicyIdx, props.nodeData.data.source_state, props.nodeData.data.label);}
                    let handleStart = ()=>{setLoadingExplain(true);setError(null);};
                    let handleFinally = ()=>{setLoadingExplain(false);};
                    Query("Explain", port, req, handleResp, handleStart, handleFinally);
                }}>
                    See MEHR.
            </button>
        </>
    }

    return body;
}