// 全局变量
let recognition = null;
let isRecording = false;
let memoirContent = '';

// 百度语音API相关
let mediaRecorder = null;
let audioChunks = [];

// 后端服务配置（支持生产和开发环境）
const BACKEND_CONFIG = {
    baseUrl: (() => {
        // 检测当前环境
        const hostname = window.location.hostname;
        // 如果是本地访问，使用localhost
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
            return 'http://localhost:3001';
        }
        // 生产环境使用当前域名
        return window.location.origin;
    })(),
    accessToken: ''
};

// 记录当前环境
console.log('=== 前端运行环境检测 ===');
console.log('当前域名:', window.location.hostname);
console.log('后端API地址:', BACKEND_CONFIG.baseUrl);
let apiConfig = {
    accessToken: ''
};

// DOM元素
const startBtn = document.getElementById('start-btn');
const stopBtn = document.getElementById('stop-btn');
const clearBtn = document.getElementById('clear-btn');
const addBtn = document.getElementById('add-btn');
const manualInput = document.getElementById('manual-input');
const statusElement = document.getElementById('status');
let memoirContentElement = document.getElementById('memoir-content');

// 检查DOM元素是否存在
console.log('=== DOM元素检查 ===');
console.log('startBtn:', startBtn);
console.log('stopBtn:', stopBtn);
console.log('clearBtn:', clearBtn);
console.log('addBtn:', addBtn);
console.log('manualInput:', manualInput);
console.log('statusElement:', statusElement);
console.log('memoirContentElement:', memoirContentElement);

if (!memoirContentElement) {
    console.error('错误: 无法找到ID为memoir-content的元素');
    // 创建一个默认元素
    const mainElement = document.querySelector('main');
    if (mainElement) {
        const memoirSection = document.createElement('section');
        memoirSection.className = 'memoir-section';
        memoirSection.innerHTML = `
            <h2>我的回忆录</h2>
            <div id="memoir-content" class="memoir-content">
                <!-- 回忆录内容将在这里显示 -->
            </div>
        `;
        mainElement.appendChild(memoirSection);
        memoirContentElement = document.getElementById('memoir-content');
        console.log('已创建默认的memoir-content元素:', memoirContentElement);
    }
}

// 初始化函数
function init() {
    console.log('=== 初始化应用 ===');
    
    // 重新检查memoirContentElement
    if (!memoirContentElement) {
        memoirContentElement = document.getElementById('memoir-content');
        console.log('重新检查memoirContentElement:', memoirContentElement);
    }
    
    // 加载百度语音API配置
    loadApiConfig();
    
    // 加载保存的回忆录内容
    loadMemoir();
    
    // 绑定按钮事件
    if (startBtn) startBtn.addEventListener('click', startRecording);
    if (stopBtn) stopBtn.addEventListener('click', stopRecording);
    if (clearBtn) clearBtn.addEventListener('click', clearMemoir);
    if (addBtn) addBtn.addEventListener('click', function() {
        if (manualInput) {
            const content = manualInput.value.trim();
            if (content) {
                addManualContent(content);
                manualInput.value = ''; // 清空输入框
                localStorage.removeItem('manualInputDraft'); // 清空草稿
            } else {
                if (statusElement) {
                    statusElement.textContent = '请输入内容后再添加';
                }
            }
        }
    });
    
    // 自动保存功能
    if (manualInput) {
        manualInput.addEventListener('input', autoSave);
        manualInput.addEventListener('blur', autoSave);
        
        // 添加快捷键支持
        manualInput.addEventListener('keydown', function(e) {
            // Ctrl+Enter 或 Cmd+Enter 快速添加内容
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault();
                if (addBtn) addBtn.click();
            }
        });
    }
    
    // 加载草稿
    loadDraft();
    
    // 添加使用提示
    setTimeout(() => {
        if (statusElement) {
            statusElement.textContent = '点击开始录音按钮开始记录您的回忆';
        }
    }, 1000);
    
    console.log('=== 初始化完成 ===');
}

