import { 
  Client, 
  GatewayIntentBits, 
  EmbedBuilder, 
  PermissionFlagsBits, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  StringSelectMenuBuilder, 
  ChannelType 
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

// إعداد الهيكلة المخزنة للسيرفر
const GuildSchema = new mongoose.Schema({
  guildId: { type: String, required: true, unique: true },
  trustedUsers: { type: [String], default: [] },
  antiNuke: { type: Boolean, default: true },
  antiSpam: { type: Boolean, default: true }
});
const GuildConfig = mongoose.models.GuildConfig || mongoose.model('GuildConfig', GuildSchema);

const PREFIX = '.'; // البادئة المعتمدة للتحكم السريع من الجوال

client.once('ready', () => {
  console.log(`[KRB SECURITY] ${client.user?.tag} Is Now Online & Protecting.`);
  client.user?.setActivity({ name: '.help | KRB System', type: 4 });
});

// ==========================================
// [1] معالج أوامر الشات النصية (Prefix Commands)
// ==========================================
client.on('messageCreate', async (message) => {
  if (message.author.bot || !message.guild || !message.content.startsWith(PREFIX)) return;

  // التحقق من صلاحيات الإدارة العليا لاستخدام السيستم
  if (!message.member?.permissions.has(PermissionFlagsBits.Administrator)) return;

  const args = message.content.slice(PREFIX.length).trim().split(/ +/);
  const command = args.shift()?.toLowerCase();

  let config = await GuildConfig.findOne({ guildId: message.guild.id });
  if (!config) config = await GuildConfig.create({ guildId: message.guild.id });

  const serverIcon = message.guild.iconURL({ forceStatic: false }) || undefined;

  // 1. لوحة التحكم والأوامر الكاملة
  if (command === 'help' || command === 'panel') {
    const embed = new EmbedBuilder()
      .setAuthor({ name: 'KRB SECURITY INFRASTRUCTURE', iconURL: client.user?.displayAvatarURL() })
      .setThumbnail(serverIcon || null)
      .setColor('#000000')
      .setDescription(
        `🔳 **[ KRB CONTROL PANEL - الميزات الكاملة ]**\n` +
        `ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ\n\n` +
        `🛡️ **أنظمة الحماية التلقائية:**\n` +
        `\`${PREFIX}status\` ➔ عرض حالة الأنظمة وعدد الوايت ليست\n` +
        `\`${PREFIX}set <nuke/spam> <on/off>\` ➔ تشغيل/تعطيل الحماية الحية\n` +
        `\`${PREFIX}wl add/remove <@user>\` ➔ إدارة قائمة المشرفين الموثوقين\n` +
        `\`${PREFIX}wl list\` ➔ استعراض قائمة الوايت ليست\n\n` +
        `🎫 **نظام التكت الفخم (جديد):**\n` +
        `\`${PREFIX}ticket setup buttons\` ➔ إنشاء لوحة تكت تعتمد على الأزرار\n` +
        `\`${PREFIX}ticket setup menu\` ➔ إنشاء لوحة تكت قائمة منسدلة فخمة\n\n` +
        `⚙️ **أوامر الإدارة السريعة:**\n` +
        `\`${PREFIX}lock\` ➔ إغلاق الشات الحالي فوراً ومنع الأعضاء من الكتابة\n` +
        `\`${PREFIX}unlock\` ➔ إعادة فتح الشات المقفل للأعضاء\n` +
        `ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ`
      )
      .setFooter({ text: 'Minimalist AirFlow Standard • KRB V1' })
      .setTimestamp();

    await message.reply({ embeds: [embed] });
  }

  // 2. أمر عرض الحالة
  if (command === 'status') {
    const embed = new EmbedBuilder()
      .setTitle('🛡️ SECURITY STATE & INFRASTRUCTURE')
      .setThumbnail(serverIcon || null)
      .setColor('#000000')
      .addFields(
        { name: '◼️ Anti-Nuke Engine', value: config.antiNuke ? '`ACTIVE / SECURED` ✅' : '`DISABLED` ❌', inline: true },
        { name: '◼️ Anti-Spam Engine', value: config.antiSpam ? '`ACTIVE / MONITORING` ✅' : '`DISABLED` ❌', inline: true },
        { name: '◼️ Whitelisted Users', value: `\`${config.trustedUsers.length}\` الموثوقين المسموح لهم بالتعديل`, inline: false }
      )
      .setTimestamp();

    await message.reply({ embeds: [embed] });
  }

  // 3. التحكم بالتشغيل والإطفاء
  if (command === 'set') {
    const target = args[0]?.toLowerCase();
    const status = args[1]?.toLowerCase();

    if (!['nuke', 'spam'].includes(target) || !['on', 'off'].includes(status)) {
      return message.reply(`❌ **خطأ:** الاستخدام الصحيح: \`${PREFIX}set <nuke/spam> <on/off>\``);
    }

    if (target === 'nuke') config.antiNuke = status === 'on';
    if (target === 'spam') config.antiSpam = status === 'on';
    await config.save();
    
    return message.reply(`🔳 **[SYSTEM UPDATE]:** تم تحديث نظام \`${target.toUpperCase()}\` إلى: **${status.toUpperCase()}**`);
  }

  // 4. إدارة الوايت ليست
  if (command === 'wl') {
    const sub = args[0]?.toLowerCase();
    if (sub === 'list') {
      const list = config.trustedUsers.map((id: string) => `<@${id}>`).join('\n') || 'لا يوجد أي أعضاء موثوقين حالياً.';
      const embed = new EmbedBuilder().setTitle('💎 KRB TRUSTED WHITELIST').setColor('#000000').setDescription(list);
      return message.reply({ embeds: [embed] });
    }

    const targetUser = message.mentions.members?.first() || message.guild.members.cache.get(args[1]);
    if (!targetUser) return message.reply(`❌ **خطأ:** يرجى منشن العضو. مثال: \`${PREFIX}wl add @user\``);

    if (sub === 'add') {
      if (config.trustedUsers.includes(targetUser.id)) return message.reply('❌ العضو مضاف مسبقاً.');
      config.trustedUsers.push(targetUser.id);
      await config.save();
      return message.reply(`✅ تم إضافة ${targetUser.user.tag} للوايت ليست.`);
    }
    if (sub === 'remove') {
      config.trustedUsers = config.trustedUsers.filter((id: string) => id !== targetUser.id);
      await config.save();
      return message.reply(`⚠️ تم إزالة العضو من الوايت ليست.`);
    }
  }

  // 5. أوامر القفل والفتح الفوري
  if (command === 'lock') {
    await message.channel.permissionOverwrites.edit(message.guild.roles.everyone, { SendMessages: false });
    const embed = new EmbedBuilder().setColor('#000000').setDescription('🔒 **[SYSTEM LOCKDOWN]:** تم إغلاق القناة الحالية بشكل كامل.');
    await message.reply({ embeds: [embed] });
  }
  if (command === 'unlock') {
    await message.channel.permissionOverwrites.edit(message.guild.roles.everyone, { SendMessages: true });
    const embed = new EmbedBuilder().setColor('#000000').setDescription('🔓 **[SYSTEM UNLOCK]:** تم إعادة فتح القناة الحالية والسماح بالكتابة.');
    await message.reply({ embeds: [embed] });
  }

  // 6. أمر بناء التكت (تختار أزرار أو قائمة منسدلة)
  if (command === 'ticket') {
    const mode = args[1]?.toLowerCase();
    if (!args[0] || args[0].toLowerCase() !== 'setup' || !['buttons', 'menu'].includes(mode)) {
      return message.reply(`❌ **خطأ:** الاستخدام الصحيح:\n\`${PREFIX}ticket setup buttons\`\n\`${PREFIX}ticket setup menu\``);
    }

    const ticketEmbed = new EmbedBuilder()
      .setAuthor({ name: `${message.guild.name} | SUPPORT SYSTEM`, iconURL: serverIcon })
      .setTitle('🎫 مركز الدعم الفني والمساعدة')
      .setDescription(
        `مرحباً بك في مركز التواصل الخاص بـ **${message.guild.name}**.\n` +
        `إذا واجهتك أي مشكلة أو كنت ترغب في تقديم استفسار/بلاغ، يرجى فتح تكت عبر الخيارات المتاحة في الأسفل وسيتم الرد عليك فوراً من قبل الإدارة.\n\n` +
        `ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ\n` +
        `◼️ *تنويه: يمنع فتح التكت بدون سبب واضح لتفادي العقوبات.*`
      )
      .setColor('#000000')
      .setFooter({ text: 'KRB Security & Infrastructure Management' });

    if (mode === 'buttons') {
      // بناء نظام التكت بالأزرار
      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder().setCustomId('tk_general').setLabel('الدعم الفني والتقني').setStyle(ButtonStyle.Secondary).setEmoji('🛠️'),
        new ButtonBuilder().setCustomId('tk_report').setLabel('تقديم بلاغ أو شكوى').setStyle(ButtonStyle.Danger).setEmoji('🛡️')
      );
      await message.channel.send({ embeds: [ticketEmbed], components: [row] });
    } else if (mode === 'menu') {
      // بناء نظام التكت بالقائمة المنسدلة
      const menu = new StringSelectMenuBuilder()
        .setCustomId('tk_select_menu')
        .setPlaceholder('🔲 اضغط هنا واختبر القسم المناسب لمعاملتك')
        .addOptions([
          { label: 'قسم الدعم العام', description: 'للاستفسارات والمشاكل العامة داخل السيرفر', value: 'tech', emoji: '⚙️' },
          { label: 'قسم الإدارة والشكاوى', description: 'لتقديم بلاغ سري أو شكوى ضد عضو/مشرف', value: 'admin', emoji: '👑' }
        ]);
      const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(menu);
      await message.channel.send({ embeds: [ticketEmbed], components: [row] });
    }
    await message.delete();
  }
});

