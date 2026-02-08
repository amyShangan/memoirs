const express = require('express');
const cors = require('cors');
const multer = require('multer');
const axios = require('axios');
const path = require('path');
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
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

// Supabase 配置
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

let supabase = null;

// 如果配置了 Supabase，则初始化
if (supabaseUrl && supabaseKey) {
    supabase = createClient(supabaseUrl, supabaseKey);
    console.log('=== Supabase 已连接 ===');
    console.log('URL:', supabaseUrl);
} else {
    console.log('⚠️  Supabase 未配置，将使用本地数据库');
}

// 回退到 SQLite（如果 Supabase 未配置）
let db = null;
const DB_PATH = path.join(__dirname, 'memoir.db');

if (!supabase) {
    const sqlite3 = require('sqlite3').verbose();
    db = new sqlite3.Database(DB_PATH, (err) => {
        if (err) {
            console.error('SQLite 数据库连接失败:', err.message);
        } else {
            console.log('SQLite 数据库连接成功');
            createTables();
        }
    });
}

// 百度API配置（支持环境变量）
const API_CONFIG = {
    apiKey: process.env.API_KEY || 'gCLxpGzB8gTMv7WL7DUqLohD',
    secretKey: process.env.SECRET_KEY || 'OIvnHq2TfiTAIRxpi8DcWrTXTpvkqzL9',
    accessToken: '',
    tokenExpireTime: 0
};

// 检测是否为生产环境
const isProduction = process.env.NODE_ENV === 'production';
console.log('=== 运行环境 ===');
console.log('环境:', isProduction ? '生产环境' : '开发环境');
console.log('端口:', port);
console.log('数据库:', supabase ? 'Supabase' : 'SQLite');

