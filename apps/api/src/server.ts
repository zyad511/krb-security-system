import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import cors from 'cors';
import { GuildConfig } from '../../bot/src/database/GuildConfig';
import { CacheManager } from '../../bot/src/database/CacheManager';

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });
const cache = CacheManager.getInstance();

app.use(cors());
app.use(express.json());

// الـ Connection بقاعدة البيانات
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/securitybot');

// مسار تعديل إعدادات السيرفر وحفظها تلقائياً بالداتابيز والكاش
app.post('/api/guilds/:guildId/config', async (req, res) => {
  const { guildId } = req.params;
  const updatedData = req.body;

  // تحديث قاعدة البيانات
  const config = await GuildConfig.findOneAndUpdate(
    { guildId },
    { $set: updatedData },
    { new: true, upsert: true }
  );

  // مسح وتحديث الكاش في الـ Redis فوراً ليطبقه البوت بدون إعادة تشغيل
  await cache.invalidateGuildConfig(guildId);
  await cache.setGuildConfig(guildId, config);

  // إرسال تحديث عبر الـ WebSocket إلى لوحة التحكم المفتوحة لدى المديرين
  io.to(`guild:${guildId}`).emit('configUpdated', config);

  return res.json({ success: true, data: config });
});

// إدارة اتصالات الـ WebSockets للمزامنة اللحظية
io.on('connection', (socket) => {
  socket.on('joinGuildRoom', (guildId) => {
    socket.join(`guild:${guildId}`);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Secure Infrastructure API Running on Port ${PORT}`));
