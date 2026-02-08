const { createClient } = require('@supabase/supabase-js');

// Supabase 客户端初始化
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

let supabase = null;

if (supabaseUrl && supabaseKey) {
    supabase = createClient(supabaseUrl, supabaseKey);
}

// API路由：获取所有语音
module.exports = async (req, res) => {
    // 设置CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        // 如果配置了Supabase，从云端获取
        if (supabase) {
            const { data, error } = await supabase
                .from('voices')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            console.log('从Supabase获取语音数据，数量:', data.length);
            return res.json(data);
        }

        // 否则返回空数组（Vercel无状态）
        console.log('Supabase未配置，返回空数组');
        res.json([]);
    } catch (error) {
        console.error('获取语音数据错误:', error);
        res.status(500).json({ error: error.message });
    }
};
