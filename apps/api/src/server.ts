import express from 'express';
import { 
    Client, 
    GatewayIntentBits, 
    TextChannel, 
    PermissionsBitField, 
    AuditLogEvent, 
    EmbedBuilder, 
    ChannelType,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    Interaction
} from 'discord.js';

const app = express();
const PORT = process.env.PORT || 10000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 🔒 قوائم الذاكرة الأمنية والتحكم الشامل لنظام KRB
const blacklistedUsers = new Set<string>(); 
const blacklistedGuilds = new Set<string>();
const whitelistedBots = new Set<string>();

// هيكلة إعدادات السيرفرات المخصصة
interface GuildConfiguration {
    logChannelId: string;
    allowedUsers: string[]; // مصفوفة تحتوي على معرفات المستخدمين المسموح لهم بالتحكم
    allowAdminsToWeb: boolean; // هل يُسمح للأدمن بدخول الموقع؟
}
const guildConfigs = new Map<string, GuildConfiguration>();

interface IsolatedBot {
    id: string;
    tag: string;
    avatar: string;
    invitedBy: string;
    guildId: string;
    guildName: string;
}
const isolatedBots = new Map<string, IsolatedBot>();

// ⚙️ إعدادات الهوية والاتصال المباشر
const DEVELOPER_ID = '1065985362658345040'; 
const PREFIX = '.';

// 🌐 استدعاء الرموز السحابية تلقائياً
const CLIENT_ID = process.env.CLIENT_ID || ''; 
const CLIENT_SECRET = process.env.CLIENT_SECRET || ''; 
const REDIRECT_URI = process.env.REDIRECT_URI || 'https://krb-security-system.onrender.com/auth/callback';

interface UserSession {
    userId: string;
    username: string;
    avatar: string;
    guilds: any[];
}
const webSessions = new Map<string, UserSession>();

const parseCookies = (rc: string | undefined) => {
    const list: { [key: string]: string } = {};
    if (!rc) return list;
    rc.split(';').forEach((cookie) => {
        const parts = cookie.split('=');
        list[parts.shift()!.trim()] = decodeURI(parts.join('='));
    });
    return list;
};

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildModeration
    ]
});

client.on('ready', () => {
    console.log(`=================================`);
    console.log(`🟢 KRB PROTECTION BOT IS ONLINE: ${client.user?.tag}`);
    console.log(`=================================`);
});

