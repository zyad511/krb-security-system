import { Schema, model, Document } from 'mongoose';

export type PunishmentType = 'IGNORE' | 'DELETE_MESSAGE' | 'WARN' | 'TIMEOUT' | 'KICK' | 'BAN' | 'REMOVE_ROLES' | 'LOCK_CHANNEL';

export interface IPunishment {
  type: PunishmentType[];
  duration?: number; // بالدقائق للـ Timeout أو القفل
  reason: string;
  deleteMessageDays?: number;
}

export interface IAntiNukeLimit {
  enabled: boolean;
  maxActions: number;
  windowSeconds: number;
  punishment: IPunishment;
}

export interface IGuildConfig extends Document {
  guildId: string;
  prefix: string;
  trustedRoles: string[];
  trustedUsers: string[];
  whitelist: string[];
  blacklist: string[];
  
  antiNuke: {
    channelDelete: IAntiNukeLimit;
    channelCreate: IAntiNukeLimit;
    roleDelete: IAntiNukeLimit;
    roleCreate: IAntiNukeLimit;
    webhookCreate: IAntiNukeLimit;
    guildUpdate: IAntiNukeLimit;
  };

  antiSpam: {
    messages: { enabled: boolean; max: number; window: number; punishment: IPunishment };
    links: { enabled: boolean; punishment: IPunishment; allowedChannels: string[]; allowedRoles: string[] };
    words: { enabled: boolean; list: string[]; regexEnabled: boolean; punishment: IPunishment };
  };

  botProtection: {
    enabled: boolean;
    verificationChannel: string;
    allowedReviewers: string[];
    allowedRoles: string[];
    verifiedRole: string;
  };

  tickets: {
    enabled: boolean;
    category: string;
    logChannel: string;
    limit: number;
  };

  logs: {
    messageDelete?: string;
    memberJoin?: string;
    securityLogs?: string;
  };
}

const PunishmentSchema = new Schema({
  type: { type: [String], required: true },
  duration: { type: Number, default: 0 },
  reason: { type: String, default: 'Violating Server Security Policies' },
  deleteMessageDays: { type: Number, default: 0 }
});

const LimitSchema = new Schema({
  enabled: { type: Boolean, default: false },
  maxActions: { type: Number, default: 3 },
  windowSeconds: { type: Number, default: 10 },
  punishment: { type: PunishmentSchema, required: true }
});

const GuildConfigSchema = new Schema<IGuildConfig>({
  guildId: { type: String, required: true, unique: true },
  prefix: { type: String, default: '!' },
  trustedRoles: { type: [String], default: [] },
  trustedUsers: { type: [String], default: [] },
  whitelist: { type: [String], default: [] },
  blacklist: { type: [String], default: [] },
  antiNuke: {
    channelDelete: { type: LimitSchema },
    channelCreate: { type: LimitSchema },
    roleDelete: { type: LimitSchema },
    roleCreate: { type: LimitSchema },
    webhookCreate: { type: LimitSchema },
    guildUpdate: { type: LimitSchema }
  },
  antiSpam: {
    messages: {
      enabled: { type: Boolean, default: false },
      max: { type: Number, default: 5 },
      window: { type: Number, default: 3 },
      punishment: { type: PunishmentSchema }
    },
    links: {
      enabled: { type: Boolean, default: false },
      punishment: { type: PunishmentSchema },
      allowedChannels: { type: [String], default: [] },
      allowedRoles: { type: [String], default: [] }
    },
    words: {
      enabled: { type: Boolean, default: false },
      list: { type: [String], default: [] },
      regexEnabled: { type: Boolean, default: false },
      punishment: { type: PunishmentSchema }
    }
  },
  botProtection: {
    enabled: { type: Boolean, default: false },
    verificationChannel: { type: String, default: '' },
    allowedReviewers: { type: [String], default: [] },
    allowedRoles: { type: [String], default: [] },
    verifiedRole: { type: String, default: '' }
  },
  tickets: {
    enabled: { type: Boolean, default: false },
    category: { type: String, default: '' },
    logChannel: { type: String, default: '' },
    limit: { type: Number, default: 5 }
  },
  logs: {
    messageDelete: { type: String, default: '' },
    memberJoin: { type: String, default: '' },
    securityLogs: { type: String, default: '' }
  }
});

export const GuildConfig = model<IGuildConfig>('GuildConfig', GuildConfigSchema);
