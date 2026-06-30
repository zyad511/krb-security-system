import express from 'express';
import { 
    Client, 
    GatewayIntentBits, 
    TextChannel, 
    PermissionsBitField, 
    AuditLogEvent, 
    EmbedBuilder, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle, 
    StringSelectMenuBuilder, 
    ChannelType 
} from 'discord.js';

const app = express();
const PORT = process.env.PORT || 10000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// قوالب الذاكرة للنظام الأمني
const blacklistedUsers = new Set<string>(); 
const blacklistedGuilds = new Set<string>();
const whitelistedBots = new Set<string>();

interface IsolatedBot {
    id: string;
    tag: string;
    avatar: string;
    invitedBy: string;
    guildId: string;
    guildName: string;
}
const isolatedBots = new Map<string, IsolatedBot>();

const DEVELOPER_ID = '1065985362658345040'; // حساب أبو عتب
const PREFIX = '.';

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
    console.log(`🟢 KRB GLOBAL SYSTEM IS READY: ${client.user?.tag}`);
    console.log(`=================================`);
});

// ==========================================
// 🛡️ رادار رصد وعزل البوتات التلقائي
// ==========================================
client.on('guildMemberAdd', async (member) => {
    if (!member.user.bot) return;

    if (!whitelistedBots.has(member.user.id)) {
        try {
            if (member.manageable) {
                await member.roles.set([]).catch(() => {});
            }
            await member.timeout(2419200000, 'KRB Security: Unapproved bot isolated.').catch(() => {});

            let inviterTag = "غير معروف أو برابط عام";
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

            isolatedBots.set(member.id, {
                id: member.id,
                tag: member.user.tag,
                avatar: member.user.displayAvatarURL({ extension: 'png' }) || 'https://cdn.discordapp.com/embed/avatars/0.png',
                invitedBy: inviterTag,
                guildId: member.guild.id,
                guildName: member.guild.name
            });

            const sysChannel = member.guild.channels.cache.find(c => c.type === ChannelType.GuildText && c.permissionsFor(member.guild.members.me!).has(PermissionsBitField.Flags.SendMessages)) as TextChannel;
            if (sysChannel) {
                sysChannel.send(`🚨 **[KRB SECURITY]:** تم رصد وعزل بوت غير مصرح به (\`${member.user.tag}\`). تم إرسال الطلب للموقع للموافقة.`);
            }
        } catch (err) {
            console.error('فشل في عزل البوت:', err);
        }
    }
});

