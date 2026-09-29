const path = require("path");
const fs = require("fs");
const { createCanvas, loadImage, GlobalFonts } = require("@napi-rs/canvas");

// إذا حطيت خط عربي (مثل Cairo أو Tajawal) بصيغة ttf داخل مجلد fonts
// بيتسجل تلقائيًا هنا عشان الحروف العربية ترتبط ببعض بشكل صحيح في الصورة.
const FONT_PATH = path.join(__dirname, "..", "fonts", "arabic.ttf");
let FONT_FAMILY = "sans-serif";
if (fs.existsSync(FONT_PATH)) {
  try {
    GlobalFonts.registerFromPath(FONT_PATH, "ArabicFont");
    FONT_FAMILY = "ArabicFont";
  } catch (err) {
    console.error("تعذر تحميل الخط العربي، بيتم استخدام الخط الافتراضي:", err);
  }
}

// يرسم نص من اليمين لليسار (محاذاة يمين) بشكل بسيط
function drawRTLText(ctx, text, x, y) {
  const prevAlign = ctx.textAlign;
  ctx.textAlign = "right";
  ctx.fillText(text, x, y);
  ctx.textAlign = prevAlign;
}

async function generateLogoutImage({ username, avatarURL, duration, panelLabel }) {
  const width = 1000;
  const height = 480;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  // خلفية تدرج بنفسجي
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, "#2d0a52");
  gradient.addColorStop(0.5, "#6a0dad");
  gradient.addColorStop(1, "#9b30ff");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  // إطار خفيف
  ctx.strokeStyle = "rgba(255,255,255,0.25)";
  ctx.lineWidth = 6;
  ctx.strokeRect(10, 10, width - 20, height - 20);

  // دائرة الصورة الرمزية
  const avatarSize = 160;
  const avatarX = width / 2 - avatarSize / 2;
  const avatarY = 45;
  try {
    const avatar = await loadImage(avatarURL);
    ctx.save();
    ctx.beginPath();
    ctx.arc(width / 2, avatarY + avatarSize / 2, avatarSize / 2 + 6, 0, Math.PI * 2);
    ctx.fillStyle = "#ffffff";
    ctx.fill();
    ctx.beginPath();
    ctx.arc(width / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(avatar, avatarX, avatarY, avatarSize, avatarSize);
    ctx.restore();
  } catch (err) {
    console.error("تعذر تحميل الصورة الرمزية:", err);
  }

  ctx.textAlign = "center";
  ctx.fillStyle = "#ffffff";

  // العنوان (نوع اللوحة)
  ctx.font = `bold 30px ${FONT_FAMILY}`;
  ctx.fillText(`سجل تسجيل خروج - ${panelLabel}`, width / 2, avatarY + avatarSize + 55);

  // اسم الشخص
  ctx.font = `bold 42px ${FONT_FAMILY}`;
  ctx.fillText(username, width / 2, avatarY + avatarSize + 115);

  // خط فاصل
  ctx.strokeStyle = "rgba(255,255,255,0.4)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(width / 2 - 200, avatarY + avatarSize + 140);
  ctx.lineTo(width / 2 + 200, avatarY + avatarSize + 140);
  ctx.stroke();

  // مدة الدخول
  ctx.font = `28px ${FONT_FAMILY}`;
  ctx.fillText(`مدة تسجيل الدخول: ${duration}`, width / 2, avatarY + avatarSize + 185);

  // الوقت والتاريخ
  const now = new Date();
  const dateStr = now.toLocaleString("ar-SA", { dateStyle: "medium", timeStyle: "short" });
  ctx.font = `20px ${FONT_FAMILY}`;
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.fillText(dateStr, width / 2, avatarY + avatarSize + 220);

  return canvas.toBuffer("image/png");
}

module.exports = { generateLogoutImage };
