import express from 'express';
import { Client, GatewayIntentBits, TextChannel, PermissionsBitField } from 'discord.js';

const app = express();
const PORT = process.env.PORT || 10000;

// إعدادات قراءة البيانات القادمة من نماذج الموقع
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// قوالب حفظ البلاك ليست في الذاكرة (تستطيع وضع الـ IDs اللي تبي تحظرها هنا مباشرة)
const blacklistedUsers = new Set<string>(['123456789012345678']); 
const blacklistedGuilds = new Set<string>();

// حسابك الشخصي المحمي ليتم منشنته تلقائياً
const DEVELOPER_ID = '1065985362658345040';

// إنشاء بوت الديسكورد بكامل الصلاحيات داخل نفس السيرفر
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

// 🛡️ نظام الحماية والأوامر داخل الديسكورد مع منشن المطور والبلاك ليست
client.on('interactionCreate', async (interaction) => {
    const isUserBlacklisted = blacklistedUsers.has(interaction.user.id);
    const isGuildBlacklisted = interaction.guildId ? blacklistedGuilds.has(interaction.guildId) : false;

    // إذا كان الشخص أو السيرفر عليه بلاك ليست
    if (isUserBlacklisted || isGuildBlacklisted) {
        if (interaction.isRepliable()) {
            await interaction.reply({
                content: `❌ **تواصل مع المطور عليك بلاك ليست**\n⚠️ حسابك أو هذا السيرفر مدرج في القائمة السوداء، للمراجعة تواصل مع: <@${DEVELOPER_ID}>`,
                ephemeral: true
            });
        }
        return; 
    }

    // منع أخطاء الـ Build بالتأكد من نوع الأمر
    if (!interaction.isChatInputCommand()) return;

    if (!interaction.inGuild() || !interaction.guild) {
        return interaction.reply({ content: "❌ الأوامر تعمل داخل السيرفرات فقط!", ephemeral: true });
    }

    // تشغيل الأوامر (مثال لأمر help)
    if (interaction.commandName === 'help') {
        try {
            await interaction.deferReply({ ephemeral: true });
            await interaction.editReply({ content: '⚡ نظام KRB يعمل بكفاءة استقرار 100% وبأعلى حماية.' });
        } catch (error) {
            console.error(error);
        }
    }
});

