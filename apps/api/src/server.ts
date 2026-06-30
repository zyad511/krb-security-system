import express from 'express';
import { Client, GatewayIntentBits, TextChannel, PermissionsBitField } from 'discord.js';

const app = express();
const PORT = process.env.PORT || 10000;

// إعدادات قراءة البيانات القادمة من نماذج الموقع
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// قوالب حفظ البلاك ليست في الذاكرة
const blacklistedUsers = new Set<string>(); 
const blacklistedGuilds = new Set<string>();

// حسابك الشخصي المحمي ليتم منشنته تلقائياً
const DEVELOPER_ID = '1065985362658345040';

// إنشاء بوت الديسكورد بكامل الصلاحيات داخل نفس السيرفر لعدم تعارض المنافذ
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

client.on('ready', () => {
    console.log(`=================================`);
    console.log(`🟢 KRB SYSTEM Connected As: ${client.user?.tag}`);
    console.log(`=================================`);
});

// نظام الحماية والأوامر داخل الديسكورد مع منشن المطور والبلاك ليست
client.on('interactionCreate', async (interaction) => {
    const isUserBlacklisted = blacklistedUsers.has(interaction.user.id);
    const isGuildBlacklisted = interaction.guildId ? blacklistedGuilds.has(interaction.guildId) : false;

    if (isUserBlacklisted || isGuildBlacklisted) {
        if (interaction.isRepliable()) {
            await interaction.reply({
                content: `❌ **تواصل مع المطور عليك بلاك ليست**\n⚠️ حسابك أو هذا السيرفر مدرج في القائمة السوداء، للمراجعة تواصل مع: <@${DEVELOPER_ID}>`,
                ephemeral: true
            });
        }
        return; 
    }

    if (!interaction.isChatInputCommand()) return;

    if (!interaction.inGuild() || !interaction.guild) {
        return interaction.reply({ content: "❌ الأوامر تعمل داخل السيرفرات فقط!", ephemeral: true });
    }

    if (interaction.commandName === 'help') {
        try {
            await interaction.deferReply({ ephemeral: true });
            await interaction.editReply({ content: '⚡ نظام KRB يعمل بكفاءة استقرار 100% وبأعلى حماية.' });
        } catch (error) {
            console.error(error);
        }
    }
});

// 🌐 عرض صفحة التحكم المطور - نسخة جوال وكمبيوتر متناسقة 100%
app.get('/', (req, res) => {
    const servers = client.guilds.cache.map(g => `
        <tr>
            <td>${g.name}</td>
            <td><span class="code-style">${g.id}</span></td>
            <td>${g.memberCount} عضو</td>
            <td>
                <span style="color: ${blacklistedGuilds.has(g.id) ? '#ef4444' : '#22c55e'}">
                    ${blacklistedGuilds.has(g.id) ? '⛔ محظور' : '🟢 محمـي'}
                </span>
            </td>
        </tr>
    `).join('');

    res.send(`
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
        <title>KRB SYSTEM | CONTROL INTERFACE</title>
        <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap" rel="stylesheet">
        <style>
            :root {
                --bg-main: #000000;
                --bg-card: #09090b;
                --border-color: #27272a;
                --text-primary: #ffffff;
                --text-secondary: #a1a1aa;
                --accent-red: #ef4444;
                --accent-green: #22c55e;
            }
            * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Cairo', sans-serif; }
            body { background-color: var(--bg-main); color: var(--text-primary); padding: 20px 15px; max-width: 1200px; margin: 0 auto; }
            
            header { border-bottom: 1px solid var(--border-color); padding-bottom: 20px; margin-bottom: 30px; display: flex; flex-direction: column; gap: 12px; align-items: flex-start; }
            header h1 { font-size: 20px; font-weight: 700; }
            
            .status-badge { background-color: #18181b; border: 1px solid var(--border-color); padding: 6px 14px; border-radius: 9999px; font-size: 12px; color: var(--accent-green); display: flex; align-items: center; gap: 8px; width: fit-content; }
            .status-badge::before { content: ''; width: 8px; height: 8px; background-color: var(--accent-green); border-radius: 50%; }
            
            .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 20px; margin-bottom: 30px; }
            .card { background-color: var(--bg-card); border: 1px solid var(--border-color); padding: 20px; border-radius: 8px; }
            .card h2 { font-size: 16px; margin-bottom: 20px; font-weight: 600; border-right: 4px solid var(--text-primary); padding-right: 12px; }
            
            label { display: block; font-size: 12px; color: var(--text-secondary); margin-bottom: 8px; font-weight: 600; }
            input, textarea, select { width: 100%; background: #18181b; border: 1px solid var(--border-color); color: var(--text-primary); padding: 12px; border-radius: 6px; margin-bottom: 15px; font-size: 14px; -webkit-appearance: none; }
            input:focus, textarea:focus, select:focus { border-color: #71717a; outline: none; }
            
            .btn { width: 100%; background: var(--text-primary); color: var(--bg-main); border: none; padding: 14px; font-weight: 700; cursor: pointer; border-radius: 6px; font-size: 14px; transition: background 0.2s; }
            .btn:hover { background: #e4e4e7; }
            .btn-danger { background: transparent; border: 1px solid var(--accent-red); color: var(--accent-red); }
            .btn-danger:hover { background: var(--accent-red); color: #ffffff; }
            
            .table-container { background-color: var(--bg-card); border: 1px solid var(--border-color); border-radius: 8px; padding: 15px; overflow-x: auto; }
            .table-container h2 { font-size: 16px; margin-bottom: 15px; }
            
            table { width: 100%; border-collapse: collapse; text-align: right; min-width: 500px; }
            th { color: var(--text-secondary); font-size: 12px; padding: 12px; border-bottom: 1px solid var(--border-color); }
            td { padding: 12px; border-bottom: 1px solid var(--border-color); font-size: 13px; }
            .code-style { background: #18181b; padding: 4px 8px; border-radius: 4px; font-family: monospace; border: 1px solid var(--border-color); font-size: 12px; }

            /* شاشات الكمبيوتر والأجهزة الكبيرة */
            @media (min-width: 768px) {
                body { padding: 40px 20px; }
                header { flex-direction: row; justify-content: space-between; align-items: center; }
                header h1 { font-size: 24px; }
                .card { padding: 30px; }
                .table-container { padding: 20px; }
            }
        </style>
    </head>
    <body>
        <header>
            <h1>KRB SYSTEM CONTROL</h1>
            <div class="status-badge">مرحباً أبو عتب | واجهة الجوال نشطة ومحمية</div>
        </header>

        <div class="grid">
            <div class="card">
                <h2>✉️ إرسال رسالة مخصصة لسيرفر</h2>
                <form action="/api/send-custom" method="POST">
                    <label>معرف السيرفر المستهدف (Guild ID) *</label>
                    <input type="text" name="guildId" placeholder="ضع الـ ID الخاص بالسيرفر..." required>
                    
                    <label>معرف القناة النصية (Channel ID) - اختياري</label>
                    <input type="text" name="channelId" placeholder="اتركه فارغاً للشات العام الافتراضي...">

                    <label>نص الرسالة</label>
                    <textarea name="message" rows="4" placeholder="اكتب نص رسالتك الملكية هنا..." required></textarea>
                    
                    <button type="submit" class="btn">إطلاق الإرسال الفوري 🚀</button>
                </form>
            </div>

            <div class="card">
                <h2>🚫 إدارة حظر النظام (Blacklist)</h2>
                <form action="/api/blacklist" method="POST">
                    <label>نوع الهدف المراد حظره</label>
                    <select name="type">
                        <option value="user">حظر مستخدم محدد (User ID)</option>
                        <option value="guild">حظر سيرفر بالكامل (Server ID)</option>
                    </select>

                    <label>المعرف الفريد (ID) *</label>
                    <input type="text" name="targetId" placeholder="ضع الرقم التعريفي هنا..." required>

                    <label>الإجراء المطلوب</label>
                    <select name="action">
                        <option value="add">إدراج وتفعيل منشن المطور 🔒</option>
                        <option value="remove">إزالة من البلاك ليست ✅</option>
                    </select>
                    
                    <button type="submit" class="btn btn-danger">تحديث جدار العزل 🛡️</button>
                </form>
            </div>
        </div>

        <div class="table-container">
            <h2 style="font-weight: 600;">📦 السيرفرات المتصلة بالشبكة (${client.guilds.cache.size})</h2>
            <table>
                <thead>
                    <tr>
                        <th>اسم السيرفر</th>
                        <th>معرف السيرفر (ID)</th>
                        <th>الأعضاء</th>
                        <th>الحالة</th>
                    </tr>
                </thead>
                <tbody>
                    ${servers || '<tr><td colspan="4" style="text-align: center; color: var(--text-secondary);">لا توجد سيرفرات متصلة حالياً.</td></tr>'}
                </tbody>
            </table>
        </div>
    </body>
    </html>
    `);
});