// ==========================================
// ⚔️ حزمة الأوامر العالمية المحدثة (تم حل مشكلة الـ Null تماماً)
// ==========================================
client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.guild) return;

    if (blacklistedUsers.has(message.author.id) || blacklistedGuilds.has(message.guild.id)) {
        if (message.content.startsWith(PREFIX)) {
            await message.reply(`❌ **تواصل مع المطور عليك بلاك ليست**\n⚠️ للحصول على تصريح تواصل مع: <@${DEVELOPER_ID}>`).catch(() => {});
        }
        return;
    }

    if (!message.content.startsWith(PREFIX)) return;

    const args = message.content.slice(PREFIX.length).trim().split(/ +/);
    const command = args.shift()?.toLowerCase();

    // 1. أمر المساعدة الشامل
    if (command === 'help') {
        const helpEmbed = new EmbedBuilder()
            .setTitle('🔳 **لوحة أوامر نظام KRB العالمي**')
            .setDescription('مرحباً بك في قائمة التحكم الشاملة. الأوامر المتاحة:')
            .addFields(
                { name: '🛡️ الحماية والإدارة', value: '`.security` - حالة النظام الأمني الحالي\n`.lock` - قفل الشات بالكامل\n`.unlock` - فتح الشات المغلَق\n`.clear [العدد]` - تنظيف الرسائل بسرعة' },
                { name: '⚙️ العقوبات والرقابة', value: '`.ban [@عضو]` - حظر عضو نهائياً\n`.kick [@عضو]` - طرد عضو من السيرفر\n`.mute [@عضو]` - كتم العضو تلقائياً\n`.unmute [@عضو]` - إلغاء كتم العضو' },
                { name: '🎫 أنظمة الدعم', value: '`.ticket-setup` - إنشاء لوحة التذاكر الفخمة المماثلة لطلبك' }
            )
            .setColor('#000000')
            .setFooter({ text: 'KRB INFRASTRUCTURE v2.5' });

        await message.channel.send({ embeds: [helpEmbed] });
    }

    // 2. أمر إنشاء التكت الفخم (نفس تصميم image_11 و image_12)
    if (command === 'ticket-setup') {
        if (message.author.id !== DEVELOPER_ID && !message.member?.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return message.reply('❌ الصلاحية محصورة للإدارة العليا ونظام KRB.');
        }

        const setupEmbed = new EmbedBuilder()
            .setTitle('KRB TICKET 🎟️')
            .setDescription('الدعم متوفر 24 ساعة لخدمتكم.\n\nإضغط على القائمة بالأسفل وافتح تذكرتك المخصصة فوراً.')
            .setColor('#000000');

        // القائمة المنسدلة المتطابقة تماماً مع تصميمك
        const menu = new StringSelectMenuBuilder()
            .setCustomId('krb_ticket_select')
            .setPlaceholder('إضغط لفتح التذكرة')
            .addOptions([
                { label: 'ل الدعم', value: 'tk_support', description: 'فتح تذكرة الدعم الفني العام', emoji: '⚙️' },
                { label: 'ل الهاكات', value: 'tk_exploits', description: 'قسم مخصص لاستفسارات وبلاغات الهاكات والسكربتات', emoji: '💻' },
                { label: 'ل الشراء', value: 'tk_buy', description: 'الشراء والاشتراكات الفورية', emoji: '💰' },
                { label: 'Refresh', value: 'tk_refresh', description: 'تحديث حالة نظام التذاكر', emoji: '🔄' }
            ]);

        const rowMenu = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(menu);

        await message.channel.send({ embeds: [setupEmbed], components: [rowMenu] });
        await message.delete().catch(() => {});
    }

    // 3. أمر حالة الأمان
    if (command === 'security') {
        const secEmbed = new EmbedBuilder()
            .setTitle('🛡️ تقرير حالة KRB SECURITY')
            .setDescription(`● **جدار الحماية الموحد:** نشط ونظيف 🟢\n● **عدد البوتات المعزولة حالياً:** \`${isolatedBots.size}\`\n● **المستخدمين في البلاك ليست:** \`${blacklistedUsers.size}\``)
            .setColor('#000000');
        await message.channel.send({ embeds: [secEmbed] });
    }

    // 4. أوامر القفل والفتح والتنظيف الإداري
    if (command === 'lock') {
        if (!message.member?.permissions.has(PermissionsBitField.Flags.ManageChannels)) return;
        await (message.channel as TextChannel).permissionOverwrites.edit(message.guild.roles.everyone, { SendMessages: false });
        await message.channel.send('🔒 **تم إغلاق القناة النصية بنجاح بأمر من النظام.**');
    }

    if (command === 'unlock') {
        if (!message.member?.permissions.has(PermissionsBitField.Flags.ManageChannels)) return;
        await (message.channel as TextChannel).permissionOverwrites.edit(message.guild.roles.everyone, { SendMessages: true });
        await message.channel.send('🔓 **تم إعادة فتح القناة النصية للجميع.**');
    }

    if (command === 'clear') {
        if (!message.member?.permissions.has(PermissionsBitField.Flags.ManageMessages)) return;
        const amount = parseInt(args[0]) || 50;
        if (amount > 100 || amount < 1) return message.reply('❌ يرجى تحديد عدد بين 1 و 100');
        await (message.channel as TextChannel).bulkDelete(amount, true);
        const replyMsg = await message.channel.send(`🧹 تم تنظيف \`${amount}\` رسالة بنجاح.`);
        setTimeout(() => replyMsg.delete().catch(() => {}), 3000);
    }

    // 5. حل مشكلة الـ Null الصارمة بإضافة الـ أمان المباشر (?.first)
    if (command === 'ban') {
        if (!message.member?.permissions.has(PermissionsBitField.Flags.BanMembers)) return;
        const target = message.mentions.members?.first(); 
        if (!target || !target.bannable) return message.reply('❌ تعذّر العثور على العضو أو لا يمكن حظره.');
        await target.ban({ reason: 'KRB Admin Command Action.' });
        await message.channel.send(`✅ تم حظر العضو \`${target.user.tag}\` بنجاح.`);
    }

    if (command === 'kick') {
        if (!message.member?.permissions.has(PermissionsBitField.Flags.KickMembers)) return;
        const target = message.mentions.members?.first();
        if (!target || !target.kickable) return message.reply('❌ تعذّر العثور على العضو أو لا يمكن طرده.');
        await target.kick('KRB Admin Command Action.');
        await message.channel.send(`✅ تم طرد العضو \`${target.user.tag}\` بنجاح.`);
    }

    if (command === 'mute') {
        if (!message.member?.permissions.has(PermissionsBitField.Flags.ModerateMembers)) return;
        const target = message.mentions.members?.first();
        if (!target || !target.manageable) return message.reply('❌ تعذّر كتم العضو.');
        await target.timeout(3600000, 'Muted via KRB Command.'); 
        await message.channel.send(`🤐 تم كتم العضو \`${target.user.tag}\` لمدة ساعة كاملة.`);
    }

    if (command === 'unmute') {
        if (!message.member?.permissions.has(PermissionsBitField.Flags.ModerateMembers)) return;
        const target = message.mentions.members?.first();
        if (!target) return message.reply('❌ اذكر العضو لإلغاء الكتم.');
        await target.timeout(null).catch(() => {});
        await message.channel.send(`🔊 تم فك الكتم والعزل عن \`${target.user.tag}\`.`);
    }
});

