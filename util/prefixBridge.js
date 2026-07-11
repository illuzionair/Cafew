/**
 * prefixBridge.js
 * Crée un faux objet "interaction" compatible discord.js v14
 * depuis un message prefix, pour exécuter les slash commands avec le prefix.
 */

function parseOptions(args, data) {
  const opts = {};
  const subcommands = data?.options?.filter(o => o.type === 1 || o.type === 2) || []; // SUB_COMMAND
  const topOptions  = data?.options?.filter(o => o.type !== 1 && o.type !== 2) || [];

  let subcommand = null;
  let remainingArgs = [...args];

  // Détecte si le 1er arg est un sous-commande
  if (subcommands.length > 0 && remainingArgs[0]) {
    const match = subcommands.find(s => s.name === remainingArgs[0].toLowerCase());
    if (match) {
      subcommand = match.name;
      remainingArgs.shift();
      // Options du sous-commande
      const subOpts = match.options || [];
      subOpts.forEach((opt, i) => {
        opts[opt.name] = remainingArgs[i] ?? null;
      });
    }
  } else {
    topOptions.forEach((opt, i) => {
      opts[opt.name] = remainingArgs[i] ?? null;
    });
  }

  return { opts, subcommand };
}

async function resolveMember(guild, val) {
  if (!val) return null;
  const id = val.replace(/[<@!>]/g, '');
  return guild.members.fetch(id).catch(() => null);
}

async function resolveUser(guild, val) {
  const member = await resolveMember(guild, val);
  return member?.user ?? null;
}

async function resolveChannel(guild, val) {
  if (!val) return null;
  const id = val.replace(/[<#>]/g, '');
  return guild.channels.cache.get(id) ?? null;
}

async function resolveRole(guild, val) {
  if (!val) return null;
  const id = val.replace(/[<@&>]/g, '');
  return guild.roles.cache.get(id) ?? null;
}

/**
 * Crée le faux objet interaction.
 */
async function createFakeInteraction(message, args, slashCmd) {
  const data = slashCmd.data;
  const { opts, subcommand } = parseOptions(args, data?.options ? { options: data.options.map(o => o.toJSON ? o.toJSON() : o) } : {});
  const guild = message.guild;

  // Résout les options async (membres, users, channels)
  const resolved = {};
  for (const [key, val] of Object.entries(opts)) {
    resolved[key] = val;
  }

  let replied = false;
  let deferred = false;
  let replyMsg = null;

  const fakeInteraction = {
    // Propriétés de base
    user: message.author,
    member: message.member,
    guild,
    channel: message.channel,
    channelId: message.channel.id,
    guildId: guild.id,
    client: message.client,
    commandName: data.name,
    replied,
    deferred,
    createdTimestamp: message.createdTimestamp,

    // Options
    options: {
      _opts: resolved,
      _subcommand: subcommand,
      getSubcommand: () => subcommand,
      getString:  (name) => resolved[name] ?? null,
      getInteger: (name) => resolved[name] != null ? parseInt(resolved[name]) : null,
      getNumber:  (name) => resolved[name] != null ? parseFloat(resolved[name]) : null,
      getBoolean: (name) => resolved[name] === 'true' || resolved[name] === 'oui',
      getUser:    async (name) => resolveUser(guild, resolved[name]),
      getMember:  async (name) => resolveMember(guild, resolved[name]),
      getChannel: async (name) => resolveChannel(guild, resolved[name]),
      getRole:    async (name) => resolveRole(guild, resolved[name]),
      // Versions sync (compatibilité -- retournent null si pas encore résolu)
      _cache: {},
    },

    isChatInputCommand: () => true,
    isButton: () => false,
    isSelectMenu: () => false,

    // reply
    reply: async (options) => {
      if (replied || deferred) return fakeInteraction.editReply(options);
      replied = true;
      fakeInteraction.replied = true;
      const content = typeof options === 'string' ? options : null;
      const payload = typeof options === 'string' ? { content: options } : { ...options };
      delete payload.ephemeral; // pas d'ephemeral en prefix
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
      return message.reply('⚠️ Cette commande nécessite un menu interactif, utilise la slash command `/' + data.name + '` à la place.').catch(() => {});
    },
  };

  // Patch options async : getMember/getUser/getChannel retournent des promesses
  // mais certaines commandes les appellent sans await -> on les rend aussi sync via cache
  const origGetMember = fakeInteraction.options.getMember.bind(fakeInteraction.options);
  const origGetUser   = fakeInteraction.options.getUser.bind(fakeInteraction.options);
  const origGetChannel = fakeInteraction.options.getChannel.bind(fakeInteraction.options);

  // Pré-résoudre toutes les options de type USER/MEMBER/CHANNEL
  for (const [key, val] of Object.entries(resolved)) {
    if (!val) continue;
    if (val.startsWith('<@') || /^\d{17,20}$/.test(val)) {
      const member = await resolveMember(guild, val).catch(() => null);
      if (member) {
        fakeInteraction.options._cache[key] = { member, user: member.user };
      }
    } else if (val.startsWith('<#')) {
      const ch = await resolveChannel(guild, val).catch(() => null);
      if (ch) fakeInteraction.options._cache[key + '_ch'] = ch;
    }
  }

  // Remplace getMember/getUser/getChannel par des versions sync qui utilisent le cache
  fakeInteraction.options.getMember  = (name) => fakeInteraction.options._cache[name]?.member ?? null;
  fakeInteraction.options.getUser    = (name) => fakeInteraction.options._cache[name]?.user ?? null;
  fakeInteraction.options.getChannel = (name) => fakeInteraction.options._cache[name + '_ch'] ?? null;

  return fakeInteraction;
}

module.exports = { createFakeInteraction };