// 保存百度语音API配置
function saveApiConfig() {
    const apiKey = apiKeyInput.value.trim();
    const secretKey = secretKeyInput.value.trim();
    
    if (apiKey && secretKey) {
        apiConfig.apiKey = apiKey;
        apiConfig.secretKey = secretKey;
        localStorage.setItem('baiduApiConfig', JSON.stringify(apiConfig));
        statusElement.textContent = 'API配置已保存，正在获取访问令牌...';
        
        // 获取访问令牌
        getAccessToken(apiKey, secretKey);
    } else {
        statusElement.textContent = '请输入完整的API Key和Secret Key';
    }
}

// 加载百度语音API配置
function loadApiConfig() {
    const savedConfig = localStorage.getItem('baiduApiConfig');
    if (savedConfig) {
        apiConfig = JSON.parse(savedConfig);
        console.log('加载保存的API配置:', apiConfig);
    }
    // 从后端获取访问令牌
    statusElement.textContent = '正在从后端获取访问令牌...';
    getAccessTokenFromBackend();
}

// 从后端获取访问令牌
function getAccessTokenFromBackend() {
    const url = `${BACKEND_CONFIG.baseUrl}/api/token`;
    
    console.log('=== 从后端获取访问令牌 ===');
    console.log('请求URL:', url);
    console.log('请求方法:', 'GET');
    
    statusElement.textContent = '正在从后端获取访问令牌...';
    
    fetch(url, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        }
    })
    .then(response => {
        console.log('=== 后端响应 ===');
        console.log('响应状态:', response.status, response.statusText);
        console.log('响应头:', Object.fromEntries(response.headers.entries()));
        
        if (!response.ok) {
            // 尝试读取错误响应内容
            return response.text().then(errorText => {
                console.error('错误响应内容:', errorText);
                throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
            });
        }
        return response.json();
    })
    .then(data => {
        console.log('=== 后端响应数据 ===');
        console.log('完整响应数据:', JSON.stringify(data, null, 2));
        
        if (data.access_token) {
            apiConfig.accessToken = data.access_token;
            BACKEND_CONFIG.accessToken = data.access_token;
            localStorage.setItem('baiduApiConfig', JSON.stringify(apiConfig));
            console.log('访问令牌获取成功:', data.access_token.substring(0, 20) + '...'); // 只显示部分令牌，保护隐私
            statusElement.textContent = '访问令牌获取成功，可以开始录音了。';
        } else {
            console.log('获取访问令牌失败:', data.error || '未知错误');
            statusElement.textContent = '获取访问令牌失败：' + (data.error || '未知错误');
        }
    })
    .catch(error => {
        console.error('=== 从后端获取访问令牌错误详情 ===');
        console.error('错误对象:', error);
        console.error('错误消息:', error.message);
        console.error('错误堆栈:', error.stack);
        statusElement.textContent = '网络错误：无法连接到后端服务，请检查后端服务器是否运行。';
    });
}

// 手动添加内容功能（当语音识别不可用时）
function addManualContent(content) {
    console.log('=== 手动添加内容 ===');
    console.log('添加的内容:', content);
    
    memoirContent += content + '\n';
    console.log('当前回忆录内容:', memoirContent);
    
    // 确保memoirContentElement存在
    if (memoirContentElement) {
        memoirContentElement.textContent = memoirContent;
        console.log('已更新回忆录DOM元素');
    } else {
        console.error('memoirContentElement未定义');
        // 重新尝试获取元素
        memoirContentElement = document.getElementById('memoir-content');
        if (memoirContentElement) {
            memoirContentElement.textContent = memoirContent;
            console.log('重新获取元素并更新');
        }
    }
    
    saveMemoir();
    if (statusElement) {
        statusElement.textContent = '内容已添加';
    }
    console.log('=== 手动添加内容完成 ===');
}

