const express = require('express');
const cors = require('cors');
const multer = require('multer');
const axios = require('axios');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3001;

// 中间件
app.use(cors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true
}));
app.use(express.json());
app.use(express.static('public'));

// 百度API配置（支持环境变量）
const API_CONFIG = {
    apiKey: process.env.API_KEY || 'gCLxpGzB8gTMv7WL7DUqLohD',
    secretKey: process.env.SECRET_KEY || 'OIvnHq2TfiTAIRxpi8DcWrTXTpvkqzL9',
    accessToken: '',
    tokenExpireTime: 0
};

// 数据库配置
const DB_PATH = process.env.DB_PATH ? path.resolve(process.env.DB_PATH) : path.join(__dirname, 'memoir.db');
let db;

// 检测是否为生产环境
const isProduction = process.env.NODE_ENV === 'production';
console.log('=== 运行环境 ===');
console.log('环境:', isProduction ? '生产环境' : '开发环境');
console.log('端口:', port);

// 初始化数据库
function initDatabase() {
    console.log('=== 初始化数据库 ===');
    
    // 创建数据库连接
    db = new sqlite3.Database(DB_PATH, (err) => {
        if (err) {
            console.error('数据库连接失败:', err.message);
        } else {
            console.log('数据库连接成功');
            // 创建语音存储表
            createTables();
        }
    });
}

// 创建数据库表
function createTables() {
    console.log('=== 创建数据库表 ===');
    
    // 创建语音存储表
    const createVoiceTableSQL = `
        CREATE TABLE IF NOT EXISTS voices (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            audio_data BLOB NOT NULL,
            audio_name TEXT,
            audio_size INTEGER,
            recognition_result TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `;
    
    db.run(createVoiceTableSQL, (err) => {
        if (err) {
            console.error('创建语音表失败:', err.message);
        } else {
            console.log('创建语音表成功');
        }
    });
}

// 存储语音数据到数据库
function saveVoiceToDatabase(audioData, audioName, audioSize, recognitionResult) {
    return new Promise((resolve, reject) => {
        console.log('=== 存储语音数据到数据库 ===');
        console.log('语音大小:', audioSize, '字节');
        console.log('识别结果:', recognitionResult);
        
        const insertSQL = `
            INSERT INTO voices (audio_data, audio_name, audio_size, recognition_result)
            VALUES (?, ?, ?, ?)
        `;
        
        db.run(insertSQL, [audioData, audioName, audioSize, recognitionResult], function(err) {
            if (err) {
                console.error('存储语音数据失败:', err.message);
                reject(err);
            } else {
                console.log('存储语音数据成功，ID:', this.lastID);
                resolve(this.lastID);
            }
        });
    });
}

// 获取所有语音数据
function getAllVoices() {
    return new Promise((resolve, reject) => {
        const selectSQL = `
            SELECT id, audio_name, audio_size, recognition_result, created_at
            FROM voices
            ORDER BY created_at DESC
        `;
        
        db.all(selectSQL, [], (err, rows) => {
            if (err) {
                console.error('获取语音数据失败:', err.message);
                reject(err);
            } else {
                console.log('获取语音数据成功，数量:', rows.length);
                resolve(rows);
            }
        });
    });
}

// 获取单个语音数据
function getVoiceById(id) {
    return new Promise((resolve, reject) => {
        const selectSQL = `
            SELECT * FROM voices WHERE id = ?
        `;
        
        db.get(selectSQL, [id], (err, row) => {
            if (err) {
                console.error('获取语音数据失败:', err.message);
                reject(err);
            } else {
                console.log('获取语音数据成功:', row ? '找到' : '未找到');
                resolve(row);
            }
        });
    });
}

// 删除语音数据
function deleteVoiceById(id) {
    return new Promise((resolve, reject) => {
        const deleteSQL = `
            DELETE FROM voices WHERE id = ?
        `;
        
        db.run(deleteSQL, [id], function(err) {
            if (err) {
                console.error('删除语音数据失败:', err.message);
                reject(err);
            } else {
                console.log('删除语音数据成功，影响行数:', this.changes);
                resolve(this.changes);
            }
        });
    });
}

