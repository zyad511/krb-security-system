import { 
  Client, 
  GatewayIntentBits, 
  EmbedBuilder, 
  PermissionFlagsBits, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  StringSelectMenuBuilder, 
  ChannelType,
  ApplicationCommandOptionType,
  Interaction,
  TextChannel,
  AttachmentBuilder,
  AuditLogEvent
} from 'discord.js';
import mongoose from 'mongoose';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ]
});

// الاتصال بقاعدة البيانات
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/krb-security';
mongoose.connect(MONGO_URI)
  .then(() => console.log('[KRB DATABASE] Connected successfully'))
  .catch((err) => console.error('[KRB DATABASE] Connection error:', err));

// إعداد هيكلة البيانات المتقدمة لـ KRB
const GuildSchema = new mongoose.Schema({
  guildId: { type: String, required: true, unique: true },
  trustedUsers: { type: [String], default: [] }, // قائمة الأيدي الموثوق لها بإدخال البوتات
  supportRole: { type: String, default: '' },    // رتبة الدعم الفني للمنشن
  logChannelId: { type: String, default: '' },   // قناة حفظ سجلات التكتات
  antiNuke: { type: Boolean, default: true },
  antiSpam: { type: Boolean, default: true }
});
const GuildConfig = mongoose.models.GuildConfig || mongoose.model('GuildConfig', GuildSchema);

const PREFIX = '.'; 
const activeBlackjack = new Map<string, { cards: number[], dealer: number[], bet: number }>();
const spamMap = new Map<string, { count: number, lastMessage: number }>();

client.once('ready', async () => {
  console.log(`[KRB SYSTEM] ${client.user?.tag} Ready to Dominate.`);
  
  const commandsData: any[] = [
    { name: 'help', description: 'عرض لوحة التحكم الكاملة والفخمة لنظام KRB' },
    { name: 'status', description: 'عرض حالة الأنظمة الأمنية والوايت ليست' },
    {
      name: 'config',
      description: 'إعداد خيارات التكت والحماية المتقدمة',
      options: [
        { name: 'logs', description: 'تحديد قناة سجلات التكت', type: ApplicationCommandOptionType.Channel },
        { name: 'role', description: 'تحديد رتبة الدعم الفني للمنشن', type: ApplicationCommandOptionType.Role },
        { name: 'trust', description: 'إضافة مستخدم موثوق للوايت ليست (ID)', type: ApplicationCommandOptionType.String }
      ]
    }
  ];

  if (client.application) {
    await client.application.commands.set(commandsData).catch(() => {});
  }
});

// ==========================================
// [1] نظام الحماية المتقدم: منع البوتات الغريبة (Anti-Bot)
// ==========================================
client.on('guildMemberAdd', async (member) => {
  if (!member.user.bot) return; // تجاهل الحسابات البشرية
  
  const config = await GuildConfig.findOne({ guildId: member.guild.id });
  if (!config || !config.antiNuke) return;

  try {
    // جلب سجلات المراقبة لمعرفة من قام بدعوة البوت
    const fetchedLogs = await member.guild.fetchAuditLogs({
      limit: 1,
      type: AuditLogEvent.BotAdd,
    });
    const botLog = fetchedLogs.entries.first();
    
    if (botLog) {
      const { executor } = botLog;
      if (executor) {
        // إذا لم يكن الفاعل هو صاحب السيرفر وليس في قائمة الموثوقين، يتم طرد البوت فوراً
        if (executor.id !== member.guild.ownerId && !config.trustedUsers.includes(executor.id)) {
          await member.kick('KRB Security: Unauthorized bot added.').catch(() => {});
          
          // محاولة سحب الصلاحيات من العضو الذي أدخل البوت كإجراء تأديبي لحماية السيرفر
          const executorMember = await member.guild.members.fetch(executor.id).catch(() => null);
          if (executorMember && executorMember.manageable) {
            await executorMember.roles.set([]).catch(() => {}); // سحب جميع رتب الفاعل
          }
          console.log(`[KRB SECURITY] Blocked bot ${member.user.tag} added by unauthorized user: ${executor.tag}`);
        }
      }
    }
  } catch (error) {
    console.error('[KRB ERROR] Failed to process anti-bot defense:', error);
  }
});

