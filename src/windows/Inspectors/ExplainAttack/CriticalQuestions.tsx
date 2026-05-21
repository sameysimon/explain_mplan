import WinBox from 'react-winbox';
import RenderWorth from '../../../common/RenderWorth';
import RenderProb from '../../../common/RenderProbability';
import { useSettings, JsonData } from '../../../Settings';
import { HistoryTable } from '../../../common/historyTable';
import { getConsiderations } from '../../../Utility';
import { InlineMath } from 'react-katex';
import 'katex/dist/katex.min.css';
import ArgumentAttack from './TextAttack';
import EndUserJustify from './EndUser';
import AlgorithmJustify from './AlgorithmUser';
import React, { useEffect, useRef } from 'react';
import RenderHistory from '../../../common/RenderHistory';

export type CriticalQuestionsProps = {
    attack:boolean|Attack;
    onClose:() => void;
    jsonData:JsonData;
    getHistoryProp:(piIdx: any, hIdx: any, propName: any, fallback?: string) => any;
    getSolutionProp:(piIdx: any, propName: any, fallback?: string) => any;
}

export type Attack = {
    SourcePolicyIdx:number;
    TargetPolicyIdx:number;
    SourceHistoryIdx:number;
    TargetHistoryIdx:number;
    Theory:number;
};

export type JustifyProps = {
    attack:Attack;
    theory:string;
    theoryType:string;
    considerations:string[]
}

export function CriticalQuestions(props: CriticalQuestionsProps) {
        const { userType } = useSettings();
        const { jsonData } = useSettings();
        if (!props.attack || typeof props.attack === 'boolean') {
            return null;
        }
        let attack = props.attack;
        let getSolutionProp = props.getSolutionProp;
        let getHistoryProp = props.getHistoryProp;
        let theory = jsonData.Theories[attack.Theory].Name.replace('_','\\_');
        let considers = getConsiderations(theory, jsonData);
        
        let sourceHistoryWorthTh = <RenderWorth worth={getHistoryProp(attack.SourcePolicyIdx, attack.SourceHistoryIdx, "Worth")}  considerations={considers}/>;
        let sourcePolicyWorthTh = <RenderWorth worth={getSolutionProp(attack.SourcePolicyIdx, "Expectation")} considerations={considers}/>;

        let targetPolicyWorthTh = <RenderWorth worth={getSolutionProp(attack.TargetPolicyIdx, "Expectation")}considerations={considers}/>;
        let targetHistoryWorthTh = <RenderWorth worth={getHistoryProp(attack.TargetPolicyIdx, attack.TargetHistoryIdx, "Worth")} considerations={considers}/>;
        let targetHistoryProbability =  <RenderProb piIdx={attack.TargetPolicyIdx} hIdx={attack.TargetHistoryIdx} data={jsonData}/>

        let cq1 = `W^{h_{${attack.SourceHistoryIdx}}}[0](s_0) \\succ_{${theory}} W^{h_{${attack.TargetHistoryIdx}}}[0](s_0)`;
        let cq2 = `\\mathcal{Q}^{\\pi_{${attack.SourcePolicyIdx}}}(s_0, \\pi_{${attack.SourcePolicyIdx}}(s_0,0) )  \\succ_{${theory}}  \\mathcal{Q}^{\\pi_{${attack.TargetPolicyIdx}}}(s_0, \\pi_{${attack.TargetPolicyIdx}}(s_0,0) )`;
        
        const winBoxRef = useRef<WinBox>(null);

        useEffect(()=> {
            winBoxRef.current?.focus();
        },[]);
        
        
/*        function AlgorithmCQ() {
            return <>
                <h2>Critical Questions</h2> 
                <p>Argument Attack:</p>
                <InlineMath math={`(${theory}^{\\pi_{${attack.SourcePolicyIdx}}}_{h_${attack.SourceHistoryIdx}}) \\rightarrow (${theory}^{\\pi_{${attack.TargetPolicyIdx}}}_{h_${attack.TargetHistoryIdx}})`} />
                <p>For {theory}, attacks are defined by two Critical Questions:</p>
                <p><b>CQ1:</b> Does the target history violate a moral principle where source does not?</p> 
                    
                    Yes.
                    <div className='hCentre'>
                        <InlineMath math={cq1} />
                        <br/>
                        {sourceHistoryWorthTh} <InlineMath className="hCentre" math={"\\succ_{" + "}"}/> {targetHistoryWorthTh}
                    </div>
                <p><b>CQ2:</b> Is there greater foresight or expectation that the target policy will violate the moral principle more than the source?</p>
                Yes.
                <div className='hCentre'>
                    <InlineMath className="hCentre" math={cq2} />
                    <br/>
                    {sourcePolicyWorthTh} <InlineMath className="hCentre" math={"\\succ_{" + "}"}/> {targetPolicyWorthTh}
                </div>
                

                <p>Thus, by moral theory {theory}, there is negative retrospection on history <InlineMath math={`h_{${attack.TargetHistoryIdx}}`}/> for selecting policy <InlineMath math={`\\pi_{${attack.TargetPolicyIdx}}`}/>,
                because of history <InlineMath math={`h_{${attack.SourceHistoryIdx}}`}/> by policy <InlineMath math={`\\pi_{${attack.TargetPolicyIdx}}`}/>.</p>
                </>
        }*/

        function DomainCQ() {
            return <>
                <h2>Policy-history compare</h2>
                <ArgumentAttack attack={props.attack} />
                <div style={{display: "flow-root", width:"fit-content"}}>
                <div style={{"float":"left"}}>
                    <p>Source History <RenderHistory policyIdx={attack.SourcePolicyIdx} historyIdx={attack.SourceHistoryIdx}/></p>
                    <HistoryTable policyIdx={attack.SourcePolicyIdx} historyIdx={attack.SourceHistoryIdx}/>
                </div>
                <div style={{"float":"right"}}>
                    <p>Target History <RenderHistory policyIdx={attack.TargetPolicyIdx} historyIdx={attack.TargetHistoryIdx}/></p>
                    <HistoryTable policyIdx={attack.TargetPolicyIdx} historyIdx={attack.TargetHistoryIdx}/>
                </div>
                </div>
                <br/>
                <p>
                To reduce computation and simplify explanatory information, policy trajectories with equivalent moral worth across all moral considerations are grouped and represented as a single history.
                The tables above show a single trajectory from each history.
                Hovering over the symbol for each history marks all its equivalent trajectories in the GraphViewer in red.
                </p>
            </>
        }

        return <WinBox title="Explain Attack" width={Math.max(window.innerWidth/3, 300)} height={Math.max(window.innerHeight/2, 300)} onClose={props.onClose} ref={winBoxRef} >
            <div className='ContentBox'>
                {userType==="User" &&
                    <EndUserJustify attack={attack} theory={theory} considerations={considers} theoryType={jsonData.Theories[attack.Theory].Type} />
                }
                {userType==="Algorithm designer" &&
                    <AlgorithmJustify attack={attack} theory={theory} considerations={considers} theoryType={jsonData.Theories[attack.Theory].Type} />
                }
                {userType==="Domain designer" &&
                    <DomainCQ/>
                }            
            </div>

        </WinBox>
    }