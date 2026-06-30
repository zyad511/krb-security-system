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
import http from 'http';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ]
});

// ==========================================
// 🌐 خادم ويب مدمج لحل مشكلة الـ 404 في Render
// ==========================================
const PORT = process.env.PORT || 3000;
http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(`
    <body style="background-color:#0b0b0b; color:#ffffff; font-family:sans-serif; display:flex; flex-direction:column; justify-content:center; align-items:center; height:100vh; margin:0;">
      <h1 style="border: 2px solid #fff; padding: 20px 40px; letter-spacing: 2px; box-shadow: 0px 0px 15px rgba(255,255,255,0.1);">🔳 KRB SYSTEM | ONLINE</h1>
      <p style="color: #666; font-size: 14px; margin-top: 10px;">Infrastructure is fully operational and active.</p>
    </body>
  `);
}).listen(PORT, () => console.log(`[KRB WEB] Embedded web server running perfectly on port ${PORT}`));

// ==========================================
// 🗄️ إعدادات الحماية وقاعدة البيانات
// ==========================================
const MONGO_URI = process.env.MONGO_URI || '';
if (MONGO_URI) {
  mongoose.connect(MONGO_URI)
    .then(() => console.log('[KRB DATABASE] Connected successfully'))
    .catch((err) => console.error('[KRB DATABASE] Memory Mode Active:', err.message));
}

const GuildSchema = new mongoose.Schema({
  guildId: { type: String, required: true, unique: true },
  trustedUsers: { type: [String], default: [] },
  supportRole: { type: String, default: '' },    
  logChannelId: { type: String, default: '' },   
  antiNuke: { type: Boolean, default: true },
  antiSpam: { type: Boolean, default: true }
});
const GuildConfig = mongoose.models.GuildConfig || mongoose.model('GuildConfig', GuildSchema);

const PREFIX = '.'; 
const spamMap = new Map<string, { count: number, lastMessage: number }>();

