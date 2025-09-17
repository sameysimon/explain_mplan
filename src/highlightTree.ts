
import { TreeNode } from "./Utility";
import { getAction } from "./Utility";


export const removeHighlights = (tree:TreeNode, setTree, setHighlights) => {
    let tree_ = JSON.parse(JSON.stringify(tree));
    let myStack = [tree_]
    while (myStack.length > 0) {
        let n = myStack.pop();
        n.highlight=false;
        n.children.forEach(item => myStack.push(item));
    }
    setHighlights([]);
    setTree(tree_);

}
export const highlightFn = (hlt, highlights, tree:TreeNode, setTree, setHighlights, jsonData) => {
    if (!hlt) return;
    if (!highlights) return;
    let piIdx = hlt.piIdx;
    let hIdx = hlt.hIdx;
    if (hIdx===-1) { hIdx=undefined; }
    let value = hlt.value;
    let setInState = hlt.setInState;
    let isProb = hlt.isProb;
    // If setInState (click) and already in list, remove policy. Done
    // If setInState (click) and not in list, add policy Done
    // If non setInState and value=on, add policy
    // If non setInsState and value=off, remove policy.
    let newHighlights = [...highlights];
    let hltPos;
    if (hIdx === undefined || hIdx===-1) {
        hltPos = newHighlights.findIndex(item => item.type==="policy" && item.piIdx===piIdx);
    } else {
        hltPos = newHighlights.findIndex(item => item.type==="history" && item.piIdx===piIdx && item.hIdx===hIdx);
    }
    
    if (hltPos!== -1) {
        // If already in the list...
        if (!setInState && !value && !newHighlights[hltPos].locked) {
            newHighlights[hltPos].value = false;
        } else if (setInState && newHighlights[hltPos].locked) {
            newHighlights[hltPos].locked = false;
            newHighlights[hltPos].value = false;
        }
        else if (setInState) {
            newHighlights[hltPos].locked = true;
        }
    } else {
        // Not in the list...
        if (value && hIdx === undefined) {
            newHighlights.push({type: "policy", piIdx: piIdx, value: value, locked: false, isProb: isProb});
        } else if (value===true && hIdx !== undefined) {
            newHighlights.push({type: "history", piIdx: piIdx, hIdx: hIdx, value: value, locked: false, isProb: isProb});
        }
    }

    let tree_ = JSON.parse(JSON.stringify(tree));
    let myStack = [{node: tree_, hlts: [...newHighlights], depth:0}]
    while (myStack.length > 0) {
        let c = myStack.pop();
        if (!c.node) { continue; }
        let v = false;// Are we turning this on or off?-> at least one policy/history that puts this on
        for (let i = 0; i < c.hlts.length; i++) {
            if (c.hlts[i].value) {v=true; break;}
        }
        c.node.highlight = v;
    
        if (c.node.type === 'state') {
            let newActions = {};
            c.hlts.forEach(hlt => {
                let policyAction = getAction(hlt.piIdx, c.node.id, jsonData);
                if (!Object.keys(newActions).includes(policyAction)) {newActions[policyAction] = [];}
                if (-1 === newActions[policyAction].findIndex(item => item.piIdx===hlt.piIdx&&item.type===hlt.type&&item.hIdx===hlt.hIdx)) {
                    newActions[policyAction].push(hlt);
                }
            });
            Object.keys(newActions).forEach(val => {
                let actionNode = c.node.children.find(child => child.label===val);
                myStack.push({node:actionNode, hlts:newActions[val], depth:c.depth+1});// Push the action node and the relevant histories/policies
            })
        } else if (c.node.type==='action') {
            let newStates = {};
            c.hlts.forEach(hlt => {
                if (hlt.type==="policy") {
                    c.node.children.forEach(child => {
                        if (!Object.keys(newStates).includes(child.id)) { newStates[child.id] = []}
                        if (-1 === newStates[child.id].findIndex(item => item.piIdx===hlt.piIdx&&item.type==="policy")) {
                            newStates[child.id].push(hlt);
                        }
                    });
                } else if (hlt.type==="history") {
                    let currStateIdx = jsonData["Histories"][hlt.piIdx][hlt.hIdx].Path[c.depth];
                    c.node.children.forEach(child => {
                        if (child.id===currStateIdx) {
                            if (!Object.keys(newStates).includes(child.id)) { newStates[child.id] = []}
                            if (-1 === newStates[child.id].findIndex(item => item.piIdx===hlt.piIdx&&item.type==="history"&&item.hIdx===hlt.hIdx)) {
                                newStates[child.id].push(hlt);
                            }
                        }
                    });
                }
            });
            Object.keys(newStates).forEach(sID => {
                let state = c.node.children.find(s => s.id===parseInt(sID));
                myStack.push({node:state, hlts:newStates[sID], depth:c.depth});
            });
        }
    }
    newHighlights = newHighlights.filter(hlt => hlt.value===true);
    setHighlights(newHighlights);
    setTree(tree_);
}