// SettingsContext.tsx
import React, { createContext, useContext, useState, ReactNode, Dispatch, SetStateAction } from "react";
import { buildTree } from './Utility.ts';
import { Query } from './generic.js';

export interface Attack {
    src: number;
    tar: number;
    Theory:number;
}
export interface Solution {
    Action_Map: { [key: string]: string };
    Expectation: { [key: string]: string };
    Acceptability: number;
}
export interface History {
    Probability:number;
    Worth:any[];
    Path:number[];
}

export interface Theory {
    Name:string;
    Type:string;
    Rank:number;
}
export interface Consideration {
    Name:string;
    Type:string;
    Heuristic?:any[];
    Default?:any;
    Component_of:string[]|string;
    Budget?:number
}
export interface JsonData {
    Theories:Theory[];
    Considerations:Consideration[];
    Non_Moral:number;
    Backups:number;
    Iterations:number;
    Expanded:number;
    Actions: string[];
    Average_histories:number;
    Duration_MEHR:number;
    Duration_Outs:number;
    Duration_Plan:number;
    Duration_Sols:number;
    Duration_Total:number;
    Horizon:number;
    Max_histories:number;
    Min_histories:number;
    Min_non_accept:number;
    Total_states:number;
    Total_Ranks:number
    Num_Min_Non_Acceptability:number;
    Total_reachable_policies:number;
    
    Domain?:string

    State_time:number[];
    Attacks: { [target_policy_idx: number] : { [source_policy_idx : number] : Attack[] }};
    Histories: History[][];
    Solutions: Solution[];
    Solutions_order: number[];
    InitialSolutionCount:number;
    SolutionTotal:number
    State_transitions: { [stateId: number]: { [action: string]: number[][] } };
    
    State_tags?: string[];
    Goals?:number[];

    Action_cause: { [stateIdx: string] : { [actionLabel: string] : string }};
}
export function createDefaultJsonData(): JsonData {
    return {
        SolutionTotal:0,
        Non_Moral:-1,
        Solutions_order:[],
        InitialSolutionCount:0,
        Backups:0,
        Iterations:0,
        Min_non_accept:0,
        Expanded:0,
        Actions:[],
        Theories:[],
        Total_Ranks:0,
        Considerations:[],
        Average_histories: 0,
        Duration_MEHR: 0,
        Duration_Outs: 0,
        Duration_Plan: 0,
        Duration_Sols: 0,
        Duration_Total: 0,
        Num_Min_Non_Acceptability:0,
        Total_reachable_policies:0,
        Horizon: 0,
        Max_histories: 0,
        Min_histories: 0,
        Total_states: 0,
        State_time: [],
        Histories: [],
        Solutions: [],
        State_transitions: {},
        State_tags: [],
        Goals: [],
        Attacks: {},
        Action_cause: {}
    };
}

type UserType = 'User'|'Algorithm designer'|'Domain designer';
interface SettingsContextType {
  userType: UserType;
  setUserType: Dispatch<SetStateAction<UserType>>;
  port:number;
  setPort: Dispatch<SetStateAction<number>>;
  jsonData:JsonData;
  setJsonData: Dispatch<SetStateAction<JsonData>>;
  currentPolicyIdx: number;
  setCurrentPolicyIdx: Dispatch<SetStateAction<number>>;
  highlightFn:any;
  setHighlightFn:any;
  highlights:any;
  setHighlights:any;
  counterPoliciesIdx:number[];
  setCounterPoliciesIdx: Dispatch<SetStateAction<number[]>>;
  // tree displayed by the canvas and used for highlighting
  tree:any;
  setTree: Dispatch<SetStateAction<any>>;
  // optional UI helpers that other parts of the app access
  conScrData:any;
  setConScrData: Dispatch<SetStateAction<any>>;
  currConsIdx:number|null;
  setCurrConsIdx: Dispatch<SetStateAction<number|null>>;
  // action helpers
  addCounterPolicy: (counter_idx:number, remove:boolean) => void;
  setConsiderationView: (pi_idx:number, h_idx:number, new_idx:number|string) => void;
}

const SettingsContext = createContext<SettingsContextType|undefined>(undefined);

export const SettingsProvider = ({ children } : { children: ReactNode }) => {
    const [userType, setUserType] = useState<UserType>('Algorithm designer');// Can be "User" or "Algorithm designer" alternatively
    const [port, setPort] = useState(18080);// Can be "user" alternatively
    const [jsonData, setJsonData] = useState();
    const [currentPolicyIdx, setCurrentPolicyIdx] = useState(0);
    const [counterPoliciesIdx, setCounterPoliciesIdx] = useState([]);
    const [highlights, setHighlights] = useState([]);
    const [highlightFn, setHighlightFn] = useState<any>(()=>()=>{});
  const [tree, setTree] = useState<any>(null);
  const [currConsIdx, setCurrConsIdx] = useState<number|null>(null);
  const [conScrData, setConScrData] = useState<any>({});

  const addCounterPolicy = (counter_idx:number, remove:boolean) => {
    let counters = remove ? [...counterPoliciesIdx].filter((pi)=>pi!==counter_idx) : [...counterPoliciesIdx, counter_idx];
    const t = buildTree(jsonData, currentPolicyIdx, counters);
    setTree(t);
    setCounterPoliciesIdx(counters);
    // reset UI helpers that the old version of this function cleared
    setConScrData({});
    setCurrConsIdx(null);
    setCurrentPolicyIdx(currentPolicyIdx);
  };

  const setConsiderationView = (pi_idx, h_idx, new_idx:number|string) => {
    let n = Number(new_idx);
    if (n === -1) {
      setConScrData({});
      setCurrConsIdx(null);
      return;
    }
    Query("SortSuccessors", port,
      h_idx!==-1 ? { policy_idx: pi_idx, hist_idx:h_idx, consideration_idx: n } : { policy_idx: pi_idx, consideration_idx: n },
      (d) => {
        let x = d['Successors'];
        setConScrData(x);
        setCurrConsIdx(n);
      }
    );
  };

  return (
    <SettingsContext.Provider value={{ 
      userType, port, jsonData, currentPolicyIdx, setUserType, setPort, setJsonData, setCurrentPolicyIdx,
      highlightFn, setHighlightFn, highlights, setHighlights, counterPoliciesIdx, setCounterPoliciesIdx,
      tree, setTree, conScrData, setConScrData, currConsIdx, setCurrConsIdx,
      addCounterPolicy, setConsiderationView
      }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used inside SettingsProvider");
  return ctx;
};
