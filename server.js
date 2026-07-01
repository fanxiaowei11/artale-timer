const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const CUBE_INTERVAL = 150; // 2分30秒 = 150秒
const CUBE_ALERT_LIMIT = 20;
const WATER_INTERVAL = 38;

// 服务端统一管理计时器状态
const state = {
  cube: {
    running: false,
    remaining: CUBE_INTERVAL,
    alertCount: 0,
    intervalId: null
  },
  water: {
    running: false,
    remaining: WATER_INTERVAL,
    intervalId: null
  }
};

function getState() {
  return {
    cube: {
      running: state.cube.running,
      remaining: state.cube.remaining,
      alertCount: state.cube.alertCount
    },
    water: {
      running: state.water.running,
      remaining: state.water.remaining
    }
  };
}

function broadcastState() {
  io.emit('state', getState());
}

function broadcastEvent(event, data) {
  io.emit(event, data);
}

function startCube() {
  if (state.cube.running) return;
  if (state.cube.alertCount >= CUBE_ALERT_LIMIT) {
    state.cube.alertCount = 0;
  }

  state.cube.running = true;
  state.cube.remaining = CUBE_INTERVAL;

  broadcastState();
  broadcastEvent('event', { type: 'cube_started', alertCount: state.cube.alertCount });

  state.cube.intervalId = setInterval(() => {
    state.cube.remaining -= 1;

    if (state.cube.remaining <= 0) {
      state.cube.alertCount += 1;
      broadcastEvent('event', { type: 'cube_alert', alertCount: state.cube.alertCount });

      if (state.cube.alertCount >= CUBE_ALERT_LIMIT) {
        clearInterval(state.cube.intervalId);
        state.cube.intervalId = null;
        state.cube.running = false;
        state.cube.remaining = 0;
        broadcastState();
        broadcastEvent('event', { type: 'cube_completed' });
      } else {
        state.cube.remaining = CUBE_INTERVAL;
        broadcastState();
      }
    } else {
      broadcastState();
    }
  }, 1000);
}

function resetCube(full) {
  if (state.cube.intervalId) clearInterval(state.cube.intervalId);
  state.cube.intervalId = null;
  state.cube.running = false;
  state.cube.remaining = CUBE_INTERVAL;
  if (full) state.cube.alertCount = 0;
  broadcastState();
}

function startWater() {
  if (state.water.running) return;

  state.water.running = true;
  state.water.remaining = WATER_INTERVAL;

  broadcastState();
  broadcastEvent('event', { type: 'water_started' });

  state.water.intervalId = setInterval(() => {
    state.water.remaining -= 1;

    if (state.water.remaining <= 0) {
      clearInterval(state.water.intervalId);
      state.water.intervalId = null;
      state.water.running = false;
      state.water.remaining = WATER_INTERVAL;
      broadcastState();
      broadcastEvent('event', { type: 'water_alert' });
    } else {
      broadcastState();
    }
  }, 1000);
}

function resetWater() {
  if (state.water.intervalId) clearInterval(state.water.intervalId);
  state.water.intervalId = null;
  state.water.running = false;
  state.water.remaining = WATER_INTERVAL;
  broadcastState();
}

// 提供静态文件
app.use(express.static(path.join(__dirname)));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

io.on('connection', (socket) => {
  console.log(`用户已连接: ${socket.id}`);

  // 新用户连接时，发送当前状态
  socket.emit('state', getState());

  socket.on('cube_start', () => startCube());
  socket.on('cube_reset', (full) => resetCube(full !== false));
  socket.on('water_start', () => startWater());
  socket.on('water_reset', () => resetWater());

  socket.on('disconnect', () => {
    console.log(`用户已断开: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`服务器已启动: http://localhost:${PORT}`);
});
