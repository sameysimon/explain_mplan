import { useEffect, useState } from "react";
import { Query } from  "../../generic";
import { Solution, Attack, useSettings } from "../../Settings";
import RenderWorth from "../../common/RenderWorth";
import RenderPolicy from "../../common/RenderPolicy";
import { TransitionTable } from "./transitionTable";
import { findPolicyWithState, findPolicyWithStateAction, getAction, TreeNode } from "../../Utility";
import { CanvasNode } from '../../Canvas';

interface QValuesType {
    Value:any[];
    isUndominated: boolean;
}
interface ActionsQValuesType {
    containsUndominated: boolean;
    QValues: QValuesType[];
    indexOfUndominated:number[];
}

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
    setPolicy: any
}


export function ActionInfo(props: ActionInfoProps) {
    const { currentPolicyIdx } = useSettings();
    const { jsonData, setJsonData } = useSettings();
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
    const [allActionsQValues, setActionsQValues] = useState<{[key:string]: ActionsQValuesType}>(null);
    const [necessaryPolicies, setNecessaryPolicies] = useState<number[]>([]);
    const [cause, setCause] = useState<string>(null);

    let expWorthPhrase = userType==="User" ? "expected worth" : "Q-value";
    
    useEffect(()=>{
        // On new new action node, check cache for Action_cause
        setActionsQValues(null);
        setNecessaryPolicies(null);
        let c = jsonData.Action_cause[String(props.nodeData.data.source_state)]?.[props.nodeData.data.label];
        // If the action was cached, use it
        if (c) {
            setCause(c);
            return;
        }
        if (polsWithState.length === 0) {
            setCause("Ancestor");
            return;
        }
        // If it is the current action, then can set to Chosen.
        if (props.nodeData.data.policyAction) {
            let j = {...jsonData};
            if (!j.Action_cause[String(props.nodeData.data.source_state)]) {
                j.Action_cause[String(props.nodeData.data.source_state)] = {};
            }
            j.Action_cause[String(props.nodeData.data.source_state)][props.nodeData.data.label] = "Chosen";
            setJsonData(jsonData);
            setCause("Chosen");
            return;
        }
        // Counter-factual action, need to query the planner for the action
        Query("QueryFoilAction", port,
            {
                'state_id': props.nodeData.data.source_state, 
                'action_label': props.nodeData.data.label,
                'factPolicyIdx': currentPolicyIdx
            },
            (d)=>{
                let j = {...jsonData};
                if (!j.Action_cause[String(props.nodeData.data.source_state)]) {
                    j.Action_cause[String(props.nodeData.data.source_state)] = {};
                }
                j.Action_cause[String(props.nodeData.data.source_state)][props.nodeData.data.label] = d['type'];
                setJsonData(jsonData);
                setCause(d['type']);
            }
        );
        // if all fails, then it stays as ... (most likely loading the action)
        
    },[props.nodeData, currentPolicyIdx])

    //
    // Query Callbacks
    //
    const queryQValues = async () => {
        Query("QValues", port, {state_id: props.nodeData.data.source_state}, 
            (d)=>{setActionsQValues(d);}
        );
    };
    const queryMEHR = async () => {
        Query("GetNeccMEHR", port,
            {
                state_id: props.nodeData.data.source_state,
                actionLabel: props.nodeData.data.label,
                factPolicyIdx: currentPolicyIdx
            }, 
            (d)=>{
                props.expHandler(d, currentPolicyIdx, props.nodeData.data.source_state, props.nodeData.data.label)
            }
        );
    }
    const planLocked = () => {
        if (cause==="Chosen" || cause==="MEHR Preference") {
            return;
        }
       let neccPolsInd = jsonData.Solutions.reduce(((out, sol, solIdx)=> {
            if (sol.Action_Map[props.nodeData.data.source_state]===props.nodeData.data.label) out.push(solIdx);
            return out;
        }), [] as number[]);

        if (neccPolsInd.length>1) {
            setNecessaryPolicies(neccPolsInd);
            return;
        }

        Query("Explain",port,
            {
                state_id: props.nodeData.data.source_state,
                actionLabel: props.nodeData.data.label,
                factPolicyIdx: currentPolicyIdx
            },
            (d)=> {
                let newJSON = JSON.parse(JSON.stringify(jsonData));
                let neccPolsInd_ = [];
                for (let key in d.FoilSolutions) { 
                    let v = parseInt(key);
                    newJSON["Solutions"][v] = d.FoilSolutions[v];
                    newJSON["Histories"][v] = d.Histories[v];
                    newJSON["Attacks"][v] = d.Attacks[v];
                    neccPolsInd_.push(v);
                };
                setJsonData(newJSON);
                setNecessaryPolicies(neccPolsInd_);
            }
        );
    }
    //
    // Formatting functions
    // 
    const listPolicies = (piList:number[]) => {
        let x = piList.slice(0,5).map((idx, i)=> <>
            <RenderPolicy id={idx}/>
            {i<piList.length-1 && ","}
        </>);
        if (piList.length>5) {
            return <>{x} and {piList.length - 5} more</>
        }
        return x; 
    }

    // Causal category    
    // Main information + transitions
    let body = <>
        <h2>Action '{props.nodeData.data.label}' on State s_{props.nodeData.data.source_state}</h2>
        <h3>Action outcomes</h3>
        <TransitionTable transitions={jsonData.State_transitions[props.nodeData.data.source_state][props.nodeData.data.label]}/>
        <h3>Use in policies:</h3>
        {polsWithState.length===0 ?
            <p>
                No policies reach this action's parent state s_${props.nodeData.data.source_state}. 
                To find out why, query an earlier, ancestor action.
            </p>
            :
            <p>
                The parent state s_{props.nodeData.data.source_state} is used by {polsWithState.length} policies: 
                ({listPolicies(polsWithState)}).
            </p>
        }
        {polsWithAction.length+polsWithState.length>0 &&
            <>
            { props.nodeData.data.policyAction==true ?
                <p>Action is selected by current policy <RenderPolicy id={currentPolicyIdx}/>.</p> :
                <p>The current policy <RenderPolicy id={currentPolicyIdx}/> selects '{bestAction}', not this action.</p>
            }
            </>
        }
        {props.nodeData.data.policyAction==false &&
            <button onClick={queryQValues} disabled={!!allActionsQValues}>
                Why action <RenderPolicy id={currentPolicyIdx} noClick={true}/>
                (s_{props.nodeData.data.source_state})={bestAction} rather than action '{props.nodeData.data.label}'?
            </button>
        }
        {allActionsQValues && <>
            <QValueTable 
                expWorthPhrase={expWorthPhrase}
                allActionsQValues={allActionsQValues}
                nodeData={props.nodeData}
                causeCategory={cause} />

            {cause && (cause.includes('Non-moral') || cause.includes('Pareto')) &&
                <button onClick={planLocked}>
                    { (cause==='Pareto Dominance') &&
                        `Why is action '${props.nodeData.data.label}' Pareto dominated?`
                    }
                    { cause=== 'Non-moral' &&
                        `Why is action '${props.nodeData.data.label}' over budget?`
                    }
                    { cause==='Pareto Dominance and Non-moral' &&
                        `Why is action '${props.nodeData.data.label}' Pareto dominated and over budget?`
                    }
                </button>
            }

            {cause && cause.includes('MEHR') &&
                <button onClick={queryMEHR}>
                    Why is action '{props.nodeData.data.label}' preferred by MEHR?
                </button>
            }
        </>
        }
        {necessaryPolicies && <>
            <p>Planning with this action '{props.nodeData.data.label}' finds {necessaryPolicies.length} counter-factual policies:</p>
            <table className="myTable">
            <thead><tr>
                <th>Policy</th>
                <th>Worth</th>
                {jsonData.Non_Moral!==-1 &&
                    <th>Over<br/>budget?</th>
                }
                <th>Visualise</th>
            </tr></thead>
            <tbody>{necessaryPolicies.map((pi_idx, i) => (<tr>
                    <td key={`necc_pols_pi_${i}`}> <RenderPolicy id={pi_idx} key={`necc_pols_rpi_${i}`} /> </td>
                    <td key={`necc_pols_w_${i}`}> <RenderWorth worth={jsonData.Solutions[pi_idx].Expectation} key={`necc_pols_rw_${i}`} /> </td>
                    {jsonData.Non_Moral!==-1 &&
                       <td key={`necc_pols_b_${i}`}>
                        {parseFloat(jsonData.Solutions[pi_idx].Expectation[jsonData.Non_Moral]) < (jsonData.Considerations[jsonData.Non_Moral].Budget*-1)
                                ? "true" : "false"}
                       </td>
                    }
                    <td key={`necc_pols_sh_${i}`}> <button onClick={() => {props.setPolicy(pi_idx);}} key={`necc_pols_sh_${i}`}>Show</button> </td>
            </tr>))}</tbody>
            </table>
            </>
        }
    </>;

    const causeToColour = (c) => {
        switch (c) {
            case 'False by MEHR':
            case 'User preference':
            case 'Equivalent':
                return 'orange';
            case 'Chosen':
                return 'green';
            case 'Ancestor':
                return 'gray'
            default:
                return 'red';
        }
    };

    return  <>
        <div className={"actionCause"} style={{backgroundColor: `${causeToColour(cause)}`}}>
            { cause==='Ancestor' && "Not Chosen By Ancestor" }
            { cause==='Equivalent' && "Equivalent to Current Policy" }
            { cause==='User preference' && "Not Chosen by User Preference" }
            { cause==='False by MEHR' && "Is preferred by MEHR" }
            { cause==='MEHR Preference' && "Not Chosen By MEHR Preference" }
            { cause==='Pareto Dominance' && "Not Chosen By Pareto Dominance" }
            { cause==='Non-moral' && "Not Chosen for Non-Morality" }
            { cause==='Pareto Dominance and Non-moral' && "Not Chosen for Pareto Dominance and Non-Morality" }
            { cause==='Chosen' && "Chosen Action" }
            
            { !cause && "..." }
        </div>
        <div className="ContentBox">
            {body}
        </div>
    </>;
    
}

