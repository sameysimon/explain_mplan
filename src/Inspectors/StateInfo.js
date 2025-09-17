

export function StateInfo(props) {
    let info;
    let isTags = true;
    try {
        let jsonString = props.nodeData.data.info
            .replace(/'/g, '"')
            .replace(/True/g, 'true')
            .replace(/False/g, 'false');
        info = JSON.parse(jsonString);
    } catch (e) {
        console.error("Failed to parse info as JSON", e);
        isTags = false;
    }
    let parentParentInfo = null;
    if (
    props.nodeData.parent &&
    props.nodeData.parent.parent &&
    props.nodeData.parent.parent.data &&
    props.nodeData.parent.parent.data.info
    ) {
    try {
        let parentInfoString = props.nodeData.parent.parent.data.info
        .replace(/'/g, '"')
        .replace(/True/g, 'true')
        .replace(/False/g, 'false');
        parentParentInfo = JSON.parse(parentInfoString);
    } catch (e) {
        parentParentInfo = null;
    }
    }



    return <>
        <h3>State '{props.nodeData.data.id.toString()}'</h3>
        {isTags &&
            <table>
            <thead>
                <tr className="bg-gray-100">
                <th className="border px-4 py-2 text-left">Feature</th>
                <th className="border px-4 py-2 text-left">Value</th>
                </tr>
            </thead>
            <tbody>
                {Object.entries(info).map(([key, value]) => (
                    <tr key={key} className="border-t">
                    <td className="border px-4 py-2 font-semibold">{key}</td>
                    <td className="border px-4 py-2"
                        style={{
                            color:
                            parentParentInfo && String(value) !== String(parentParentInfo[key])
                                ? 'red'
                                : 'black'
                        }}
                        >
                        {String(value)}
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    }
    {!isTags && <p>There are no state tags.</p>}
    </>
};