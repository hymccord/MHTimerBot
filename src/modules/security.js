import { PermissionsBitField } from 'discord.js';
/**
 * Checks the permissions of the member to see if they're at the minimum level
 * @param {GuildMember} member Guild member to confirm permissions for
 * @param {'admin'|'mod'} level Minimum level required ('admin' or 'mod')
 * @returns {boolean} Whether the user is at that level or higher
 */
function checkPerms(member, level) {
    if (!member || !level || !member.guild || !member.id || !('client' in member)) return false;
    const guild = member.guild;
    let authCheck = false;
    if (member.id === member.client.settings.owner)
        authCheck = true;
    if (!authCheck && ((level === 'admin') || (level === 'mod'))) {
        if ('adminrole' in member.client.settings.guilds[guild.id]) {
            authCheck = member.roles.cache.some(role => role.name === member.client.settings.guilds[guild.id].adminrole);
        } else {
            authCheck = member.permissions.has(PermissionsBitField.Flags.Administrator);
        }
    }
    if (!authCheck && (level === 'mod')) {
        if ('modrole' in member.client.settings.guilds[guild.id]) {
            authCheck = member.roles.cache.some(role => role.name === member.client.settings.guilds[guild.id].modrole);
        } else {
            authCheck = member.permissions.has(PermissionsBitField.Flags.ManageMessages);
        }
    }
    return authCheck;
}

export {
    checkPerms,
};
