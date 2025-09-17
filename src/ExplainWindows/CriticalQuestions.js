import WinBox from 'react-winbox';
import RenderWorth from '../renderQValue';
import RenderProb from '../renderProbability';
import { useSettings } from '../Settings';
import { HistoryTable } from '../Inspectors/historyTable';
import { InlineMath } from 'react-katex';
import 'katex/dist/katex.min.css';
import { json } from 'd3';





export function CriticalQuestions(props) {
        const { userType } = useSettings();
        const { jsonData } = useSettings();
        let attack = props.attack;
        let getSolutionProp = props.getSolutionProp;
        let getHistoryProp = props.getHistoryProp;
        let theory = jsonData.theories[attack.Theory].Name;
        
        let sourceHistoryWorth = <RenderWorth worth={getHistoryProp(attack.SourcePolicyIdx, attack.SourceHistoryIdx, "Worth")} jsonData={jsonData} />;
        let sourceHistoryWorthTh = <RenderWorth worth={getHistoryProp(attack.SourcePolicyIdx, attack.SourceHistoryIdx, "Worth")} jsonData={jsonData} theory={theory}/>;
        let sourcePolicyWorthTh = <RenderWorth worth={getSolutionProp(attack.SourcePolicyIdx, "Expectation")} jsonData={jsonData} theory={theory}/>;
        let sourcePolicyWorth = <RenderWorth worth={getSolutionProp(attack.SourcePolicyIdx, "Expectation")} jsonData={jsonData} />;
        let sourceHistoryProbability = <RenderProb piIdx={attack.SourcePolicyIdx} hIdx={attack.SourceHistoryIdx} jsonData={jsonData}/>;

        let targetHistoryWorth = <RenderWorth worth={getHistoryProp(attack.TargetPolicyIdx, attack.TargetHistoryIdx, "Worth")} jsonData={jsonData} />;
        let targetPolicyWorth = <RenderWorth worth={getSolutionProp(attack.TargetPolicyIdx, "Expectation")} jsonData={jsonData} />;
        let targetPolicyWorthTh = <RenderWorth worth={getSolutionProp(attack.TargetPolicyIdx, "Expectation")} jsonData={jsonData} theory={theory}/>;
        let targetHistoryWorthTh = <RenderWorth worth={getHistoryProp(attack.TargetPolicyIdx, attack.TargetHistoryIdx, "Worth")} jsonData={jsonData} theory={theory}/>;
        let targetHistoryProbability =  <RenderProb piIdx={attack.TargetPolicyIdx} hIdx={attack.TargetHistoryIdx} jsonData={jsonData}/>

        let att = ``;
        let cq1 = `W^{h_{${attack.SourceHistoryIdx}}}[0](s_0) \\succ_{${theory}} W^{h_{${attack.TargetHistoryIdx}}}[0](s_0)`;
        let cq2 = `\\mathcal{Q}^{\\pi_{${attack.SourcePolicyIdx}}}(s_0, \\pi_{${attack.SourcePolicyIdx}}(s_0,0) )  \\succ_{${theory}}  \\mathcal{Q}^{\\pi_{${attack.TargetPolicyIdx}}}(s_0, \\pi_{${attack.TargetPolicyIdx}}(s_0,0) )`;
    

        function ArgumentAttack() {
            return <>
            <div className="argument">
                By {theory}, 
                it was right to do policy pi_{attack.SourcePolicyIdx} with expected worth {sourcePolicyWorth},
                resulting in history with worth {sourceHistoryWorth}
                with probability {sourceHistoryProbability}.
            </div>
            
            <p color='red'>ATTACKS</p>

            <div className="argument">
                By {theory}, 
                it was right to do policy pi_{attack.TargetPolicyIdx} with expected worth {targetPolicyWorth},
                resulting in history with worth {targetHistoryWorth}
                with probability {targetHistoryProbability}.
            </div>
            </>
        }

        function AlgorithmCQ() {
            return <>
                <h2>Critical Questions</h2>
                <p>Argument Attack:</p>
                <InlineMath math={`(${theory}^{\\pi_{${attack.SourcePolicyIdx}}}_{h_${attack.SourceHistoryIdx}}) \\rightarrow (${theory}^{\\pi_{${attack.TargetPolicyIdx}}}_{h_${attack.TargetHistoryIdx}})`} />
                <ArgumentAttack/>
                <p>Attacks are defined by the two Critical Questions:</p>
                <p>(CQ1) Does the target history violate a moral principle where source does not?</p> 
                    
                    Yes.
                    <div className='hCentre'>
                        <InlineMath math={cq1} />
                        <br/>
                        {sourceHistoryWorthTh} <InlineMath className="hCentre" math={"\\succ_{" + "}"}/> {targetHistoryWorthTh}
                    </div>

                    

                <p>(CQ2) Is there greater foresight or expectation that the target policy will violate the moral principle more than the source?</p>

                Yes.
                <div className='hCentre'>
                    <InlineMath className="hCentre" math={cq2} />
                    <br/>
                    {sourcePolicyWorthTh} <InlineMath className="hCentre" math={"\\succ_{" + "}"}/> {targetPolicyWorthTh}
                </div>
                

                <p>Thus, there is negative retrospection on history <InlineMath math={`h_{${attack.TargetHistoryIdx}}`}/> for selecting policy <InlineMath math={`\\pi_{${attack.TargetPolicyIdx}}`}/>,
                by {theory}, 
                for missing history <InlineMath math={`h_{${attack.SourceHistoryIdx}}`}/> after policy <InlineMath math={`\\pi_{${attack.TargetPolicyIdx}}`}/>.</p>
                </>
        }

        function UserCQ() {
            return <>
                <h2>Justification</h2>
                <ArgumentAttack/>
                <p>Performing policy pi_{attack.TargetPolicyIdx} reaches history h_{attack.TargetHistoryIdx} with probability {targetHistoryProbability}.</p>
                <p>Alternatively, policy pi_{attack.SourcePolicyIdx} reaches history h_{attack.SourceHistoryIdx} with probability {sourceHistoryProbability}.</p>
                <p>Hypothetically, imagine reaching the two outcomes.</p>
                <p>According to {theory}, history h_{attack.TargetHistoryIdx} is worth {targetHistoryWorthTh}.</p>
                <p>By the same theory, history h_{attack.SourceHistoryIdx} is worth {sourceHistoryWorthTh}.</p>
                <p>From the perspective of h_{attack.TargetHistoryIdx} after policy pi_{attack.TargetPolicyIdx}, there is potentially negative retrospection for missing the preferable worth {sourceHistoryWorthTh}.</p>
                <p>In fact, policy pi_{attack.TargetPolicyIdx} is expected to be worth {targetPolicyWorthTh} -- worse than the expected worth of pi_{attack.SourcePolicyIdx} which is {sourcePolicyWorthTh}.</p>
                <p>Then there is no good reason to select pi_{attack.TargetPolicyIdx}. Then there is negative retrospection from the perspective of h_{attack.TargetHistoryIdx}.</p>
            </>
        }

        function DomainCQ() {
            return <>
                <h2>Policy-history compare</h2>
                <ArgumentAttack/>
                <p>Histories:</p>
                <div style={{"float":"left"}}>
                    <HistoryTable policyIdx={attack.TargetPolicyIdx} historyIdx={attack.TargetHistoryIdx}/>
                </div>
                <div style={{"float":"right"}}>
                    <HistoryTable policyIdx={attack.SourcePolicyIdx} historyIdx={attack.SourceHistoryIdx}/>
                </div>
            </>
        }
        console.log("HISTORIES",jsonData.Histories);


        return <WinBox title="Explain Attack" width={Math.max(window.innerWidth/3, 300)} height={Math.max(window.innerHeight/2, 300)} onClose={props.onClose}>
            {userType==="User" &&
                <UserCQ/>
            }
            {userType==="Algorithm designer" &&
                <AlgorithmCQ/>
            }
            {userType==="Domain designer" &&
                <DomainCQ/>
            }            
        </WinBox>
    }