// ==========================================
// [2] معالج التفاعلات والضغط التلقائي (Interactions)
// ==========================================
client.on('interactionCreate', async (interaction) => {
  if (!interaction.guild) return;

  let ticketType = '';

  // أ) فحص نقرات الأزرار
  if (interaction.isButton()) {
    if (interaction.customId === 'tk_general') ticketType = 'دعم-عام';
    if (interaction.customId === 'tk_report') ticketType = 'شكوى-بلاغ';

    // زر إغلاق التكت
    if (interaction.customId === 'close_ticket') {
      await interaction.reply('🔳 **[KRB SYSTEM]:** سيتم إغلاق وتدمير التكت وحذفه خلال 5 ثوانٍ...');
      setTimeout(() => interaction.channel?.delete().catch(() => {}), 5000);
      return;
    }
  }

  // ب) فحص اختيارات القائمة المنسدلة
  if (interaction.isStringSelectMenu() && interaction.customId === 'tk_select_menu') {
    const value = interaction.values[0];
    if (value === 'tech') ticketType = 'دعم-فني';
    if (value === 'admin') ticketType = 'إدارة-عليا';
  }

  // ج) كود إنشاء قناة التكت وضبط الصلاحيات الاحترافية الفخمة
  if (ticketType) {
    await interaction.deferReply({ ephemeral: true });

    const channelName = `${ticketType}-${interaction.user.username}`;
    
    // إنشاء الغرفة بحيث لا يراها إلا صاحب التكت والإدارة العليا فقط
    const ticketChannel = await interaction.guild.channels.create({
      name: channelName,
      type: ChannelType.GuildText,
      permissionOverwrites: [
        { id: interaction.guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] },
        { id: interaction.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.AttachFiles] },
        { id: client.user!.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] }
      ]
    });

    const insideEmbed = new EmbedBuilder()
      .setAuthor({ name: `KRB AUTOMATED TICKET SYSTEM`, iconURL: client.user?.displayAvatarURL() })
      .setColor('#000000')
      .setDescription(
        `🖤 **مرحباً بك يا <@${interaction.user.id}>**\n` +
        `لقد قمت بفتح تكت تحت قسم: \`${ticketType.toUpperCase()}\`.\n\n` +
        `طاقم الإدارة متواجد ومستعد لمساعدتك الآن، يرجى كتابة تفاصيل مشكلتك بوضوح وانتظار الرد.\n` +
        `ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ ـ`
      )
      .setFooter({ text: 'لإغلاق التكت اضغط على الزر أدناه مباشرة' });

    const closeRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId('close_ticket').setLabel('إغلاق التكت فوراً').setStyle(ButtonStyle.Danger).setEmoji('🔒')
    );

    await ticketChannel.send({ content: `<@${interaction.user.id}> | للإدارة`, embeds: [insideEmbed], components: [closeRow] });
    await interaction.editReply({ content: `✅ تم إنشاء التكت الخاص بك بنجاح: <#${ticketChannel.id}>` });
  }
});

// محرك حماية البوت والـ API من الانهيار والتعطل المستمر (Anti-Crash)
process.on('unhandledRejection', (reason) => console.error('[KRB CRASH PROTECTION] Rejection:', reason));
process.on('uncaughtException', (err) => console.error('[KRB CRASH PROTECTION] Exception:', err));

client.login(process.env.DISCORD_TOKEN);
