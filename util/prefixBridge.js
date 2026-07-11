/**
 * prefixBridge.js
 * Crée un faux objet "interaction" compatible discord.js v14
 * depuis un message prefix, pour exécuter les slash commands avec le prefix.
 */

function parseOptions(args, data) {
  const opts = {};
  const subcommands = data?.options?.filter(o => o.type === 1 || o.type === 2) || [];
  const topOptions  = data?.options?.filter(o => o.type !== 1 && o.type !== 2) || [];

  let subcommand = null;
  let remainingArgs = [...args];

  if (subcommands.length > 0 && remainingArgs[0]) {
    const match = subcommands.find(s => s.name === remainingArgs[0].toLowerCase());
    if (match) {
      subcommand = match.name;
      remainingArgs.shift();
      const subOpts = match.options || [];
      subOpts.forEach((opt, i) => { opts[opt.name] = remainingArgs[i] ?? null; });
    }
  } else {
    topOptions.forEach((opt, i) => { opts[opt.name] = remainingArgs[i] ?? null; });
  }

  return { opts, subcommand };
}

async function resolveMember(guild, val) {
  if (!val) return null;
  const id = val.replace(/[<@!>]/g, '');
  if (!/^\d+$/.test(id)) return null;
  return guild.members.fetch(id).catch(() => null);
}

async function resolveUser(guild, val) {
  const member = await resolveMember(guild, val);
  return member?.user ?? null;
}

function resolveChannel(guild, val) {
  if (!val) return null;
  const id = val.replace(/[<#>]/g, '');
  return guild.channels.cache.get(id) ?? null;
}

function resolveRole(guild, val) {
  if (!val) return null;
  const id = val.replace(/[<@&>]/g, '');
  if (!/^\d+$/.test(id)) return null;
  return guild.roles.cache.get(id) ?? null;
}

async function createFakeInteraction(message, args, slashCmd) {
  const data = slashCmd.data;
  const { opts, subcommand } = parseOptions(
    args,
    data?.options ? { options: data.options.map(o => o.toJSON ? o.toJSON() : o) } : {}
  );
  const guild = message.guild;

  const resolved = { ...opts };

  let replied  = false;
  let deferred = false;
  let replyMsg = null;

  const fakeInteraction = {
    user:             message.author,
    member:           message.member,
    guild,
    channel:          message.channel,
    channelId:        message.channel.id,
    guildId:          guild.id,
    client:           message.client,
    commandName:      data.name,
    replied,
    deferred,
    createdTimestamp: message.createdTimestamp,

    options: {
      _opts:       resolved,
      _subcommand: subcommand,
      _cache:      {},
      getSubcommand: () => subcommand,
      getString:   (name) => resolved[name] ?? null,
      getInteger:  (name) => resolved[name] != null ? parseInt(resolved[name])   : null,
      getNumber:   (name) => resolved[name] != null ? parseFloat(resolved[name]) : null,
      getBoolean:  (name) => resolved[name] === 'true' || resolved[name] === 'oui',
      // Versions sync — remplacées après le cache
      getMember:  (name) => null,
      getUser:    (name) => null,
      getChannel: (name) => null,
      getRole:    (name) => null,
    },

    isChatInputCommand: () => true,
    isButton:           () => false,
    isSelectMenu:       () => false,

    reply: async (options) => {
      if (replied || deferred) return fakeInteraction.editReply(options);
      replied = true;
      fakeInteraction.replied = true;
      const payload = typeof options === 'string' ? { content: options } : { ...options };
      delete payload.ephemeral;
      replyMsg = await message.reply(payload).catch(() => message.channel.send(payload));
      return replyMsg;
    },

    deferReply: async () => {
      deferred = true;
      fakeInteraction.deferred = true;
      replyMsg = await message.channel.send('⏳ Chargement...').catch(() => null);
      return replyMsg;
    },

    editReply: async (options) => {
      const payload = typeof options === 'string' ? { content: options } : { ...options };
      delete payload.ephemeral;
      if (replyMsg) {
        await replyMsg.edit(payload).catch(async () => {
          replyMsg = await message.channel.send(payload).catch(() => null);
        });
      } else {
        replyMsg = await message.channel.send(payload).catch(() => null);
      }
      return replyMsg;
    },

    followUp: async (options) => {
      const payload = typeof options === 'string' ? { content: options } : { ...options };
      delete payload.ephemeral;
      return message.channel.send(payload).catch(() => null);
    },

    deleteReply: async () => {
      if (replyMsg) await replyMsg.delete().catch(() => {});
    },

    showModal: async () => {
      return message.reply(
        `⚠️ Cette commande nécessite un menu interactif. Utilise la slash command \`/${data.name}\` à la place.`
      ).catch(() => {});
    },
  };

  // ── Pré-résolution asynchrone de toutes les options ──
  for (const [key, val] of Object.entries(resolved)) {
    if (!val) continue;

    // Membre / User  —  <@id>, <@!id>, ou id brut
    if (/^(<@!?\d+>|\d{17,20})$/.test(val)) {
      const member = await resolveMember(guild, val).catch(() => null);
      if (member) {
        fakeInteraction.options._cache[key]           = { member, user: member.user };
        fakeInteraction.options._cache[key + '_user'] = member.user;
      }
    }

    // Channel  —  <#id>
    if (val.startsWith('<#')) {
      const ch = resolveChannel(guild, val);
      if (ch) fakeInteraction.options._cache[key + '_ch'] = ch;
    }

    // Role  —  <@&id> ou id brut précédé de @&
    if (/^<@&\d+>$/.test(val) || /^\d{17,20}$/.test(val)) {
      const role = resolveRole(guild, val);
      if (role) fakeInteraction.options._cache[key + '_role'] = role;
    }
  }

  // ── Accesseurs sync finaux ──
  fakeInteraction.options.getMember  = (name) => fakeInteraction.options._cache[name]?.member    ?? null;
  fakeInteraction.options.getUser    = (name) => fakeInteraction.options._cache[name + '_user']  ??
                                                  fakeInteraction.options._cache[name]?.user      ?? null;
  fakeInteraction.options.getChannel = (name) => fakeInteraction.options._cache[name + '_ch']    ?? null;
  fakeInteraction.options.getRole    = (name) => fakeInteraction.options._cache[name + '_role']  ?? null;

  return fakeInteraction;
}

module.exports = { createFakeInteraction };
