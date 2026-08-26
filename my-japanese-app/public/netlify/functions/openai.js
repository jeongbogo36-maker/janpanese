const https = require('https');

exports.handler = async (event) => {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return { statusCode: 500, body: JSON.stringify({ text: "오류|오류|API 키 없음" }) };

    const { mode, input } = JSON.parse(event.body);

    let prompt = "";
    if (mode === 'word_game') {
        prompt = `Select ONE random Japanese word (JLPT N5-N3). 
        Format: Word|PronunciationInKorean|Meaning
        Example: りんご|링고|사과
        Strictly output ONLY the string. No explanation, no quotes, no markdown.`;
    } else {
        prompt = `Translate "${input}" to Japanese. 
        Format: Japanese|KoreanPronunciation|Description
        Strictly output ONLY the string formatted with '|'.`;
    }

    const data = JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
        temperature: 1.0 // 무작위성 극대화
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
                    // AI 응답에서 따옴표, 마크다운 기호 등을 제거
                    let text = response.choices[0].message.content.trim();
                    text = text.replace(/[`"']/g, ""); 
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

