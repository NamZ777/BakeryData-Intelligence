import React from 'react';
import { 
  Target, 
  Database, 
  Sparkles, 
  Cpu, 
  FlaskConical, 
  Rocket, 
  CheckCircle2,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';

export const CrispDmPhasesView: React.FC = () => {
  const phases = [
    {
      step: 1,
      name: 'Phase 1: Business Understanding',
      thaiTitle: 'การเข้าใจธุรกิจ เป้าหมาย และการนิยามกลุ่มเป้าหมาย',
      icon: <Target className="w-6 h-6 text-amber-600" />,
      color: 'amber',
      objectives: [
        'ลดอัตราการเหลือทิ้งของเบเกอรี่ลง 20% (Food Waste Reduction)',
        'เพิ่มค่าใช้จ่ายเฉลี่ยต่อบิล (Ticket Size) ขึ้น 15%',
        'เพิ่มอัตราการซื้อซ้ำ (Retention Rate) ของสมาชิกขึ้น 25%',
        'นิยาม 4 กลุ่มเป้าหมายหลัก: Morning Commuter, Cafe Hopper, Health & Family, Evening Discount Hunter',
      ],
      deliverable: 'ข้อกำหนดตัวชี้วัด (KPIs Metrics) และ Persona Definitions',
    },
    {
      step: 2,
      name: 'Phase 2: Data Understanding',
      thaiTitle: 'การสำรวจและจัดเก็บข้อมูลตามพฤติกรรมลูกค้า',
      icon: <Database className="w-6 h-6 text-blue-600" />,
      color: 'blue',
      objectives: [
        'POS Data: บันทึก Timestamp ของทุกบิล, รายการที่สั่งพร้อมกัน, วิธีชำระเงิน, ยอดรวม',
        'CRM Data: ประวัติการซื้อรายคน, ความถี่, ช่องทาง LINE OA, สินค้าที่ชอบ',
        'External Data: สภาพอากาศ (ฝนตก/แดดออก), วันหยุดนักขัตฤกษ์, กิจกรรมรอบร้าน',
        'Digital Engagement: สถิติการคลิกดูเมนูบน LINE OA, Engagement โปรโมชั่นโซเชียล',
      ],
      deliverable: 'Exploratory Data Analysis (EDA) และรายงาน Peak Hours รายเมนู',
    },
    {
      step: 3,
      name: 'Phase 3: Data Preparation',
      thaiTitle: 'การทำความสะอาดและสร้างคุณลักษณะข้อมูล',
      icon: <Sparkles className="w-6 h-6 text-emerald-600" />,
      color: 'emerald',
      objectives: [
        'Data Cleansing: กรองบิลยกเลิก/ทดสอบระบบออก, จัดการ Missing Values สมาชิก',
        'Feature Engineering: คำนวณค่า RFM (Recency, Frequency, Monetary)',
        'Time-based Features: สัดส่วน % Morning Purchases, % Weekend Purchases',
        'Product Preference Features: Healthy Bread Ratio, Cake & Pastry Ratio',
      ],
      deliverable: 'Cleaned Dataset / Data Mart พร้อมสำหรับป้อนเข้าโมเดล',
    },
    {
      step: 4,
      name: 'Phase 4: Data Modeling',
      thaiTitle: 'การสร้างและประยุกต์ใช้โมเดลวิทยาศาสตร์ข้อมูล',
      icon: <Cpu className="w-6 h-6 text-purple-600" />,
      color: 'purple',
      objectives: [
        'Customer Segmentation: K-Means Clustering / RFM วิเคราะห์แบ่ง 4 กลุ่มอัตโนมัติ',
        'Demand Forecasting Model: Prophet / XGBoost พยากรณ์ยอดขายรายชิ้นล่วงหน้า 7-30 วัน',
        'Market Basket Analysis: Apriori Algorithm หาแพทเทิร์นสินค้าซื้อคู่กัน (Cross-selling)',
        'Dynamic Markdown Model: คำนวณช่วงเวลาและ % ส่วนลดระบายสินค้าก่อนปิดร้าน',
      ],
      deliverable: 'Production Machine Learning Models & Rule Engines',
    },
    {
      step: 5,
      name: 'Phase 5: Evaluation',
      thaiTitle: 'การประเมินผลประสิทธิภาพโมเดลและผลลัพธ์ธุรกิจ',
      icon: <FlaskConical className="w-6 h-6 text-rose-600" />,
      color: 'rose',
      objectives: [
        'Technical Accuracy: ตรวจวัดค่าความคลาดเคลื่อน MAPE < 10% (ทำได้ 6.8%) และ Silhouette 0.74',
        'A/B Testing: ส่งบรอดแคสต์ Personalized LINE OA เทียบกับแบบหว่านทั่วไป (ได้ Uplift +212%)',
        'Business ROI: คำนวณ % การลดลงของ Food Waste และยอดขายส่วนเพิ่มจริงที่สาขา',
      ],
      deliverable: 'รายงานผลทดสอบ A/B Testing และ ROI Validation Report',
    },
    {
      step: 6,
      name: 'Phase 6: Deployment & Action Plan',
      thaiTitle: 'การนำไปใช้งานจริงตามกลุ่มเป้าหมาย',
      icon: <Rocket className="w-6 h-6 text-cyan-600" />,
      color: 'cyan',
      objectives: [
        'Kitchen & Inventory Dashboard: แดชบอร์ดให้เชฟรู้ว่าต้องอบขนมปังชนิดใด จำนวนเท่าไรในแต่ละช่วง',
        'Automated Personalized Marketing: ระบบส่งแจ้งเตือนและคูปองเฉพาะบุคคลผ่าน LINE OA',
        'Custom Data Upload: ระบบรองรับการอัปโหลดไฟล์ POS, CRM, Kitchen ของร้านคุณเอง',
        'Model Maintenance: กำหนดการ Re-train โมเดลทุก 1 เดือน เพื่ออัปเดตพฤติกรรมตามฤดูกาล',
      ],
      deliverable: 'Live Web System, Role-Based Dashboards & Actionable Workflows',
    },
  ];

  return (
    <div className="space-y-6">
      
      {/* Intro Header */}
      <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
        <div className="flex items-center gap-2 text-xs font-semibold text-amber-700 uppercase tracking-wider mb-1">
          <ShieldCheck className="w-4 h-4 text-amber-600" />
          <span>Cross Industry Standard Process for Data Mining</span>
        </div>
        <h2 className="text-xl font-bold text-stone-900">
          วงจรการพัฒนาโมเดลธุรกิจร้านเบเกอรี่ด้วยกระบวนการ CRISP-DM
        </h2>
        <p className="text-xs text-stone-500 max-w-3xl mt-1 leading-relaxed">
          แอปพลิเคชันนี้ถูกออกแบบและสร้างขึ้นตามโครงสร้าง CRISP-DM ทั้ง 6 ขั้นตอนอย่างเคร่งครัด เพื่อแก้ปัญหาขยะอาหาร (Food Waste), เพิ่ม Ticket Size และสร้างความภักดีของสมาชิกอย่างยั่งยืน
        </p>
      </div>

      {/* Phases Grid */}
      <div className="space-y-4">
        {phases.map((phase) => (
          <div 
            key={phase.step}
            className="bg-white rounded-2xl p-6 border border-stone-200 shadow-sm hover:border-amber-300 transition"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 mb-4 border-b border-stone-100">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-stone-50 border border-stone-200 flex items-center justify-center shrink-0">
                  {phase.icon}
                </div>
                <div>
                  <span className="text-xs font-bold text-amber-700 uppercase">{phase.name}</span>
                  <h3 className="text-base font-bold text-stone-900">{phase.thaiTitle}</h3>
                </div>
              </div>

              <div className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 self-start md:self-auto">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>สำเร็จแล้วในระบบ (Operational)</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="md:col-span-2 space-y-2">
                <div className="font-bold text-stone-800">กิจกรรมและวิธีการดำเนินงาน (Key Activities):</div>
                <ul className="space-y-1.5 text-stone-600">
                  {phase.objectives.map((obj, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <ChevronRight className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                      <span>{obj}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-4 rounded-xl bg-stone-50 border border-stone-200/80 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-stone-400 block mb-1">ผลลัพธ์ของขั้นตอนนี้ (Deliverables)</span>
                  <p className="text-xs font-semibold text-stone-800 leading-relaxed">
                    {phase.deliverable}
                  </p>
                </div>
                <div className="text-[11px] text-emerald-700 font-bold mt-2">
                  ✓ ตรวจสอบผ่านเกณฑ์มาตรฐาน
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};
