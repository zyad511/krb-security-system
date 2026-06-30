import express from 'express';
import cors from 'cors';
import { GuildConfig } from './database/GuildConfig';
import { CacheManager } from './database/CacheManager';

const app = express();
app.use(cors());
app.use(express.json());

const cache = CacheManager.getInstance();

// نقطة نهاية لجلب إعدادات السيرفر إلى لوحة التحكم
app.get('/api/config/:guildId', async (req, res) => {
  const { guildId } = req.params;
  try {
    let config = await cache.getGuildConfig(guildId);
    if (!config) {
      config = await GuildConfig.findOne({ guildId });
      if (config) await cache.setGuildConfig(guildId, config);
    }
    return res.json(config || { error: 'Not found' });
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// نقطة نهاية لتحديث الإعدادات من لوحة التحكم ومسح الكاش القديم فوراً
app.post('/api/config/:guildId', async (req, res) => {
  const { guildId } = req.params;
  try {
    const updatedConfig = await GuildConfig.findOneAndUpdate(
      { guildId },
      { $set: req.body },
      { upsert: true, new: true }
    );
    await cache.invalidateGuildConfig(guildId);
    await cache.setGuildConfig(guildId, updatedConfig);
    return res.json({ success: true, config: updatedConfig });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update configuration' });
  }
});

// تم التعديل هنا: الـ API يشتغل على 5000 ويترك منفذ 10000 الأساسي للوحة التحكم لمنع التصادم
const PORT = process.env.API_PORT || 5000;
app.listen(PORT, () => {
  console.log(`[KRB API] Dashboard backend running on port ${PORT}`);
});
