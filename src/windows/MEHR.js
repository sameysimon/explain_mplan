import WinBox from 'react-winbox';
import RenderWorth from '../common/RenderWorth';
import { useState } from 'react'; 
import { CriticalQuestions } from './Inspectors/ExplainAttack/CriticalQuestions';
import { useSettings } from '../Settings';
import RenderPolicy from '../common/RenderPolicy';
import { RoundProb } from '../common/RenderProbability';


export default function ExplainMEHR(props) {
    const { jsonData, setJsonData } = useSettings();
    const { highlightFn, highlights, setHighlights } = useSettings();
    const { currentPolicyIdx, setCurrentPolicyIdx } = useSettings();
    const [ cqWindow, setCqWindow ] = useState(false); 
    const [ firstFoilIdx, setFirstFoilIdx ] = useState(0); 
    const [ foilPageSize, setFoilPageSize ] = useState(10);
    const { counterPoliciesIdx, setCounterPoliciesIdx } = useSettings();
    const { addCounterPolicy } = useSettings();

    
    let pIdx = props.expInfo["policyID"];
    let stateID = props.expInfo["stateID"];
    let actionLabel = props.expInfo["action"];
    let foils = props.expInfo["foils"];
    let missingPolicies = [];
    // Getters
    const getSolutionProp = (piIdx, propName, fallback="Loading...") => {
        return jsonData.Solutions?.[piIdx]?.[propName] ?? fallback;
    }
    const getHistoryProp = (piIdx, hIdx, propName, fallback="Loading...") => {
        if (!jsonData.Histories[piIdx]) {
            if (!missingPolicies.includes(piIdx)) {
                missingPolicies.push(piIdx);
            }
            return fallback;
        }
        return jsonData?.Histories?.[piIdx]?.[hIdx]?.[propName] ?? fallback;
    }
    const mouseEnter = (e,pi,h,isProb=false) => {
        let hlt = {piIdx: pi, hIdx:h, value: true, setInState: false, isProb:isProb};
        highlightFn(hlt);
    }
    const mouseLeave = (e,pi,h,isProb=false) => {
        let hlt = {piIdx: pi, hIdx:h, value: false, setInState: false, isProb:isProb};
        highlightFn(hlt);
    }
    const getHistoryHandlers = (piIdx, hIdx, isProb=false) => {
        let cName="highlighted";
        if (-1===highlights.findIndex(item => item.piIdx===piIdx && item.hIdx===hIdx&& item.type==="history")) {
            cName="";
        }
        return {
            onMouseEnter: (e) => {mouseEnter(e, piIdx, hIdx, isProb)},
            onMouseLeave: (e) =>{mouseLeave(e, piIdx, hIdx, isProb)},
            className: cName};
    }
    
    const r =  <>
        {cqWindow && <CriticalQuestions 
            attack={cqWindow}
            onClose={()=>{setCqWindow(false)}}
            jsonData={jsonData}
            getHistoryProp={getHistoryProp}
            getSolutionProp={getSolutionProp}/>
        }
        <WinBox 
            title={`Explain ${actionLabel} on s_${stateID}`} 
            width={Math.max(window.innerWidth/2, 600)} 
            height={Math.max(window.innerHeight/2, 600)}
            onClose={()=>{setCqWindow(false)}}
            >
            <div className='ContentBox'>
            <h3>Why not action {actionLabel} on state s_{stateID} rather than policy <RenderPolicy id={pIdx} noClick={true} />?</h3>

            <p>There are {foils.length} in-budget and Pareto undominated policies that chose action '{actionLabel}' on state s_{stateID} with a minimal non-acceptability of <RoundProb value={jsonData.Solutions[foils[0]].Acceptability} /></p>
            
            {foils.slice(firstFoilIdx, firstFoilIdx+foilPageSize).map((piIdx, i) => {
                return <>
                    <h4>
                        Foil Policy <RenderPolicy id={piIdx} noClick={true}/> worth <RenderWorth worth={getSolutionProp(piIdx, "Expectation")} jsonData={jsonData} />
                    {counterPoliciesIdx.includes(piIdx) ?
                        <button onClick={()=>{addCounterPolicy(piIdx, true)}}>
                            Remove from graph viewer
                        </button>
                    :
                        <button onClick={()=>{addCounterPolicy(piIdx, false)}}>
                            Add to graph viewer
                        </button>
                    }
                    </h4>
                    <AttackTable jsonData={jsonData} piIdx={piIdx} getHistoryProp={getHistoryProp} getHistoryHandlers={getHistoryHandlers} setCqWindow={setCqWindow} />
                </>
            })}
            <h4>The Fact Policy <RenderPolicy id={pIdx} noClick={true}/> worth <RenderWorth worth={getSolutionProp(pIdx, "Expectation")} jsonData={jsonData} /></h4>
            <AttackTable jsonData={jsonData} piIdx={pIdx} getHistoryProp={getHistoryProp} getHistoryHandlers={getHistoryHandlers} setCqWindow={setCqWindow} />
            </div>
            </WinBox>
            </>
        let maybeMissing = [...foils];
        foils.map((piIdx)=> {
            Object.entries(jsonData.Attacks[piIdx]).map((attacks) => {
                maybeMissing.push(attacks[0]);
            });
        });
        Object.entries(jsonData.Attacks[pIdx]).map((attacks) => {
            maybeMissing.push(attacks[0]);
        });
        maybeMissing.map(piIdx => {
            if (!jsonData.Histories[piIdx] && !missingPolicies.includes(piIdx)) {
                missingPolicies.push(piIdx); 
            }
        });
        if (missingPolicies.length>0) {
            props.fetchHistories(missingPolicies);
        }
        return r;
};