// 🌐 عرض صفحة التحكم المطور (AirFlow Style) مباشرة بدون ملف خارجي
app.get('/', (req, res) => {
    // تجهيز قائمة السيرفرات الحية لتظهر في الجدول مباشرة
    const servers = client.guilds.cache.map(g => `
        <tr>
            <td>${g.name}</td>
            <td><span class="code-style">${g.id}</span></td>
            <td>${g.memberCount} عضو</td>
            <td>
                <span style="color: ${blacklistedGuilds.has(g.id) ? '#ef4444' : '#22c55e'}">
                    ${blacklistedGuilds.has(g.id) ? '⛔ محظور معزول' : '🟢 محمـي'}
                </span>
            </td>
        </tr>
    `).join('');

    // إرسال كود الـ HTML عالي التباين مباشرة للمتصفح
    res.send(`
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
        <meta charset="UTF-8">
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
            body { background-color: var(--bg-main); color: var(--text-primary); padding: 40px 20px; max-width: 1200px; margin: 0 auto; }
            header { border-bottom: 1px solid var(--border-color); padding-bottom: 20px; margin-bottom: 40px; display: flex; justify-content: space-between; align-items: center; }
            header h1 { font-size: 22px; font-weight: 700; }
            .status-badge { background-color: #18181b; border: 1px solid var(--border-color); padding: 6px 14px; border-radius: 9999px; font-size: 13px; color: var(--accent-green); display: flex; align-items: center; gap: 8px; }
            .status-badge::before { content: ''; width: 8px; height: 8px; background-color: var(--accent-green); border-radius: 50%; }
            .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(350px, 1fr)); gap: 24px; margin-bottom: 40px; }
            .card { background-color: var(--bg-card); border: 1px solid var(--border-color); padding: 30px; border-radius: 8px; }
            .card h2 { font-size: 17px; margin-bottom: 20px; font-weight: 600; border-right: 4px solid var(--text-primary); padding-right: 12px; }
            label { display: block; font-size: 13px; color: var(--text-secondary); margin-bottom: 8px; font-weight: 600; }
            input, textarea, select { width: 100%; background: #18181b; border: 1px solid var(--border-color); color: var(--text-primary); padding: 12px 16px; border-radius: 6px; margin-bottom: 20px; font-size: 14px; }
            input:focus, textarea:focus, select:focus { border-color: #71717a; outline: none; }
            .btn { width: 100%; background: var(--text-primary); color: var(--bg-main); border: none; padding: 14px; font-weight: 700; cursor: pointer; border-radius: 6px; font-size: 14px; }
            .btn:hover { background: #e4e4e7; }
            .btn-danger { background: transparent; border: 1px solid var(--accent-red); color: var(--accent-red); }
            .btn-danger:hover { background: var(--accent-red); color: #ffffff; }
            .table-container { background-color: var(--bg-card); border: 1px solid var(--border-color); border-radius: 8px; padding: 20px; }
            table { width: 100%; border-collapse: collapse; text-align: right; }
            th { color: var(--text-secondary); font-size: 13px; padding: 16px; border-bottom: 1px solid var(--border-color); }
            td { padding: 16px; border-bottom: 1px solid var(--border-color); font-size: 14px; }
            .code-style { background: #18181b; padding: 4px 8px; border-radius: 4px; font-family: monospace; border: 1px solid var(--border-color); }
        </style>
    </head>
    <body>
        <header>
            <h1>KRB SYSTEM | PANEL</h1>
            <div class="status-badge">مرحباً أبو عتب | لوحة التحكم والجدار الأمني متصل بالكامل</div>
        </header>

        <div class="grid">
            <!-- ميزة الإرسال المخصص لأي سيرفر -->
            <div class="card">
                <h2>✉️ إرسال رسالة مخصصة لسيرفر معين</h2>
                <form action="/api/send-custom" method="POST">
                    <label>معرف السيرفر المستهدف (Guild ID) *</label>
                    <input type="text" name="guildId" placeholder="أدخل الـ ID الخاص بالسيرفر هنا..." required>
                    
                    <label>معرف القناة النصية (Channel ID) - اختياري</label>
                    <input type="text" name="channelId" placeholder="اتركه فارغاً للإرسال في الشات العام الافتراضي...">

                    <label>نص الرسالة</label>
                    <textarea name="message" rows="4" placeholder="اكتب نص رسالتك الفخمة هنا..." required></textarea>
                    
                    <button type="submit" class="btn">إطلاق الإرسال الفوري 🚀</button>
                </form>
            </div>

            <!-- ميزة حظر البلاك ليست -->
            <div class="card">
                <h2>🚫 إدارة حظر النظام (Blacklist System)</h2>
                <form action="/api/blacklist" method="POST">
                    <label>نوع الهدف المراد حظره</label>
                    <select name="type">
                        <option value="user">حظر مستخدم محدد (User ID)</option>
                        <option value="guild">حظر سيرفر بالكامل (Server ID)</option>
                    </select>

                    <label>المعرف الفريد (ID) *</label>
                    <input type="text" name="targetId" placeholder="ضع الرقم التعريفي ID هنا..." required>

                    <label>الإجراء المطلوب</label>
                    <select name="action">
                        <option value="add">إدراج وتفعيل منشن المطور 🔒</option>
                        <option value="remove">إزالة من البلاك ليست وفك العزل ✅</option>
                    </select>
                    
                    <button type="submit" class="btn btn-danger">تحديث جدار العزل الأمني 🛡️</button>
                </form>
            </div>
        </div>

        <div class="table-container">
            <h2 style="margin-bottom: 20px;">📦 مراقبة خريطة السيرفرات المتصلة بالشبكة (${client.guilds.cache.size})</h2>
            <table>
                <thead>
                    <tr>
                        <th>اسم السيرفر المضيف</th>
                        <th>معرف السيرفر (ID)</th>
                        <th>إجمالي عدد الأعضاء</th>
                        <th>الحالة الأمنية بالنظام</th>
                    </tr>
                </thead>
                <tbody>
                    ${servers || '<tr><td colspan="4" style="text-align: center; color: var(--text-secondary);">لا توجد سيرفرات متصلة بالبوت حالياً.</td></tr>'}
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
        res.send('<script>alert("🚀 تم إرسال رسالتك للسيرفر المحدد بنجاح!"); window.location.href="/";</script>');
    } catch (error: any) {
        res.status(500).send(`❌ فشل الإرسال الأمني: ${error.message}`);
    }
});

// 🔒 [API] التحكم في إضافة وإزالة الـ Blacklist لقواعد البيانات
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

    res.send('<script>alert("🔒 تم تحديث سجلات الـ Blacklist بنجاح!"); window.location.href="/";</script>');
});

// تشغيل الخادم الموحد على بورت واحد لـ Render
app.listen(PORT, () => {
    if (process.env.DISCORD_TOKEN) {
        client.login(process.env.DISCORD_TOKEN);
    } else {
        console.error('❌ كراش: لم يتم العثور على توكن البوت DISCORD_TOKEN في إعدادات Render!');
    }
});