// ==========================================
// 💡 معالجة تفاعلات القائمة المنسدلة بدون أي تعليق
// ==========================================
client.on('interactionCreate', async (interaction) => {
    if (blacklistedUsers.has(interaction.user.id) || (interaction.guildId && blacklistedGuilds.has(interaction.guildId))) {
        if (interaction.isRepliable()) {
            await interaction.reply({ content: `❌ **تواصل مع المطور عليك بلاك ليست** <@${DEVELOPER_ID}>`, ephemeral: true });
        }
        return;
    }

    // عند اختيار خيار من القائمة المنسدلة للتذاكر
    if (interaction.isStringSelectMenu() && interaction.customId === 'krb_ticket_select') {
        const selectedValue = interaction.values[0];

        // معالجة زر الريفرش الذكي
        if (selectedValue === 'tk_refresh') {
            await interaction.reply({ content: '🔄 تم تحديث حالة الاتصال بالخادم ونظام الاستجابة بنجاح!', ephemeral: true });
            return;
        }

        // تفادي تعليق البوت بالرد المبدئي الفوري
        await interaction.deferReply({ ephemeral: true });

        let categoryName = 'دعم';
        if (selectedValue === 'tk_exploits') categoryName = 'هاكات';
        if (selectedValue === 'tk_buy') categoryName = 'شراء';

        const channelName = `${categoryName}-${interaction.user.username}`;
        
        try {
            const ticketChannel = await interaction.guild?.channels.create({
                name: channelName,
                type: ChannelType.GuildText,
                permissionOverwrites: [
                    { id: interaction.guild.roles.everyone.id, deny: [PermissionsBitField.Flags.ViewChannel] },
                    { id: interaction.user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory] },
                    { id: client.user!.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] }
                ]
            });

            if (ticketChannel) {
                const welcomeEmbed = new EmbedBuilder()
                    .setTitle(`🔳 تذكرة قسم [${categoryName.toUpperCase()}]`)
                    .setDescription(`أهلاً بك <@${interaction.user.id}> في تذكرتك الخاصة. يرجى طرح استفسارك أو طلبك هنا وسيتواصل معك الفريق الفوري لـ KRB.`)
                    .setColor('#000000');

                const closeBtn = new ActionRowBuilder<ButtonBuilder>().addComponents(
                    new ButtonBuilder().setCustomId('close_krb_ticket').setLabel('إغلاق التذكرة 🔒').setStyle(ButtonStyle.Danger)
                );

                await ticketChannel.send({ embeds: [welcomeEmbed], components: [closeBtn] });
                await interaction.editReply({ content: `✅ تم إنشاء تذكرتك بنجاح هنا: <#${ticketChannel.id}>` });
            }
        } catch (err) {
            await interaction.editReply({ content: '❌ فشل إنشاء التذكرة، يرجى التحقق من الصلاحيات الإدارية للبوت.' });
        }
    }

    if (interaction.isButton() && interaction.customId === 'close_krb_ticket') {
        await interaction.reply({ content: '🔳 جاري أرشفة وتدمير الغرفة النصية خلال لحظات...' });
        setTimeout(() => interaction.channel?.delete().catch(() => {}), 2000);
    }
});

