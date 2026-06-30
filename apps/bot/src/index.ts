import { Client, GatewayIntentBits, Partials, Events } from 'discord.js';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { CacheManager } from './database/CacheManager';
import { AntiNukeEngine } from './engines/AntiNukeEngine';
import { AntiSpamEngine } from './engines/AntiSpamEngine';
import { onGuildMemberAdd } from './events/guildMemberAdd';
import { onInteractionCreate } from './events/interactionCreate';

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
  
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/securitybot');
    console.log('[DATABASE] Successfully connected to MongoDB.');
    CacheManager.getInstance();
  } catch (error) {
    console.error('[CRITICAL INIT ERROR] Failed to initialize core systems:', error);
  }
});

// [ANTI-NUKE] تم التعديل هنا لحل مشكلة التايب سكريبت بشكل كامل وآمن
client.on(Events.ChannelDelete, async (channel) => {
  if ('guild' in channel && channel.guild) {
    await antiNuke.handleChannelDelete(channel.guild, channel);
  }
});

client.on(Events.MessageCreate, async (message) => {
  if (!message.guild || message.author.bot) return;
  await antiSpam.handleIncomingMessage(message);
});

client.on(Events.GuildMemberAdd, async (member) => {
  await onGuildMemberAdd(member);
});

client.on(Events.InteractionCreate, async (interaction) => {
  await onInteractionCreate(interaction);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[ANTI-CRASH] Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('[ANTI-CRASH] Uncaught Exception caught:', err);
});

client.login(process.env.DISCORD_TOKEN);
