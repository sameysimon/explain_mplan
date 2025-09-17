
export async function Query(endpoint, port, request, handleResp, handleStart, handleFinal) {
    try {
        handleStart();
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
        console.log(`Query to endpoint ${endpoint} failed`, err);
    } finally {
        handleFinal();
    }
}