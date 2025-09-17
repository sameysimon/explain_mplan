import { useSettings } from '../Settings.tsx';


export function EdgeInfo(props) {
    const { jsonData } = useSettings();
    const action = props.edgeData.source.data;
    const sourceState = action.source_state;
    const target = props.edgeData.target.data;
    return <>
        <h3>State {sourceState} via {action.label} to State {target.id}</h3>
        <table>
        <thead>
            <tr className="bg-gray-100">
            <th className="border px-4 py-2 text-left">Theory Idx</th>
            <th className="border px-4 py-2 text-left">Theory Name</th>
            <th className="border px-4 py-2 text-left">Value</th>
            </tr>
        </thead>
        <tbody>
            {props.edgeData.theories.map((val, i) => (
                <tr key={i} className="border-t">
                <td className="border px-4 py-2 font-semibold">{i}</td>
                <td className="border px-4 py-2">{jsonData.theories[i].Name}</td>
                <td className="border px-4 py-2">{String(val)}</td>
                </tr>
            ))}
            <tr className="border-t">
            <td className="border px-4 py-2 font-semibold"></td>
            <td className="border px-4 py-2">Probability</td>
            <td className="border px-4 py-2">{String(props.edgeData.probability)}</td>
            </tr>
        </tbody>
        </table>
    </>
}