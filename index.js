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

const USER_ID = "362029431021109270";
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

  const userEntrou = oldState.channelId !== VOICE_CHANNEL_ID && newState.channelId === VOICE_CHANNEL_ID;
  const usuarioCorreto = newState.member?.id === USER_ID;

  if (!userEntrou || !usuarioCorreto) return;

  try {
    tocando = true;

    const connection = joinVoiceChannel({
      channelId: VOICE_CHANNEL_ID,
      guildId: newState.guild.id,
      adapterCreator: newState.guild.voiceAdapterCreator
    });

    await entersState(connection, VoiceConnectionStatus.Ready, 15000);

    const player = createAudioPlayer();
    const resource = createAudioResource(AUDIO_FILE);

    connection.subscribe(player);
    player.play(resource);

    player.on(AudioPlayerStatus.Idle, () => {
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
