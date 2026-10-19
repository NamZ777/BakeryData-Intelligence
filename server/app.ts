import express from "express";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();

app.use(express.json({ limit: "25mb" }));

// Lazy Gemini API initialization
let aiClient: GoogleGenAI | null = null;
function getAiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// Health endpoint
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    hasApiKey: Boolean(process.env.GEMINI_API_KEY),
    timestamp: new Date().toISOString(),
  });
});

// Supported Gemini models per AI Studio guidelines
const SUPPORTED_MODELS = [
  "gemini-3.8-flash",
  "gemini-3.1-flash-lite",
  "gemini-flash-latest",
  "gemini-4-argon",
];

// AI Advisor endpoint
app.post("/api/ai/advisor", async (req, res) => {
  try {
    const { 
      role = "ฝ่ายบริหาร", 
      currentMetrics, 
      personaData, 
      queryPrompt, 
      history = [],
      model = "gemini-3.8-flash",
      storeContext,
      focusTopic
    } = req.body;

    // Validate model selection
    const selectedModel = SUPPORTED_MODELS.includes(model) ? model : "gemini-3.8-flash";
    const ai = getAiClient();

    if (!ai) {
      // Fallback analytical response when API key is not configured
      return res.json({
        success: true,
        source: "heuristic",
        modelUsed: "CRISP-DM Rule Engine (Heuristic)",
        analysis: generateHeuristicAnalysis(queryPrompt || "", role, currentMetrics, storeContext),
      });
    }

    const systemPrompt = `คุณคือ "CRISP-DM Bakery AI Consultant" ที่ปรึกษาธุรกิจเบเกอรี่และนักวิทยาศาสตร์ข้อมูลผู้เชี่ยวชาญระดับแนวหน้า

🎯 กฎเหล็กสำคัญที่สุด (CRITICAL INSTRUCTIONS):
1. **ตอบให้ตรงคำถามของผู้ใช้ทันที (Direct Answer First)**:
   - บรรทัดแรกๆ ต้องตอบสิ่งที่ผู้ใช้ถามโดยตรงและชัดเจนที่สุดเสมอ
   - หากผู้ใช้ถามเรื่องเจาะจง (เช่น สคริปต์คำพูดแคชเชียร์, เวลาลดราคา, สูตร/วิธีแปรรูปของเหลือ, แผนอบรอบบ่าย, เทคนิคจัดหน้าร้าน, อัตราส่วนแป้ง) ให้ตอบเรื่องนั้นให้ละเอียด ชัดเจน ลงมือทำได้ทันที
   - ห้ามตอบเป็นภาพรวม 3 KPIs หรือสรุปกว้างๆ เว้นแต่ผู้ใช้จะถามถึงภาพรวมของร้านหรือผลการดำเนินงาน
2. **เจาะจงและใช้ตัวเลขจริง (Data-Grounded Precision)**:
   - นำข้อมูลสถานะร้าน ตัวเลข KPI ยอดขาย กลุ่มลูกค้า หรือรายการสินค้าที่ให้ไปใช้ในการคำนวณและอ้างอิง
   - หากตัวชี้วัดเป็น 0 หรือยังไม่มีข้อมูล ให้แนะนำแนวทางเก็บข้อมูลและตัวเลข Benchmark มาตรฐานของร้านเบเกอรี่
3. **ปรับสไตล์คำตอบตามบทบาท (Role Adaptation)**:
   - บทบาทปัจจุบัน: "${role}"
   - สำหรับเชฟห้องครัว: เน้นไทม์ไลน์เวลาอบ, อุณหภูมิ, วัตถุดิบ, Par-baked, เทคนิคจัด Batch
   - สำหรับผู้จัดการหน้าร้าน: เน้นสคริปต์พูด, จังหวะ Upsell, การจัด Display, การบริหารคิว, การรับมือสต็อก
   - สำหรับฝ่ายบริหาร: เน้นผลตอบแทน (ROI), Margin %, P&L, การจัดสรรงบ, กลยุทธ์การเติบโต
   - สำหรับ Data Science: เน้นสถิติ, Support/Confidence/Lift, Clustering, CRISP-DM Framework
4. **โครงสร้างคำตอบที่อ่านง่ายและเป็นมืออาชีพ**:
   - ใช้ Markdown หัวข้อ ตัวหนา bullet points และตารางสรุปเมื่อเหมาะสม
   - จบด้วย "Action Steps ทันที" 2-3 ข้อที่พนักงานสามารถนำไปทำได้เลยในวันนี้`;

    // Context summary
    let contextText = `[ข้อมูลสถานะร้านเบเกอรี่ปัจจุบัน]\n`;
    contextText += `- มุมมองที่ผู้ใช้เลือก: ${role} ${focusTopic ? `(เน้นหัวข้อ: ${focusTopic})` : ""}\n`;
    if (currentMetrics) {
      contextText += `- อัตราของเสียเบเกอรี่ (Waste Rate): ${currentMetrics.wasteRate ?? "N/A"}% (เป้าหมายลดเหลือ ≤14.8% หรือลดลง 20%)\n`;
      contextText += `- ยอดซื้อเฉลี่ยต่อบิล (Ticket Size): ${currentMetrics.avgTicketSize ?? "N/A"} บาท (เป้าหมาย ≥215 บาท หรือเพิ่มขึ้น 15%)\n`;
      contextText += `- อัตราซื้อซ้ำสมาชิก (Retention Rate): ${currentMetrics.retentionRate ?? "N/A"}% (เป้าหมาย ≥75% หรือเพิ่มขึ้น 25%)\n`;
      if (currentMetrics.totalRevenue) contextText += `- ยอดขายรวม: ${Number(currentMetrics.totalRevenue).toLocaleString()} บาท\n`;
      if (currentMetrics.costSaved) contextText += `- เงินที่ประหยัดได้จากลดของเสีย: ${Number(currentMetrics.costSaved).toLocaleString()} บาท\n`;
      if (currentMetrics.extraRevenue) contextText += `- รายได้เพิ่มจากการเพิ่ม Ticket Size: ${Number(currentMetrics.extraRevenue).toLocaleString()} บาท\n`;
    }

    if (personaData && Array.isArray(personaData) && personaData.length > 0) {
      contextText += `- สัดส่วนลูกค้า 4 กลุ่ม Persona: ${personaData.map((p: any) => `${p.name} (${p.pct || 0}%)`).join(", ")}\n`;
    }

    if (storeContext) {
      if (storeContext.totalTransactions !== undefined) {
        contextText += `- จำนวนบิลขายทั้งหมด: ${storeContext.totalTransactions} บิล, สมาชิก CRM: ${storeContext.totalMembers || 0} คน, แบทช์การผลิต: ${storeContext.totalBatches || 0} แบทช์\n`;
      }
      if (storeContext.topProducts && storeContext.topProducts.length > 0) {
        contextText += `- สินค้าขายดีเด่น: ${storeContext.topProducts.slice(0, 5).join(", ")}\n`;
      }
      if (storeContext.topWasted && storeContext.topWasted.length > 0) {
        contextText += `- สินค้าที่มีของเสียสูงสุด: ${storeContext.topWasted.slice(0, 3).join(", ")}\n`;
      }
      if (storeContext.commonPairs && storeContext.commonPairs.length > 0) {
        contextText += `- สินค้าที่จับคู่บ่อย (Market Basket Rules): ${storeContext.commonPairs.join(" | ")}\n`;
      }
    }

    // Build multi-turn contents
    const contents: any[] = [];

    // Append prior history if available (limit to last 6 turns for optimal focus)
    if (Array.isArray(history) && history.length > 0) {
      const recentHistory = history.slice(-6);
      for (const item of recentHistory) {
        if (item.sender === "user" || item.role === "user") {
          contents.push({
            role: "user",
            parts: [{ text: item.text }],
          });
        } else if (item.sender === "ai" || item.role === "model") {
          contents.push({
            role: "model",
            parts: [{ text: item.text }],
          });
        }
      }
    }

    // Final user prompt with context prepended
    const userPromptWithContext = `${contextText}\n[คำถามของผู้ใช้]:\n${queryPrompt || "ช่วยวิเคราะห์และให้คำแนะนำเจาะจงสำหรับสถานการณ์ปัจจุบัน"}`;

    contents.push({
      role: "user",
      parts: [{ text: userPromptWithContext }],
    });

    const response = await ai.models.generateContent({
      model: selectedModel,
      contents,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.65,
      },
    });

    res.json({
      success: true,
      source: "gemini",
      modelUsed: selectedModel,
      analysis: response.text || "ไม่พบข้อความตอบกลับจากระบบ AI",
    });
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to generate AI advisory",
      modelUsed: "CRISP-DM Rule Engine (Fallback)",
      fallback: generateHeuristicAnalysis(req.body.queryPrompt || "", req.body.role, req.body.currentMetrics, req.body.storeContext),
    });
  }
});

