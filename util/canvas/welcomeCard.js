const { createCanvas, loadImage } = require('@napi-rs/canvas');

const C = {
  bg1:    '#2C1A0E',
  bg2:    '#3D2410',
  border: '#C8922A',
  gold:   '#C8922A',
  title:  '#E8B84B',
  name:   '#F5E6C8',
  sub:    '#D4B483',
  muted:  '#9E7D55',
};

async function generateWelcomeCard(member, client) {
  const W = 900, H = 280;
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext('2d');

  // Fond brun café
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, C.bg1);
  bg.addColorStop(1, C.bg2);
  ctx.fillStyle = bg;
  ctx.beginPath();
  ctx.roundRect(0, 0, W, H, 20);
  ctx.fill();

  // Bordure or
  ctx.strokeStyle = C.border;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.roundRect(2, 2, W - 4, H - 4, 18);
  ctx.stroke();

  // Avatar
  const avatarURL = member.user.displayAvatarURL({ extension: 'png', size: 256 });
  const avatar = await loadImage(avatarURL);
  ctx.save();
  ctx.beginPath();
  ctx.arc(140, 140, 90, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();
  ctx.drawImage(avatar, 50, 50, 180, 180);
  ctx.restore();

  // Anneau avatar or
  ctx.strokeStyle = C.gold;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(140, 140, 92, 0, Math.PI * 2);
  ctx.stroke();

  // Séparateur vertical
  ctx.strokeStyle = C.gold + '55';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(258, 40);
  ctx.lineTo(258, H - 40);
  ctx.stroke();

  // Titre
  ctx.fillStyle = C.title;
  ctx.font = 'bold 24px sans-serif';
  ctx.fillText('✦  BIENVENUE  ✦', 290, 78);

  // Nom
  ctx.fillStyle = C.name;
  ctx.font = 'bold 38px sans-serif';
  ctx.fillText(member.user.username, 290, 135);

  // Membre #
  ctx.fillStyle = C.sub;
  ctx.font = '22px sans-serif';
  ctx.fillText(`Membre #${member.guild.memberCount}`, 290, 178);

  // Nom du serveur
  ctx.fillStyle = C.muted;
  ctx.font = '19px sans-serif';
  ctx.fillText(`sur ${member.guild.name}`, 290, 215);

  // Ligne déco bas
  const deco = ctx.createLinearGradient(290, 0, 870, 0);
  deco.addColorStop(0, C.gold);
  deco.addColorStop(1, 'transparent');
  ctx.fillStyle = deco;
  ctx.fillRect(290, 238, 560, 2);

  return canvas.toBuffer('image/png');
}

module.exports = { generateWelcomeCard };