// ==========================================
// [2] معالج الرسائل: أوامر الـ Prefix + نظام الـ Anti-Spam
// ==========================================
client.on('messageCreate', async (message) => {
  if (message.author.bot || !message.guild) return;

  let config = await GuildConfig.findOne({ guildId: message.guild.id });
  if (!config) config = await GuildConfig.create({ guildId: message.guild.id });

  // 🔳 تشغيل نظام الـ Anti-Spam الفعلي
  if (config.antiSpam && !message.member?.permissions.has(PermissionFlagsBits.Administrator)) {
    const now = Date.now();
    const userData = spamMap.get(message.author.id) || { count: 0, lastMessage: now };

    if (now - userData.lastMessage < 3000) { // 3 ثوانٍ
      userData.count++;
      if (userData.count > 4) { // إذا أرسل أكثر من 4 رسائل متتالية
        await message.delete().catch(() => {});
        await message.member?.timeout(60000, 'KRB Anti-Spam System Limit Exceeded').catch(() => {});
        const warnEmbed = new EmbedBuilder()
          .setColor('#000000')
          .setDescription(`⚠️ **[ANTI-SPAM]:** تم كتم <@${message.author.id}> لمدة دقيقة وحذف رسائله بسبب التكرار المفرط.`);
        const warnMsg = await message.channel.send({ embeds: [warnEmbed] });
        setTimeout(() => warnMsg.delete().catch(() => {}), 5000);
        return;
      }
    } else {
      userData.count = 1;
      userData.lastMessage = now;
    }
    spamMap.set(message.author.id, userData);
  }

  if (!message.content.startsWith(PREFIX)) return;
  const args = message.content.slice(PREFIX.length).trim().split(/ +/);
  const command = args.shift()?.toLowerCase();
  
  // جلب دقيق لأيقونة السيرفر بجودة عالية وبصيغة ثابتة
  const serverIconUrl = message.guild.iconURL({ extension: 'png', size: 1024 }) || undefined;

  // إعداد لوحة التكت الفخمة تخصيص "على كيفك" (.ticket-setup)
  if (command === 'ticket-setup') {
    if (!message.member?.permissions.has(PermissionFlagsBits.Administrator)) return;
    
    const embed = new EmbedBuilder()
      .setAuthor({ name: `${message.guild.name.toUpperCase()} | PREMIUM SYSTEM`, iconURL: serverIconUrl })
      .setTitle('🔳 **مـركـز الـدّعـم الـفـنّـي والـخـدمـات**')
      .setColor('#000000')
      .setThumbnail(serverIconUrl || null)
      .setDescription(
        `ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ\n\n` +
        `أهلاً بك في قسم مساعدة الأعضاء الخاص بـ **KRB SYSTEM**.\n` +
        `يرجى الضغط على الزر المناسب لنوع معاملتك بالأسفل ليتم فتح تكت تواصل خاص ومشفر مع طاقم الإدارة.\n\n` +
        `◼️ **الأقسام المتاحة حالياً:**\n` +
        `• **الدعم العام :** للاستفسارات العامة والمشاكل التقنية.\n` +
        `• **الشكاوى والبلاغات :** للتواصل السري المباشر مع الإدارة العليا.\n\n` +
        `ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ`
      )
      .setFooter({ text: 'KRB Infrastructure • High Contrast Minimalist Style' });

    // وضع الأزرار الفخمة والمخصصة مع الإيموجيات الهادئة
    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId('tk_general').setLabel('الدعم الفني والتقني 🛠️').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('tk_report').setLabel('تقديم شكوى أو بلاغ 🛡️').setStyle(ButtonStyle.Danger)
    );

    await message.channel.send({ embeds: [embed], components: [row] });
    await message.delete().catch(() => {});
  }
});