// ==========================================
// 🛡️ رادار رصد وعزل وتطهير البوتات التلقائي مع لوج الأزرار
// ==========================================
client.on('guildMemberAdd', async (member) => {
    if (!member.user.bot) return;

    if (!whitelistedBots.has(member.user.id)) {
        try {
            const hasAdmin = member.permissions.has(PermissionsBitField.Flags.Administrator);

            let inviterTag = "غير معروف";
            try {
                const fetchedLogs = await member.guild.fetchAuditLogs({
                    limit: 1,
                    type: AuditLogEvent.BotAdd,
                });
                const logEntry = fetchedLogs.entries.first();
                if (logEntry && logEntry.target?.id === member.id && logEntry.executor) {
                    inviterTag = `${logEntry.executor.tag} (\`${logEntry.executor.id}\`)`;
                }
            } catch (auditError) {
                console.log("تعذر قراءة سجل الـ Audit Log.");
            }

            // حفظ البوت في معتقل الموقع المؤقت
            isolatedBots.set(member.id, {
                id: member.id,
                tag: member.user.tag,
                avatar: member.user.displayAvatarURL({ extension: 'png' }) || 'https://cdn.discordapp.com/embed/avatars/0.png',
                invitedBy: inviterTag,
                guildId: member.guild.id,
                guildName: member.guild.name
            });

            // جلب إعدادات السيرفر المخصصة (قناة اللوج)
            const config = guildConfigs.get(member.guild.id);
            let logChannel = member.guild.channels.cache.get(config?.logChannelId || '') as TextChannel;

            // إذا لم يتم تحديد قناة لوج، يبحث تلقائياً عن أي قناة نصية عامة كاحتياط
            if (!logChannel) {
                logChannel = member.guild.channels.cache.find(c => c.type === ChannelType.GuildText && c.permissionsFor(member.guild.members.me!).has(PermissionsBitField.Flags.SendMessages)) as TextChannel;
            }

            if (hasAdmin) {
                if (member.kickable) {
                    await member.kick('KRB Security: Unwhitelisted bot joined with Administrator permissions.');
                    if (logChannel) {
                        const embed = new EmbedBuilder()
                            .setTitle('🚨 تم إحباط تهديد عالي الخطورة')
                            .setDescription(`حاول بوت غير مصرح به الدخول بصلاحية **مسؤول (Administrator)** وتم طرده فوراً لحماية بنية السيرفر.`)
                            .addFields(
                                { name: '🤖 البوت المحجوب', value: `\`${member.user.tag}\` (${member.user.id})`, inline: true },
                                { name: '👤 الداعي الفعلي', value: `${inviterTag}`, inline: true }
                            )
                            .setColor('#ef4444')
                            .setTimestamp();
                        logChannel.send({ embeds: [embed] });
                    }
                }
            } else {
                // عزل البوت العادي وسحب رتبه وتوقيفه
                if (member.manageable) await member.roles.set([]).catch(() => {});
                await member.timeout(2419200000, 'KRB Security: Unapproved bot isolated.').catch(() => {});

                if (logChannel) {
                    // بناء اللوج الفخم المرتب بالأزرار التفاعلية
                    const logEmbed = new EmbedBuilder()
                        .setTitle('🔳 نظام الحجب والعزل العالمي - KRB SECURITY')
                        .setDescription(`**تم رصد وحجب بوت غير موثق بنجاح.** النظام بانتظار قرار الإدارة العليا أو الأشخاص المصرح لهم لاتخاذ الإجراء المناسب.`)
                        .addFields(
                            { name: '🤖 اسم البوت المستهدف', value: `\`${member.user.tag}\``, inline: true },
                            { name: '🆔 معرف البوت الفريد', value: `\`${member.id}\``, inline: true },
                            { name: '👤 المسؤول عن دعوته', value: `${inviterTag}`, inline: false }
                        )
                        .setThumbnail(member.user.displayAvatarURL() || 'https://cdn.discordapp.com/embed/avatars/0.png')
                        .setColor('#000000')
                        .setFooter({ text: 'KRB Protection Systems' })
                        .setTimestamp();

                    const actionRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
                        new ButtonBuilder()
                            .setCustomId(`approve_${member.id}_${member.guild.id}`)
                            .setLabel('موافقة وتوثيق ✅')
                            .setStyle(ButtonStyle.Success),
                        new ButtonBuilder()
                            .setCustomId(`reject_${member.id}_${member.guild.id}`)
                            .setLabel('رفض وطرد نهائي ❌')
                            .setStyle(ButtonStyle.Danger)
                    );

                    await logChannel.send({ embeds: [logEmbed], components: [actionRow] });
                }
            }
        } catch (err) {
            console.error('خطأ في نظام الرادار:', err);
        }
    }
});

