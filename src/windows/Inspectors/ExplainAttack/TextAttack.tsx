import RenderWorth from '../../../common/RenderWorth';
import { useSettings } from '../../../Settings';
import 'katex/dist/katex.min.css';
import { getConsiderations } from '../../../Utility';
import RenderProb from '../../../common/RenderProbability';
import { CriticalQuestions } from './CriticalQuestions.tsx';
import { InlineMath } from 'react-katex';
import RenderPolicy from '../../../common/RenderPolicy.tsx';



export default function ArgumentAttack(props:any) {
    const { jsonData } = useSettings();
    let thName = jsonData.Theories[props.attack.Theory].Name;
    let considers = getConsiderations(thName, jsonData);

    let sourcePolicyWorth = <RenderWorth worth={jsonData.Solutions[props.attack.SourcePolicyIdx].Expectation}  />;
    let targetPolicyWorth = <RenderWorth worth={jsonData.Solutions[props.attack.TargetHistoryIdx].Expectation} />;
    let sourceHistoryWorth = <RenderWorth worth={jsonData.Histories[props.attack.SourcePolicyIdx][props.attack.SourceHistoryIdx].Worth} considerations={considers} />;
    let targetHistoryWorth = <RenderWorth worth={jsonData.Histories[props.attack.TargetPolicyIdx][props.attack.TargetHistoryIdx].Worth} considerations={considers} />;
    let sourceHistoryProbability = <RenderProb piIdx={props.attack.SourcePolicyIdx} hIdx={props.attack.SourceHistoryIdx} data={jsonData}/>;
    let targetHistoryProbability = <RenderProb piIdx={props.attack.TargetPolicyIdx} hIdx={props.attack.TargetHistoryIdx} data={jsonData}/>;

    return <>
    <div className="argument">
        By {thName}, 
        it was right to do policy <RenderPolicy id={props.attack.SourcePolicyIdx} /> from the perspective of a history worth {sourceHistoryWorth}, which has probability {sourceHistoryProbability}.
    </div>
    
    <p color='red'>ATTACKS</p>

    <div className="argument">
        By {thName}, 
        it was right to do policy <InlineMath math={`\\pi_{${props.attack.TargetPolicyIdx}}`}/>  from the perspective of a history worth {targetHistoryWorth}, which has probability {targetHistoryProbability}.
    </div>
    </>
}