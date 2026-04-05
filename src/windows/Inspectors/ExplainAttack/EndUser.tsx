import RenderWorth from '../../../common/RenderWorth';
import { useSettings } from '../../../Settings';
import 'katex/dist/katex.min.css';
import { RoundProb } from '../../../common/RenderProbability';
import {  Attack } from './CriticalQuestions.tsx';
import RenderPolicy from '../../../common/RenderPolicy.tsx';
import ArgumentAttack from './TextAttack';
import RenderHistory from '../../../common/RenderHistory.tsx';

type JustifyProps = {
    attack:Attack;
    theory:string;
    considerations:string[]
}

export default function EndUserJustify(props:JustifyProps) {
    const { jsonData } = useSettings();
    
    let source_history_Worth = jsonData.Histories[props.attack.SourcePolicyIdx][props.attack.SourceHistoryIdx].Worth;
    let source_history_pr = jsonData.Histories[props.attack.SourcePolicyIdx][props.attack.SourceHistoryIdx].Probability;
    let target_history_Worth = jsonData.Histories[props.attack.TargetPolicyIdx][props.attack.TargetHistoryIdx].Worth;
    let target_history_pr = jsonData.Histories[props.attack.TargetPolicyIdx][props.attack.TargetHistoryIdx].Probability;
    return <>
        <h2>Justification</h2>
        <ArgumentAttack attack={props.attack} />
        <h3>Dialogue Explanation</h3>
        <div className="chat">
            <div className="chat_bubble_container incoming">
                <div className="chat_bubble">
                    The system should do policy <RenderPolicy id={props.attack.TargetPolicyIdx} />.
                </div>
            </div>
            <div className="chat_bubble_container outgoing">
                <div className="chat_bubble">
                    No, that policy has a {<RoundProb value={target_history_pr}/>} probability of history {<RenderHistory policyIdx={props.attack.TargetPolicyIdx} historyIdx={props.attack.TargetHistoryIdx} />}, 
                    worth <RenderWorth worth={target_history_Worth} considerations={props.considerations} />, considered by moral theory '{props.theory}'.
                </div>
            </div>
            <div className="chat_bubble_container incoming">
                <div className="chat_bubble">
                    This may be the most preferable history by moral theory {props.theory}.
                </div>
            </div>
            <div className="chat_bubble_container outgoing">
                <div className="chat_bubble">
                    No, from the perspective of that history end-point, there would be negative retrospection for missing policy <RenderPolicy id={props.attack.SourcePolicyIdx} />.
                    It has a <RoundProb value={source_history_pr}/> probability of 
                    history <RenderHistory policyIdx={props.attack.SourcePolicyIdx} historyIdx={props.attack.TargetHistoryIdx} /> worth <RenderWorth worth={source_history_Worth} considerations={props.considerations}/> by {props.theory}.
                </div>
            </div>
            <div className="chat_bubble_container incoming">
                <div className="chat_bubble">
                    That history may well be preferable, but was this foreseeable? Perhaps other histories would make <RenderPolicy id={props.attack.TargetPolicyIdx} /> preferable at decision-time.
                </div>
            </div>
            <div className="chat_bubble_container outgoing">
                <div className="chat_bubble">
                    No, at decision-time <RenderPolicy id={props.attack.SourcePolicyIdx} /> expected <RenderWorth worth={source_history_Worth} considerations={props.considerations}/> which is 
                    preferable to <RenderWorth worth={target_history_Worth} considerations={props.considerations}/> expected by policy <RenderPolicy id={props.attack.TargetPolicyIdx} />.
                </div>
            </div>
        </div>
    </>

}
