const { createCanvas, loadImage } = require('@napi-rs/canvas');

async function generateWelcomeCard(member, client) {
  const canvas = createCanvas(900, 280);
  const ctx = canvas.getContext('2d');

  const gradient = ctx.createLinearGradient(0, 0, 900, 280);
  gradient.addColorStop(0, '#1a1a2e');
  gradient.addColorStop(1, '#16213e');
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.roundRect(0, 0, 900, 280, 20);
  ctx.fill();

  ctx.strokeStyle = client.config.color || '#5865F2';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.roundRect(2, 2, 896, 276, 18);
  ctx.stroke();

  ctx.fillStyle = client.config.color || '#5865F2';
  ctx.fillRect(0, 0, 6, 280);

  const avatarURL = member.user.displayAvatarURL({ extension: 'png', size: 256 });
  const avatar = await loadImage(avatarURL);
  ctx.save();
  ctx.beginPath();
  ctx.arc(140, 140, 90, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();
  ctx.drawImage(avatar, 50, 50, 180, 180);
  ctx.restore();

  ctx.strokeStyle = client.config.color || '#5865F2';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(140, 140, 92, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = client.config.color || '#5865F2';
  ctx.font = 'bold 26px sans-serif';
  ctx.fillText('BIENVENUE', 290, 80);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 36px sans-serif';
  ctx.fillText(member.user.username, 290, 135);

  ctx.fillStyle = '#aaaacc';
  ctx.font = '22px sans-serif';
  ctx.fillText(`Membre #${member.guild.memberCount}`, 290, 175);

  ctx.fillStyle = '#7289da';
  ctx.font = '20px sans-serif';
  ctx.fillText(`sur ${member.guild.name}`, 290, 215);

  return canvas.toBuffer('image/png');
}

module.exports = { generateWelcomeCard };
