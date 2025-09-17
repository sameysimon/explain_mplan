import { useState, useEffect } from 'react';

import WinBox from 'react-winbox';
import 'katex/dist/katex.min.css';

import Summary from './ExplainWindows/Summary.tsx';
import Canvas from './Canvas.tsx';
import FileDetails from './FileDetails'
import Inspector from './Inspectors/Base.js'
import ExplainMEHR from './ExplainWindows/MEHR.js'

import { buildTree, setShowRecursive } from './Utility.ts';
import { createDefaultJsonData, useSettings } from './Settings.tsx';
import { highlightFn, removeHighlights } from './highlightTree.ts';

const HISTORY_KEY = "ExplainMEHR";
const MDP_SUGGESTIONS = 10;

export default function App() {
    const { port, setPort } = useSettings();
    const { userType, setUserType } = useSettings();
    const { jsonData, setJsonData } = useSettings();
    const { currentPolicyIdx, setCurrentPolicyIdx } = useSettings();
    const { highlights, setHighlights } = useSettings();
    const { setHighlightFn } = useSettings();

    const [tree, setTree] = useState(null);
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

        try {
            const request = {file_in: f, from_root: true};
            // TODO change port depending on what is in the box...
            const response = await fetch(`http://localhost:${port}/MDP`, {
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
            alert(`File generated at ${data['file_out']}. Open file to process!`);
        } catch (err) {
        } finally {
        }
    }

    const event_loadJSONFile = (e) => {loadJSONFile(e.target.files[0]);};
    const loadJSONFile = (f) => {
        if (f && f.type === "application/json") {
            try {
               new Response(f).json().then(json => {
                    const tree = buildTree(json, 0);
                    console.log("build tree.")
                    setTree(tree);
                    // If key in old jsonData and not overwritten in new, then carry it over...
                    let defaultData = createDefaultJsonData();
                    json = { ...defaultData, ...json}
                    json.initalSolutionCount = json.solutions.length;
                    /*let minNaccIdx=0;
                    for (let i = 1; i < json.solutions.length; i++) {
                        if (json.solutions[i].Acceptability < json.solutions[minNaccIdx].Acceptability) {
                            minNaccIdx = i;
                        }
                    }
                    setCurrentPolicyIdx(minNaccIdx);*/
                    setJsonData(json);

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
        setCurrentPolicyIdx(new_idx);
    };

    // Runs on first render -> gets local storage.
    useEffect(() => {
        const h = JSON.parse(localStorage.getItem(HISTORY_KEY)) || [];
        setMDPFileHistory(h);
        
    }, [])
    useEffect(()=> {
        const x = (hlt) => highlightFn(hlt,highlights,tree,setTree,setHighlights,jsonData);
        setHighlightFn(() => x);
    }, [highlights,tree,setTree,setHighlights,jsonData])
    // 
    // EVENT HANDLERS
    //

    // Handler to be passed to Canvas
    const toggleShow = (id, value) => {
        // Deep copy tree to avoid mutating state directly
        const newTree = JSON.parse(JSON.stringify(tree));
        setShowRecursive(newTree, id, value);
        setTree(newTree);
    };
    
    const nodeClicked = (e, d) => {
        if (e.shiftKey) {
            // Toggle show for this node and its descendants
            const shouldShow = !d.children?.some(child => child.data.show);
            toggleShow(d.data.id, shouldShow);
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
        for (let key in newData.FoilSolutions) { 
            newJSON["solutions"][parseInt(key)] = newData.FoilSolutions[key];
            newJSON["Histories"][parseInt(key)] = newData.Histories[key];
            newJSON["Attacks"][parseInt(key)] = newData.Attacks[key];
        };
        const x = {policyID: piIdx, stateID:stateID, action:actionLabel, foils: Object.keys(newData.FoilSolutions).map(x => parseInt(x)) }
        setExplanations([...explanations, x]);
        setJsonData(newJSON);
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

        return 
    }

    return <>
        <label htmlFor="fileIn">1. Send a JSON MDP file to MPLAN. </label>
        <input list="mdpSuggestions" name="fileIn" id="fileIn" width="50" style={{"width": "400pt"}} /> 
        <button onClick={ queryMMMDP }>Submit</button><br/>

        <label style={{padding:"0 0px 0 5px"}} htmlFor="fileInput">2. Load an MPLAN solution file: </label>
        <input type="file" id="fileinput" onChange={event_loadJSONFile} />
        <datalist id="mdpSuggestions">
            {mdpFileHistory.map((item, i) => (
                <option key={i} value={item}/>
            ))}
        </datalist>

        <label htmlFor="port">Port to query MPlan: </label>
        <input
            type="number"
            id="port"
            min="0"
            step="1"
            value={port}
            onChange={e => {
                const val = e.target.value;
                // Only set if val is a valid integer and not empty
                if (/^\d+$/.test(val)) {
                    setPort(parseInt(val, 10));
                } else if (val === "") {
                    setPort(""); // Allow clearing the box
                }
            }}
            style={{width: "6em"}}
        /><br/>
        <>Current policy is {currentPolicyIdx}</>
        { tree == null ? <></> :
            <>
            <button onClick={()=>{removeHighlights(tree,setTree,setHighlights)}}>Remove Highlights</button>
            <select name="policy" id="policySelect" value={currentPolicyIdx} onChange={function(e){setPolicy(e.target.value);}}>
            Selected Policy {Array.from({ length : jsonData.solutions.length}, (_, i) => (
                <option key={i} value={i}>Policy {i}</option>
                ))}
            </select>
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
                
                <FileDetails />
                <WinBox 
                    noClose x="0" y={window.innerHeight * 0.05} title="Graph Viewer"
                     width={window.innerWidth * 0.8} height={window.innerHeight * 0.8}
                     className={"myStopScroll"}>
                <Canvas
                    tree={tree}
                    treeDepth={parseInt(jsonData.horizon * 2 + 1) || 10}
                    nodeClicked={nodeClicked}
                    edgeClicked={edgeClicked}
                />
                </WinBox>
                <Summary/>
                <Inspector node={node} edge={edge} minimised={edge=="none" && node=="none"} expHandler={newExplanation} />
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