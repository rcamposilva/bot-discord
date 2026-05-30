const { Client, GatewayIntentBits } = require("discord.js");
const {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  AudioPlayerStatus,
  entersState,
  VoiceConnectionStatus
} = require("@discordjs/voice");

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
  if (tocando) return;

  const userEntrou =
    oldState.channelId !== VOICE_CHANNEL_ID &&
    newState.channelId === VOICE_CHANNEL_ID;

  const usuarioCorreto = newState.member?.id === USER_ID;

  if (!userEntrou || !usuarioCorreto) return;

  try {
    tocando = true;

    console.log(`Usuário ${newState.member.user.tag} entrou na call.`);

    const connection = joinVoiceChannel({
      channelId: VOICE_CHANNEL_ID,
      guildId: newState.guild.id,
      adapterCreator: newState.guild.voiceAdapterCreator,
      selfDeaf: false
    });

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

    player.play(resource);

    console.log("Tocando áudio...");

    player.on(AudioPlayerStatus.Idle, () => {
      console.log("Áudio finalizado.");
      connection.destroy();
      tocando = false;
    });

    player.on("error", (error) => {
      console.error("Erro ao tocar áudio:", error);
      connection.destroy();
      tocando = false;
    });

  } catch (error) {
    console.error("Erro geral:", error);
    tocando = false;
  }
});

client.login(TOKEN);