// Intelligent, query-responsive heuristic engine
function generateHeuristicAnalysis(query: string, role: string, metrics: any, storeContext?: any): string {
  const q = query.toLowerCase();

  // 1. Intent: Cashier Scripts & Upselling & Front-of-House
  if (q.includes("สคริปต์") || q.includes("พูด") || q.includes("แคชเชียร์") || q.includes("เชียร์") || q.includes("upsell") || q.includes("หน้าร้าน")) {
    return `### 🎯 สคริปต์แคชเชียร์และเทคนิคเชียร์ขาย (Cashier Upsell Script)

**เป้าหมาย**: เพิ่ม Ticket Size จาก ฿${metrics?.avgTicketSize || 185} เป็น ฿215+ (+15%)

#### 1. สคริปต์เชียร์ขายช่วงเช้า (07:00 - 09:30 น. • Morning Commuter)
> **สถานการณ์**: ลูกค้าสั่งเครื่องดื่มกาแฟ 1 แก้ว (เช่น ลาเต้ร้อน ฿85)
>
> 🗣️ **พนักงานยิ้มและผายมือไปที่ตู้เบเกอรี่**:  
> *"สวัสดีตอนเช้าครับคุณลูกค้า วันนี้มีครัวซองต์เนยสดฝรั่งเศสอบเสร็จร้อนๆ จับคู่กาแฟลดทันที 25 บาท รวมเป็น ฿145 อิ่มอร่อยพร้อมทำงานเลยครับ รับเพิ่มด้วยไหมครับ?"*  
> 
> 💡 **เทคนิค**: ใช้เทคนิค "Assumptive Close" ระบุราคาคู่ที่ประหยัดลงชัดเจน

#### 2. สคริปต์เชียร์ขายช่วงบ่าย (13:00 - 16:00 น. • Cafe Hopper)
> **สถานการณ์**: ลูกค้ามาเป็นคู่หรือนั่งทานที่ร้าน
>
> 🗣️ **พนักงาน**:  
> *"สำหรับมัทฉะลาเต้ ทางร้านมีชีสเค้กหน้าไหม้ Signature ที่เข้ากันมาก ทานคู่กันตัดเลี่ยนได้สมบูรณ์แบบ ตอนนี้มีเซ็ตเค้ก+เครื่องดื่มลด 10% ให้บริการครับ"*

#### 📋 Action Steps หน้าร้านวันนี้:
- วางจานชิมมินิครัวซองต์ข้างเครื่องคิดเงิน (Impulse Zone)
- กำหนด Challenge ประจำกะ: พนักงานที่ Upsell คอมโบได้ครบ 15 บิล รับแต้มโบนัสรายวัน`;
  }

  // 2. Intent: Dynamic Markdown & Evening Clearance & Food Waste
  if (q.includes("ลดราคา") || q.includes("markdown") || q.includes("เย็น") || q.includes("ค่ำ") || q.includes("ขยะ") || q.includes("waste") || q.includes("ของเหลือ") || q.includes("เหลือทิ้ง")) {
    return `### 📉 แผนปฏิบัติการ Dynamic Markdown & เคลียร์สต็อกเหลือทิ้ง 0 ชิ้น

**เป้าหมาย**: ลดอัตราสูญเสียอาหาร (Food Waste) ลง 20% (ปัจจุบัน ${metrics?.wasteRate ?? 3.8}%) และประหยัดต้นทุนปีละกว่า ฿${(metrics?.costSaved || 48500).toLocaleString()}

#### 1. ไทม์ไลน์ Dynamic Markdown อัตโนมัติ (18:30 - 20:00 น.)
- **18:30 น. (Trigger 1: -20%)**:  
  ตรวจสอบตู้ขนมสด หากมีครัวซองต์ เดนิช หรือขนมปังสดเหลือเกิน 10 ชิ้น ให้ติดป้าย *"Happy Evening -20%"*
- **19:15 น. (Trigger 2: -35%)**:  
  หากสต็อกยังคงเหลือเกิน 5 ชิ้น ปรับส่วนลดเป็น 35% ดึงดูดกลุ่ม Evening Discount Hunter
- **19:45 น. (Trigger 3: Surprise Mystery Box / 1 แถม 1)**:  
  จัดรวมเซ็ต 3 ชิ้น ฿100 หรือซื้อ 1 แถม 1 เพื่อเคลียร์สต็อกหน้าเคาน์เตอร์ให้เป็น 0 ก่อนปิดไฟ

#### 2. แนวทางแปรรูปเบเกอรี่ที่ขายไม่หมด (Salvage & Repurposing Protocol):
- **ครัวซองต์เนยสด**: นำไปทำเป็น *Almond Croissant* (ชุบไซรัป ปาดครีมอัลมอนด์แล้วอบซ้ำในวันถัดไป ขายได้ราคาสูงขึ้น)
- **ขนมปังแซนด์วิช/โฮลวีต**: หั่นเต๋าอบกรอบเป็น *Garlic Butter Croutons* สำหรับใส่ซุปและสลัด
- **ขนมปังบริออช/บาแก็ตต์**: แปรรูปเป็น *Classic Bread Pudding* เสิร์ฟพร้อมซอสวานิลลา

#### 📋 Action Steps สำหรับกะเย็น:
- เช็คยอดสต็อกคงเหลือผ่านแท็บเล็ตหน้าร้านเวลา 18:15 น.
- ยิงแจ้งเตือน Dynamic Markdown ผ่าน LINE OA เวลา 18:25 น. ให้กลุ่มสมาชิกแถบใกล้ร้าน`;
  }

  // 3. Intent: Baking Schedule & Kitchen Operations & Par-bake
  if (q.includes("อบ") || q.includes("ครัว") || q.includes("แป้ง") || q.includes("สูตร") || q.includes("par-bake") || q.includes("batch") || q.includes("เตา") || q.includes("เชฟ")) {
    return `### 🥐 ตารางการผลิตและแผนคุมเตาอบแบบ 3-Batch Production

**เป้าหมาย**: ป้องกันขนมขาดช่วง (Stockout) ในชั่วโมงเร่งด่วน ควบคู่กับการลดของเสียเหลือทิ้ง 20%

#### 1. ตาราง Batch Production ประจำวัน
| รอบอบ | เวลา | รายการขนมเป้าหมาย | สัดส่วนผลิต | กลุ่มลูกค้าเป้าหมาย |
| :--- | :--- | :--- | :---: | :--- |
| **Batch 1 (เช้า)** | 05:30 - 06:45 | ครัวซองต์, พัฟ, แซนด์วิชสด, ขนมปังปอนด์ | 55% | Morning Commuter |
| **Batch 2 (สาย)** | 10:30 - 11:30 | เพสตรีผลไม้สด, ทาร์ตไข่, เดนิช, เค้กหน้าร้าน | 25% | Cafe Hopper & แขกทั่วไป |
| **Batch 3 (บ่าย)** | 14:30 - 15:15 | โฮลวีตเพื่อสุขภาพ, บริออช, เบเกอรี่สดรอบเย็น | 20% | Health & Family / กลับบ้าน |

#### 2. กลยุทธ์ Par-Baked (อบกึ่งสำเร็จรูปแช่แข็ง)
- พักแป้งครัวซองต์ขึ้นรูปและอบเพียง 80% (Par-baked) แล้วแช่เย็นควบคุมอุณหภูมิ 2-4°C
- หากยอดขายช่วงเที่ยงเร่งตัวขึ้น ให้ดึงมาอบ Re-bake ต่อเพียง 4-6 นาที เพื่อเสิร์ฟขนมสดร้อนโดยไม่ต้องเสี่ยงอบทิ้งล่วงหน้า

#### 📋 Action Steps สำหรับหัวหน้าเชฟ:
- คำนวณยอดพยากรณ์ล่วงหน้า 1 วันจากแท็บ Dashboard
- ตรวจสอบอุณหภูมิพรูฟเฟอร์ (Proofer) 28°C ความชื้น 80% ให้คงที่`;
  }

  // 4. Intent: LINE OA, CRM, Membership, Vouchers, Retention
  if (q.includes("line") || q.includes("crm") || q.includes("สมาชิก") || q.includes("ซื้อซ้ำ") || q.includes("retention") || q.includes("voucher") || q.includes("คูปอง") || q.includes("broadcast")) {
    return `### 👥 กลยุทธ์ LINE OA CRM & แคมเปญเพิ่ม Retention แตะ 25%

**เป้าหมาย**: เพิ่มอัตราซื้อซ้ำ (Retention Rate) ของสมาชิกแตะ ${metrics?.retentionRate ?? 66.7}% (เป้าหมาย 75%+) ดึงดูดลูกค้ากลับมาซื้ออย่างสม่ำเสมอ

#### 1. สคริปต์บรอดแคสต์ LINE OA แบบเจาะกลุ่ม (Segmented Push)
> **หัวข้อ**: 🥐 กลิ่นเนยสดหอมกรุ่นยามเช้า... รับฟรีอเมริกาโน่เย็นคู่ครัวซองต์!
>
> **เนื้อหา**:  
> *"อรุณสวัสดิ์ครับคุณ [ชื่อลูกค้า] ✨  
> เช้านี้เติมพลังก่อนเริ่มงานกับ 'ครัวซองต์เนยสด AOP อบร้อนจากเตา'  
> พิเศษเฉพาะสมาชิกคนสำคัญ: แสดงข้อความนี้ รับส่วนลดจับคู่กาแฟทันที ฿30  
> (เฉพาะช่วงเวลา 07:00 - 09:30 น. วันนี้เท่านั้น)"*  
> 
> 📲 **Call-to-Action**: [คลิกเก็บคูปองหน้าร้าน]

#### 2. กลยุทธ์บันไดสะสมแต้ม (Stamp Ladder Optimization):
- สมาชิกซื้อครบ ฿150 รับ 1 แสตมป์
- สะสมครบ 5 แสตมป์: รับฟรีเครื่องดื่ม Signature 1 แก้ว (ดึงดูดกลับมารอบ 2-5 ภายใน 14 วัน)
- สะสมครบ 10 แสตมป์: รับกล่องขนมอบ Premium Gift Box 1 กล่อง

#### 📋 Action Steps สัปดาห์นี้:
- ตั้งเวลาบรอดแคสต์ Auto-trigger ในระบบ LINE OA วันจันทร์-ศุกร์ เวลา 06:45 น.
- ตั้งค่าแจ้งเตือนสิทธิประโยชน์วันเกิด (Birthday Voucher ส่วนลด 20%) ล่วงหน้า 3 วัน`;
  }

  // 5. Intent: Financials, Profit, Margins, P&L, ROI
  if (q.includes("กำไร") || q.includes("margin") || q.includes("ต้นทุน") || q.includes("การเงิน") || q.includes("p&l") || q.includes("งบ") || q.includes("ราคา") || q.includes("คุ้ม")) {
    return `### 💰 การวิเคราะห์โครงสร้างผลกำไรและการเงิน (P&L & Margin Optimization)

**เป้าหมาย**: เพิ่มผลกำไรสุทธิรวม และควบคุมต้นทุนของเสียให้ต่ำกว่า 4%

#### 1. โครงสร้างกำไรขั้นต้นจำแนกตามกลุ่มสินค้า (Gross Margin Breakdown)
- **เครื่องดื่มชากาแฟ (Beverage)**: Margin สูงสุด **72 - 78%** (ต้นทุนหลักคือนมและเมล็ดกาแฟ)
- **เพสตรีและครัวซองต์ (Pastry & Croissant)**: Margin **58 - 65%** (ใช้วัตถุดิบเนยนำเข้า)
- **ขนมปังเพื่อสุขภาพ & ปอนด์ (Healthy Bread)**: Margin **48 - 54%** (ความถี่ในการซื้อสม่ำเสมอ เป็นตัวดึงดูดลูกค้า)
- **เค้กและขนมจัดเลี้ยง (Artisan Cake)**: Margin **64 - 70%** (มูลค่าต่อชิ้นสูง)

#### 2. ผลกระทบทางการเงินเมื่อบรรลุเป้าหมาย 3 KPIs:
1. **ลดของเสีย 20%**: ประหยัดต้นทุนวัตถุดิบและค่าอบได้ราว **฿45,000 - ฿68,000 / เดือน**
2. **เพิ่ม Ticket Size 15%**: สร้างรายได้ส่วนเพิ่มจากการ Upsell ได้กว่า **฿75,000 - ฿120,000 / เดือน**
3. **เพิ่ม Member Retention 25%**: ลดต้นทุนการหาลูกค้าใหม่ (CAC) ลง 40% และเพิ่ม Customer Lifetime Value (LTV)

#### 📋 ข้อเสนอแนะเชิงกลยุทธ์สำหรับผู้บริหาร:
- มุ่งเน้นการทำ Cross-sell สินค้ากลุ่ม Margin สูง (เครื่องดื่ม) คู่กับเบเกอรี่สด
- ตรวจสอบราคานำเข้าของเนยสดและแป้งทุก 15 วันเพื่อปรับปรุงสูตรก่อนต้นทุนพุ่ง`;
  }

  // 6. Intent: Data Science, CRISP-DM, Machine Learning, Apriori, Clustering
  if (q.includes("crisp") || q.includes("data") || q.includes("วิทยาศาสตร์ข้อมูล") || q.includes("โมเดล") || q.includes("apriori") || q.includes("lift") || q.includes("k-means") || q.includes("อัลกอริทึม")) {
    return `### 🧪 ระเบียบวิธี CRISP-DM และสถาปัตยกรรมโมเดล Data Science ของร้าน

#### 1. สถานะกระบวนการ 6 ขั้นตอนของ CRISP-DM:
1. **Business Understanding**: กำหนด 3 KPIs ชัดเจน (ลดขยะ 20%, เพิ่ม Ticket Size 15%, เพิ่ม Retention 25%)
2. **Data Understanding**: รวมข้อมูล 3 แหล่ง (บิลขาย POS, ข้อมูลสมาชิก CRM, แบทช์การผลิต Kitchen)
3. **Data Preparation**: ทำความสะอาดข้อมูล จัดการ Missing values, คัดกรองรหัสสินค้า และสร้างคอลัมน์เวลา
4. **Modeling**:
   - **K-Means Clustering (RFM)**: แบ่ง 4 Customer Personas แม่นยำ
   - **Apriori Algorithm**: ขุดกฎความสัมพันธ์ของสินค้า (Market Basket Analysis) หาคู่ที่มีค่า Lift > 1.5
   - **Time-Series Demand Forecasting**: พยากรณ์ความต้องการอบรายชั่วโมง
5. **Evaluation**: ตรวจวัดผลลัพธ์ผ่าน A/B Testing แคมเปญ LINE OA และความแม่นยำ MAPE < 8.5%
6. **Deployment**: ระบบ Dashboard แยก 3 บทบาทพร้อม AI Advisor แบบ Interactive

#### 2. การแปลผลค่า Lift ใน Market Basket Analysis:
- **Lift > 1.0**: สินค้าทั้งสองมีความสัมพันธ์กันมากกว่าโอกาสสุ่ม (เช่น ครัวซองต์ + อเมริกาโน่ Lift = 1.82 ควรจัดเป็นชุดคอมโบ)
- **Confidence > 60%**: เมื่อลูกค้าสั่งสินค้า A มีโอกาสสูงกว่า 60% ที่จะตอบรับการเสนอขายสินค้า B`;
  }

  // Default Comprehensive Response tailored to Role
  if (role === "kitchen" || role === "เชฟห้องครัว") {
    return `### 🥐 คำแนะนำเจาะจงสำหรับหัวหน้าเชฟและห้องครัวเบเกอรี่

1. **การควบคุมของเสียอาหาร (Food Waste Control)**:
   - ลดจำนวนการอบรอบบ่าย (14:30 น.) ของกลุ่ม Sweet Pastry ลง 15% เพื่อลดโอกาสเหลือทิ้งช่วงค่ำ
   - ตรวจสอบเตาอบและเทคนิคขึ้นรูปเพื่อลดตำหนิด้านรูปลักษณ์ (Aesthetic Defects) ซึ่งคิดเป็น 28% ของของเสีย
2. **การจัดเตรียมวัตถุดิบ (Raw Material Prep)**:
   - วางแผนสต็อกแป้งไม่ฟอกสีและเนยสดล่วงหน้าสำหรับวันหยุด ซึ่งกลุ่มครอบครัวมียอดซื้อสูงขึ้น 32%
3. **การประสานงานหน้าร้าน**:
   - อัปเดตจำนวนขนมสดที่พร้อมจำหน่ายผ่านระบบแบบเรียลไทม์เพื่อให้แคชเชียร์เชียร์ขายได้ตรงจุด`;
  }

  if (role === "manager" || role === "ผู้จัดการร้าน") {
    return `### ☕ คำแนะนำเจาะจงสำหรับผู้จัดการหน้าร้าน

1. **การขับเคลื่อน Ticket Size จาก ฿${metrics?.avgTicketSize || 185} สู่ ฿215+**:
   - ฝึกทีมแคชเชียร์ให้เสนอจับคู่ "เครื่องดื่ม + มินิเบเกอรี่" ทุกบิลช่วงเช้า 07:00-09:30 น.
   - จัดดิสเพลย์ขนมปังสดบริเวณจุดชำระเงินให้หยิบง่าย (Impulse Purchase)
2. **การดำเนินมาตรการ Dynamic Markdown (18:30 น. เป็นต้นไป)**:
   - ตรวจสอบสต็อกคงเหลือเวลา 18:15 น. แล้วปรับป้ายลดราคา 20% และ 35% ตามสัดส่วน
3. **การบริการลูกค้าสมาชิก**:
   - เชิญชวนลูกค้าสแกน LINE OA สะสมแต้ม โดยเน้นย้ำสิทธิประโยชน์รับคูปองส่วนลดวันเกิด`;
  }

  return `### 📊 สรุปบทวิเคราะห์เชิงกลยุทธ์สำหรับฝ่ายบริหาร

1. **ความคืบหน้าของ 3 KPIs หลัก**:
   - **ของเสียอาหาร (Waste Rate)**: อยู่ที่ ${metrics?.wasteRate ?? 3.8}% มุ่งสู่เป้าหมายลดลง 20% อย่างมีประสิทธิภาพ
   - **ยอดซื้อเฉลี่ย (Ticket Size)**: อยู่ที่ ฿${metrics?.avgTicketSize ?? 215} เติบโตขึ้นจากการจัดโปรโมชั่นคู่สินค้า
   - **การซื้อซ้ำ (Retention Rate)**: อยู่ที่ ${metrics?.retentionRate ?? 66.7}% ขับเคลื่อนด้วยระบบ CRM สมาชิก
2. **ข้อเสนอแนะเชิงนโยบายและการลงทุน**:
   - ขยายงบทำการตลาดผ่าน LINE OA เจาะกลุ่ม Cafe Hopper ที่มี Margin สูงถึง 68%
   - พิจารณาขยายตู้แช่ Par-baked เพื่อรองรับกำลังการผลิตที่เพิ่มขึ้นในไตรมาสถัดไป`;
}

// ส่งออกเฉพาะ Express app (ไม่เรียก listen) เพื่อให้ใช้ได้ทั้งตอนรันเองและเป็น Vercel Serverless Function
export default app;
