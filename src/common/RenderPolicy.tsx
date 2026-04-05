import RenderWorth from "./RenderWorth";
import { useSettings } from "../Settings";
import { InlineMath } from 'react-katex';
import { useEffect, useRef, useState } from "react";
import ContextMenu from "./ContextMenu";

export default function RenderPolicy(props:{id:number, noClick?:boolean, key?:string}) {
    const { jsonData, highlightFn, currentPolicyIdx, counterPoliciesIdx,
            addCounterPolicy, setConsiderationView } = useSettings();
    const [contextMenu, setContextMenu] = useState({x:0, y:0, toggled:false});
    const contextMenuRef = useRef(null);

    let key = "";
    if (props.key) {key=props.key;}
    
    function clearMenu() {
        setContextMenu({x:0, y:0, toggled:false});
    }

    useEffect(()=> {
        function handler(e) {
            if (contextMenuRef.current) {
                clearMenu();
            }
        }
        document.addEventListener('click', handler);
        return () => {
            document.removeEventListener('click', handler);
        }
    })

    const rightClick = (e) => {
        e.preventDefault();
        // make sure the ref is attached before measuring
        const menuEl = contextMenuRef.current;
        let ctxMenuAttr = {width:0, height:0};
        if (menuEl && typeof menuEl.getBoundingClientRect === 'function') {
            ctxMenuAttr = menuEl.getBoundingClientRect();
        }
        const isLeft = e.clientX < window?.innerWidth / 2;
        let x = isLeft ? e.clientX : e.clientX - ctxMenuAttr.width;
        let y = e.clientY;
        setContextMenu({x: x, y:y, toggled:true});
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

    let btns = [];
    if (props.id !== currentPolicyIdx) {
        let isRemoving = counterPoliciesIdx.includes(props.id);
        btns.push({
            text:`${isRemoving ? `Remove` : 'Add' } counter policy`,
            isToggle:true,
            isToggled:false,
            onClick:()=>{
                addCounterPolicy(props.id, isRemoving);
                clearMenu();
            }
        });
    }
    jsonData.Considerations.map((c, i) => {
        btns.push({
            text: `View successors by ${c.Name}`,
            onClick: () => { setConsiderationView(props.id, -1, i); clearMenu(); }
        });
    });
    
    return (<>
        <span key={`renderPolicy${props.id}`} className="tooltip" onContextMenu={rightClick}
            {...(!props.noClick
                ? {
                    onMouseEnter: mouseEnter,
                    onMouseLeave: mouseLeave
                }
                : {})}
        >
            <InlineMath key={key} math={`\\pi_{${props.id}}`} />
            <span key={`${key}_renderPolicy${props.id}`} className="tooltiptext">
                <RenderWorth key={key} worth={jsonData.Solutions[props.id].Expectation} noToolTip={true} />
            </span>
        </span>
        
        <ContextMenu 
            contextMenuRef={contextMenuRef}
            positionX={contextMenu.x} 
            positionY={contextMenu.y} 
            isMenuOn={contextMenu.toggled}
            buttons={btns}
            key={key}
            />
        </>
    );
}