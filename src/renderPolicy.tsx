import RenderWorth from "./renderQValue";
import { useSettings } from "./Settings";
import { InlineMath } from 'react-katex';

export default function RenderPolicy(props:{id:number, noClick?:boolean}) {
    const { jsonData, highlightFn } = useSettings();

    const click = (e) => {
        let hlt = {piIdx: props.id, hIdx:-1, value: true, setInState: true, isProb:false};
        highlightFn(hlt);
    }
    const mouseEnter = (e) => {
        console.log(props.id);
        let hlt = {piIdx: props.id, hIdx:-1, value: true, setInState: false, isProb:false};
        highlightFn(hlt);
    }
    const mouseLeave = (e) => {
        let hlt = {piIdx: props.id, hIdx:-1, value: false, setInState: false, isProb:false};
        highlightFn(hlt);
    }

    return (
        <span className="tooltip"
            {...(!props.noClick
                ? {
                    onClick: click,
                    onMouseEnter: mouseEnter,
                    onMouseLeave: mouseLeave
                }
                : {})}
        >
            <InlineMath math={`\\pi_{${props.id}}`} />
            <div className="tooltiptext">
                <RenderWorth worth={jsonData.solutions[props.id].Expectation} noToolTip={true} />
            </div>
        </span>
    );
}