// 自动保存功能
function autoSave() {
    if (manualInput.value.trim()) {
        localStorage.setItem('manualInputDraft', manualInput.value);
    }
}

// 加载草稿
function loadDraft() {
    const draft = localStorage.getItem('manualInputDraft');
    if (draft) {
        manualInput.value = draft;
    }
}

// 开始录音
function startRecording() {
    if (!isRecording) {
        console.log('=== 开始录音 ===');
        const startTime = new Date();
        console.log('录音开始时间:', startTime.toLocaleString());
        console.log('录音内容: 请开始讲述您的回忆...');
        
        // 检查API配置
        if (!apiConfig.accessToken) {
            console.log('错误: 未获取访问令牌');
            statusElement.textContent = '请先配置百度语音API并获取访问令牌';
            return;
        }
        
        console.log('检查API配置: 已获取访问令牌');
        
        // 请求麦克风权限
        console.log('请求麦克风权限...');
        navigator.mediaDevices.getUserMedia({ audio: true })
            .then(stream => {
                console.log('麦克风权限获取成功');
                // 创建MediaRecorder实例，设置为最佳音频格式
                // 使用 audio/webm 格式（浏览器普遍支持，兼容性更好）
                let options = {
                    mimeType: 'audio/webm',
                    audioBitsPerSecond: 48000,
                    sampleRate: 48000,
                    channelCount: 1
                };
                
                // 检查格式是否支持
                if (!MediaRecorder.isTypeSupported(options.mimeType)) {
                    console.warn('audio/webm 格式不支持，尝试 audio/ogg');
                    options.mimeType = 'audio/ogg';
                    if (!MediaRecorder.isTypeSupported(options.mimeType)) {
                        console.warn('audio/ogg 格式也不支持，使用默认格式');
                        options = { mimeType: '' };
                    }
                }
                
                try {
                    if (options.mimeType) {
                        mediaRecorder = new MediaRecorder(stream, options);
                    } else {
                        mediaRecorder = new MediaRecorder(stream);
                    }
                } catch (e) {
                    console.warn('创建MediaRecorder失败，使用默认格式:', e.message);
                    mediaRecorder = new MediaRecorder(stream);
                }
                
                audioChunks = [];
                
                console.log('创建MediaRecorder实例:', mediaRecorder);
                console.log('MediaRecorder配置:', {
                    mimeType: mediaRecorder.mimeType,
                    audioBitsPerSecond: mediaRecorder.audioBitsPerSecond,
                    state: mediaRecorder.state
                });
                
                // 检测浏览器支持的音频格式
                console.log('=== 检测浏览器支持的音频格式 ===');
                const supportedTypes = MediaRecorder.isTypeSupported;
                const testTypes = [
                    'audio/wav',
                    'audio/ogg',
                    'audio/webm',
                    'audio/mp3',
                    'audio/ogg;codecs=opus',
                    'audio/webm;codecs=opus'
                ];
                
                testTypes.forEach(type => {
                    console.log(`支持格式 ${type}:`, MediaRecorder.isTypeSupported(type));
                });
                
                // 绑定事件监听器
                mediaRecorder.ondataavailable = event => {
                    if (event.data.size > 0) {
                        audioChunks.push(event.data);
                        console.log('收到音频数据，大小:', event.data.size, '字节');
                    }
                };
                
                mediaRecorder.onstop = () => {
                    const endTime = new Date();
                    console.log('=== 录音停止 ===');
                    console.log('录音结束时间:', endTime.toLocaleString());
                    console.log('录音时长:', (endTime - startTime) / 1000, '秒');
                    console.log('音频数据块数量:', audioChunks.length);
                    
                    stream.getTracks().forEach(track => track.stop());
                    console.log('麦克风流已停止');
                    console.log('录音内容: 录音已停止，正在处理...');
                    statusElement.textContent = '录音已停止，正在识别...请稍候';
                    
                    // 处理录音数据并调用百度API
                    console.log('开始处理音频数据...');
                    processAudioData(audioChunks);
                };
                
                // 开始录音
                mediaRecorder.start();
                console.log('开始录音');
                
                isRecording = true;
                startBtn.disabled = true;
                stopBtn.disabled = false;
                startBtn.classList.add('recording');
                statusElement.textContent = '🔴 正在录音...请清晰地说出您的回忆（建议2-5秒）';
                statusElement.classList.add('recording-status');
                console.log('UI状态更新: 录音中');
            })
            .catch(error => {
                console.error('=== 获取麦克风权限失败 ===');
                console.error('错误详情:', error);
                statusElement.textContent = '权限错误：请在浏览器设置中允许麦克风权限。';
            });
    } else {
        console.log('警告: 录音已经在进行中');
    }
}

