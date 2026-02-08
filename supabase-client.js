const { createClient } = require('@supabase/supabase-js');
const config = require('./supabase-config');

// 初始化 Supabase 客户端
const supabase = createClient(config.url, config.anonKey);

// 数据库操作模块
const db = {
    /**
     * 获取所有语音记录
     */
    async getAllVoices() {
        try {
            const { data, error } = await supabase
                .from(config.tables.voices)
                .select('*')
                .order('created_at', { ascending: false });
            
            if (error) throw error;
            
            console.log('=== Supabase 查询结果 ===');
            console.log('获取语音数据成功，数量:', data.length);
            
            return data;
        } catch (error) {
            console.error('获取语音数据失败:', error.message);
            throw error;
        }
    },

    /**
     * 获取单个语音记录
     */
    async getVoiceById(id) {
        try {
            const { data, error } = await supabase
                .from(config.tables.voices)
                .select('*')
                .eq('id', id)
                .single();
            
            if (error) throw error;
            
            console.log('获取语音数据成功:', data ? '找到' : '未找到');
            return data;
        } catch (error) {
            console.error('获取语音数据失败:', error.message);
            throw error;
        }
    },

    /**
     * 保存语音记录
     * @param {Buffer} audioData - 音频数据
     * @param {string} audioName - 音频文件名
     * @param {number} audioSize - 音频大小
     * @param {string} recognitionResult - 识别结果
     * @returns {Promise<number>} - 新记录的ID
     */
    async saveVoice(audioData, audioName, audioSize, recognitionResult) {
        try {
            console.log('=== 保存语音到 Supabase ===');
            console.log('文件名:', audioName);
            console.log('大小:', audioSize, '字节');
            console.log('识别结果:', recognitionResult);
            
            // 1. 先上传音频文件到存储
            let audioUrl = null;
            const fileName = `${Date.now()}_${audioName}`;
            
            try {
                const { data: uploadData, error: uploadError } = await supabase
                    .storage
                    .from(config.buckets.audio)
                    .upload(fileName, audioData, {
                        contentType: 'audio/wav',
                        upsert: false
                    });
                
                if (uploadError) {
                    console.warn('音频上传失败（继续保存记录）:', uploadError.message);
                } else {
                    // 获取公开URL
                    const { data: urlData } = supabase
                        .storage
                        .from(config.buckets.audio)
                        .getPublicUrl(fileName);
                    
                    audioUrl = urlData.publicUrl;
                    console.log('音频已上传，URL:', audioUrl);
                }
            } catch (uploadErr) {
                console.warn('音频上传出错（继续保存记录）:', uploadErr.message);
            }
            
            // 2. 保存记录到数据库
            const { data, error } = await supabase
                .from(config.tables.voices)
                .insert({
                    audio_name: audioName,
                    audio_size: audioSize,
                    audio_url: audioUrl,
                    recognition_result: recognitionResult
                })
                .select();
            
            if (error) throw error;
            
            console.log('保存成功，ID:', data[0].id);
            return data[0].id;
        } catch (error) {
            console.error('保存语音数据失败:', error.message);
            throw error;
        }
    },

    /**
     * 删除语音记录
     */
    async deleteVoice(id) {
        try {
            // 1. 获取记录信息
            const voice = await this.getVoiceById(id);
            
            if (!voice) {
                throw new Error('语音记录未找到');
            }
            
            // 2. 删除存储中的音频文件
            if (voice.audio_url) {
                try {
                    const fileName = voice.audio_url.split('/').pop();
                    await supabase
                        .storage
                        .from(config.buckets.audio)
                        .remove([fileName]);
                    console.log('音频文件已删除');
                } catch (err) {
                    console.warn('音频文件删除失败:', err.message);
                }
            }
            
            // 3. 删除数据库记录
            const { error } = await supabase
                .from(config.tables.voices)
                .delete()
                .eq('id', id);
            
            if (error) throw error;
            
            console.log('删除成功，影响行数: 1');
            return 1;
        } catch (error) {
            console.error('删除语音数据失败:', error.message);
            throw error;
        }
    }
};

module.exports = {
    supabase,
    db
};
