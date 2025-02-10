export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Only GET requests are allowed' });
    }

    const { webinarId, token, next_page_token } = req.query;

    if (!webinarId || !token) {
        return res.status(400).json({ message: 'Missing required fields' });
    }

    let ZOOM_API_URL = `https://api.zoom.us/v2/report/webinars/${webinarId}/participants?page_size=300`;
    if (next_page_token) {
        ZOOM_API_URL += `&next_page_token=${next_page_token}`;
    }

    try {
        const response = await fetch(ZOOM_API_URL, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            const error = await response.json();
            return res.status(response.status).json({ message: error.message });
        }

        const data = await response.json();
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
}
