import { useState, useEffect } from 'react';

import WinBox from 'react-winbox';
import 'katex/dist/katex.min.css';

import Summary from './windows/Summary.tsx';
import Canvas from './Canvas.tsx';
import FileDetails from './windows/FileDetails.tsx'
import Inspector from './Inspector.js'
import ExplainMEHR from './windows/MEHR.js'
import { Query } from './generic.js';

import { buildTree, setShowRecursive } from './Utility.ts';
import { createDefaultJsonData, useSettings } from './Settings.tsx';
import { highlightFn, removeHighlights } from './highlightTree.ts';

const HISTORY_KEY = "ExplainMEHR";
const MDP_SUGGESTIONS = 10;

export default function App() {
    const { port, setPort } = useSettings();
    const { userType, setUserType } = useSettings();
    const { jsonData, setJsonData, currentPolicyIdx, setCurrentPolicyIdx,
            counterPoliciesIdx, setCounterPoliciesIdx,
            highlights, setHighlights, setHighlightFn,
            tree, setTree, conScrData, setConScrData, currConsIdx, setCurrConsIdx,
            addCounterPolicy, setConsiderationView } = useSettings();

    const [mdpFileHistory, setMDPFileHistory] = useState([]);
    const [explanations, setExplanations] = useState([]);
    const [node, setNode] = useState("none");
    const [edge, setEdge] = useState("none");
    
    const queryMMMDP = async (e) => {
        // Save input to suggest for next time
        const f = document.getElementById('fileIn').value.trim();
        if (f==="") { return; }
        const updated = [f, ...mdpFileHistory.filter((x) => x !== f)].slice(
            0,
            MDP_SUGGESTIONS
        );
        localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
        setMDPFileHistory(updated);
        const request = {file_in: f, from_root: true};
        Query("MDP", port, request, (data)=>{alert(`File generated at ${data['file_out']}. Open file to process!`);},()=>{},()=>{});
    }

    const event_loadJSONFile = (e) => {loadJSONFile(e.target.files[0]);};
    const loadJSONFile = (f) => {
        if (f && f.type === "application/json") {
            try {
               new Response(f).json().then(json => {
                    let defaultData = createDefaultJsonData();
                    json = { ...defaultData, ...json};
                    const tree = buildTree(json, 0);
                    json.Non_Moral = json.Considerations.findIndex(c=> c.Type==="Cost");
                    json.Total_Ranks = [...new Set(json.Theories.map((t)=>t.Rank))].length
                    json.initalSolutionCount = json.Solutions.length;
                    setJsonData(json);
                    setTree(tree);

                });
            } catch (error) {
                alert("JSON file is invalid" + error);
            }
        } else {
            alert("Please select a valid JSON file...");
        }
    };
    const setPolicy = (new_idx) => {
        const t = buildTree(jsonData, new_idx);
        setTree(t);
        setConScrData({});
        setCurrConsIdx(null);
        setCurrentPolicyIdx(new_idx);
    };

    // Runs on first render -> gets local storage, listens for solution files.
    useEffect(() => {
        const h = JSON.parse(localStorage.getItem(HISTORY_KEY)) || [];
        setMDPFileHistory(h);  
    }, [])
    // Update highlights
    useEffect(()=> {
        const x = (hlt) => highlightFn(hlt,highlights,tree,setTree,setHighlights,jsonData);
        setHighlightFn(() => x);
    }, [highlights,tree,setTree,setHighlights,jsonData])
    
    // 
    // EVENT HANDLERS
    //
    // Handler to be passed to Canvas
    const toggleShow = (pathKey, value) => {
        // Deep copy tree to avoid mutating state directly
        const newTree = JSON.parse(JSON.stringify(tree));
        setShowRecursive(newTree, pathKey, value);
        setTree(newTree);
    };
    const nodeClicked = (e, d) => {
        if (e.shiftKey) {
            // Toggle show for this node and its descendants
            const shouldShow = !d.children?.some(child => child.data.show);
            toggleShow(d.data.pathKey, shouldShow);
            setNode(d);
        } else {
            setNode(d);
            setEdge("none");
        }
        
    };
    const edgeClicked = (e,d) => {
        // console.log("Edge Clicked:", d);
    };
    const newExplanation = (newData, piIdx, stateID, actionLabel) => {
        let newJSON = JSON.parse(JSON.stringify(jsonData));
        Object.entries(newData.Histories).map((hists) => {
            newJSON.Histories[parseInt(hists[0])] = hists[1]
        })
        Object.entries(newData.Attacks).map((atts) => {
            newJSON.Attacks[parseInt(atts[0])] = atts[1]
        })
        newData.Solutions.map((soln)=> {
            newJSON.Solutions.push(soln);
        })
        const x = {policyID: piIdx, stateID:stateID, action:actionLabel, foils: newData.FoilSolutions }
        setJsonData(newJSON);
        setExplanations([...explanations, x]);
    };
    const fetchHistories = async (policyIdList) => {
        let piIds = policyIdList.filter((piId) => {
            return !jsonData.Histories[piId] 
        });
        if (piIds.length===0) {
            return;
        }
        let newJSON=""
        try {
            const request = {policy_ids: piIds};
            console.log("req",request);
            const response = await fetch('http://localhost:18080/Histories', {
                method: 'POST',
                headers: {
                'Content-Type': 'application/json'
                },
                body: JSON.stringify(request)
            });
            if (!response.ok) {
                throw new Error(`Server error: ${response.status}`);
            }
            const data = await response.json();
            newJSON = JSON.parse(JSON.stringify(jsonData));
            for (const [piID,histories] of Object.entries(data)) {
                newJSON.Histories[piID] = histories;
            }
        } catch (err) {
            console.error("Couldn't fetch histories for policies", piIds, err);
            return;
        }
        setJsonData(newJSON);
        return;
    }


    return <>
        <label htmlFor="fileIn">1. Send a json file with a MMMDP/SSP to the Server: </label>
        <input list="mdpSuggestions" name="fileIn" id="fileIn" width="50" style={{"width": "400pt"}} /> 
        <button onClick={ queryMMMDP }>Submit</button><br/>

        <label htmlFor="fileInput">2. Load a json solution file: </label>
        <input type="file" id="fileinput" onChange={event_loadJSONFile} />
        <datalist id="mdpSuggestions">
            {mdpFileHistory.map((item, i) => (
                <option key={i} value={item}/>
            ))}
        </datalist>

        { tree == null ? <></> :
            <>
            <>Current policy is {currentPolicyIdx} of {jsonData.Solutions.length}</>
            <select name="policy" id="policySelect" value={currentPolicyIdx} onChange={function(e){setPolicy(parseInt(e.target.value));}}>
            Selected Policy {Array.from({ length : jsonData.Solutions.length}, (_, i) => (
                <option key={`select_pi_${i}`} value={i}>Policy {i} w/ {jsonData.Solutions[i].Acceptability} non-acc.</option>
                ))}
            </select>
            <button onClick={()=>{removeHighlights(tree,setTree,setHighlights)}}>Remove Highlights</button> 
            </>
        }<br/>
        <label htmlFor="userType">
            You are {userType.match("^[aieouAIEOU].*") ? "an " : "a " }
        </label>
        <select id="userType" name="userType" onChange={(e)=>{setUserType(e.target.value);}}>
            <option default value="Algorithm designer">Algorithm designer</option>
            <option default value="Domain designer">Domain designer</option>
            <option value="User">End user</option>
        </select>
        <br/>
        { tree == null 
            ? <h2>Load a file...</h2>
            : <>
                <WinBox 
                    noClose x="0" y={window.innerHeight * 0.05} title="Graph Viewer"
                     width={window.innerWidth * 0.8} height={window.innerHeight * 0.8}
                     className={"myStopScroll"}>
                <Canvas
                    tree={tree}
                    treeDepth={parseInt(jsonData.Horizon * 2 + 1) || 10}
                    nodeClicked={nodeClicked}
                    edgeClicked={edgeClicked}
                    scrColors={conScrData}
                />
                </WinBox>
                <Summary setPolicy={setPolicy} width={window.innerWidth * 0.5} height={window.innerHeight * 0.5} />
                <Inspector node={node} edge={edge} minimised={edge=="none" && node=="none"} expHandler={newExplanation} setPolicy={setPolicy} />
                {explanations.map((exp, i) => (
                    <ExplainMEHR
                        key={"exp" + i}
                        expInfo={exp}
                        fetchHistories={fetchHistories}
                    />
                ))}
             </>
        }
        </>;
}
//