// ==========================================
// ⚔️ معالجة أزرار الموافقة والرفض المباشرة في ديسكورد مع فحص الصلاحيات الأمنية المخصصة
// ==========================================
client.on('interactionCreate', async (interaction: Interaction) => {
    if (!interaction.isButton()) return;

    const [action, botId, guildId] = interaction.customId.split('_');
    if (action !== 'approve' && action !== 'reject') return;

    const guild = interaction.guild;
    if (!guild || guild.id !== guildId) return;

    // جلب الصلاحيات لمعرفة من يحق له الضغط
    const config = guildConfigs.get(guildId);
    const isDev = interaction.user.id === DEVELOPER_ID;
    const isOwner = guild.ownerId === interaction.user.id;
    const isAllowedUser = config?.allowedUsers.includes(interaction.user.id) || false;

    // منع أي شخص غير مصرح له من الضغط على الأزرار
    if (!isDev && !isOwner && !isAllowedUser) {
        return interaction.reply({ content: '❌ **لا تمتلك الصلاحيات الأمنية الكافية لاتخاذ القرار بشأن هذا البوت.**', ephemeral: true });
    }

    await interaction.deferUpdate();

    try {
        const targetBotMember = await guild.members.fetch(botId).catch(() => null);

        if (action === 'approve') {
            whitelistedBots.add(botId);
            isolatedBots.delete(botId);
            if (targetBotMember) {
                await targetBotMember.timeout(null).catch(() => {});
            }
            
            const approvedEmbed = new EmbedBuilder()
                .setTitle('✅ تم قبول البوت وتوثيقه')
                .setDescription(`تم فك العزل عن البوت بنجاح والموافقة عليه داخل السيرفر بنجاح.`)
                .addFields(
                    { name: '🤖 البوت', value: `<@${botId}>`, inline: true },
                    { name: '👤 الفاعل المسؤول', value: `${interaction.user}`, inline: true }
                )
                .setColor('#22c55e')
                .setTimestamp();

            await interaction.editReply({ embeds: [approvedEmbed], components: [] });
        } else if (action === 'reject') {
            isolatedBots.delete(botId);
            if (targetBotMember && targetBotMember.kickable) {
                await targetBotMember.kick('KRB Security: Bot request rejected via log controls.');
            }

            const rejectedEmbed = new EmbedBuilder()
                .setTitle('❌ تم رفض وطرد البوت')
                .setDescription(`تم رفض توثيق البوت وطره نهائياً خارج أسوار السيرفر.`)
                .addFields(
                    { name: '🤖 البوت المسؤول', value: `\`${botId}\``, inline: true },
                    { name: '👤 الفاعل المسؤول', value: `${interaction.user}`, inline: true }
                )
                .setColor('#ef4444')
                .setTimestamp();

            await interaction.editReply({ embeds: [rejectedEmbed], components: [] });
        }
    } catch (err: any) {
        console.error(err);
    }
});

// نظام المساعدة التقليدي
client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.guild) return;
    if (blacklistedUsers.has(message.author.id) || blacklistedGuilds.has(message.guild.id)) return;

    if (message.content === `${PREFIX}help`) {
        const helpEmbed = new EmbedBuilder()
            .setTitle('🔳 **نظام الحماية العالمي KRB SECURITY**')
            .setDescription('مرحباً بك في واجهة المساعدة الموحدة. لوحة القيادة تتيح لك تخصيص قنوات اللوج والمشرفين بشكل مستقل.')
            .setColor('#000000');
        message.channel.send({ embeds: [helpEmbed] });
    }
});

