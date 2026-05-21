import './ContextMenu.css';
import { createPortal } from 'react-dom';

type MenuButton = {
    text:string;
    isToggle?:boolean;
    isToggled?:boolean;
    onClick:any
}

const ContextMenu = (props:{buttons:MenuButton[], isMenuOn:boolean, positionX:number, positionY:number, contextMenuRef, key?:string}) => {
    const menu = (
        <menu className={`context-menu ${props.isMenuOn ? 'active' : ''}`} ref={props.contextMenuRef} style={{top: props.positionY + 2 + 'px', left: props.positionX + 2 + 'px'}}>
            {props.buttons.map((btn, i) => {
                return <button 
                onClick={(e)=>{e.stopPropagation(); btn.onClick()}}
                key={`${props.key}_ContextMenu_${i}`} >
                    {btn.text}
                </button>
            })}              
        </menu>
    );

    return typeof document !== 'undefined'
        ? createPortal(menu, document.body)
        : menu;
};

export default ContextMenu;