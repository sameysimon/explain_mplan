import RenderWorth from "./RenderWorth";
import { useSettings } from "../Settings";
import { InlineMath } from 'react-katex';
import { useEffect, useRef, useState } from "react";
import ContextMenu from "../common/ContextMenu";

export default function RenderHistory(props:{policyIdx:number, historyIdx:number}) {
    const { jsonData, highlightFn, highlights, setConsiderationView } = useSettings();
    const [contextMenu, setContextMenu] = useState({x:0, y:0, toggled:false});
    const contextMenuRef = useRef(null);

    function clearMenu() {
        setContextMenu({x:0, y:0, toggled:false});
    }
    
    useEffect(()=> {
        function handleCloseMenu(e) {
            if (contextMenuRef.current) {
                if (!contextMenuRef.current.contains(e.target)) {
                    clearMenu();
                }
            }
        }
        document.addEventListener('click', handleCloseMenu);
        return () => {
            document.removeEventListener('click', handleCloseMenu);
        }
    },[]);
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
    let btns = [];
    btns.push({
        text: `Highlight History`,
        onClick: () => {
            let hlt = {piIdx: props.policyIdx, hIdx:props.historyIdx, value: true, setInState: true, isProb:false};
            highlightFn(hlt);
            clearMenu();
        }
    });
    jsonData.Considerations.map((c, i) => {
        btns.push({
            text: `View successors by ${c.Name}`,
            onClick: () => { setConsiderationView(props.policyIdx, props.historyIdx, i); clearMenu(); }
        });
    });

    return <><span className="tooltip"
        onContextMenu={rightClick}
        
        >
            <InlineMath math={`h^{\\pi_{${props.policyIdx}}}_{${props.historyIdx}}`} />
    <div className="tooltiptext">
        <RenderWorth worth={jsonData.Histories[props.policyIdx][props.historyIdx].Worth} noToolTip={true} />
    </div>
    </span>
    <ContextMenu 
            contextMenuRef={contextMenuRef}
            positionX={contextMenu.x} 
            positionY={contextMenu.y} 
            isMenuOn={contextMenu.toggled}
            buttons={btns}
            />
    </>
}