// ==========================================
// 🌐 واجهة لوحة تحكم الجوال المحدثة والمنظمة كاملاً
// ==========================================
app.get('/', (req, res) => {
    let quarantineCards = '';
    isolatedBots.forEach((bot) => {
        quarantineCards += `
        <div class="card quarantine-card">
            <img class="bot-avatar" src="${bot.avatar}" alt="Bot Avatar">
            <div class="bot-details">
                <h3>${bot.tag}</h3>
                <p><strong>السيرفر:</strong> ${bot.guildName}</p>
                <p><strong>الداعي الفعلي:</strong> ${bot.invitedBy}</p>
            </div>
            <div class="card-actions">
                <form action="/api/approve-bot" method="POST" style="width:100%;">
                    <input type="hidden" name="botId" value="${bot.id}">
                    <input type="hidden" name="guildId" value="${bot.guildId}">
                    <button type="submit" class="btn btn-approve">توثيق وموافقة كـ KRB ✅</button>
                </form>
            </div>
        </div>
        `;
    });

    if (!quarantineCards) {
        quarantineCards = `<p style="color:var(--text-secondary); text-align:center; padding: 20px; font-size:14px;">🛡️ المعتقل نظيف. لا توجد قضايا اختراق أو بوتات معزولة حالياً.</p>`;
    }

    const serversTable = client.guilds.cache.map(g => `
        <tr>
            <td>${g.name}</td>
            <td><span class="code-style">${g.id}</span></td>
            <td>${g.memberCount} عضو</td>
            <td><span style="color: ${blacklistedGuilds.has(g.id) ? '#ef4444' : '#22c55e'}">${blacklistedGuilds.has(g.id) ? '⛔ محظور' : '🟢 محمي'}</span></td>
        </tr>
    `).join('');

    res.send(`
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
        <title>KRB ULTIMATE PANEL</title>
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
            body { background-color: var(--bg-main); color: var(--text-primary); padding: 15px; max-width: 1200px; margin: 0 auto; }
            header { border-bottom: 1px solid var(--border-color); padding-bottom: 15px; margin-bottom: 25px; display: flex; flex-direction: column; gap: 10px; }
            header h1 { font-size: 18px; font-weight: 700; }
            .status-badge { background-color: #18181b; border: 1px solid var(--border-color); padding: 5px 12px; border-radius: 9999px; font-size: 12px; color: var(--accent-green); width: fit-content; }
            
            .section-title { font-size: 15px; font-weight: 700; margin: 25px 0 15px 0; border-right: 4px solid #fff; padding-right: 10px; color: #fff; }
            
            .grid { display: grid; grid-template-columns: 1fr; gap: 15px; }
            @media (min-width: 768px) { .grid { grid-template-columns: repeat(auto-fit, minmax(350px, 1fr)); } header { flex-direction: row; justify-content: space-between; align-items: center; } header h1 { font-size: 22px; } }
            
            .card { background-color: var(--bg-card); border: 1px solid var(--border-color); padding: 20px; border-radius: 8px; display: flex; flex-direction: column; }
            
            .quarantine-container { display: flex; flex-direction: column; gap: 15px; }
            .quarantine-card { flex-direction: row; flex-wrap: wrap; gap: 15px; align-items: center; position: relative; border-left: 3px solid var(--accent-red); }
            .bot-avatar { width: 55px; height: 55px; border-radius: 50%; border: 1px solid var(--border-color); background: #222; }
            .bot-details { flex: 1; min-width: 200px; }
            .bot-details h3 { font-size: 15px; color: #fff; margin-bottom: 4px; }
            .bot-details p { font-size: 12px; color: var(--text-secondary); margin-bottom: 2px; }
            .card-actions { width: 100%; margin-top: 10px; }
            
            label { display: block; font-size: 12px; color: var(--text-secondary); margin-bottom: 6px; font-weight: 600; }
            input, textarea, select { width: 100%; background: #18181b; border: 1px solid var(--border-color); color: var(--text-primary); padding: 12px; border-radius: 6px; margin-bottom: 12px; font-size: 13px; -webkit-appearance: none; }
            
            .btn { width: 100%; background: var(--text-primary); color: var(--bg-main); border: none; padding: 12px; font-weight: 700; cursor: pointer; border-radius: 6px; font-size: 13px; }
            .btn-danger { background: transparent; border: 1px solid var(--accent-red); color: var(--accent-red); }
            .btn-approve { background: #fff; color: #000; border: 1px solid #fff; }
            .btn-approve:hover { background: var(--accent-green); border-color: var(--accent-green); color:#fff; }
            
            .table-container { background-color: var(--bg-card); border: 1px solid var(--border-color); border-radius: 8px; padding: 15px; overflow-x: auto; margin-top: 15px; }
            table { width: 100%; border-collapse: collapse; text-align: right; min-width: 500px; }
            th { color: var(--text-secondary); font-size: 12px; padding: 12px; border-bottom: 1px solid var(--border-color); }
            td { padding: 12px; border-bottom: 1px solid var(--border-color); font-size: 13px; }
            .code-style { background: #18181b; padding: 3px 6px; border-radius: 4px; font-family: monospace; border: 1px solid var(--border-color); font-size: 12px; }
        </style>
    </head>
    <body>
        <header>
            <h1>KRB CONTROL INFRASTRUCTURE</h1>
            <div class="status-badge">مرحباً أبو عتب | وحدة التحكم الذكية الحية</div>
        </header>

        <h2 class="section-title">🤖 رادار طلبات توثيق وفك عزل البوتات المستجدة</h2>
        <div class="quarantine-container">
            ${quarantineCards}
        </div>

        <h2 class="section-title">⚙️ أدوات النطاق والتحكم عن بعد</h2>
        <div class="grid">
            <div class="card">
                <h2>✉️ إرسال رسالة مخصصة لسيرفر</h2>
                <form action="/api/send-custom" method="POST">
                    <label>معرف السيرفر المستهدف (Guild ID) *</label>
                    <input type="text" name="guildId" placeholder="ضع الـ ID الخاص بالسيرفر..." required>
                    <label>معرف القناة النصية (Channel ID) - اختياري</label>
                    <input type="text" name="channelId" placeholder="اتركه فارغاً للشات العام الافتراضي...">
                    <label>نص الرسالة</label>
                    <textarea name="message" rows="3" placeholder="اكتب رسالتك الفخمة هنا..." required></textarea>
                    <button type="submit" class="btn">إطلاق الإرسال الفوري 🚀</button>
                </form>
            </div>

            <div class="card">
                <h2>🚫 إدارة حظر النظام (Blacklist)</h2>
                <form action="/api/blacklist" method="POST">
                    <label>نوع الحظر الأمني</label>
                    <select name="type">
                        <option value="user">حظر مستخدم محدد (User ID)</option>
                        <option value="guild">حظر سيرفر كامل (Server ID)</option>
                    </select>
                    <label>المعرف الفريد (ID) *</label>
                    <input type="text" name="targetId" placeholder="ضع الرقم التعريفي هنا..." required>
                    <label>الإجراء المطلوب</label>
                    <select name="action">
                        <option value="add">إدراج وتفعيل منشن المطور 🔒</option>
                        <option value="remove">إزالة من البلاك ليست ✅</option>
                    </select>
                    <button type="submit" class="btn btn-danger">تحديث حظر النظام 🛡️</button>
                </form>
            </div>
        </div>

        <h2 class="section-title">📦 خريطة السيرفرات المتصلة بالشبكة</h2>
        <div class="table-container">
            <table>
                <thead>
                    <tr>
                        <th>اسم السيرفر</th>
                        <th>معرف السيرفر (ID)</th>
                        <th>الأعضاء</th>
                        <th>الحالة والأمان</th>
                    </tr>
                </thead>
                <tbody>
                    ${serversTable || '<tr><td colspan="4" style="text-align: center; color: var(--text-secondary);">لا توجد سيرفرات متصلة حالياً.</td></tr>'}
                </tbody>
            </table>
        </div>
    </body>
    </html>
    `);
});