client.once('ready', async () => {
  console.log(`[KRB SYSTEM] ${client.user?.tag} deployed successfully.`);
  
  const commandsData: any[] = [
    { name: 'help', description: 'عرض لوحة التحكم الكاملة والفخمة لنظام KRB' },
    { name: 'status', description: 'عرض حالة الأنزمة الأمنية والوايت ليست' },
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

async function getGuildConfig(guildId: string) {
  const defaultConfig = { guildId, trustedUsers: [], supportRole: '', logChannelId: '', antiNuke: true, antiSpam: true };
  if (mongoose.connection.readyState !== 1) return defaultConfig;
  try {
    const config = await GuildConfig.findOne({ guildId }).maxTimeMS(1500);
    return config || defaultConfig;
  } catch {
    return defaultConfig;
  }
}

// ==========================================
// 🛠️ أمر إرسال اللوحة وتعديل النصوص الكاملة
// ==========================================
client.on('messageCreate', async (message) => {
  if (message.author.bot || !message.guild) return;

  if (!message.content.startsWith(PREFIX)) return;
  const args = message.content.slice(PREFIX.length).trim().split(/ +/);
  const command = args.shift()?.toLowerCase();
  
  // جلب رابط أيقونة السيرفر بشكل صحيح ومؤمن ليظهر كصورة Thumbnail دائرية فخمة
  const serverIconUrl = message.guild.iconURL({ extension: 'png', size: 1024 }) || 'https://cdn.discordapp.com/embed/avatars/0.png';

  if (command === 'ticket-setup') {
    if (!message.member?.permissions.has(PermissionFlagsBits.Administrator)) return;
    
    // 📝 [هنا يمكنك تعديل كافة نصوص اللوحة الرئيسية لـ KRB]
    const embed = new EmbedBuilder()
      .setAuthor({ name: `KRB SYSTEM | MANAGEMENT HUB`, iconURL: serverIconUrl })
      .setTitle('🔳 **مـركـز خـدمـات الـسـيـرفـر والـدّعـم الـفـنّـي**')
      .setColor('#000000')
      .setThumbnail(serverIconUrl)
      .setDescription(
        `ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ\n\n` +
        `مرحباً بك في المنصة الموحدة التابعة لنظام **KRB SYSTEM**.\n` +
        `يمكنك الآن بدء محادثة خاصة ومباشرة مع الإدارة الفنية عبر اختيار الطريقة المناسبة لك بالأسفل:\n\n` +
        `🔲 **الخيار الأول:** عبر القائمة المنسدلة (Menu)\n` +
        `🔲 **الخيار الثاني:** عبر الأزرار التفاعلية (Buttons)\n\n` +
        `ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ`
      )
      .setFooter({ text: 'KRB Infrastructure • Premium Hybrid Interface' });

    const menu = new StringSelectMenuBuilder()
      .setCustomId('tk_hybrid_menu')
      .setPlaceholder('🔲 اختر القسم المطلوب من القائمة هنا...')
      .addOptions([
        { label: 'قسم الدعم الفني والتقني', value: 'tech', emoji: '🛠️' },
        { label: 'قسم الشكاوى والبلاغات السرية', value: 'report', emoji: '🛡️' }
      ]);
    const rowMenu = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(menu);

    const rowButtons = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId('tk_general_btn').setLabel('الدعم التقني 🛠️').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('tk_report_btn').setLabel('تقديم بلاغ 🛡️').setStyle(ButtonStyle.Danger)
    );

    await message.channel.send({ embeds: [embed], components: [rowMenu, rowButtons] });
    await message.delete().catch(() => {});
    return;
  }

  if (command === 'help') {
    const embed = new EmbedBuilder()
      .setTitle('🔳 KRB ULTIMATE PANEL')
      .setDescription('النظام يعمل بكفاءة. اكتب `.ticket-setup` لإطلاق واجهة الدعم الفني الفخمة.')
      .setColor('#000000');
    await message.reply({ embeds: [embed] });
  }
});

// ==========================================
// 🔒 نظام معالجة التكتات، الـ Log، والتدمير الفوري الآمن
// ==========================================
client.on('interactionCreate', async (interaction: Interaction) => {
  if (!interaction.guild || !interaction.isRepliable()) return;

  const config = await getGuildConfig(interaction.guild.id);
  const serverIconUrl = interaction.guild.iconURL({ extension: 'png', size: 1024 }) || 'https://cdn.discordapp.com/embed/avatars/0.png';

  // معالجة أوامر السلاش الإعدادية
  if (interaction.isChatInputCommand()) {
    await interaction.deferReply({ ephemeral: true }).catch(() => {});
    if (interaction.commandName === 'help') {
      await interaction.editReply({ content: '🔳 نظام KRB نشط بالكامل. اكتب التوجيه النصي `.ticket-setup` لتشغيل اللوحة الهجينة.' });
    }
    if (interaction.commandName === 'status') {
      await interaction.editReply({ content: '🛡️ جميع خوارزميات KRB الحية تعمل في بيئة التشغيل المستقرة حالياً.' });
    }
    return;
  }

  // دالة إنشاء التكت الآمنة مع جلب الصورة الفخمة
  const createTicket = async (typeLabel: string) => {
    await interaction.deferReply({ ephemeral: true }).catch(() => {});

    const ticketChannel = await interaction.guild!.channels.create({
      name: `${typeLabel}-${interaction.user.username}`,
      type: ChannelType.GuildText,
      permissionOverwrites: [
        { id: interaction.guild!.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] },
        { id: interaction.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.AttachFiles] },
        { id: client.user!.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.AttachFiles, PermissionFlagsBits.ManageChannels] }
      ]
    }).catch(() => null);

    if (!ticketChannel) {
      return interaction.editReply({ content: '❌ فشل إنشاء الغرفة. تأكد من إعطاء البوت صلاحية `Manage Channels` وصلاحيات كاملة للرتبة الخاصة به.' });
    }

    const mentionRole = config.supportRole ? `<@&${config.supportRole}>` : '@here';

    // 📝 [هنا نصوص غرف التواصل المغلقة من الداخل]
    const insideEmbed = new EmbedBuilder()
      .setAuthor({ name: 'KRB MANAGEMENT SYSTEM', iconURL: serverIconUrl })
      .setTitle('🔳 **غرفة تواصل مغلقة ونشطة**')
      .setThumbnail(serverIconUrl)
      .setColor('#000000')
      .setDescription(
        `ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ\n\n` +
        `مرحباً بك <@${interaction.user.id}> في قسم الـ **${typeLabel.replace('-', ' ')}**.\n` +
        `تم استدعاء طاقم المسؤولين لمراجعة طلبك ومساعدتك فوراً.\n\n` +
        `يرجى كتابة مشكلتك بالتفصيل هنا وسيقوم المسؤول بالرد عليك قريباً.\n\n` +
        `ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ`
      )
      .setFooter({ text: 'اضغط على الزر الأسود بالأسفل لإنهاء المحادثة وتدمير الروم' });

    const closeRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId('close_hybrid_ticket').setLabel('إغلاق وحفظ التكت 🔒').setStyle(ButtonStyle.Secondary)
    );

    await ticketChannel.send({ 
      content: `👤 **مفتوح بواسطة:** <@${interaction.user.id}> | 🔔 **طاقم العمل:** ${mentionRole}`, 
      embeds: [insideEmbed], 
      components: [closeRow] 
    });

    await interaction.editReply({ content: `✅ تم إنشاء تذكرتك الفخمة بنجاح، تفضل هنا: <#${ticketChannel.id}>` });
  };

  if (interaction.isStringSelectMenu() && interaction.customId === 'tk_hybrid_menu') {
    const selected = interaction.values[0];
    await createTicket(selected === 'tech' ? 'دعم-عام' : 'بلاغ-سري');
  }

  if (interaction.isButton()) {
    const cid = interaction.customId;
    if (cid === 'tk_general_btn') await createTicket('دعم-عام');
    if (cid === 'tk_report_btn') await createTicket('بلاغ-سري');

    // 🔒 كود الإغلاق الذكي والتدمير السريع (مؤمن ضد التعليق)
    if (cid === 'close_hybrid_ticket') {
      const channel = interaction.channel as TextChannel;
      
      // الرد المبدئي السريع لتجنب تعليق الديسكورد
      await interaction.reply({ content: '🔳 **[KRB SYSTEM]:** جاري استخراج النص وتدمير القناة فوراً...' }).catch(() => {});

      try {
        const messages = await channel.messages.fetch({ limit: 100 }).catch(() => null);
        let transcriptText = `KRB TICKET LOG TRANSCRIPT\n----------------------------------------\n\n`;

        if (messages) {
          Array.from(messages.values()).reverse().forEach(msg => {
            transcriptText += `[${msg.createdAt.toLocaleString()}] ${msg.author.tag}: ${msg.content}\n`;
          });
        }

        const buffer = Buffer.from(transcriptText, 'utf-8');
        const attachment = new AttachmentBuilder(buffer, { name: `transcript-${channel.name}.txt` });

        // التحقق من إرسال السجل لقناة الـ Log إذا كانت مهيأة
        if (config.logChannelId) {
          const logChannel = interaction.guild.channels.cache.get(config.logChannelId) as TextChannel;
          if (logChannel) {
            await logChannel.send({ 
              content: `🔒 **تم غلق وتدمير تكت بنجاح:** \`${channel.name}\` بواسطة <@${interaction.user.id}>`, 
              files: [attachment] 
            }).catch(() => {});
          }
        }
      } catch (logError) {
        console.log('[KRB LOG BYPASS] Logging skipped or failed, moving to deletion.');
      }

      // 💥 تنفيذ عملية حذف القناة فوراً ودون انتظار طويل لمنع التعليق
      setTimeout(async () => {
        await channel.delete().catch((err) => {
          console.error('[KRB ERROR] Could not delete channel, missing Manage Channels permission:', err.message);
        });
      }, 1500);
    }
  }
});

process.on('unhandledRejection', (reason) => console.error('[KRB CRASH] Handled:', reason));
process.on('uncaughtException', (err) => console.error('[KRB CRASH] Handled:', err));

client.login(process.env.DISCORD_TOKEN);
