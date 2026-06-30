import { Client, GatewayIntentBits, Partials, Events } from 'discord.js';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { CacheManager } from './database/CacheManager';
import { AntiNukeEngine } from './engines/AntiNukeEngine';
import { AntiSpamEngine } from './engines/AntiSpamEngine';
import { onGuildMemberAdd, onInteractionCreate } from './events/guildMemberAdd';

dotenv.config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildModeration
  ],
  partials: [Partials.Message, Partials.Channel, Partials.GuildMember]
});

const antiNuke = new AntiNukeEngine();
const antiSpam = new AntiSpamEngine();

client.once(Events.ClientReady, async (c) => {
  console.log(`[KRB SYSTEM] Active and logged in as ${c.user.tag}`);
  
  // الاتصال بقواعد البيانات
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/securitybot');
  console.log('[DATABASE] Connected to MongoDB.');
});

// ربط أحداث الحماية ضد التخريب (Anti-Nuke)
client.on(Events.ChannelDelete, async (channel) => {
  if (channel.isDMC()) return;
  await antiNuke.handleChannelDelete(channel.guild, channel);
});

// ربط أحداث الحماية ضد السخام والكلمات الممنوعة (Anti-Spam)
client.on(Events.MessageCreate, async (message) => {
  if (!message.guild || message.author.bot) return;
  await antiSpam.handleIncomingMessage(message);
});

// ربط نظام حماية البوتات والـ Buttons للـ Verification
client.on(Events.GuildMemberAdd, async (member) => {
  await onGuildMemberAdd(member);
});

client.on(Events.InteractionCreate, async (interaction) => {
  await onInteractionCreate(interaction);
});

client.login(process.env.DISCORD_TOKEN);
