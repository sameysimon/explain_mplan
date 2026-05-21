import { RoundProb } from "./common/RenderProbability";
import type { JsonData, Solution } from "./Settings";


export const variance = (nums:number[]) => {
    const mean = nums.reduce((sum, val) => sum + val, 0) / nums.length;
    const squaredDiffSum = nums.reduce((acc, val) => {
        return acc + Math.pow(val - mean, 2);
    }, 0);
        return nums.length > 0 ? squaredDiffSum / nums.length : 0;
}
export const argmin = (nums:number[]) => {
    let minIndex = 0;
    for (let i = 1; i < nums.length; i++) {
        if (nums[i] < nums[minIndex]) {
            minIndex = i;
        }
    }
    return minIndex;
}



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

export const getConsiderations = (theory:string, data:JsonData) => {
    let considers:string[] = [];
    data.Considerations.forEach((co) => {
        if (co.Component_of === theory || co.Component_of.includes(theory)) {
            considers.push(co.Name);
        }
    });
    return considers;
}
export const getAction = (policyIdx:number, stateIdx:number, data:JsonData) => {
    if (!data.Solutions[policyIdx]) {
        return "[no policyIdx]";
    }
    if (!(stateIdx in data.Solutions[policyIdx].Action_Map)) {
        return "[no stateIdx]";
    }
    return data.Solutions[policyIdx].Action_Map[stateIdx];
}

export const findPolicyWithStateAction = (actionLabel:string, source_state:number, jsonData:JsonData) => {
    let pols:number[] = [];
    for (let i:number = 0; i < jsonData.Solutions.length; i++) {
        if (!jsonData.Solutions[i].Action_Map[source_state]) {
            continue;
        }
        if (jsonData.Solutions[i].Action_Map[source_state].includes(actionLabel)) {
            pols.push(i);
        }
        
    }
    return pols;
};

export const findPolicyWithState = (source_state:number, jsonData:JsonData) => {
    let pols = [];
    for (let i = 0; i < jsonData.Solutions.length; i++) {
        if (!jsonData.Solutions[i].Action_Map[source_state]) {
            continue;
        }
        pols.push(i);
    }
    return pols;
};


export interface TreeNode {
    id: number | string;
    type: 'state' | 'action';
    isGoal:boolean;
    show: boolean;
    info: any;
    selected: boolean;
    children: TreeNode[];
    source_state: number | string;
    label?: string;
    policyAction?: boolean;
    highlight?: boolean;
    edgeLabel?: number;
    counterAction?:boolean;
}

export const buildTree = (json:JsonData, piIdx:number, counter_policies?:number[]) => {
    var tree:TreeNode = {id: 0, type:'state', isGoal:false, show: true, info: json.State_tags ? json.State_tags[0] : "", selected: false, children: [], source_state: 0, label: "0"};
    if (!counter_policies) {
        counter_policies = [];
    }
    makeTree(tree, true, json, piIdx, counter_policies);
    return tree;
};

export const makeTree = (node:TreeNode, showState:boolean, json:JsonData, piIdx:number, counterPiIdxs:number[]) => {
    if (node.type === 'state') {
        let policyAction = getAction(piIdx, node.id as number, json);
        let counterActions = counterPiIdxs.map((i)=> getAction(i, node.id as number, json)).flat(1);
        for (const actionStr of Object.keys(json.State_transitions[node.id])) {
            let actionID = "s_" + node.id + "a_" + actionStr;
            var a: TreeNode = {
                id: actionID,
                label: actionStr,
                info: 'Action',
                type: 'action',
                isGoal:false,
                show: showState,
                selected: false,
                policyAction: policyAction.includes(actionStr),
                counterAction: counterActions.includes(actionStr),
                source_state: node.id,
                highlight: false,
                children: []
            };
            makeTree(a, showState && (policyAction.includes(actionStr) || counterActions.includes(actionStr)), json, piIdx, counterPiIdxs);
            node.children.push(a);
        }
    } else if (node.type === 'action') {
        let successors = json.State_transitions[node.source_state][node.label];
        for (const scr of successors) {
            var s: TreeNode = {
                id: scr[1],
                type: 'state',
                isGoal: json.Goals ? json.Goals.includes(scr[1]) : false,
                label: scr[1],
                edgeLabel: Math.round(scr[0] * 1_000) / 1_000,
                info : json.State_tags ? json.State_tags[scr[1]] : "",
                show: showState,
                selected: false,
                highlight: false,
                source_state: node.source_state,
                children: []
            };
            makeTree(s, showState, json, piIdx, counterPiIdxs);
            node.children.push(s);
        }
    }
        
};