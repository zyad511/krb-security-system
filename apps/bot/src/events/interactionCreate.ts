import { Interaction, EmbedBuilder } from 'discord.js';
// 🔗 استدعاء محلي مباشر وآمن 100% متوافق مع نظام الـ rootDir
import { client, whitelistedBots, SUPREME_OWNER_ID } from '../index'; 

client.on('interactionCreate', async (interaction: Interaction) => {
    if (!interaction.isButton()) return;
    
    // تفكيك معرفات أزرار الحماية والتحقق منها
    const [action, botId, guildId] = interaction.customId.split('_');
    if (action !== 'approve' && action !== 'reject') return;

    const guild = interaction.guild;
    if (!guild || guild.id !== guildId) return;

    // التحقق الصارم من هوية أبو عتب (SUPREME_OWNER_ID) أو مالك السيرفر
    const isOwner = guild.ownerId === interaction.user.id;
    const isSupreme = interaction.user.id === SUPREME_OWNER_ID;

    if (!isSupreme && !isOwner) {
        return interaction.reply({ content: '❌ هذا الزر مخصص للإدارة العليا لنظام KRB فقط.', ephemeral: true });
    }

    await interaction.deferUpdate();

    try {
        const targetBotMember = await guild.members.fetch(botId).catch(() => null);

        if (action === 'approve') {
            if (!targetBotMember) return;

            // إضافة البوت لقائمة السماح وفك العزل عنه فوراً
            whitelistedBots.add(botId);
            await targetBotMember.timeout(null, 'KRB Security: Approved via security button.').catch(() => {});
            
            const emb = new EmbedBuilder()
                .setTitle('✅ تم قبول وتوثيق البوت بنجاح')
                .setDescription(`تم فك العزل التام عن البوت <@${botId}> وتأكيده داخل السيرفر بأمر الإدارة.`)
                .addFields({ name: '👤 المسؤول التنفيذي', value: `${interaction.user}` })
                .setColor('#000000'); 
                
            await interaction.editReply({ embeds: [emb], components: [] });
        } else {
            // طرد البوت وتنظيف السيرفر فوراً في حال الرفض
            if (targetBotMember && targetBotMember.kickable) {
                await targetBotMember.kick('KRB Security: Rejected via security buttons.').catch(() => {});
            }
            
            const emb = new EmbedBuilder()
                .setTitle('❌ تم طرد ورفض البوت بنجاح')
                .setDescription(`تم ترحيل البوت المستهدف خارج حدود السيرفر وتطهير المنطقة بسلام.`)
                .addFields({ name: '👤 المسؤول التنفيذي', value: `${interaction.user}` })
                .setColor('#000000');
                
            await interaction.editReply({ embeds: [emb], components: [] });
        }
    } catch (err) { 
        console.error('[KRB BUTTON ERROR]', err); 
    }
});
