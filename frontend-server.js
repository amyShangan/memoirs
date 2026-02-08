const express = require('express');
const path = require('path');
const cors = require('cors');
const port = 8000;

const app = express();

// 中间件
app.use(cors());
app.use(express.static(path.join(__dirname)));

// 处理所有请求，返回index.html
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// 启动服务器
app.listen(port, () => {
    console.log(`前端服务器运行在 http://localhost:${port}`);
});
