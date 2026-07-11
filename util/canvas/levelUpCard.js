const { createCanvas, loadImage } = require('@napi-rs/canvas');

const C = {
  bg1:    '#2C1A0E',
  bg2:    '#3D2410',
  bg3:    '#4A2E14',
  border: '#C8922A',
  gold:   '#E8B84B',
  gold2:  '#C8922A',
  text:   '#F5E6C8',
  sub:    '#D4B483',
  muted:  '#9E7D55',
  dark:   '#1A0A00',
};

async function generateLevelUpCard(member, newLevel, grade) {
  const W = 900, H = 300;
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext('2d');

  // Fond
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, C.bg1);
  bg.addColorStop(0.5, C.bg3);
  bg.addColorStop(1, C.bg2);
  ctx.fillStyle = bg;
  ctx.beginPath();
  ctx.roundRect(0, 0, W, H, 20);
  ctx.fill();

  // Lueur centrale dorée
  const glow = ctx.createRadialGradient(W / 2, H / 2, 10, W / 2, H / 2, 300);
  glow.addColorStop(0, '#C8922A22');
  glow.addColorStop(1, 'transparent');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  // Bordure double
  ctx.strokeStyle = C.border;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.roundRect(2, 2, W - 4, H - 4, 18);
  ctx.stroke();
  ctx.strokeStyle = C.gold + '33';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(10, 10, W - 20, H - 20, 13);
  ctx.stroke();

  // Étoiles déco
  const stars = [
    [60, 40], [840, 40], [60, 260], [840, 260],
    [200, 25], [700, 25], [200, 275], [700, 275],
  ];
  ctx.fillStyle = C.gold + 'AA';
  ctx.font = '16px sans-serif';
  for (const [x, y] of stars) ctx.fillText('★', x, y);

  // Avatar
  const avatarURL = member.user.displayAvatarURL({ extension: 'png', size: 256 });
  const avatar = await loadImage(avatarURL);
  ctx.save();
  ctx.beginPath();
  ctx.arc(110, 150, 75, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();
  ctx.drawImage(avatar, 35, 75, 150, 150);
  ctx.restore();

  // Anneau or avatar
  ctx.strokeStyle = C.gold;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(110, 150, 77, 0, Math.PI * 2);
  ctx.stroke();

  // Anneau intérieur
  ctx.strokeStyle = C.gold + '44';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(110, 150, 85, 0, Math.PI * 2);
  ctx.stroke();

  // Séparateur
  ctx.strokeStyle = C.gold + '44';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(210, 40);
  ctx.lineTo(210, H - 40);
  ctx.stroke();

  // LEVEL UP!
  ctx.fillStyle = C.gold;
  ctx.font = 'bold 20px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('★  LEVEL UP !  ★', W / 2 + 60, 58);

  // Grand numéro de niveau
  ctx.font = 'bold 80px sans-serif';
  ctx.fillStyle = C.gold + '22';
  ctx.fillText(newLevel, W / 2 + 60, 185);
  ctx.fillStyle = C.gold;
  ctx.font = 'bold 72px sans-serif';
  ctx.fillText(newLevel, W / 2 + 58, 182);

  // Pseudo
  ctx.fillStyle = C.text;
  ctx.font = 'bold 30px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(member.user.username, 235, 100);

  // Grade
  const bw = ctx.measureText(grade.name).width + 24;
  ctx.fillStyle = C.gold2;
  ctx.beginPath();
  ctx.roundRect(235, 112, bw, 28, 8);
  ctx.fill();
  ctx.fillStyle = C.dark;
  ctx.font = 'bold 14px sans-serif';
  ctx.fillText(grade.name, 247, 131);

  // "Niveau atteint"
  ctx.fillStyle = C.sub;
  ctx.font = '19px sans-serif';
  ctx.fillText(`a atteint le niveau`, 235, 175);

  // Ligne déco bas
  const deco = ctx.createLinearGradient(235, 0, 870, 0);
  deco.addColorStop(0, C.gold);
  deco.addColorStop(0.5, C.gold2);
  deco.addColorStop(1, 'transparent');
  ctx.fillStyle = deco;
  ctx.fillRect(235, 215, 600, 2);

  // Texte encouragement
  ctx.fillStyle = C.muted;
  ctx.font = 'italic 17px sans-serif';
  ctx.fillText('Continue comme ça ! ☕', 235, 250);

  return canvas.toBuffer('image/png');
}

module.exports = { generateLevelUpCard };