// ==========================================
// [3] معالج التفاعلات المتقدم (Slash & Buttons Management)
// ==========================================
client.on('interactionCreate', async (interaction: Interaction) => {
  if (!interaction.guild || !interaction.isRepliable()) return;

  let config = await GuildConfig.findOne({ guildId: interaction.guild.id });
  if (!config) config = await GuildConfig.create({ guildId: interaction.guild.id });
  const serverIconUrl = interaction.guild.iconURL({ extension: 'png', size: 1024 }) || undefined;

  // إعدادات البوت عبر أوامر الـ Slash (/)
  if (interaction.isChatInputCommand() && interaction.commandName === 'config') {
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({ content: '❌ صلاحياتك غير كافية لاستخدام هذا الأمر.', ephemeral: true });
    }
    const logChannel = interaction.options.getChannel('logs');
    const role = interaction.options.getRole('role');
    const trustUser = interaction.options.getString('trust');

    if (logChannel) config.logChannelId = logChannel.id;
    if (role) config.supportRole = role.id;
    if (trustUser) config.trustedUsers.push(trustUser);

    await config.save();
    await interaction.reply({ content: '✅ **[KRB CONFIG]:** تم تحديث وحفظ الإعدادات الفخمة بنجاح في قاعدة البيانات.', ephemeral: true });
  }

  // التفاعل مع الأزرار (فتح وإغلاق وحفظ سجلات التكت)
  if (interaction.isButton()) {
    const customId = interaction.customId;
    let ticketType = '';

    if (customId === 'tk_general') ticketType = 'دعم-عام';
    if (customId === 'tk_report') ticketType = 'بلاغ-سري';

    // أ) إنشاء التكت الفخم والمنشن التلقائي
    if (ticketType) {
      await interaction.deferReply({ ephemeral: true });

      const ticketChannel = await interaction.guild.channels.create({
        name: `${ticketType}-${interaction.user.username}`,
        type: ChannelType.GuildText,
        permissionOverwrites: [
          { id: interaction.guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] },
          { id: interaction.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.AttachFiles] },
          { id: client.user!.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.AttachFiles] }
        ]
      });

      // صياغة منشن رتبة الدعم المخصصة
      const mentionRole = config.supportRole ? `<@&${config.supportRole}>` : '@here';

      const insideEmbed = new EmbedBuilder()
        .setAuthor({ name: 'KRB MANAGEMENT SYSTEM', iconURL: serverIconUrl })
        .setTitle('🔳 **غرفة تواصل مغلقة ونشطة**')
        .setColor('#000000')
        .setThumbnail(serverIconUrl || null)
        .setDescription(
          `ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ\n\n` +
          `مرحباً بك <@${interaction.user.id}> في قسم الـ **${ticketType.replace('-', ' ')}**.\n` +
          `تم استدعاء طاقم الدعم الفني لمراجعة طلبك ومساعدتك فوراً.\n\n` +
          `يرجى كتابة مشكلتك أو تفاصيل البلاغ هنا بوضوح لتسهيل المعاملة.\n\n` +
          `ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ`
        )
        .setFooter({ text: 'اضغط على الزر الأحمر لإنهاء وحفظ المحادثة تلقائياً' });

      const controlRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder().setCustomId('close_ticket').setLabel('إغلاق وحفظ التكت 🔒').setStyle(ButtonStyle.Danger)
      );

      // إرسال الرسالة الأساسية مع المنشنات المطلوبة للتنبيه
      await ticketChannel.send({ 
        content: `👤 **مفتوح بواسطة:** <@${interaction.user.id}> | 🔔 **إلى:** ${mentionRole}`, 
        embeds: [insideEmbed], 
        components: [controlRow] 
      });

      await interaction.editReply({ content: `✅ تم إنشاء تكتك الفخم بنجاح، يمكنك التوجه هنا: <#${ticketChannel.id}>` });
    }

    // ب) زر إغلاق التكت وإنشاء الـ Log الحفظ الكامل كملف
    if (customId === 'close_ticket') {
      await interaction.deferReply();
      const channel = interaction.channel as TextChannel;

      // سحب آخر 100 رسالة من الشات
      const messages = await channel.messages.fetch({ limit: 100 });
      let transcriptText = `KRB TICKET LOG TRANSCRIPT\nSERVER: ${interaction.guild.name}\nCHANNEL: ${channel.name}\nCLOSED BY: ${interaction.user.tag}\n----------------------------------------\n\n`;

      const reversedMessages = Array.from(messages.values()).reverse();
      reversedMessages.forEach(msg => {
        transcriptText += `[${msg.createdAt.toLocaleString()}] ${msg.author.tag}: ${msg.content}\n`;
      });

      // تحويل النص إلى Buffer وإرفاقه كملف نصي .txt لحفظ المساحة والفخامة
      const buffer = Buffer.from(transcriptText, 'utf-8');
      const attachment = new AttachmentBuilder(buffer, { name: `transcript-${channel.name}.txt` });

      const logEmbed = new EmbedBuilder()
        .setTitle('🔒 **[CLOSED & LOGGED] تم إغلاق تكت**')
        .setColor('#000000')
        .setThumbnail(serverIconUrl || null)
        .addFields(
          { name: '◼️ اسم القناة', value: `\`${channel.name}\``, inline: true },
          { name: '◼️ الفاعل', value: `<@${interaction.user.id}>`, inline: true }
        )
        .setTimestamp();

      // إرسال الملف إلى القناة المحددة للـ Logs إذا تم ضبطها
      if (config.logChannelId) {
        const logChannel = interaction.guild.channels.cache.get(config.logChannelId) as TextChannel;
        if (logChannel) {
          await logChannel.send({ embeds: [logEmbed], files: [attachment] });
        }
      }

      await interaction.editReply('🔳 **[KRB SYSTEM]:** تم حفظ السجل وإرساله بنجاح للـ Log. سيتم حذف القناة الحالية نهائياً الآن...');
      setTimeout(() => channel.delete().catch(() => {}), 4000);
    }
  }
});

// الحماية الشاملة من الانهيار (Anti-Crash)
process.on('unhandledRejection', (reason) => console.error('[KRB CRASH] Blocked Rejection:', reason));
process.on('uncaughtException', (err) => console.error('[KRB CRASH] Blocked Exception:', err));

client.login(process.env.DISCORD_TOKEN);