// 🚀 [API] فك العزل والتوثيق المباشر لبوت معزول
app.post('/api/approve-bot', async (req, res) => {
    const { botId, guildId } = req.body;
    if (!botId || !guildId) return res.status(400).send('البيانات ناقصة.');

    try {
        whitelistedBots.add(botId);
        isolatedBots.delete(botId);

        const guild = await client.guilds.fetch(guildId);
        const targetBotMember = await guild.members.fetch(botId).catch(() => null);

        if (targetBotMember) {
            await targetBotMember.timeout(null, 'Approved via KRB Dashboard.').catch(() => {});
            const sysChannel = guild.channels.cache.find(c => c.type === ChannelType.GuildText) as TextChannel;
            if (sysChannel) {
                sysChannel.send(`✅ **[KRB SECURITY]:** تم توثيق البوت <@${botId}> بنجاح من لوحة التحكم وإلغاء العزل والتجميد عنه.`);
            }
        }
        res.send('<script>alert("✅ تم توثيق البوت وإلغاء عقوبة العزل عنه داخل السيرفر بنجاح!"); window.location.href="/";</script>');
    } catch (error: any) {
        res.status(500).send(`فشل التوثيق الأمني: ${error.message}`);
    }
});

// 🚀 [API] استقبال وإرسال الرسائل المخصصة
app.post('/api/send-custom', async (req, res) => {
    const { guildId, channelId, message } = req.body;
    if (!guildId || !message) return res.status(400).send('❌ خطأ: البيانات ناقصة!');

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

        if (!targetChannel) return res.status(400).send('❌ خطأ: لم أجد قناة نصية صالحة أمتلك فيها صلاحية الكتابة!');
        await targetChannel.send(message);
        res.send('<script>alert("🚀 تم إرسال رسالتك بنجاح!"); window.location.href="/";</script>');
    } catch (error: any) {
        res.status(500).send(`❌ فشل الإرسال: ${error.message}`);
    }
});

// 🔒 [API] التحكم في البلاك ليست
app.post('/api/blacklist', (req, res) => {
    const { type, targetId, action } = req.body;
    if (!targetId) return res.status(400).send('❌ خطأ: ID مطلوب!');

    if (action === 'add') {
        if (type === 'user') blacklistedUsers.add(targetId);
        if (type === 'guild') blacklistedGuilds.add(targetId);
    } else if (action === 'remove') {
        if (type === 'user') blacklistedUsers.delete(targetId);
        if (type === 'guild') blacklistedGuilds.delete(targetId);
    }
    res.send('<script>alert("🔒 تم تحديث السجلات بنجاح!"); window.location.href="/";</script>');
});

app.listen(PORT, () => {
    if (process.env.DISCORD_TOKEN) {
        client.login(process.env.DISCORD_TOKEN);
    } else {
        console.error('❌ كراش: لم يتم العثور على توكن البوت DISCORD_TOKEN في إعدادات Render!');
    }
});
