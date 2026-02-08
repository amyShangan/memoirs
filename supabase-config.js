// Supabase 配置
// 访问 https://supabase.com 创建免费项目

const supabaseUrl = process.env.SUPABASE_URL || '你的SUPABASE_URL';
const supabaseKey = process.env.SUPABASE_ANON_KEY || '你的SUPABASE_ANON_KEY';

module.exports = {
    url: supabaseUrl,
    anonKey: supabaseKey,
    
    // 数据库表配置
    tables: {
        voices: 'voices'
    },
    
    // 存储桶配置
    buckets: {
        audio: 'audio-recordings'
    }
};