// 停止录音
function stopRecording() {
    if (isRecording && mediaRecorder) {
        console.log('=== 停止录音 ===');
        mediaRecorder.stop();
        isRecording = false;
        startBtn.disabled = false;
        stopBtn.disabled = true;
        startBtn.classList.remove('recording');
        statusElement.classList.remove('recording-status');
        console.log('录音已停止，正在处理...');
    } else {
        console.log('警告: 没有正在进行的录音');
    }
}

// 处理录音数据
function processAudioData(audioChunks) {
    console.log('=== 处理录音数据 ===');
    console.log('音频数据块数量:', audioChunks.length);
    
    // 创建音频Blob
    const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
    console.log('音频Blob大小:', audioBlob.size, '字节');
    console.log('音频Blob类型:', audioBlob.type);
    
    // 转换为Base64
    console.log('开始将音频转换为Base64...');
    const reader = new FileReader();
    reader.onloadend = function() {
        console.log('Base64转换完成');
        const base64Audio = reader.result.split(',')[1];
        console.log('Base64数据长度:', base64Audio.length, '字符');
        console.log('Base64数据前50个字符:', base64Audio.substring(0, 50) + '...');
        
        // 调用语音识别API
        console.log('开始调用语音识别API...');
        recognizeSpeech(base64Audio);
    };
    reader.onerror = function(error) {
        console.error('=== Base64转换错误 ===');
        console.error('错误详情:', error);
        statusElement.textContent = '音频处理错误：转换为Base64失败。';
    };
    reader.readAsDataURL(audioBlob);
}

