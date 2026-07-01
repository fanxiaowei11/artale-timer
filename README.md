# Artale 炎魔机制计时器

多用户实时同步版 Node.js + WebSocket 计时器，用于 Artale 游戏中的炎魔机制。

## 功能

- **魔方提醒**：召唤炎魔后，每 2 分 30 秒提醒一次，共提醒 20 次
- **黑水提醒**：双魔方出现后，38 秒提醒躲避黑水
- **多用户同步**：所有连接的用户实时同步计时器状态（WebSocket）

## 部署到 Railway（免费）

1. 访问 [Railway](https://railway.app) 并用 GitHub 账号登录
2. 点击 "New Project" → "Deploy from GitHub repo"
3. 选择 `fanxiaowei11/artale-timer` 仓库
4. Railway 会自动识别 `railway.json` 配置并部署
5. 部署完成后，点击生成的域名即可访问

## 本地运行

```bash
npm install
npm start
```

服务器将在 http://localhost:3000 启动
