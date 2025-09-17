import { useSettings } from "./Settings";

export default function RenderWorth(props) {
    const { jsonData } = useSettings();
    let qValue = {};
    if (typeof props.worth === 'object' && !Array.isArray(props.worth) && props.worth !== null) {
        qValue = props.worth;
    } else if (typeof props.worth === 'string' || props.worth instanceof String){
        const words = props.worth.split(";");
        words.filter((word) => word.length > 0);
        jsonData.theories.forEach((element, i) => {
            qValue[element.Name] = words[i];
        });
    } else {
        // Assume array of elements
        jsonData.theories.forEach((element, i) => {
            qValue[element.Name] = props.worth[i];
        });
    }
    if (props.theory) {
        return <span className="tooltip">
            {"("}{qValue[props.theory]}{")"}
            <div className="tooltiptext">{props.theory}</div>
        </span>;
    }
    const worthKey=JSON.stringify(props.worth);
    return <>
        {"("}
        {jsonData.theories.map((v, i) => (<>
          <span className="worthElement tooltip" style={{color: props.colorMap?.[v.Name] ?? "inherit"}} key={`rw${worthKey}_span_${i}`}>
                {qValue[v.Name]}
                {!props.noToolTip && 
                    <div class="tooltiptext" key={`rw${worthKey}tooltipText_${i}`}>{v.Name}</div>
                }
            </span>
            {i < jsonData.theories.length - 1 && "; "}
        </>
        ))}
        {")"}
        </>
        
}