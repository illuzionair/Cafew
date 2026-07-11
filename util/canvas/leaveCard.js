const { createCanvas, loadImage } = require('@napi-rs/canvas');

const C = {
  bg1:    '#2C1005',
  bg2:    '#3A1208',
  border: '#A0401A',
  gold:   '#C8922A',
  title:  '#E07050',
  name:   '#F5E6C8',
  sub:    '#C4A080',
  muted:  '#8A6040',
};

async function generateLeaveCard(member, client) {
  const W = 900, H = 280;
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext('2d');

  // Fond brun foncé rougeatre café
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, C.bg1);
  bg.addColorStop(1, C.bg2);
  ctx.fillStyle = bg;
  ctx.beginPath();
  ctx.roundRect(0, 0, W, H, 20);
  ctx.fill();

  // Bordure
  ctx.strokeStyle = C.border;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.roundRect(2, 2, W - 4, H - 4, 18);
  ctx.stroke();

  // Avatar assombri
  const avatarURL = member.user.displayAvatarURL({ extension: 'png', size: 256 });
  const avatar = await loadImage(avatarURL);
  ctx.save();
  ctx.beginPath();
  ctx.arc(140, 140, 90, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();
  ctx.drawImage(avatar, 50, 50, 180, 180);
  ctx.globalAlpha = 0.4;
  ctx.fillStyle = '#1A0800';
  ctx.fillRect(50, 50, 180, 180);
  ctx.globalAlpha = 1;
  ctx.restore();

  // Anneau avatar
  ctx.strokeStyle = C.border;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(140, 140, 92, 0, Math.PI * 2);
  ctx.stroke();

  // Séparateur vertical
  ctx.strokeStyle = C.border + '55';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(258, 40);
  ctx.lineTo(258, H - 40);
  ctx.stroke();

  // Titre
  ctx.fillStyle = C.title;
  ctx.font = 'bold 24px sans-serif';
  ctx.fillText('✦  AU REVOIR  ✦', 290, 78);

  // Nom
  ctx.fillStyle = C.name;
  ctx.font = 'bold 38px sans-serif';
  ctx.fillText(member.user.username, 290, 135);

  // Sous-titre
  ctx.fillStyle = C.sub;
  ctx.font = '22px sans-serif';
  ctx.fillText('vient de quitter le serveur', 290, 178);

  // Membres restants
  ctx.fillStyle = C.muted;
  ctx.font = '19px sans-serif';
  ctx.fillText(`Il reste ${member.guild.memberCount} membres`, 290, 215);

  // Ligne déco bas
  const deco = ctx.createLinearGradient(290, 0, 870, 0);
  deco.addColorStop(0, C.border);
  deco.addColorStop(1, 'transparent');
  ctx.fillStyle = deco;
  ctx.fillRect(290, 238, 560, 2);

  return canvas.toBuffer('image/png');
}

module.exports = { generateLeaveCard };