// 🚀 [API] استقبال وإرسال الرسائل المخصصة للسيرفرات
app.post('/api/send-custom', async (req, res) => {
    const { guildId, channelId, message } = req.body;

    if (!guildId || !message) {
        return res.status(400).send('❌ خطأ: البيانات ناقصة!');
    }

    try {
        const guild = await client.guilds.fetch(guildId);
        if (!guild) return res.status(404).send('❌ خطأ: السيرفر غير موجود!');

        let targetChannel: TextChannel | null = null;

        if (channelId) {
            targetChannel = (await guild.channels.fetch(channelId)) as TextChannel;
        } else {
            targetChannel = guild.channels.cache.find(
                (ch) => ch.isTextBased() && ch.permissionsFor(guild.members.me!)?.has(PermissionsBitField.Flags.SendMessages)
            ) as TextChannel;
        }

        if (!targetChannel) {
            return res.status(400).send('❌ خطأ: لم أجد قناة نصية صالحة أمتلك فيها صلاحية الكتابة!');
        }

        await targetChannel.send(message);
        res.send('<script>alert("🚀 تم إرسال رسالتك بنجاح!"); window.location.href="/";</script>');
    } catch (error: any) {
        res.status(500).send(`❌ فشل الإرسال: ${error.message}`);
    }
});

// 🔒 [API] التحكم في إضافة وإزالة الـ Blacklist
app.post('/api/blacklist', (req, res) => {
    const { type, targetId, action } = req.body;

    if (!targetId) return res.status(400).send('❌ خطأ: الـ ID مطلوب!');

    if (action === 'add') {
        if (type === 'user') blacklistedUsers.add(targetId);
        if (type === 'guild') blacklistedGuilds.add(targetId);
    } else if (action === 'remove') {
        if (type === 'user') blacklistedUsers.delete(targetId);
        if (type === 'guild') blacklistedGuilds.delete(targetId);
    }

    res.send('<script>alert("🔒 تم تحديث السجلات بنجاح!"); window.location.href="/";</script>');
});

// تشغيل الخادم
app.listen(PORT, () => {
    if (process.env.DISCORD_TOKEN) {
        client.login(process.env.DISCORD_TOKEN);
    } else {
        console.error('❌ كراش: لم يتم العثور على توكن البوت DISCORD_TOKEN في إعدادات Render!');
    }
});
