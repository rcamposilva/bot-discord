const { Client, GatewayIntentBits } = require("discord.js");
const {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  AudioPlayerStatus,
  VoiceConnectionStatus,
  entersState
} = require("@discordjs/voice");

const fs = require("fs");
require("dotenv").config();

const TOKEN = process.env.DISCORD_TOKEN;

const USER_ID = "335950828412076035";
const VOICE_CHANNEL_ID = "750112204216598579";
const AUDIO_FILE = "./entrada.mp3";

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates
  ]
});

let tocando = false;

client.once("ready", () => {
  console.log(`Bot online como ${client.user.tag}`);
});

client.on("voiceStateUpdate", async (oldState, newState) => {
  try {
    if (tocando) return;

    const usuarioCorreto = newState.member?.id === USER_ID;
    const entrouNoCanal =
      oldState.channelId !== VOICE_CHANNEL_ID &&
      newState.channelId === VOICE_CHANNEL_ID;

    if (!usuarioCorreto || !entrouNoCanal) return;

    console.log("Usuário detectado entrando na call.");

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

    console.log("Conectando ao canal de voz...");

    await entersState(
      connection,
      VoiceConnectionStatus.Ready,
      30000
    );

    console.log("Conectado ao canal de voz.");

    const player = createAudioPlayer();

    const resource = createAudioResource(AUDIO_FILE, {
      inlineVolume: true
    });

    resource.volume.setVolume(1);

    connection.subscribe(player);

    console.log("Iniciando reprodução...");

    player.play(resource);

    player.on(AudioPlayerStatus.Playing, () => {
      console.log("Áudio tocando.");
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

    connection.on("error", (error) => {
      console.error("Erro na conexão:", error);
      tocando = false;
    });

  } catch (error) {
    console.error("Erro geral:", error);
    tocando = false;
  }
});

client.login(TOKEN);
