import RenderWorth from '../../../common/RenderWorth';
import { useSettings } from '../../../Settings';
import 'katex/dist/katex.min.css';
import { InlineMath } from 'react-katex';
import { RoundProb } from '../../../common/RenderProbability';
import {  Attack, JustifyProps } from './CriticalQuestions.tsx';
import RenderPolicy from '../../../common/RenderPolicy.tsx';
import ArgumentAttack from './TextAttack';
import RenderHistory from '../../../common/RenderHistory.tsx';
import { argmin, variance } from '../../../Utility.ts';



export default function AlgorithmJustify(props:JustifyProps) {
    const { jsonData } = useSettings();
    
    let source_history_Worth = jsonData.Histories[props.attack.SourcePolicyIdx][props.attack.SourceHistoryIdx].Worth;
    let source_history_pr = jsonData.Histories[props.attack.SourcePolicyIdx][props.attack.SourceHistoryIdx].Probability;
    let target_history_Worth = jsonData.Histories[props.attack.TargetPolicyIdx][props.attack.TargetHistoryIdx].Worth;
    let target_history_pr = jsonData.Histories[props.attack.TargetPolicyIdx][props.attack.TargetHistoryIdx].Probability;

    let source_policy_Worth = Object.values(jsonData.Solutions[props.attack.SourcePolicyIdx].Expectation) as unknown[] as number[];
    let target_policy_Worth = Object.values(jsonData.Solutions[props.attack.TargetPolicyIdx].Expectation) as unknown[] as number[];
    
    return <>
        <h2>Critical Questions</h2> 
        <p>Argument Attack:</p>
        <InlineMath math={`(${props.theory}^{\\pi_{${props.attack.SourcePolicyIdx}}}_{h_${props.attack.SourceHistoryIdx}}) \\rightarrow (${props.theory}^{\\pi_{${props.attack.TargetPolicyIdx}}}_{h_${props.attack.TargetHistoryIdx}})`} />
        <p>For {props.theory}, attacks are defined by two Critical Questions:</p>
        <p><b>CQ1:</b> Does the target trajectory violate a moral principle where source does not?</p> 
            
            Yes.
            {props.theoryType !== 'Maximin' && props.theory !== 'Fairness' &&
                
                <div className='hCentre'>
                    <InlineMath math={`W^{h_{${props.attack.SourceHistoryIdx}}}[0](s_0) \\succ W^{h_{${props.attack.TargetHistoryIdx}}}[0](s_0)`} 
                     />
                    <br/>
                    <RenderWorth worth={source_history_Worth} considerations={props.considerations}/>
                    <InlineMath math={`\\succ`} /> 
                    <RenderWorth worth={target_history_Worth} considerations={props.considerations}/>
                    <br/>

                    {(props.theoryType === 'Utility' && props.considerations.length > 1) && <>
                        <RenderWorth worth={source_history_Worth} considerations={props.considerations} combineDefault={0} combine={(a,b)=>{return parseFloat(a)+parseFloat(b);}}/>
                        <InlineMath math={`\\succ`} /> 
                        <RenderWorth worth={target_history_Worth} considerations={props.considerations} combineDefault={0} combine={(a,b)=>{return parseFloat(a)+parseFloat(b);}}/>
                    </>}
                </div>
            }
            {props.theory === 'Maximin' &&
                <div className='hCentre'>
                    <InlineMath math={`CQ1_{${props.theory} = \\min_{c_i \\in C^{${props.theory}}}} \\vec{W}^{h_{${props.attack.SourceHistoryIdx}}_{i}[0](s_0)
                        >
                        \\min_{c_i \\in C^{${props.theory}}}} \\vec{W}^{h'_{${props.attack.TargetHistoryIdx}}_{i}[0](s_0)`} 
                     />
                    <br/>
                    <InlineMath math={`CQ1_{${props.theory} = \\min`} /> 
                    <RenderWorth worth={source_history_Worth} considerations={props.considerations}/>
                    <InlineMath math={`>`} /> 
                    <InlineMath math={`\\min`} /> 
                    <RenderWorth worth={target_history_Worth} considerations={props.considerations}/>
                    <br/>
                    <InlineMath math={`CQ1_{${props.theory} = ${argmin(source_history_Worth)}  \\succ_{${props.theory}} ${argmin(target_history_Worth)}`} /> 
                    <br/>
                </div>
            }
            {props.theory === 'Fairness' &&
                <div className='hCentre'>
                    <InlineMath math={`CQ1_{${props.theory} = \\frac{\\sum_{c_i \\in C^{${props.theory}}} (\\vec{W}^{h_{${props.attack.SourceHistoryIdx}}_{i}[0](s_0) - \\mu}{|C^{${props.theory}}|}
                        >
                        \\frac{\\sum_{c_i \\in C^{${props.theory}}} (\\vec{W}^{h_{${props.attack.SourceHistoryIdx}}_{i}[0](s_0) - \\mu'}{|C^{${props.theory}}|}`}
                     />
                    <br/>
                    <InlineMath math={`CQ1_{${props.theory} = \\text{variance}(`} /> 
                    <RenderWorth worth={source_history_Worth} considerations={props.considerations}/>
                    <InlineMath math={`) > \\text{variance}(`} /> 
                    <RenderWorth worth={target_history_Worth} considerations={props.considerations}/>
                    <InlineMath math={`)`} />
                    <br/>
                    <InlineMath math={`CQ1_{${props.theory} = ${argmin(source_history_Worth)}  \\succ_{${props.theory}} ${argmin(target_history_Worth)}`} /> 
                    <br/>
                </div>
            }
        <p><b>CQ2:</b> Is there greater foresight or expectation that the target policy will violate the moral principle more than the source?</p>
        Yes.
    
        <div className='hCentre'>
            {props.theory === 'Maximin' &&
                <InlineMath math={`CQ2_{${props.theory} = \\min_{c_i \\in C^{${props.theory}}}} \\mathcal{Q}^{\\pi_{${props.attack.SourcePolicyIdx}}_{${props.theory}}(s_0, \\pi_{${props.attack.SourcePolicyIdx}}(s_0, 0))
                    \\succ_{${props.theory}} 
                    \\min_{c_i \\in C^{${props.theory}}}} \\mathcal{Q}^{\\pi_{${props.attack.TargetPolicyIdx}}_{${props.theory}}(s_0, \\pi_{${props.attack.TargetPolicyIdx}}(s_0, 0))`} 
                />
            }
            {props.theory !== 'Maximin' &&
                <InlineMath math={`CQ2_{${props.theory}} = \\mathcal{Q}^{\\pi_{${props.attack.SourcePolicyIdx}}}_{${props.theory}}(s_0, \\pi_{${props.attack.SourcePolicyIdx}}(s_0, 0))
                    \\succ_{${props.theory}} 
                    \\mathcal{Q}^{\\pi_{${props.attack.TargetPolicyIdx}}}_{${props.theory}}(s_0, \\pi_{${props.attack.TargetPolicyIdx}}(s_0, 0))`} 
                />
            }
            <br/>
            <RenderWorth worth={source_policy_Worth} considerations={props.considerations} />
            <InlineMath className="hCentre" math={"\\succ"} />
            <RenderWorth worth={target_policy_Worth} considerations={props.considerations} />

            {(props.theoryType === 'Utility' && props.considerations.length > 1) && 
                <>
                <br/>
                <RenderWorth worth={source_policy_Worth} considerations={props.considerations} combineDefault={0} combine={(a,b)=>{return parseFloat(a)+parseFloat(b);}}/>
                <InlineMath className="hCentre" math={"\\succ"} />
                <RenderWorth worth={target_policy_Worth} considerations={props.considerations} combineDefault={0} combine={(a,b)=>{return parseFloat(a)+parseFloat(b);}}/>
                </>
            }

        </div>
        

        <p>Thus, by moral theory {props.theory}, there is negative retrospection on trajectory <InlineMath math={`h_{${props.attack.TargetHistoryIdx}}`}/> for selecting policy <InlineMath math={`\\pi_{${props.attack.TargetPolicyIdx}}`}/>,
        because of trajectory <InlineMath math={`h_{${props.attack.SourceHistoryIdx}}`}/> by policy <InlineMath math={`\\pi_{${props.attack.TargetPolicyIdx}}`}/>.</p>
        </>
}