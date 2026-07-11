const { createCanvas, loadImage } = require('@napi-rs/canvas');

const C = {
  bg1:    '#1A0A0A',
  bg2:    '#2C1010',
  border: '#8B2020',
  accent: '#C0392B',
  title:  '#E57373',
  name:   '#F5E6C8',
  sub:    '#C49A9A',
  muted:  '#8A6060',
};

async function generateLeaveCard(member, client) {
  const W = 900, H = 280;
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext('2d');

  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, C.bg1);
  bg.addColorStop(1, C.bg2);
  ctx.fillStyle = bg;
  ctx.beginPath();
  ctx.roundRect(0, 0, W, H, 20);
  ctx.fill();

  ctx.strokeStyle = C.border;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.roundRect(2, 2, W - 4, H - 4, 18);
  ctx.stroke();

  ctx.fillStyle = C.accent;
  ctx.beginPath();
  ctx.roundRect(0, 0, 6, H, [20, 0, 0, 20]);
  ctx.fill();

  const avatarURL = member.user.displayAvatarURL({ extension: 'png', size: 256 });
  const avatar = await loadImage(avatarURL);
  ctx.save();
  ctx.beginPath();
  ctx.arc(140, 140, 90, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();
  ctx.drawImage(avatar, 50, 50, 180, 180);
  ctx.globalAlpha = 0.45;
  ctx.fillStyle = '#000000';
  ctx.fillRect(50, 50, 180, 180);
  ctx.globalAlpha = 1;
  ctx.restore();

  ctx.strokeStyle = C.accent;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(140, 140, 92, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = C.border + '55';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(255, 40);
  ctx.lineTo(255, H - 40);
  ctx.stroke();

  ctx.fillStyle = C.title;
  ctx.font = 'bold 24px sans-serif';
  ctx.fillText('✦  AU REVOIR  ✦', 290, 78);

  ctx.fillStyle = C.name;
  ctx.font = 'bold 38px sans-serif';
  ctx.fillText(member.user.username, 290, 135);

  ctx.fillStyle = C.sub;
  ctx.font = '22px sans-serif';
  ctx.fillText('vient de quitter le serveur', 290, 175);

  ctx.fillStyle = C.muted;
  ctx.font = '19px sans-serif';
  ctx.fillText(`Il reste ${member.guild.memberCount} membres`, 290, 215);

  const deco = ctx.createLinearGradient(290, 0, 880, 0);
  deco.addColorStop(0, C.accent);
  deco.addColorStop(1, 'transparent');
  ctx.fillStyle = deco;
  ctx.fillRect(290, 235, 560, 2);

  return canvas.toBuffer('image/png');
}

module.exports = { generateLeaveCard };