// 创建数据库表（SQLite 回退）
function createTables() {
    console.log('=== 创建数据库表 ===');
    
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

// Supabase 数据库操作
const supabaseDb = {
    async getAllVoices() {
        const { data, error } = await supabase
            .from('voices')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        console.log('Supabase - 获取语音数据成功，数量:', data.length);
        return data;
    },
    
    async getVoiceById(id) {
        const { data, error } = await supabase
            .from('voices')
            .select('*')
            .eq('id', id)
            .single();
        
        if (error) throw error;
        return data;
    },
    
    async saveVoice(audioData, audioName, audioSize, recognitionResult) {
        // 先上传音频文件
        let audioUrl = null;
        const fileName = `${Date.now()}_${audioName}`;
        
        try {
            const { data: uploadData, error: uploadError } = await supabase
                .storage
                .from('audio-recordings')
                .upload(fileName, audioData, {
                    contentType: 'audio/wav',
                    upsert: false
                });
            
            if (!uploadError) {
                const { data: urlData } = supabase
                    .storage
                    .from('audio-recordings')
                    .getPublicUrl(fileName);
                audioUrl = urlData.publicUrl;
            }
        } catch (err) {
            console.warn('音频上传失败:', err.message);
        }
        
        // 保存记录
        const { data, error } = await supabase
            .from('voices')
            .insert({
                audio_name: audioName,
                audio_size: audioSize,
                audio_url: audioUrl,
                recognition_result: recognitionResult
            })
            .select();
        
        if (error) throw error;
        console.log('Supabase - 保存成功，ID:', data[0].id);
        return data[0].id;
    },
    
    async deleteVoice(id) {
        const voice = await this.getVoiceById(id);
        
        if (voice?.audio_url) {
            try {
                const fileName = voice.audio_url.split('/').pop();
                await supabase.storage.from('audio-recordings').remove([fileName]);
            } catch (err) {
                console.warn('音频文件删除失败:', err.message);
            }
        }
        
        const { error } = await supabase
            .from('voices')
            .delete()
            .eq('id', id);
        
        if (error) throw error;
        return 1;
    }
};

// SQLite 数据库操作（回退）
const sqliteDb = {
    getAllVoices() {
        return new Promise((resolve, reject) => {
            const selectSQL = `
                SELECT id, audio_name, audio_size, recognition_result, created_at
                FROM voices
                ORDER BY created_at DESC
            `;
            
            db.all(selectSQL, [], (err, rows) => {
                if (err) reject(err);
                else {
                    console.log('SQLite - 获取语音数据成功，数量:', rows.length);
                    resolve(rows);
                }
            });
        });
    },
    
    getVoiceById(id) {
        return new Promise((resolve, reject) => {
            const selectSQL = `SELECT * FROM voices WHERE id = ?`;
            db.get(selectSQL, [id], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    },
    
    saveVoice(audioData, audioName, audioSize, recognitionResult) {
        return new Promise((resolve, reject) => {
            const insertSQL = `
                INSERT INTO voices (audio_data, audio_name, audio_size, recognition_result)
                VALUES (?, ?, ?, ?)
            `;
            
            db.run(insertSQL, [audioData, audioName, audioSize, recognitionResult], function(err) {
                if (err) reject(err);
                else {
                    console.log('SQLite - 保存成功，ID:', this.lastID);
                    resolve(this.lastID);
                }
            });
        });
    },
    
    deleteVoice(id) {
        return new Promise((resolve, reject) => {
            const deleteSQL = `DELETE FROM voices WHERE id = ?`;
            db.run(deleteSQL, [id], function(err) {
                if (err) reject(err);
                else {
                    console.log('SQLite - 删除成功，影响行数:', this.changes);
                    resolve(this.changes);
                }
            });
        });
    }
};

// 使用当前配置的数据库
const currentDb = supabase ? supabaseDb : sqliteDb;

// 获取访问令牌
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

        const response = await axios.post(url, null, { params });
        const data = response.data;

        if (data.access_token) {
            API_CONFIG.accessToken = data.access_token;
            API_CONFIG.tokenExpireTime = Date.now() + (data.expires_in || 2592000) * 1000;
            console.log('访问令牌获取成功，有效期至:', new Date(API_CONFIG.tokenExpireTime).toLocaleString());
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
app.post('/api/recognize', async (req, res) => {
    try {
        const token = await getAccessToken();
        
        // 处理文件上传
        const multer = require('multer');
        const upload = multer({ storage: multer.memoryStorage() });
        
        // 手动处理 multipart/form-data
        const audioData = req.body.audioData ? Buffer.from(req.body.audioData, 'base64') : null;
        
        if (!audioData) {
            return res.status(400).json({ error: '没有音频数据' });
        }
        
        const base64Audio = audioData.toString('base64');

        const url = 'https://vop.baidu.com/server_api';
        const data = {
            format: 'wav',
            rate: 16000,
            channel: 1,
            cuid: 'memoir_app',
            token: token,
            speech: base64Audio,
            len: audioData.length
        };

        const response = await axios.post(url, data, {
            headers: { 'Content-Type': 'application/json' }
        });

        console.log('=== 百度语音API响应 ===');
        console.log('响应状态:', response.status);
        
        const recognitionResult = response.data.err_no === 0 ? response.data.result[0] : null;
        console.log('识别结果:', recognitionResult);
        
        if (response.data.err_no !== 0) {
            console.error('百度语音API错误:', response.data);
        }
        
        // 保存到数据库
        const voiceId = await currentDb.saveVoice(
            audioData,
            'recording.wav',
            audioData.length,
            recognitionResult
        );

        res.json({ ...response.data, voiceId });
    } catch (error) {
        console.error('语音识别错误:', error);
        res.status(500).json({ error: error.message });
    }
});

// 路由：获取所有语音数据
app.get('/api/voices', async (req, res) => {
    try {
        const voices = await currentDb.getAllVoices();
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
        const voice = await currentDb.getVoiceById(id);
        
        if (voice) {
            if (!supabase && voice.audio_data) {
                voice.audio_data = voice.audio_data.toString('base64');
            }
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
        const changes = await currentDb.deleteVoice(id);
        
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
    console.log(`服务器运行在 http://localhost:${port}`);
    
    if (!supabase) {
        initDatabase();
    }
    
    getAccessToken().catch(error => {
        console.error('启动时获取令牌失败:', error);
    });
});
