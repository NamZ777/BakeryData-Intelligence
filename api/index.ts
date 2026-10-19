// Vercel Serverless Function: ส่งต่อทุกคำขอ /api/* ไปที่ Express app
// (ดู rewrites ใน vercel.json) ส่วนหน้าเว็บ (Vite) ถูกเสิร์ฟเป็นไฟล์ static จาก dist/
import app from "../server/app.js";

export default app;