interface ActionInfoProps {
    expWorthPhrase: string;
    nodeData: CanvasNode;
    allActionsQValues: {[key:string]: ActionsQValuesType};
    causeCategory: string;
}
function QValueTable(props) {
    const { jsonData } = useSettings();
    let r = <>
        <h4>{props.expWorthPhrase} selection for source state s_{props.nodeData.data.source_state}:</h4>
        <table className="myTable">
            <thead>
                <tr>
                    <th>Action</th>
                    <th>Worth</th>
                    <th>Contains<br/>undominated?</th>
                    {jsonData.Non_Moral!==-1 &&
                        <th>Over<br/>budget?</th>
                    }
                </tr>
            </thead>
            <tbody>
            { Object.keys(props.allActionsQValues).map((actLabel) => {
                let qVals = props.allActionsQValues[actLabel];
                let budget = jsonData.Non_Moral!==-1 ? jsonData.Considerations[jsonData.Non_Moral].Budget : 0;
                return <tr key={'row_'+actLabel} className="border-t">
                    <td key={'action_'+actLabel}>{actLabel}</td>
                    <td key={'qval_'+actLabel}>
                        {qVals.QValues.map((qv, i) => (<>
                            <RenderWorth key={'worth_'+actLabel} worth={qv.Value}/>
                            {i < qVals.QValues.length - 1 && ", " }
                        </>))}
                    </td>
                    <td key={'isUnDom_' + actLabel}>{qVals.containsUndominated ? "true" : "false"}</td>
                    {jsonData.Non_Moral!==-1 &&
                        <td key={'isOverBudget_' + actLabel}>
                            {qVals.QValues.every(qv=> qv.Value[jsonData.Non_Moral] < (budget*-1)) 
                                ? "true" : "false"}
                        </td>
                    }
                </tr>
            })}
            </tbody>
            </table>
    </>;
    return r;
}