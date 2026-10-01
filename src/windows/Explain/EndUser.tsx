import RenderWorth from '../../Renderers/RenderWorth.tsx';
import { useSettings } from '../../Settings.tsx';
import 'katex/dist/katex.min.css';
import { RoundProb } from '../../DisplayInfo/RenderProbability.js';
import {  Attack, JustifyProps } from './CriticalQuestions.tsx';
import RenderPolicy from '../../Renderers/RenderPolicy.tsx';
import ArgumentAttack from './TextAttack.tsx';
import RenderHistory from '../../Renderers/RenderHistory.tsx';
import { argmin, variance } from '../../Utility.ts';



export default function EndUserJustify(props:JustifyProps) {
    const { jsonData } = useSettings();
    
    let source_history_Worth = jsonData.Histories[props.attack.SourcePolicyIdx][props.attack.SourceHistoryIdx].Worth;
    let source_history_pr = jsonData.Histories[props.attack.SourcePolicyIdx][props.attack.SourceHistoryIdx].Probability;
    let target_history_Worth = jsonData.Histories[props.attack.TargetPolicyIdx][props.attack.TargetHistoryIdx].Worth;
    let target_history_pr = jsonData.Histories[props.attack.TargetPolicyIdx][props.attack.TargetHistoryIdx].Probability;

    let source_policy_Worth = Object.values(jsonData.Solutions[props.attack.SourcePolicyIdx].Expectation) as unknown[] as number[];
    let target_policy_Worth = Object.values(jsonData.Solutions[props.attack.TargetPolicyIdx].Expectation) as unknown[] as number[];
    
    

    return <>
        <h2>Attack Justification</h2>
        <ArgumentAttack attack={props.attack} />
        <h3>Dialogue Explanation</h3>
        <div className="chat">
            <div className="chat_bubble_container incoming">
                <div className="chat_bubble">
                    Policy <RenderPolicy id={props.attack.TargetPolicyIdx} /> is correct.
                </div>
            </div>
            <div className="chat_bubble_container outgoing">
                <div className="chat_bubble">
                    No, one outcome of the policy is worth <RenderWorth worth={target_history_Worth} considerations={props.considerations} /> by moral theory {props.theory}.
                    {props.theoryType==='Fairness' &&
                        <> The theory judges the variance between entities of {} unfair.</>
                    }
                    {props.theoryType==='Maximin' &&
                        <> The theory judges in favour of the worst-off entity {}, with moral worth {}.</>
                    }
                </div>
            </div>
            <div className="chat_bubble_container incoming">
                <div className="chat_bubble">
                    That's right. After the policy, that outcome will be considered acceptable.
                </div>
            </div>
            <div className="chat_bubble_container outgoing">
                <div className="chat_bubble">
                    No, it will not. The policy misses the outcome from policy <RenderPolicy id={props.attack.SourcePolicyIdx} />, worth <RenderWorth worth={source_history_Worth} considerations={props.considerations}/> which is preferred by {props.theory}.
                    {props.theoryType==='Fairness' &&
                        <> The variance between entities in that trajectory is {variance(source_history_Worth)} which is more fair.</>
                    }
                    {props.theoryType==='Maximin' &&
                        <> The worst-off entity in that trajectory is {jsonData.Considerations[argmin(source_history_Worth)].Name} with moral worth {Math.min(...source_history_Worth)}, which is preferable.</>
                    }
                </div>
            </div>
            <div className="chat_bubble_container incoming">
                <div className="chat_bubble">
                    That outcome may well be preferable, but is this foreseeable?
                </div>
            </div>
            <div className="chat_bubble_container outgoing">
                <div className="chat_bubble">
                    {((props.theoryType !=='Fairness') && (props.theoryType !== 'Maximin')) &&
                        <>
                            Yes, at decision-time <RenderPolicy id={props.attack.SourcePolicyIdx} /> expected <RenderWorth worth={source_policy_Worth} considerations={props.considerations}/> which is 
                            preferable to <RenderWorth worth={target_policy_Worth} considerations={props.considerations}/> expected by policy <RenderPolicy id={props.attack.TargetPolicyIdx} />.
                        </>
                    }
                    {props.theoryType==='Fairness' &&
                        <>
                            No, at decision-time <RenderPolicy id={props.attack.SourcePolicyIdx} /> expected <RenderWorth worth={source_policy_Worth} considerations={props.considerations}/> which is
                            with variance {variance(source_policy_Worth)}.
                            This is less fair than <RenderPolicy id={props.attack.TargetPolicyIdx} /> which expected <RenderWorth worth={target_policy_Worth} considerations={props.considerations}/>
                            with variance {variance(target_policy_Worth)}.
                        </>
                    }
                    {props.theoryType==='Maximin' &&
                        <>
                            No, at decision-time <RenderPolicy id={props.attack.SourcePolicyIdx} /> expected <RenderWorth worth={source_history_Worth} considerations={props.considerations}/> where 
                            {jsonData.Considerations[argmin(source_history_Worth)].Name} is the worst-off with {Math.min(...source_history_Worth)}.
                            This is more than <RenderPolicy id={props.attack.TargetPolicyIdx} />, which expected <RenderWorth worth={target_policy_Worth} considerations={props.considerations}/> where 
                            {jsonData.Considerations[argmin(target_policy_Worth)].Name} is the worst-off with {Math.min(...target_policy_Worth)}.
                        </>
                    }
                </div>
            </div>
        </div>
    </>

}
