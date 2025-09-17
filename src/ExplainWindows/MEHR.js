import WinBox from 'react-winbox';
import RenderWorth from '../renderQValue';
import { useState } from 'react'; 
import { CriticalQuestions } from './CriticalQuestions';
import { useSettings } from '../Settings';
import RenderPolicy from '../renderPolicy';


export default function ExplainMEHR(props) {
    const { jsonData } = useSettings();
    const { highlightFn, highlights, setHighlights } = useSettings();
    const [ cqWindow, setCqWindow ] = useState(false); 

    let pIdx = props.expInfo["policyID"];
    let stateID = props.expInfo["stateID"];
    let actionLabel = props.expInfo["action"];
    let foilPolicyIds = props.expInfo["foils"];
    console.log("foil policy IDs", foilPolicyIds);
    let missingPolicies = []
    // Event handlers
    const click = (e,pi,h=-1,isProb=false) => {
        let hlt = {piIdx: pi, hIdx:h, value: true, setInState: true, isProb:isProb};
        highlightFn(hlt);
    }
    const mouseEnter = (e,pi,h,isProb=false) => {
        let hlt = {piIdx: pi, hIdx:h, value: true, setInState: false, isProb:isProb};
        highlightFn(hlt);
    }
    const mouseLeave = (e,pi,h,isProb=false) => {
        let hlt = {piIdx: pi, hIdx:h, value: false, setInState: false, isProb:isProb};
        highlightFn(hlt);
    }
    const getSourcePolicyHandlers = (attVal) => {
        let cName="highlighted";
        if (-1===highlights.findIndex(item => item.piIdx===attVal.SourcePolicyIdx && item.type==="policy")) {
            cName="";
        }
        return {
            onClick: (e) => click(e, attVal.SourcePolicyIdx),
            onMouseEnter: (e) =>mouseEnter(e, attVal.SourcePolicyIdx),
            onMouseLeave: (e) =>{mouseLeave(e, attVal.SourcePolicyIdx)},
            className: cName};
    }
    const getTargetPolicyHandlers = (attVal) => {
        let cName="highlighted";
        if (-1===highlights.findIndex(item => item.piIdx===attVal.TargetPolicyIdx && item.type==="policy")) {
            cName="";
        }
        return {
            onClick: (e) => click(e, attVal.TargetPolicyIdx),
            onMouseEnter: (e) =>mouseEnter(e, attVal.TargetPolicyIdx),
            onMouseLeave: (e) =>{mouseLeave(e, attVal.TargetPolicyIdx)},
            className: cName};
    }
    const getSourceHistoryHandlers = (attVal) => {
        let cName="highlighted";
        if (-1===highlights.findIndex(item => item.piIdx===attVal.SourcePolicyIdx && item.hIdx===attVal.SourceHistoryIdx&& item.type==="history")) {
            cName="";
        }
        return {
            onClick: (e) => click(e, attVal.SourcePolicyIdx, attVal.SourceHistoryIdx),
            onMouseEnter: (e) =>mouseEnter(e, attVal.SourcePolicyIdx, attVal.SourceHistoryIdx),
            onMouseLeave: (e) =>{mouseLeave(e, attVal.SourcePolicyIdx,attVal.SourceHistoryIdx)},
            className: cName};
    }
    const getTargetHistoryHandlers = (attVal,isProb=false) => {
        let cName="highlighted";
        if (-1===highlights.findIndex(item => item.piIdx===attVal.TargetPolicyIdx && item.hIdx===attVal.TargetHistoryIdx&& item.type==="history")) {
            cName="";
        }
        return {
            onClick: (e) => {click(e, attVal.TargetHistoryIdx, attVal.TargetHistoryIdx,isProb)},
            onMouseEnter: (e) => {mouseEnter(e, attVal.TargetPolicyIdx, attVal.TargetHistoryIdx,isProb)},
            onMouseLeave: (e) =>{mouseLeave(e, attVal.TargetPolicyIdx,attVal.TargetHistoryIdx,isProb)},
            className: cName};
    }
    

    // Getters
    const getSolutionProp = (piIdx, propName, fallback="Loading...") => {
        return jsonData.solutions?.[piIdx]?.[propName] ?? fallback;
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
    let nonAcceptLoading = false;
    let nonAcceptByTheory = {};
    for (let i = 0; i < foilPolicyIds.length; i++) {
        let piIdx = foilPolicyIds[i];
        nonAcceptByTheory[piIdx] = {};
        console.log(jsonData.Attacks, piIdx, nonAcceptByTheory);
        for (let attIdx = 0; attIdx < jsonData.Attacks[String(piIdx)].length; attIdx++) {
            let attVal = jsonData.Attacks[piIdx][attIdx];
            let nacc = getHistoryProp(attVal.TargetPolicyIdx, attVal.TargetHistoryIdx, "Probability",-1);
            if (nacc === -1) {
                i = foilPolicyIds.length;
                nonAcceptLoading=true;
                break;
            }
            if (nonAcceptByTheory[piIdx].hasOwnProperty(attVal.Theory)) {
                nonAcceptByTheory[piIdx][attVal.Theory] += nacc
            } else {
                nonAcceptByTheory[piIdx][attVal.Theory] = nacc
            }

        }
    }
    
    
    const r =  <>
        {cqWindow && <CriticalQuestions 
            attack={cqWindow}
            onClose={()=>{console.log("onclose"); setCqWindow(false)}}
            jsonData={jsonData}
            getHistoryProp={getHistoryProp}
            getSolutionProp={getSolutionProp}/>
        }
        <WinBox title={`Explain ${actionLabel} on s_${stateID}`} width={Math.max(window.innerWidth/2, 600)} height={Math.max(window.innerHeight/2, 600)}>
                <h3>Why not action {actionLabel} on state s_{stateID} rather than policy pi_{pIdx}?</h3>
                <p>The best policies using {actionLabel} on state s_{stateID} are listed.</p>
                {foilPolicyIds.map((piIdx) => (<details key={"details_" + piIdx}>
                    <summary key={"sum_" + piIdx} >
                        Foil Policy <RenderPolicy id={piIdx} noClick={true}/> with <RenderWorth worth={getSolutionProp(piIdx, "Expectation")} jsonData={jsonData} />. Total Non-Acceptability: {jsonData.solutions[piIdx].Acceptability}.
                    </summary>
                    <div key={"content_" + piIdx} className='content'>
                        Attacks:<br/>
                        <table className="myTable" key={"table_"+piIdx}>
                            <thead key={"table_"+piIdx}>
                                <tr className="border-t" key={"tr_"+piIdx}>
                                    <th key={"th1_"+piIdx}>Source Policy</th>
                                    <th key={"th2_"+piIdx}>Source Policy Worth</th>
                                    <th key={"th3_"+piIdx}>Source History</th>
                                    <th key={"th4_"+piIdx}>Target Policy</th>
                                    <th key={"th5_"+piIdx}>Target History</th>
                                    <th key={"th6_"+piIdx}>Probability</th>
                                    <th key={"th7_"+piIdx}>Theory</th>
                                    <th key={"th8_"+piIdx}></th>
                                </tr>
                            </thead>

                            <tbody key={"tbody_"+piIdx}>
                                {jsonData.Attacks[piIdx].map((attVal, attIdx) => (
                                    <tr key={"tr1_"+piIdx + "_att" + attIdx}>
                                        <td key={"td_"+piIdx + "_att" + attIdx + "1"} {...getSourcePolicyHandlers(attVal)} >
                                            pi_{attVal.SourcePolicyIdx}
                                        </td>

                                        <td key={"td_"+piIdx + "_att" + attIdx + "2"} {...getSourcePolicyHandlers(attVal)} >
                                            <RenderWorth worth={getSolutionProp(attVal.SourcePolicyIdx, "Expectation")} jsonData={jsonData} colorMap={{[jsonData.theories[attVal.Theory].Name]: "green"}}/>
                                        </td>

                                        <td key={"td_"+piIdx + "_att" + attIdx + "3"} {...getSourceHistoryHandlers(attVal)} >
                                            <RenderWorth worth={getHistoryProp(attVal.SourcePolicyIdx, attVal.SourceHistoryIdx, "Worth")} jsonData={jsonData} colorMap={{[jsonData.theories[attVal.Theory].Name]: "green"}}/>
                                        </td>

                                        <td key={"td_"+piIdx + "_att" + attIdx + "4"} {...getTargetPolicyHandlers(attVal)}>
                                            <RenderWorth worth={getSolutionProp(attVal.TargetPolicyIdx, "Expectation")} jsonData={jsonData} colorMap={{[jsonData.theories[attVal.Theory].Name]: "red"}}/>
                                        </td>

                                        <td key={"td_"+piIdx + "_att" + attIdx + "5"} {...getTargetHistoryHandlers(attVal)}>
                                            <RenderWorth worth={getHistoryProp(attVal.TargetPolicyIdx, attVal.TargetHistoryIdx, "Worth")} jsonData={jsonData} colorMap={{[jsonData.theories[attVal.Theory].Name]: "red"}}/>
                                        </td>

                                        <td key={"td_"+piIdx + "_att" + attIdx + "6"} {...getTargetHistoryHandlers(attVal, true)}>
                                            {getHistoryProp(attVal.TargetPolicyIdx, attVal.TargetHistoryIdx, "Probability")}
                                        </td>

                                        <td key={"td_"+piIdx + "_att" + attIdx + "7"}>
                                            {jsonData.theories[attVal.Theory].Name}
                                        </td>

                                        <td key={"td_"+piIdx + "_att" + attIdx + "8"}>
                                            <button onClick={()=>{setCqWindow(attVal)}}>Explain</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {!nonAcceptLoading &&
                        <table className="myTable" key={"table2_"+piIdx}>
                            <thead key={"table2_"+piIdx}>
                                <tr className="border-t" key={"tr_"+piIdx}>
                                    <th key={`2th1_${piIdx}_theory`}>Theory</th>
                                    <th key={`2th1_${piIdx}_nonAccept`}>Non-Acceptability</th>
                                </tr>
                            </thead>
                            <tbody key={"2tbody_"+piIdx}>
                                {Object.keys(nonAcceptByTheory[piIdx]).map((theory, i) => (
                                    <tr key={"2tr1_"+piIdx + "_th" + i}>
                                        <td key={"2td_"+piIdx + "th" + i + "1"} >
                                            {jsonData.theories[theory].Name}
                                        </td>
                                        <td key={"2td_"+piIdx + "th" + i + "2"} >
                                            {nonAcceptByTheory[piIdx][theory]}
                                        </td>
                                    </tr>
                                ))}
                                <tr>
                                    <td key={"2tr1_"+piIdx + "_th_total"}>Total</td>
                                    <td key={"2tr1_"+piIdx + "_th_totalValue"}>{Object.values(nonAcceptByTheory[piIdx]).reduce((a,b)=>{return a+b}, 0)}</td>
                                </tr>
                            </tbody>
                        </table>
                    }
                </details>))}
                
                <br/>            
            </WinBox></>
        if (missingPolicies.length>0) {
            props.fetchHistories(missingPolicies);
        }
        return r;
};

