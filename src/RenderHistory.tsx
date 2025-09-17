import RenderWorth from "./renderQValue";
import { useSettings } from "./Settings";
import { InlineMath } from 'react-katex';

export default function RenderHistory(props:{policyIdx:number, historyIdx:number}) {
    const { jsonData, highlightFn } = useSettings();

    const click = (e) => {
        let hlt = {piIdx: props.policyIdx, hIdx:props.historyIdx, value: true, setInState: true, isProb:false};
        highlightFn(hlt);
    }
    const mouseEnter = (e) => {
        let hlt = {piIdx: props.policyIdx, hIdx:props.historyIdx, value: true, setInState: false, isProb:false};
        highlightFn(hlt);
    }
    const mouseLeave = (e) => {
        let hlt = {piIdx: props.policyIdx, hIdx:props.historyIdx, value: false, setInState: false, isProb:false};
        highlightFn(hlt);
    }

    return <span className="tooltip"
        onClick={click}
        onMouseEnter={mouseEnter}
        onMouseLeave={mouseLeave}>
            <InlineMath math={`\\h^{\pi_{${props.policyIdx}}}_{${props.historyIdx}}`} />
    <div className="tooltiptext">
        <RenderWorth worth={jsonData.Histories[props.policyIdx][props.historyIdx].Worth} noToolTip={true} />
    </div>
    </span>
}