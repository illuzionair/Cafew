const { createCanvas, loadImage } = require('@napi-rs/canvas');

async function generateRankCard(member, userData, rank) {
  const canvas = createCanvas(934, 282);
  const ctx = canvas.getContext('2d');
  const { level, xp, xpNeeded, grade } = userData;

  const gradient = ctx.createLinearGradient(0, 0, 934, 282);
  gradient.addColorStop(0, '#0f0f1a');
  gradient.addColorStop(1, '#1a1a2e');
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.roundRect(0, 0, 934, 282, 16);
  ctx.fill();

  ctx.strokeStyle = grade.color;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.roundRect(2, 2, 930, 278, 14);
  ctx.stroke();

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
  ctx.fillStyle = grade.color;
  const badgeText = grade.name;
  const bw = ctx.measureText(badgeText).width + 20;
  ctx.beginPath();
  ctx.roundRect(45, 200, bw, 26, 8);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 14px sans-serif';
  ctx.fillText(badgeText, 55, 218);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 32px sans-serif';
  ctx.fillText(member.user.username, 260, 80);

  ctx.fillStyle = '#aaaacc';
  ctx.font = '20px sans-serif';
  ctx.fillText(`Rang #${rank}`, 260, 115);

  ctx.fillStyle = grade.color;
  ctx.font = 'bold 22px sans-serif';
  ctx.fillText(`NIVEAU ${level}`, 700, 75);

  ctx.fillStyle = '#aaaacc';
  ctx.font = '18px sans-serif';
  ctx.fillText(`${xp} / ${xpNeeded} XP`, 260, 150);

  ctx.fillStyle = '#2c2c3e';
  ctx.beginPath();
  ctx.roundRect(260, 165, 620, 28, 14);
  ctx.fill();

  const progress = Math.min(xp / xpNeeded, 1);
  const barGrad = ctx.createLinearGradient(260, 0, 880, 0);
  barGrad.addColorStop(0, grade.color);
  barGrad.addColorStop(1, '#ffffff44');
  ctx.fillStyle = barGrad;
  ctx.beginPath();
  ctx.roundRect(260, 165, Math.max(progress * 620, 28), 28, 14);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 13px sans-serif';
  ctx.fillText(`${Math.floor(progress * 100)}%`, 260 + (progress * 620) / 2 - 10, 184);

  ctx.fillStyle = '#888899';
  ctx.font = '17px sans-serif';
  ctx.fillText(`Prochain niveau dans ${xpNeeded - xp} XP`, 260, 225);

  return canvas.toBuffer('image/png');
}

module.exports = { generateRankCard };
