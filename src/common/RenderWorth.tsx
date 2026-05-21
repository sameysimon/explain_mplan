import { useSettings, JsonData } from "../Settings";


type RenderWorthProps = {
    key?:string;
    worth:any;
    considerations?:string|string[];
    colorMap?:{ [key:string]: string };
    noToolTip?:boolean;
    combine?:(a:any, b:any)=>any;
    combineDefault?:any;
}

export default function RenderWorth(props : RenderWorthProps) {
    const { jsonData } = useSettings();
    let key = "";
    if (props.key) {
        key = props.key;
    }
    let qValue = {};
    if (typeof props.worth === 'object' && !Array.isArray(props.worth) && props.worth !== null) {
        qValue = props.worth;
    } else if (typeof props.worth === 'string' || props.worth instanceof String){
        const words = props.worth.split(";");
        words.filter((word) => word.length > 0);
        jsonData.Considerations.forEach((element, i) => {
            qValue[element.Name] = words[i];
        });
    } else {
        // Assume array of elements
        jsonData.Considerations.forEach((element, i) => {
            qValue[element.Name] = props.worth[i];
        });
    }
    let myConsiderations = [];
    if (!props.considerations) {
        myConsiderations = jsonData.Considerations.map(c => c.Name);
    }
    else if (typeof props.considerations === "string" || props.considerations instanceof String) {
        myConsiderations = [props.considerations];
    } else {
        myConsiderations = props.considerations;
    }
    const worthKey=JSON.stringify(props.worth);
    const myToString = (v) => {
        if (typeof v === 'undefined') {return "undefined";}
        let r = v.toString();
        if (r==="false") {
            return "F"
        }
        if (r==="true") {
            return "T"
        }
        return r;
    }
    
    if (props.combine!==undefined && props.combineDefault!==undefined) {
        let combo = props!.combineDefault;
        myConsiderations.forEach((v) => {
            combo = props.combine!(qValue[v], combo);
        });
        return <span className="nowrap">
            {"("}
            {combo}
            {")"}
            </span>;
    }

    return <span className="nowrap">
        {"("}
        {myConsiderations.map((v, i) => (<>
          <span className="worthElement tooltip" style={{color: props.colorMap?.[v] ?? "inherit"}} key={`${key}_rw${worthKey}_span_${i}`}>
                {myToString(qValue[v])}
                {!props.noToolTip && 
                    <span className="tooltiptext" key={`${key}_rw${worthKey}tooltipText_${i}`}>{v}</span>
                }
            </span>
            {i < myConsiderations.length - 1 && "; "}
        </>
        ))}
        {")"}
        </span>
        
}