// ==========================================
// 🌐 واجهة الـ Dashboard السحابية المرتبة في خانات
// ==========================================
app.get('/', (req, res) => {
    const cookies = parseCookies(req.headers.cookie);
    const sessionId = cookies['krb_session'];
    const session = sessionId ? webSessions.get(sessionId) : null;

    if (!session) {
        const discordAuthUrl = `https://discord.com/api/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&scope=identify%20guilds`;
        return res.send(`
        <!DOCTYPE html>
        <html lang="ar" dir="rtl">
        <head>
            <meta charset="UTF-8"><title>KRB SECURITY SYSTEM</title>
            <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;700&display=swap" rel="stylesheet">
            <style>
                body { background: #000; color: #fff; font-family: 'Cairo', sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin:0; }
                .login-box { background: #09090b; padding: 40px 30px; border-radius: 8px; border: 1px solid #27272a; text-align: center; width: 90%; max-width: 420px; }
                .btn-discord { display: block; text-decoration: none; padding: 14px; background: #fff; color: #000; font-weight: 700; border-radius: 6px; font-size: 14px; margin-top:20px;}
            </style>
        </head>
        <body>
            <div class="login-box">
                <h1>🔳 KRB GLOBAL PROTECTION</h1>
                <p>سجل دخولك عبر حساب ديسكورد للوصول إلى مركز إدارة وحماية السيرفرات.</p>
                <a href="${discordAuthUrl}" class="btn-discord">تسجيل الدخول عبر ديسكورد ⚡</a>
            </div>
        </body>
        </html>
        `);
    }

    const isGlobalOwner = session.userId === DEVELOPER_ID;
    const adminGuildIds = session.guilds
        .filter((g: any) => (BigInt(g.permissions) & 0x8n) === 0x8n)
        .map((g: any) => g.id);

    // فلترة السيرفرات بناءً على رغبتك: لا يدخل الإداري إلا إذا سمح صاحب السيرفر من الخيار المخصص، عدا ذلك فقط الـ Owner والمطور يدخلون
    const sharedGuilds = client.guilds.cache.filter(g => {
        if (isGlobalOwner) return true;
        const isServerOwner = g.ownerId === session.userId;
        const config = guildConfigs.get(g.id);
        const isAllowedAdmin = config?.allowAdminsToWeb && adminGuildIds.includes(g.id);
        return isServerOwner || isAllowedAdmin;
    });

    let configSections = '';
    sharedGuilds.forEach((g) => {
        const currentConfig = guildConfigs.get(g.id) || { logChannelId: '', allowedUsers: [], allowAdminsToWeb: false };
        configSections += `
        <div class="card config-box">
            <h4 class="server-title">📦 إعدادات سيرفر: ${g.name}</h4>
            <form action="/api/save-config" method="POST">
                <input type="hidden" name="guildId" value="${g.id}">
                
                <div class="form-group">
                    <label>🆔 معرف روم اللوج المخصص (Log Channel ID)</label>
                    <input type="text" name="logChannelId" value="${currentConfig.logChannelId}" placeholder="مثال: 123456789012345678">
                </div>

                <div class="form-group">
                    <label>👥 المعرفات المسموح لها بالموافقة والرفض (User IDs فصل بينها بفاصلة ,)</label>
                    <input type="text" name="allowedUsers" value="${currentConfig.allowedUsers.join(', ')}" placeholder="مثال: 1065985362658345040, 5432167890">
                </div>

                <div class="form-group inline-checkbox">
                    <input type="checkbox" name="allowAdminsToWeb" value="true" ${currentConfig.allowAdminsToWeb ? 'checked' : ''} id="chk-${g.id}">
                    <label for="chk-${g.id}" style="display:inline; cursor:pointer;">السماح للإداريين (Administrators) بدخول هذا الموقع والتعديل على الإعدادات</label>
                </div>

                <button type="submit" class="btn">حفظ وتثبيت الإعدادات 💾</button>
            </form>
        </div>
        `;
    });

    let quarantineCards = '';
    isolatedBots.forEach((bot) => {
        if (isGlobalOwner || sharedGuilds.has(bot.guildId)) {
            quarantineCards += `
            <div class="card quarantine-card">
                <img class="bot-avatar" src="${bot.avatar}">
                <div class="bot-details">
                    <h3>${bot.tag}</h3>
                    <p><strong>السيرفر:</strong> ${bot.guildName}</p>
                    <p><strong>الداعي:</strong> ${bot.invitedBy}</p>
                </div>
                <div class="card-actions-row">
                    <form action="/api/approve-bot" method="POST" style="flex:1;">
                        <input type="hidden" name="botId" value="${bot.id}">
                        <input type="hidden" name="guildId" value="${bot.guildId}">
                        <button type="submit" class="btn btn-approve">توثيق وموافقة ✅</button>
                    </form>
                    <form action="/api/reject-bot" method="POST" style="flex:1;">
                        <input type="hidden" name="botId" value="${bot.id}">
                        <input type="hidden" name="guildId" value="${bot.guildId}">
                        <button type="submit" class="btn btn-danger">رفض وطرد ❌</button>
                    </form>
                </div>
            </div>
            `;
        }
    });

    if (!quarantineCards) {
        quarantineCards = `<p class="empty-msg">🛡️ المعتقل نظيف بالكامل حالياً.</p>`;
    }

    res.send(`
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>KRB PANEL - CONTROL INFRASTRUCTURE</title>
        <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap" rel="stylesheet">
        <style>
            :root { --bg-main: #000000; --bg-card: #09090b; --border-color: #27272a; --text-primary: #ffffff; --text-secondary: #a1a1aa; --accent-red: #ef4444; --accent-green: #22c55e; }
            * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Cairo', sans-serif; line-height: 1.6; }
            body { background-color: var(--bg-main); color: var(--text-primary); padding: 20px; max-width: 1200px; margin: 0 auto; }
            header { border-bottom: 1px solid var(--border-color); padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap:15px; }
            .user-badge { display: flex; align-items: center; gap: 10px; font-size: 14px; }
            .user-avatar { width: 32px; height: 32px; border-radius: 50%; border: 1px solid var(--border-color); }
            .section-title { font-size: 15px; font-weight: 700; margin: 30px 0 15px 0; border-right: 4px solid #fff; padding-right: 10px; }
            .grid { display: grid; grid-template-columns: 1fr; gap: 20px; }
            @media (min-width: 768px) { .grid { grid-template-columns: repeat(auto-fit, minmax(350px, 1fr)); } }
            .card { background-color: var(--bg-card); border: 1px solid var(--border-color); padding: 20px; border-radius: 8px; word-wrap: break-word; }
            .config-box { border-top: 3px solid #fff; }
            .server-title { font-size:14px; margin-bottom:15px; border-bottom: 1px solid var(--border-color); padding-bottom:5px; }
            .form-group { margin-bottom: 15px; }
            .inline-checkbox { display: flex; align-items: center; gap: 10px; margin-bottom:20px; font-size:12px; color: var(--text-secondary); }
            label { display: block; font-size: 12px; color: var(--text-secondary); margin-bottom: 6px; }
            input[type="text"], textarea, select { width: 100%; background: #18181b; border: 1px solid var(--border-color); color: #fff; padding: 12px; border-radius: 6px; font-size: 13px; }
            input[type="checkbox"] { width: 16px; height: 16px; accent-color: #fff; }
            .btn { width: 100%; background: #fff; color: #000; border: none; padding: 12px; font-weight: 700; border-radius: 6px; cursor: pointer; font-size:13px; transition: background 0.2s; }
            .btn:hover { background: #e4e4e7; }
            .card-actions-row { display: flex; gap: 10px; margin-top: 15px; }
            .btn-approve { background: var(--accent-green); color: #fff; }
            .btn-danger { background: var(--accent-red); color: #fff; }
            .quarantine-card { display: flex; flex-direction: column; gap: 15px; border-left: 3px solid var(--accent-red); }
            .bot-avatar { width: 48px; height: 48px; border-radius: 50%; }
            .empty-msg { color: var(--text-secondary); text-align: center; padding: 20px; font-size: 13px; width: 100%; }
        </style>
    </head>
    <body>
        <header>
            <h2>KRB MANAGEMENT CONSOLE</h2>
            <div class="user-badge">
                <img class="user-avatar" src="${session.avatar}">
                <span>مرحباً، <strong>${session.username}</strong> ${isGlobalOwner ? '(الإدارة العليا 👑)' : '(إدارة معتمدة)'}</span>
                <a href="/logout" style="color:var(--accent-red); text-decoration:none; margin-right:10px;">[خروج]</a>
            </div>
        </header>

        <h3 class="section-title">⚙️ الخانات المستقلة لإعدادات قنوات اللوج والصلاحيات الأمنية لكل سيرفر</h3>
        <div class="grid">
            ${configSections || '<p class="empty-msg">لا توجد سيرفرات تملك صلاحية إدارتها حالياً.</p>'}
        </div>

        <h3 class="section-title">🤖 رادار كشف وعزل البوتات النشط</h3>
        <div class="grid">
            ${quarantineCards}
        </div>

        ${isGlobalOwner ? `
        <h3 class="section-title">📢 أدوات البث والنطاق الشامل (خاص بأبو عتب)</h3>
        <div class="grid">
            <div class="card">
                <form action="/api/send-custom" method="POST">
                    <label>نوع الإرسال المطلوب</label>
                    <select name="sendType" id="sendTypeSelect" onchange="toggleGuildInput()" style="margin-bottom:15px;">
                        <option value="all">📢 إرسال شامل لجميع السيرفرات (Broadcast)</option>
                        <option value="single">📌 سيرفر محدد فقط (يتطلب كتابة الـ ID بالأسفل)</option>
                    </select>
                    
                    <div id="guildIdContainer" style="display: none; margin-bottom:15px;">
                        <label>معرف السيرفر المستهدف (Guild ID) *</label>
                        <input type="text" name="guildId">
                    </div>
                    
                    <label>نص الرسالة أو الإعلان الإداري</label>
                    <textarea name="message" rows="3" required placeholder="اكتب هنا..." style="margin-bottom:15px;"></textarea>
                    <button type="submit" class="btn">إطلق الإرسال الفوري 🚀</button>
                </form>
            </div>
            <script>
                function toggleGuildInput() {
                    const select = document.getElementById('sendTypeSelect');
                    const container = document.getElementById('guildIdContainer');
                    if (select.value === 'single') container.style.display = 'block';
                    else container.style.display = 'none';
                }
            </script>
        </div>
        ` : ''}
    </body>
    </html>
    `);
});