// 调用后端服务进行语音识别
function recognizeSpeech(base64Audio) {
    const url = `${BACKEND_CONFIG.baseUrl}/api/recognize`;
    
    console.log('=== 调用后端语音识别服务 ===');
    console.log('请求URL:', url);
    console.log('请求方法:', 'POST');
    
    // 将Base64转换为Blob
    const binaryString = atob(base64Audio);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    const audioBlob = new Blob([bytes], { type: 'audio/wav' });
    
    // 创建FormData对象
    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.wav');
    
    fetch(url, {
        method: 'POST',
        body: formData
    })
    .then(response => {
        console.log('=== 后端语音识别响应 ===');
        console.log('响应状态:', response.status, response.statusText);
        console.log('响应头:', Object.fromEntries(response.headers.entries()));
        
        if (!response.ok) {
            // 尝试读取错误响应内容
            return response.text().then(errorText => {
                console.error('错误响应内容:', errorText);
                throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
            });
        }
        return response.json();
    })
    .then(data => {
        console.log('=== 后端语音识别响应数据 ===');
        console.log('完整响应数据:', JSON.stringify(data, null, 2));
        
        if (data.err_no === 0) {
            // 识别成功
            const result = data.result[0];
            console.log('=== 音频内容识别结果 ===');
            console.log('识别结果:', result);
            console.log('音频中的内容:', result);
            console.log('识别结果长度:', result.length, '字符');
            
            memoirContent += result + '\n';
            console.log('当前回忆录内容:', memoirContent);
            
            // 确保memoirContentElement存在
            if (memoirContentElement) {
                memoirContentElement.textContent = memoirContent;
                console.log('已更新回忆录DOM元素');
            } else {
                console.error('memoirContentElement未定义');
                // 重新尝试获取元素
                memoirContentElement = document.getElementById('memoir-content');
                if (memoirContentElement) {
                    memoirContentElement.textContent = memoirContent;
                    console.log('重新获取元素并更新');
                }
            }
            
            saveMemoir();
            if (statusElement) {
                statusElement.textContent = '识别成功：' + result;
            }
        } else if (data.err_msg && data.err_msg.includes('speech quality error')) {
            // 语音质量错误
            console.error('=== 音频质量错误 ===');
            console.error('语音质量错误:', data);
            console.error('错误原因:', '音频质量不佳，可能是环境噪音太大或录音设备问题');
            console.error('建议:', '请在安静环境中重新录音，确保麦克风正常工作');
            if (statusElement) {
                statusElement.textContent = '语音质量错误：请在安静环境中重新录音，确保麦克风正常工作。';
            }
        } else {
            // 其他错误
            console.error('=== 语音识别失败 ===');
            console.error('语音识别失败:', data);
            console.error('错误代码:', data.err_no);
            console.error('错误消息:', data.err_msg);
            console.error('建议:', '请检查网络连接和API配置');
            if (statusElement) {
                statusElement.textContent = '识别失败：' + (data.err_msg || '未知错误');
            }
        }
    })
    .catch(error => {
        console.error('=== 语音识别API调用错误详情 ===');
        console.error('错误对象:', error);
        console.error('错误消息:', error.message);
        console.error('错误堆栈:', error.stack);
        statusElement.textContent = '网络错误：无法连接到后端服务，请检查后端服务器是否运行。';
    });
}

// 清空回忆录
function clearMemoir() {
    if (confirm('确定要清空所有回忆录内容吗？')) {
        memoirContent = '';
        memoirContentElement.textContent = '';
        saveMemoir();
        statusElement.textContent = '回忆录已清空';
    }
}

// 保存回忆录到本地存储
function saveMemoir() {
    console.log('=== 保存回忆录到本地存储 ===');
    console.log('保存前本地存储状态:', {
        memoirContent: localStorage.getItem('memoirContent'),
        localStorageLength: localStorage.length
    });
    console.log('要保存的内容:', memoirContent);
    console.log('要保存的内容长度:', memoirContent.length, '字符');
    
    try {
        localStorage.setItem('memoirContent', memoirContent);
        console.log('保存成功');
        console.log('保存后本地存储状态:', {
            memoirContent: localStorage.getItem('memoirContent'),
            localStorageLength: localStorage.length
        });
    } catch (error) {
        console.error('=== 保存失败 ===');
        console.error('保存失败:', error);
        console.error('错误类型:', error.name);
        console.error('错误消息:', error.message);
        if (statusElement) {
            statusElement.textContent = '保存失败，请重试';
        }
    }
    console.log('=== 保存完成 ===');
}

