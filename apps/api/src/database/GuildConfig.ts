import { Schema, model, models } from 'mongoose';

const GuildConfigSchema = new Schema({
  guildId: { type: String, required: true, unique: true },
  trustedUsers: { type: [String], default: [] },
  trustedRoles: { type: [String], default: [] },
  whitelist: { type: [String], default: [] },
  antiSpam: {
    words: { enabled: Boolean, list: [String], regexEnabled: Boolean, punishment: Object },
    links: { enabled: Boolean, allowedChannels: [String], punishment: Object },
    messages: { enabled: Boolean, max: Number, window: Number, punishment: Object }
  },
  botProtection: {
    allowedReviewers: { type: [String], default: [] },
    allowedRoles: { type: [String], default: [] },
    verifiedRole: String
  }
});

export const GuildConfig = models.GuildConfig || model('GuildConfig', GuildConfigSchema);
