import type { JsonData, Solution } from "./Settings";




// Recursively set show for descendants of a node by id
export const setShowRecursive = (node, targetId, value) => {
    if (node.id === targetId) {
        if (node.children) {
            node.children.forEach(child => { child.show = value; });
        }
        return true;
    }
    if (node.children) {
        for (let child of node.children) {
            if (setShowRecursive(child, targetId, value)) return true;
        }
    }
    return false;
};


export const getAction = (policyIdx:number, stateIdx:number, data:JsonData) => {
    if (!data.solutions[policyIdx]) {
        return "[no policyIdx]";
    }
    if (!(stateIdx in data.solutions[policyIdx].Action_Map)) {
        return "[no stateIdx]";
    }
    return data.solutions[policyIdx].Action_Map[stateIdx];
}

export const findPolicyWithStateAction = (actionLabel:string, source_state:number, jsonData:JsonData) => {
    let pols = [];
    for (let i = 0; i < jsonData.solutions.length; i++) {
        if (!jsonData.solutions[i].Action_Map[source_state]) {
            continue;
        }
        if (jsonData.solutions[i].Action_Map[source_state] === actionLabel) {
            pols.push(i);
        }
        
    }
    return pols;
};

export const findPolicyWithState = (source_state:number, jsonData:JsonData) => {
    let pols = [];
    for (let i = 0; i < jsonData.solutions.length; i++) {
        if (!jsonData.solutions[i].Action_Map[source_state]) {
            continue;
        }
        pols.push(i);
    }
    return pols;
};


export interface TreeNode {
    id: number | string;
    type: 'state' | 'action';
    show: boolean;
    info: any;
    selected: boolean;
    children: TreeNode[];
    source_state: number | string;
    label?: string;
    policyAction?: boolean;
    highlight?: boolean;
    edgeLabel?: number;
}

export const buildTree = (json:JsonData, piIdx:number) => {
    console.log(json);
    var tree:TreeNode = {id: 0, type:'state', show: true, info: json.state_tags ? json.state_tags[0] : "", selected: false, children: [], source_state: 0};
    makeTree(tree, true, json, piIdx);
    return tree;
};

export const makeTree = (node:TreeNode, showState:boolean, json:JsonData, piIdx:number) => {
    if (node.type === 'state') {
        let policyAction = getAction(piIdx, node.id as number, json);
        for (const actionStr of Object.keys(json.state_transitions[node.id])) {
            let actionID = "s_" + node.id + "a_" + actionStr;
            var a: TreeNode = {
                id: actionID,
                label: actionStr,
                info: 'Action',
                type: 'action',
                show: showState,
                selected: false,
                policyAction: actionStr == policyAction,
                source_state: node.id,
                highlight: false,
                children: []
            };
            makeTree(a, showState && (actionStr == policyAction), json, piIdx);
            node.children.push(a);
        }
    } else if (node.type === 'action') {
        let successors = json.state_transitions[node.source_state][node.label];
        for (const scr of successors) {
            var s: TreeNode = {
                id: scr[1],
                type: 'state',
                label: scr[1],
                edgeLabel:scr[0],
                info : json.state_tags ? json.state_tags[scr[1]] : "",
                show: showState,
                selected: false,
                highlight: false,
                source_state: node.source_state,
                children: []
            };
            makeTree(s, showState, json, piIdx);
            node.children.push(s);
        }
    }
        
};