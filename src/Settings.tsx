// SettingsContext.tsx
import React, { createContext, useContext, useState, ReactNode, Dispatch, SetStateAction } from "react";

export interface Attack {
    SourcePolicyIdx: number;
    SourceHistoryIdx: number;
    TargetPolicyIdx: number;
    TargetHistoryIdx: number;
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
    Rank:number;
    Type:string;
    Heuristic?:any[];
    Default?:any;
}
export interface JsonData {
    theories:Theory[];
    Backups:number;
    Iterations:number;
    Expanded:number;
    actions: string[];
    average_histories:number;
    duration_MEHR:number;
    duration_Outs:number;
    duration_Plan:number;
    duration_Sols:number;
    duration_Total:number;
    horizon:number;
    max_histories:number;
    min_histories:number;
    min_non_accept:number;
    total_states?:number;
    

    state_time:number[];
    Attacks: { [policyIdx: number] : Attack[]};
    Histories: History[][];
    solutions: Solution[];
    solutions_order: number[];
    initialSolutionCount:number;
    SolutionTotal:number
    state_transitions: { [stateId: number]: { [action: string]: number[][] } };
    
    state_tags?: string[];
    goals?:number[];
}
export function createDefaultJsonData(): JsonData {
    return {
        SolutionTotal:0,
        solutions_order:[],
        initialSolutionCount:0,
        Backups:0,
        Iterations:0,
        min_non_accept:0,
        Expanded:0,
        actions:[],
        theories:[],
        average_histories: 0,
        duration_MEHR: 0,
        duration_Outs: 0,
        duration_Plan: 0,
        duration_Sols: 0,
        duration_Total: 0,
        horizon: 0,
        max_histories: 0,
        min_histories: 0,
        total_states: 0,
        state_time: [],
        Histories: [],
        solutions: [],
        state_transitions: {},
        state_tags: [],
        goals: [],
        Attacks: {}
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
}

const SettingsContext = createContext<SettingsContextType|undefined>(undefined);

export const SettingsProvider = ({ children } : { children: ReactNode }) => {
    const [userType, setUserType] = useState<UserType>('Algorithm designer');// Can be "User" or "Algorithm designer" alternatively
    const [port, setPort] = useState(18080);// Can be "user" alternatively
    const [jsonData, setJsonData] = useState();
    const [currentPolicyIdx, setCurrentPolicyIdx] = useState(0);
    const [highlights, setHighlights] = useState([]);
    const [highlightFn, setHighlightFn] = useState<any>(()=>()=>{});

  return (
    <SettingsContext.Provider value={{ 
      userType, port, jsonData, currentPolicyIdx, setUserType, setPort, setJsonData, setCurrentPolicyIdx,
      highlightFn, setHighlightFn, highlights, setHighlights
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
