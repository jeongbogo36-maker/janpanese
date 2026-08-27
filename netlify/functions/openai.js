const https = require('https');

exports.handler = async (event) => {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return { statusCode: 500, body: JSON.stringify({ text: "오류|오류|API 키 없음" }) };

    const { mode, input } = JSON.parse(event.body);

    let prompt = "";
    if (mode === 'word_game') {
        // 실생활 테마(식당, 교통, 쇼핑, 인사, 응급상황 등) 강조
        prompt = `Generate ONE highly practical Japanese word or very short phrase used in real-life situations (Travel, Dining, Shopping, Daily Conversation). 
        Focus on words that a traveler would actually use.
        Format: Word|KoreanPronunciation|Meaning
        Example: すみません|스미마센|저기요/죄송합니다
        Strictly output ONLY the string. No quotes, no markdown.`;
    } else {
        prompt = `Translate "${input}" to Japanese. 
        Format: Japanese|KoreanPronunciation|Description
        Strictly output ONLY the string formatted with '|'.`;
    }

    const data = JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.9
    });

    const options = {
        hostname: 'api.openai.com',
        path: '/v1/chat/completions',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        }
    };

    return new Promise((resolve) => {
        const req = https.request(options, (res) => {
            let resBody = '';
            res.on('data', (d) => resBody += d);
            res.on('end', () => {
                try {
                    const response = JSON.parse(resBody);
                    let text = response.choices[0].message.content.trim();
                    text = text.replace(/[`"']/g, ""); // 불필요한 따옴표 제거
                    resolve({ statusCode: 200, body: JSON.stringify({ text }) });
                } catch (e) {
                    resolve({ statusCode: 500, body: JSON.stringify({ text: "오류|오류|응답 오류" }) });
                }
            });
        });
        req.write(data);
        req.end();
    });
};
