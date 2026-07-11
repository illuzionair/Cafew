const {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  AudioPlayerStatus,
  VoiceConnectionStatus,
  entersState,
  StreamType
} = require('@discordjs/voice');
const playdl = require('play-dl');

// Stations radio pré-définies
const STATIONS = [
  { name: '🎵 Lofi Hip-Hop',       value: 'lofi',      url: 'http://streams.ilovemusic.de/iloveradio17.mp3' },
  { name: '🎸 Rock Classic',        value: 'rock',      url: 'http://streaming.radio.co/s57eb8f2f5/listen' },
  { name: '🎷 Jazz FM',             value: 'jazz',      url: 'http://streaming.radio.co/s48ee7a35a/listen' },
  { name: '🎤 Hip-Hop 24/7',        value: 'hiphop',    url: 'http://streams.ilovemusic.de/iloveradio2.mp3' },
  { name: '🎹 Classical Music',     value: 'classical', url: 'http://streams.ilovemusic.de/iloveradio14.mp3' },
  { name: '🔥 Electro / House',     value: 'electro',   url: 'http://streams.ilovemusic.de/iloveradio.mp3' },
  { name: '🇫🇷 NRJ France',         value: 'nrj',       url: 'https://scdn.nrjaudio.fm/fr/30001/mp3_128.mp3' },
  { name: '🇫🇷 Skyrock',            value: 'skyrock',   url: 'http://icecast.skyrock.net/s/natio_mp3_128k' },
  { name: '🇫🇷 Fun Radio',          value: 'fun',       url: 'https://streaming.radio.funradio.fr/fun-1-44-128?listen=webAAC-128mp3' },
  { name: '🌊 Chill Synthwave',     value: 'synthwave', url: 'http://streams.ilovemusic.de/iloveradio21.mp3' },
];

// Gestionnaire par guild
const sessions = new Map(); // guildId → { connection, player, station, volume, textChannel }

async function getOrCreateSession(guild, voiceChannel, textChannel) {
  if (sessions.has(guild.id)) return sessions.get(guild.id);

  const connection = joinVoiceChannel({
    channelId: voiceChannel.id,
    guildId: guild.id,
    adapterCreator: guild.voiceAdapterCreator,
    selfDeaf: true,
  });

  await entersState(connection, VoiceConnectionStatus.Ready, 15_000);

  const player = createAudioPlayer();
  connection.subscribe(player);

  const session = { connection, player, station: null, volume: 100, textChannel };
  sessions.set(guild.id, session);

  connection.on(VoiceConnectionStatus.Disconnected, async () => {
    try {
      await Promise.race([
        entersState(connection, VoiceConnectionStatus.Signalling, 5_000),
        entersState(connection, VoiceConnectionStatus.Connecting, 5_000),
      ]);
    } catch {
      connection.destroy();
      sessions.delete(guild.id);
    }
  });

  return session;
}

async function playStation(guild, voiceChannel, textChannel, stationValue, customUrl = null) {
  const station = STATIONS.find(s => s.value === stationValue);
  const url = customUrl || (station ? station.url : null);
  if (!url) throw new Error('Station introuvable.');

  const session = await getOrCreateSession(guild, voiceChannel, textChannel);
  session.station = station || { name: '🎵 Custom', value: 'custom', url };

  const stream = await playdl.stream(url, { discordPlayerCompatibility: true }).catch(async () => {
    // Fallback : stream direct via http pour les radios mp3
    const { createReadStream } = require('fs');
    const https = require('https');
    const http = require('http');
    const mod = url.startsWith('https') ? https : http;
    return new Promise((resolve, reject) => {
      mod.get(url, res => resolve({ stream: res, type: StreamType.Arbitrary }));
    });
  });

  const resource = createAudioResource(stream.stream, {
    inputType: stream.type,
    inlineVolume: true,
  });
  resource.volume?.setVolume(session.volume / 100);
  session.player.play(resource);
  session.resource = resource;

  return session.station;
}

function stopStation(guildId) {
  const session = sessions.get(guildId);
  if (!session) return false;
  session.player.stop(true);
  session.connection.destroy();
  sessions.delete(guildId);
  return true;
}

function setVolume(guildId, vol) {
  const session = sessions.get(guildId);
  if (!session) return false;
  session.volume = Math.max(0, Math.min(200, vol));
  if (session.resource?.volume) session.resource.volume.setVolume(session.volume / 100);
  return true;
}

function getSession(guildId) {
  return sessions.get(guildId) || null;
}

module.exports = { STATIONS, playStation, stopStation, setVolume, getSession };
