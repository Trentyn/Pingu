import {Client, Guild} from 'discord.js';
import container from '../inversify.config.js';
import Command from '../commands';
import {TYPES} from '../types.js';
import Config from '../services/config.js';
import {prisma} from '../utils/db.js';
import {REST} from '@discordjs/rest';
import {Setting} from '@prisma/client';
import registerCommandsOnGuild from '../utils/register-commands-on-guild.js';

export async function createGuildSettings(guild: Guild): Promise<Setting> {
  return prisma.setting.upsert({
    where: {
      guildId: guild.id,
    },
    create: {
      guildId: guild.id,
    },
    update: {},
  });
}

export default async (guild: Guild): Promise<void> => {
  await createGuildSettings(guild);

  const config = container.get<Config>(TYPES.Config);

  // Setup slash commands
  if (!config.REGISTER_COMMANDS_ON_BOT) {
    const client = container.get<Client>(TYPES.Client);

    const rest = new REST({version: '10'}).setToken(config.DISCORD_TOKEN);

    await registerCommandsOnGuild({
      rest,
      applicationId: client.user!.id,
      guildId: guild.id,
      commands: container.getAll<Command>(TYPES.Command).map(command => command.slashCommand),
    });
  }

  const owner = await guild.fetchOwner();
  await owner.send('👋 Hi! Thank you for adding me to your server! Enjoy and tell your friends about me! Invite link - https://discord.com/api/oauth2/authorize?client_id=989899728823144468&permissions=8&scope=applications.commands%20bot');
};
