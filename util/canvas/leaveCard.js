const { createCanvas, loadImage } = require('@napi-rs/canvas');

async function generateLeaveCard(member, client) {
  const canvas = createCanvas(900, 280);
  const ctx = canvas.getContext('2d');

  const gradient = ctx.createLinearGradient(0, 0, 900, 280);
  gradient.addColorStop(0, '#1a0a0a');
  gradient.addColorStop(1, '#2d1010');
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.roundRect(0, 0, 900, 280, 20);
  ctx.fill();

  ctx.strokeStyle = '#e74c3c';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.roundRect(2, 2, 896, 276, 18);
  ctx.stroke();

  ctx.fillStyle = '#e74c3c';
  ctx.fillRect(0, 0, 6, 280);

  const avatarURL = member.user.displayAvatarURL({ extension: 'png', size: 256 });
  const avatar = await loadImage(avatarURL);
  ctx.save();
  ctx.beginPath();
  ctx.arc(140, 140, 90, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();
  ctx.drawImage(avatar, 50, 50, 180, 180);
  ctx.globalAlpha = 0.5;
  ctx.fillStyle = '#111111';
  ctx.fillRect(50, 50, 180, 180);
  ctx.globalAlpha = 1;
  ctx.restore();

  ctx.strokeStyle = '#e74c3c';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(140, 140, 92, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = '#e74c3c';
  ctx.font = 'bold 26px sans-serif';
  ctx.fillText('AU REVOIR', 290, 80);

  ctx.fillStyle = '#cccccc';
  ctx.font = 'bold 36px sans-serif';
  ctx.fillText(member.user.username, 290, 135);

  ctx.fillStyle = '#888888';
  ctx.font = '22px sans-serif';
  ctx.fillText('vient de quitter le serveur', 290, 175);

  ctx.fillStyle = '#555577';
  ctx.font = '20px sans-serif';
  ctx.fillText(`Il reste ${member.guild.memberCount} membres`, 290, 215);

  return canvas.toBuffer('image/png');
}

module.exports = { generateLeaveCard };
