const axios = require('axios');

// 百度API配置
const API_CONFIG = {
    apiKey: process.env.API_KEY || 'gCLxpGzB8gTMv7WL7DUqLohD',
    secretKey: process.env.SECRET_KEY || 'OIvnHq2TfiTAIRxpi8DcWrTXTpvkqzL9',
    accessToken: '',
    tokenExpireTime: 0
};

// API路由：获取百度访问令牌
module.exports = async (req, res) => {
    // 设置CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        // 检查令牌是否有效
        if (API_CONFIG.accessToken && Date.now() < API_CONFIG.tokenExpireTime) {
            console.log('使用缓存的访问令牌');
            return res.json({ access_token: API_CONFIG.accessToken });
        }

        // 获取新令牌
        const url = `https://aip.baidubce.com/oauth/2.0/token`;
        const params = {
            grant_type: 'client_credentials',
            client_id: API_CONFIG.apiKey,
            client_secret: API_CONFIG.secretKey
        };

        console.log('请求新的访问令牌...');
        
        const response = await axios.post(url, null, { params });
        const data = response.data;

        if (data.access_token) {
            API_CONFIG.accessToken = data.access_token;
            API_CONFIG.tokenExpireTime = Date.now() + (data.expires_in || 2592000) * 1000;
            
            console.log('访问令牌获取成功，有效期至:', new Date(API_CONFIG.tokenExpireTime).toLocaleString());
            
            res.json({ access_token: data.access_token });
        } else {
            throw new Error('获取访问令牌失败: ' + (data.error_description || '未知错误'));
        }
    } catch (error) {
        console.error('获取访问令牌错误:', error.message);
        res.status(500).json({ error: error.message });
    }
};
