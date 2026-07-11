const { createCanvas, loadImage } = require('@napi-rs/canvas');

const C = {
  bg1:  '#2C1A0E',
  bg2:  '#3D2410',
  bar:  '#4A2E14',
  text: '#F5E6C8',
  sub:  '#D4B483',
  muted:'#9E7D55',
  gold: '#C8922A',
};

async function generateRankCard(member, userData, rank) {
  const W = 934, H = 282;
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext('2d');
  const { level, xp, xpNeeded, grade } = userData;

  // Fond
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, C.bg1);
  bg.addColorStop(1, C.bg2);
  ctx.fillStyle = bg;
  ctx.beginPath();
  ctx.roundRect(0, 0, W, H, 16);
  ctx.fill();

  // Bordure couleur grade
  ctx.strokeStyle = grade.color;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.roundRect(2, 2, W - 4, H - 4, 14);
  ctx.stroke();

  // Barre latérale grade
  ctx.fillStyle = grade.color;
  ctx.beginPath();
  ctx.roundRect(0, 0, 6, H, [16, 0, 0, 16]);
  ctx.fill();

  // Avatar
  const avatarURL = member.user.displayAvatarURL({ extension: 'png', size: 256 });
  const avatar = await loadImage(avatarURL);
  ctx.save();
  ctx.beginPath();
  ctx.arc(130, 141, 85, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();
  ctx.drawImage(avatar, 45, 56, 170, 170);
  ctx.restore();

  ctx.strokeStyle = grade.color;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(130, 141, 87, 0, Math.PI * 2);
  ctx.stroke();

  // Badge grade
  const badgeText = grade.name;
  ctx.font = 'bold 13px sans-serif';
  const bw = ctx.measureText(badgeText).width + 22;
  ctx.fillStyle = grade.color;
  ctx.beginPath();
  ctx.roundRect(45, 202, bw, 26, 8);
  ctx.fill();
  ctx.fillStyle = '#1A0A00';
  ctx.fillText(badgeText, 56, 220);

  // Séparateur
  ctx.strokeStyle = C.gold + '44';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(250, 30);
  ctx.lineTo(250, H - 30);
  ctx.stroke();

  // Nom
  ctx.fillStyle = C.text;
  ctx.font = 'bold 32px sans-serif';
  ctx.fillText(member.user.username, 270, 78);

  // Rang
  ctx.fillStyle = C.sub;
  ctx.font = '20px sans-serif';
  ctx.fillText(`Rang #${rank}`, 270, 112);

  // Niveau (coin haut droit)
  ctx.fillStyle = grade.color;
  ctx.font = 'bold 22px sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(`NIVEAU ${level}`, W - 30, 50);
  ctx.textAlign = 'left';

  // XP texte
  ctx.fillStyle = C.sub;
  ctx.font = '18px sans-serif';
  ctx.fillText(`${xp} / ${xpNeeded} XP`, 270, 148);

  // Barre XP fond
  ctx.fillStyle = C.bar;
  ctx.beginPath();
  ctx.roundRect(270, 162, 620, 28, 14);
  ctx.fill();

  // Barre XP remplie
  const progress = Math.min(xp / xpNeeded, 1);
  const barGrad = ctx.createLinearGradient(270, 0, 890, 0);
  barGrad.addColorStop(0, grade.color);
  barGrad.addColorStop(1, C.gold);
  ctx.fillStyle = barGrad;
  ctx.beginPath();
  ctx.roundRect(270, 162, Math.max(progress * 620, 28), 28, 14);
  ctx.fill();

  // % au centre barre
  ctx.fillStyle = '#1A0A00';
  ctx.font = 'bold 13px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`${Math.floor(progress * 100)}%`, 270 + (progress * 620) / 2, 181);
  ctx.textAlign = 'left';

  // Prochain niveau
  ctx.fillStyle = C.muted;
  ctx.font = '17px sans-serif';
  ctx.fillText(`Prochain niveau dans ${xpNeeded - xp} XP`, 270, 222);

  // Ligne déco bas
  const deco = ctx.createLinearGradient(270, 0, 890, 0);
  deco.addColorStop(0, grade.color);
  deco.addColorStop(1, 'transparent');
  ctx.fillStyle = deco;
  ctx.fillRect(270, 240, 600, 2);

  return canvas.toBuffer('image/png');
}

module.exports = { generateRankCard };