// 存储配置
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// 获取访问令牌
async function getAccessToken() {
    // 检查令牌是否有效
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

        const response = await axios.post(url, null, { params });
        const data = response.data;

        if (data.access_token) {
            API_CONFIG.accessToken = data.access_token;
            // 设置令牌过期时间（默认2592000秒，即30天）
            API_CONFIG.tokenExpireTime = Date.now() + (data.expires_in || 2592000) * 1000;
            console.log('访问令牌获取成功，有效期至:', new Date(API_CONFIG.tokenExpireTime).toLocaleString());
            console.log('访问令牌:', data.access_token.substring(0, 50) + '...'); // 只显示部分令牌，保护隐私
            return data.access_token;
        } else {
            throw new Error('获取访问令牌失败: ' + (data.error_description || '未知错误'));
        }
    } catch (error) {
        console.error('获取访问令牌错误:', error);
        throw error;
    }
}

// 路由：获取访问令牌
app.get('/api/token', async (req, res) => {
    try {
        const token = await getAccessToken();
        res.json({ access_token: token });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 路由：语音识别
app.post('/api/recognize', upload.single('audio'), async (req, res) => {
    try {
        const token = await getAccessToken();
        const audioData = req.file.buffer;
        const base64Audio = audioData.toString('base64');
        
        // 检测音频格式
        const originalname = req.file.originalname || 'recording.wav';
        const mimeType = req.file.mimetype || '';
        let audioFormat = 'wav';
        let audioRate = 16000;
        
        console.log('=== 音频文件信息 ===');
        console.log('文件名:', originalname);
        console.log('MIME类型:', mimeType);
        console.log('文件大小:', audioData.length, '字节');
        
        // 根据MIME类型设置格式
        if (mimeType.includes('webm')) {
            audioFormat = 'webm';
            audioRate = 48000;
        } else if (mimeType.includes('ogg')) {
            audioFormat = 'ogg';
            audioRate = 48000;
        } else if (mimeType.includes('mp3')) {
            audioFormat = 'mp3';
            audioRate = 44100;
        }
        
        console.log('识别的音频格式:', audioFormat);
        console.log('采样率:', audioRate);
        
        const url = 'https://vop.baidu.com/server_api';
        const data = {
            format: audioFormat,
            rate: audioRate,
            channel: 1,
            cuid: 'memoir_app',
            token: token,
            speech: base64Audio,
            len: audioData.length
        };

        const response = await axios.post(url, data, {
            headers: {
                'Content-Type': 'application/json'
            }
        });

        console.log('=== 百度语音API响应 ===');
        console.log('响应状态:', response.status, response.statusText);
        console.log('响应数据:', JSON.stringify(response.data, null, 2));

        // 存储语音数据到数据库
        const recognitionResult = response.data.err_no === 0 ? response.data.result[0] : null;
        console.log('识别结果:', recognitionResult);
        
        if (response.data.err_no !== 0) {
            console.error('百度语音API错误:', {
                err_no: response.data.err_no,
                err_msg: response.data.err_msg,
                suggestion: response.data.err_no === 3301 ? '音频质量不佳，请确保录音清晰、噪音小' : '请检查网络连接或API配置'
            });
        }
        
        await saveVoiceToDatabase(
            audioData,
            originalname,
            audioData.length,
            recognitionResult
        );

        res.json(response.data);
    } catch (error) {
        console.error('语音识别错误:', error);
        res.status(500).json({ error: error.message });
    }
});

// 路由：获取所有语音数据
app.get('/api/voices', async (req, res) => {
    try {
        const voices = await getAllVoices();
        res.json(voices);
    } catch (error) {
        console.error('获取语音数据错误:', error);
        res.status(500).json({ error: error.message });
    }
});

// 路由：获取单个语音数据
app.get('/api/voices/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const voice = await getVoiceById(id);
        if (voice) {
            // 将音频数据转换为Base64
            voice.audio_data = voice.audio_data.toString('base64');
            res.json(voice);
        } else {
            res.status(404).json({ error: '语音数据未找到' });
        }
    } catch (error) {
        console.error('获取语音数据错误:', error);
        res.status(500).json({ error: error.message });
    }
});

// 路由：删除语音数据
app.delete('/api/voices/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const changes = await deleteVoiceById(id);
        if (changes > 0) {
            res.json({ message: '删除成功' });
        } else {
            res.status(404).json({ error: '语音数据未找到' });
        }
    } catch (error) {
        console.error('删除语音数据错误:', error);
        res.status(500).json({ error: error.message });
    }
});

// 静态文件服务
app.use(express.static(path.join(__dirname, '.')));

// 启动服务器
app.listen(port, () => {
    console.log(`后端服务器运行在 http://localhost:${port}`);
    // 初始化数据库
    initDatabase();
    // 启动时获取一次令牌
    getAccessToken().catch(error => {
        console.error('启动时获取令牌失败:', error);
    });
});