// ==========================================
// 🚀 التحكم الخلفي لحفظ الخانات والـ APIs بدون أخطاء
// ==========================================
app.post('/api/save-config', (req, res) => {
    const cookies = parseCookies(req.headers.cookie);
    const sessionId = cookies['krb_session'];
    const session = sessionId ? webSessions.get(sessionId) : null;
    if (!session) return res.status(403).send('غير مصرح لك.');

    const { guildId, logChannelId, allowedUsers, allowAdminsToWeb } = req.body;
    const guild = client.guilds.cache.get(guildId);
    if (!guild) return res.status(404).send('السيرفر غير موجود.');

    const isGlobalOwner = session.userId === DEVELOPER_ID;
    const isServerOwner = guild.ownerId === session.userId;

    if (!isGlobalOwner && !isServerOwner) {
        return res.status(403).send('فقط صاحب السيرفر الأساسي يمكنه تعديل هذه الإعدادات المصيرية.');
    }

    // تنظيف وتحويل المدخلات إلى مصفوفة نظيفة من الـ IDs
    const usersArray = allowedUsers ? allowedUsers.split(',').map((id: string) => id.trim()).filter((id: string) => id.length > 0) : [];

    guildConfigs.set(guildId, {
        logChannelId: logChannelId ? logChannelId.trim() : '',
        allowedUsers: usersArray,
        allowAdminsToWeb: allowAdminsToWeb === 'true'
    });

    res.send(`<script>alert("✅ تم حفظ الإعدادات وتخصيص الخانات بنجاح في نظام KRB!"); window.location.href="/";</script>`);
});