// 从本地存储加载回忆录
function loadMemoir() {
    console.log('=== 加载回忆录内容 ===');
    console.log('本地存储长度:', localStorage.length);
    console.log('本地存储所有键:', Object.keys(localStorage));
    
    try {
        const savedContent = localStorage.getItem('memoirContent');
        console.log('从本地存储获取的内容:', savedContent);
        console.log('从本地存储获取的内容长度:', savedContent ? savedContent.length : 0, '字符');
        
        if (savedContent) {
            memoirContent = savedContent;
            console.log('加载后的回忆录内容:', memoirContent);
            console.log('加载后的回忆录内容长度:', memoirContent.length, '字符');
            
            // 确保memoirContentElement存在
            if (memoirContentElement) {
                memoirContentElement.textContent = memoirContent;
                console.log('已更新回忆录DOM元素');
            } else {
                console.error('memoirContentElement未定义，无法更新DOM');
                // 重新尝试获取元素
                memoirContentElement = document.getElementById('memoir-content');
                if (memoirContentElement) {
                    memoirContentElement.textContent = memoirContent;
                    console.log('重新获取元素并更新');
                }
            }
        } else {
            console.log('=== 本地存储为空 ===');
            console.log('本地存储中没有保存的回忆录内容');
            console.log('本地存储所有内容:', JSON.stringify(Object.fromEntries(Object.entries(localStorage)), null, 2));
            // 可以设置默认内容
            memoirContent = '';
            if (memoirContentElement) {
                memoirContentElement.textContent = '暂无回忆内容，点击开始录音按钮开始记录';
                console.log('已设置默认提示内容');
            }
        }
    } catch (error) {
        console.error('=== 加载失败 ===');
        console.error('加载失败:', error);
        console.error('错误类型:', error.name);
        console.error('错误消息:', error.message);
        if (statusElement) {
            statusElement.textContent = '加载失败';
        }
        // 重置内容
        memoirContent = '';
    }
    console.log('=== 加载回忆录完成 ===');
    console.log('最终回忆录内容:', memoirContent);
    console.log('最终回忆录内容长度:', memoirContent.length, '字符');
}

// 语音数据管理
const voiceListElement = document.getElementById('voice-list');
const refreshVoicesBtn = document.getElementById('refresh-voices-btn');

// 初始化语音数据管理
function initVoiceManagement() {
    console.log('=== 初始化语音数据管理 ===');
    
    // 绑定刷新按钮事件
    if (refreshVoicesBtn) {
        refreshVoicesBtn.addEventListener('click', fetchVoiceData);
    }
    
    // 初始加载语音数据
    fetchVoiceData();
}

// 从后端获取语音数据
function fetchVoiceData() {
    console.log('=== 从后端获取语音数据 ===');
    
    fetch(`${BACKEND_CONFIG.baseUrl}/api/voices`)
        .then(response => {
            console.log('响应状态:', response.status, response.statusText);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('=== 获取语音数据成功 ===');
            console.log('语音数据:', data);
            console.log('语音数据数量:', data.length);
            
            // 显示语音数据
            displayVoiceData(data);
        })
        .catch(error => {
            console.error('=== 获取语音数据失败 ===');
            console.error('错误:', error);
            if (voiceListElement) {
                voiceListElement.innerHTML = '<p>获取语音数据失败，请重试</p>';
            }
        });
}

// 更新回忆录内容
function updateMemoirContent(voices) {
    console.log('=== 更新回忆录内容 ===');
    
    const memoirContentElement = document.getElementById('memoir-content');
    if (!memoirContentElement) {
        console.error('memoirContentElement未定义');
        return;
    }
    
    if (voices.length === 0) {
        memoirContentElement.innerHTML = '<p>暂无回忆记录，点击开始录音按钮开始记录</p>';
        return;
    }
    
    // 生成回忆录内容
    const memoirItems = voices
        .filter(voice => voice.recognition_result) // 只显示有识别结果的语音
        .map(voice => {
            const date = new Date(voice.created_at);
            const formattedDate = date.toLocaleString('zh-CN', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            });
            
            return `
                <div class="memoir-item">
                    <div class="memoir-item-date">${formattedDate}</div>
                    <div class="memoir-item-content">${voice.recognition_result}</div>
                    <div class="memoir-item-voice">
                        <button class="btn-secondary play-voice-btn" data-id="${voice.id}">播放语音</button>
                    </div>
                </div>
            `;
        }).join('');
    
    memoirContentElement.innerHTML = memoirItems || '<p>暂无语音识别结果</p>';
}

