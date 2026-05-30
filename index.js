const { Client, GatewayIntentBits } = require("discord.js");
const {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  AudioPlayerStatus,
  StreamType,
  VoiceConnectionStatus,
  entersState
} = require("@discordjs/voice");

const prism = require("prism-media");
const ffmpegPath = require("ffmpeg-static");
const fs = require("fs");
require("dotenv").config();

const TOKEN = process.env.DISCORD_TOKEN;
const VOICE_CHANNEL_ID = "750112204216598579";
const AUDIO_FILE = "./entrada.mp3";

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates
  ]
});

let tocando = false;

client.once("clientReady", () => {
  console.log(`Bot online como ${client.user.tag}`);
});

client.on("voiceStateUpdate", async (oldState, newState) => {
  console.log(`Evento voz: user=${newState.member?.id} old=${oldState.channelId} new=${newState.channelId}`);

  if (tocando) return;

  const entrouNoCanal =
    oldState.channelId !== VOICE_CHANNEL_ID &&
    newState.channelId === VOICE_CHANNEL_ID;

  if (!entrouNoCanal) return;

  try {
    console.log("Usuário entrou no canal configurado.");

    if (!fs.existsSync(AUDIO_FILE)) {
      console.error(`Arquivo não encontrado: ${AUDIO_FILE}`);
      return;
    }

    tocando = true;

    const connection = joinVoiceChannel({
      channelId: VOICE_CHANNEL_ID,
      guildId: newState.guild.id,
      adapterCreator: newState.guild.voiceAdapterCreator,
      selfDeaf: false,
      selfMute: false
    });

    
    console.log("Bot conectado na call.");

    const player = createAudioPlayer();

    const ffmpeg = new prism.FFmpeg({
      executable: ffmpegPath,
      args: [
        "-i", AUDIO_FILE,
        "-analyzeduration", "0",
        "-loglevel", "0",
        "-f", "s16le",
        "-ar", "48000",
        "-ac", "2"
      ]
    });

    const resource = createAudioResource(ffmpeg, {
      inputType: StreamType.Raw
    });

    connection.subscribe(player);
    player.play(resource);

    console.log("Comando para tocar enviado.");

    player.on(AudioPlayerStatus.Playing, () => {
      console.log("Áudio tocando agora.");
    });

    player.on(AudioPlayerStatus.Idle, () => {
      console.log("Áudio finalizado.");
      connection.destroy();
      tocando = false;
    });

    player.on("error", (error) => {
      console.error("Erro no player:", error);
      connection.destroy();
      tocando = false;
    });

  } catch (error) {
    console.error("Erro geral:", error);
    tocando = false;
  }
});

client.login(TOKEN);