// موافقة من الموقع
app.post('/api/approve-bot', async (req, res) => {
    const cookies = parseCookies(req.headers.cookie);
    const sessionId = cookies['krb_session'];
    const session = sessionId ? webSessions.get(sessionId) : null;
    if (!session) return res.status(403).send('غير مصرح لك.');

    const { botId, guildId } = req.body;
    whitelistedBots.add(botId);
    isolatedBots.delete(botId);

    const guild = client.guilds.cache.get(guildId);
    if (guild) {
        const targetBotMember = await guild.members.fetch(botId).catch(() => null);
        if (targetBotMember) await targetBotMember.timeout(null).catch(() => {});
    }
    res.redirect('/');
});

// رفض وطرد من الموقع
app.post('/api/reject-bot', async (req, res) => {
    const cookies = parseCookies(req.headers.cookie);
    const sessionId = cookies['krb_session'];
    const session = sessionId ? webSessions.get(sessionId) : null;
    if (!session) return res.status(403).send('غير مصرح لك.');

    const { botId, guildId } = req.body;
    isolatedBots.delete(botId);

    const guild = client.guilds.cache.get(guildId);
    if (guild) {
        const targetBotMember = await guild.members.fetch(botId).catch(() => null);
        if (targetBotMember && targetBotMember.kickable) await targetBotMember.kick('Rejected via Dashboard.');
    }
    res.redirect('/');
});

