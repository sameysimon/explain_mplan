
export async function Query(endpoint, port, request, handleResp, handleStart=null, handleFinal=null) {
    console.log(`Query endpoint ${endpoint}`, request);
    try {
        if (handleStart) handleStart();
        const response = await fetch(`http://localhost:${port}/${endpoint}`, {
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
        handleResp(data);
    } catch (err) {
        alert(`Query to endpoint ${endpoint} failed: ${err.message}`);
        console.log(`Query to endpoint ${endpoint} failed`, err);
    } finally {
        if (handleFinal) handleFinal();
    }
}