// 显示语音数据
function displayVoiceData(voices) {
    console.log('=== 显示语音数据 ===');
    
    if (!voiceListElement) {
        console.error('voiceListElement未定义');
        return;
    }
    
    if (voices.length === 0) {
        voiceListElement.innerHTML = '<p>暂无语音记录，点击开始录音按钮开始记录</p>';
        updateMemoirContent(voices);
        return;
    }
    
    // 生成语音数据列表
    const voiceItems = voices.map(voice => {
        const date = new Date(voice.created_at);
        const formattedDate = date.toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
        
        return `
            <div class="voice-item" data-id="${voice.id}">
                <div class="voice-item-header">
                    <div class="voice-item-info">
                        <strong>语音 ${voice.id}</strong>
                        <span> · </span>
                        <span>${formattedDate}</span>
                        <span> · </span>
                        <span>大小: ${(voice.audio_size / 1024).toFixed(2)} KB</span>
                    </div>
                    <div class="voice-item-actions">
                        <button class="btn-secondary play-voice-btn" data-id="${voice.id}">播放</button>
                        <button class="btn-secondary delete-voice-btn" data-id="${voice.id}">删除</button>
                    </div>
                </div>
                ${voice.recognition_result ? `
                    <div class="voice-item-content">
                        ${voice.recognition_result}
                    </div>
                ` : ''}
                <div class="voice-item-audio" id="audio-${voice.id}">
                    <!-- 音频播放器将在这里动态添加 -->
                </div>
            </div>
        `;
    }).join('');
    
    voiceListElement.innerHTML = voiceItems;
    
    // 更新回忆录内容
    updateMemoirContent(voices);
    
    // 绑定事件
    bindVoiceItemEvents();
}

// 绑定语音项事件
function bindVoiceItemEvents() {
    console.log('=== 绑定语音项事件 ===');
    
    // 绑定播放按钮事件
    document.querySelectorAll('.play-voice-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const voiceId = this.getAttribute('data-id');
            playVoice(voiceId);
        });
    });
    
    // 绑定删除按钮事件
    document.querySelectorAll('.delete-voice-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const voiceId = this.getAttribute('data-id');
            deleteVoice(voiceId);
        });
    });
}

// 播放语音
function playVoice(voiceId) {
    console.log('=== 播放语音 ===');
    console.log('语音ID:', voiceId);
    
    // 获取语音数据
    fetch(`${BACKEND_CONFIG.baseUrl}/api/voices/${voiceId}`)
        .then(response => {
            console.log('响应状态:', response.status, response.statusText);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('=== 获取语音详情成功 ===');
            console.log('语音详情:', data);
            
            // 创建音频元素
            const audioContainer = document.getElementById(`audio-${voiceId}`);
            if (audioContainer) {
                // 清除现有内容
                audioContainer.innerHTML = '';
                
                // 创建音频元素
                const audioElement = document.createElement('audio');
                audioElement.controls = true;
                audioElement.src = `data:audio/wav;base64,${data.audio_data}`;
                audioElement.title = `语音 ${voiceId}`;
                
                // 添加到容器
                audioContainer.appendChild(audioElement);
                
                // 自动播放
                audioElement.play().catch(error => {
                    console.warn('自动播放失败:', error);
                });
            }
        })
        .catch(error => {
            console.error('=== 获取语音详情失败 ===');
            console.error('错误:', error);
        });
}

// 删除语音
function deleteVoice(voiceId) {
    console.log('=== 删除语音 ===');
    console.log('语音ID:', voiceId);
    
    if (confirm(`确定要删除语音 ${voiceId} 吗？`)) {
        fetch(`${BACKEND_CONFIG.baseUrl}/api/voices/${voiceId}`, {
            method: 'DELETE'
        })
        .then(response => {
            console.log('响应状态:', response.status, response.statusText);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('=== 删除语音成功 ===');
            console.log('删除结果:', data);
            
            // 重新加载语音数据
            fetchVoiceData();
        })
        .catch(error => {
            console.error('=== 删除语音失败 ===');
            console.error('错误:', error);
        });
    }
}

// 页面加载完成后初始化
window.addEventListener('DOMContentLoaded', function() {
    init();
    initVoiceManagement();
});