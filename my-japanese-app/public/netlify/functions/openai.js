const https = require('https');

exports.handler = async (event) => {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return { statusCode: 500, body: JSON.stringify({ text: "오류|오류|API 키 없음" }) };

    const { mode, input } = JSON.parse(event.body);

    let prompt = "";
    if (mode === 'word_game') {
        prompt = `Generate ONE random Japanese word (Level: JLPT N5-N4). 
        Format: Word|KoreanPronunciation|Meaning
        Example: りんご|링고|사과
        Strictly output ONLY the string. No quotes, no sentences.`;
    } else {
        prompt = `Translate "${input}" into Japanese. 
        Format: Japanese|KoreanPronunciation|Description
        Strictly output ONLY the string formatted with '|'.`;
    }

    const data = JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.8
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
                    // 따옴표나 마크다운 기호 제거 로직
                    text = text.replace(/[`"']/g, ""); 
                    resolve({ statusCode: 200, body: JSON.stringify({ text }) });
                } catch (e) {
                    resolve({ statusCode: 500, body: JSON.stringify({ text: "오류|오류|응답 파싱 실패" }) });
                }
            });
        });
        req.on('error', () => resolve({ statusCode: 500, body: JSON.stringify({ text: "오류|오류|네트워크 오류" }) }));
        req.write(data);
        req.end();
    });
};