function AttackTable(props) {
    const { jsonData, piIdx, getHistoryHandlers, getHistoryProp } = props;

    return (
        <table className="myTable" key={"table_" + piIdx}>
            <thead>
                <tr className="border-t">
                    <th>Source Policy</th>
                    <th>Source History</th>
                    <th style={{ width: '40px' }}></th> {/* Column for the Arrow */}
                    <th>Target History</th>
                    <th>Probability</th>
                    <th>Theory</th>
                    <th></th>
                </tr>
            </thead>
            <tbody>
                {Object.entries(jsonData.Attacks[piIdx]).map(([srcPolicy, attacksArray], groupIdx) => {
                    const policyRowSpan = attacksArray.length;

                    return attacksArray.map((att, attIdx) => {
                        const theoryName = jsonData.Theories[att.thy].Name;
                        
                        // Logic for Theory Merging
                        const isFirstTheoryOccurrence = attIdx === 0 || jsonData.Theories[attacksArray[attIdx - 1].thy].Name !== theoryName;
                        let theoryRowSpan = 1;
                        if (isFirstTheoryOccurrence) {
                            for (let i = attIdx + 1; i < attacksArray.length; i++) {
                                if (jsonData.Theories[attacksArray[i].thy].Name === theoryName) theoryRowSpan++;
                                else break;
                            }
                        }

                        // Logic for Source History Merging
                        const isFirstSrcOccurrence = attIdx === 0 || attacksArray[attIdx - 1].src !== att.src;
                        let srcRowSpan = 1;
                        if (isFirstSrcOccurrence) {
                            for (let i = attIdx + 1; i < attacksArray.length; i++) {
                                if (attacksArray[i].src === att.src) srcRowSpan++;
                                else break;
                            }
                        }

                        const relevantCons = jsonData.Considerations
                            .filter((c) => c.Component_of.includes(theoryName))
                            .map((c) => c.Name);
                        
                        let myGreenConsiders = {};
                        let myRedConsiders = {};
                        relevantCons.forEach((con_name) => { 
                            myGreenConsiders[con_name] = "green"; 
                            myRedConsiders[con_name] = "red"; 
                        });

                        const rowBg = groupIdx % 2 === 0 ? "#ffffff" : "#f9f9f9";

                        return (
                            <tr key={`tr_${piIdx}_${srcPolicy}_${attIdx}`} style={{ backgroundColor: rowBg }}>
                                {attIdx === 0 && (
                                    <td rowSpan={policyRowSpan} style={{ verticalAlign: 'middle', fontWeight: 'bold' }}>
                                        <RenderPolicy id={srcPolicy} />
                                    </td>
                                )}

                                {isFirstSrcOccurrence && (
                                    <td rowSpan={srcRowSpan} {...getHistoryHandlers(srcPolicy, att.src)} style={{ verticalAlign: 'middle' }}>
                                        h_{att.src} <RenderWorth worth={getHistoryProp(srcPolicy, att.src, "Worth")} jsonData={jsonData} colorMap={myGreenConsiders} />
                                    </td>
                                )}

                                {attIdx === 0 && (
                                    <td rowSpan={policyRowSpan} style={{ verticalAlign: 'middle', textAlign: 'center', fontSize: '1.5rem', color: '#e74c3c' }}>
                                        <span style={{ display: 'inline-block', transform: 'scaleX(1)' }}>➔</span>
                                    </td>
                                )}

                                <td {...getHistoryHandlers(piIdx, att.tar)}>
                                    h_{att.tar} <RenderWorth worth={getHistoryProp(piIdx, att.tar, "Worth")} jsonData={jsonData} colorMap={myRedConsiders} />
                                </td>

                                <td>
                                    <RoundProb value={getHistoryProp(piIdx, att.tar, "Probability")} />
                                </td>

                                {isFirstTheoryOccurrence && (
                                    <td rowSpan={theoryRowSpan} style={{ verticalAlign: 'middle'}}>
                                        {theoryName}
                                    </td>
                                )}

                                <td>
                                    <button onClick={() => {
                                        props.setCqWindow({
                                            Theory: att.thy,
                                            SourcePolicyIdx: srcPolicy,
                                            TargetPolicyIdx: piIdx,
                                            SourceHistoryIdx: att.src,
                                            TargetHistoryIdx: att.tar
                                        })
                                    }}>Explain</button>
                                </td>
                            </tr>
                        );
                    });
                })}
            </tbody>
        </table>
    );
}