// الإرسال الشامل الذكي
app.post('/api/send-custom', async (req, res) => {
    const cookies = parseCookies(req.headers.cookie);
    const sessionId = cookies['krb_session'];
    const session = sessionId ? webSessions.get(sessionId) : null;
    if (!session || session.userId !== DEVELOPER_ID) return res.status(403).send('للإدارة العليا فقط.');

    const { guildId, sendType, message } = req.body;

    if (sendType === 'all') {
        let successCount = 0;
        const guilds = Array.from(client.guilds.cache.values());
        for (const guild of guilds) {
            try {
                const targetChannel = guild.channels.cache.find(ch => ch.isTextBased() && ch.permissionsFor(guild.members.me!)?.has(PermissionsBitField.Flags.SendMessages)) as TextChannel;
                if (targetChannel) {
                    await targetChannel.send(message);
                    successCount++;
                }
            } catch (err) {}
        }
        return res.send(`<script>alert("📢 تم الإرسال الشامل إلى ${successCount} سيرفر!"); window.location.href="/";</script>`);
    }

    try {
        const guild = await client.guilds.fetch(guildId);
        const targetChannel = guild.channels.cache.find(ch => ch.isTextBased() && ch.permissionsFor(guild.members.me!)?.has(PermissionsBitField.Flags.SendMessages)) as TextChannel;
        if (targetChannel) await targetChannel.send(message);
        res.send(`<script>alert("🚀 تم إرسال الرسالة بنجاح!"); window.location.href="/";</script>`);
    } catch (error: any) { res.status(500).send(error.message); }
});

// مسارات OAuth2 لبوابة ديسكورد
app.get('/auth/callback', async (req, res) => {
    const { code } = req.query;
    if (!code) return res.redirect('/');
    try {
        const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
            method: 'POST',
            body: new URLSearchParams({
                client_id: CLIENT_ID,
                client_secret: CLIENT_SECRET,
                grant_type: 'authorization_code',
                code: code as string,
                redirect_uri: REDIRECT_URI,
            }),
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });
        const tokenData = await tokenResponse.json() as any;
        const userResponse = await fetch('https://discord.com/api/users/@me', { headers: { Authorization: `Bearer ${tokenData.access_token}` } });
        const userData = await userResponse.json() as any;
        const guildsResponse = await fetch('https://discord.com/api/users/@me/guilds', { headers: { Authorization: `Bearer ${tokenData.access_token}` } });
        const guildsData = await guildsResponse.json() as any;

        const sessionId = Math.random().toString(36).substring(2, 15);
        webSessions.set(sessionId, {
            userId: userData.id,
            username: userData.username,
            avatar: userData.avatar ? `https://cdn.discordapp.com/avatars/${userData.id}/${userData.avatar}.png` : 'https://cdn.discordapp.com/embed/avatars/0.png',
            guilds: Array.isArray(guildsData) ? guildsData : []
        });
        res.setHeader('Set-Cookie', `krb_session=${sessionId}; HttpOnly; Secure; Path=/; Max-Age=8640000`);
        res.redirect('/');
    } catch (error) { res.status(500).send('فشلت المصادقة.'); }
});

app.get('/logout', (req, res) => {
    const cookies = parseCookies(req.headers.cookie);
    if (cookies['krb_session']) webSessions.delete(cookies['krb_session']);
    res.setHeader('Set-Cookie', 'krb_session=; HttpOnly; Secure; Path=/; Max-Age=0');
    res.redirect('/');
});

app.listen(PORT, () => {
    if (process.env.DISCORD_TOKEN) client.login(process.env.DISCORD_TOKEN);
});
