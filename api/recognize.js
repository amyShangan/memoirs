const { createClient } = require('@supabase/supabase-js');

// Supabase 客户端初始化
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

let supabase = null;

// 只有配置了Supabase才初始化
if (supabaseUrl && supabaseKey) {
    supabase = createClient(supabaseUrl, supabaseKey);
}

// 百度API配置
const API_CONFIG = {
    apiKey: process.env.API_KEY || 'gCLxpGzB8gTMv7WL7DUqLohD',
    secretKey: process.env.SECRET_KEY || 'OIvnHq2TfiTAIRxpi8DcWrTXTpvkqzL9',
    accessToken: '',
    tokenExpireTime: 0
};

// 获取百度访问令牌
async function getAccessToken() {
    if (API_CONFIG.accessToken && Date.now() < API_CONFIG.tokenExpireTime) {
        return API_CONFIG.accessToken;
    }

    try {
        const url = `https://aip.baidubce.com/oauth/2.0/token`;
        const params = {
            grant_type: 'client_credentials',
            client_id: API_CONFIG.apiKey,
            client_secret: API_CONFIG.secretKey
        };

        const response = await fetch(url, {
            method: 'POST',
            body: new URLSearchParams(params)
        });
        const data = await response.json();

        if (data.access_token) {
            API_CONFIG.accessToken = data.access_token;
            API_CONFIG.tokenExpireTime = Date.now() + (data.expires_in || 2592000) * 1000;
            return data.access_token;
        } else {
            throw new Error('获取访问令牌失败: ' + (data.error_description || '未知错误'));
        }
    } catch (error) {
        console.error('获取访问令牌错误:', error);
        throw error;
    }
}

// API路由：语音识别
module.exports = async (req, res) => {
    // 设置CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        // 获取访问令牌
        const token = await getAccessToken();
        
        // 获取音频数据
        const { audio, filename } = req.body;
        
        if (!audio) {
            return res.status(400).json({ error: '没有音频数据' });
        }

        // 转换base64音频数据
        const audioData = Buffer.from(audio, 'base64');
        const base64Audio = audioData.toString('base64');

        // 调用百度语音API
        const baiduUrl = 'https://vop.baidu.com/server_api';
        const baiduData = {
            format: 'wav',
            rate: 16000,
            channel: 1,
            cuid: 'memoir_app',
            token: token,
            speech: base64Audio,
            len: audioData.length
        };

        const response = await fetch(baiduUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(baiduData)
        });

        const result = await response.json();
        console.log('百度API响应:', result);

        // 保存到Supabase
        let voiceId = null;
        if (supabase) {
            const recognitionResult = result.err_no === 0 ? result.result?.[0] : null;
            
            const { data, error } = await supabase
                .from('voices')
                .insert({
                    audio_name: filename || 'recording.wav',
                    audio_size: audioData.length,
                    audio_url: null,  // Vercel限制，无法直接存储大文件
                    recognition_result: recognitionResult
                })
                .select();

            if (error) {
                console.error('Supabase保存失败:', error);
            } else if (data && data.length > 0) {
                voiceId = data[0].id;
            }
        }

        // 返回结果
        res.json({
            ...result,
            voiceId: voiceId
        });
    } catch (error) {
        console.error('语音识别错误:', error);
        res.status(500).json({ error: error.message });
    }
};
