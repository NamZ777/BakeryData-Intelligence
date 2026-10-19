"""
ตัวสร้างข้อมูลจำลอง (Synthetic Data) สำหรับสาธิตระบบ BakeryData Intelligence
=======================================================================
** ข้อมูลชุดนี้ "สร้างขึ้น" เพื่อสาธิตเท่านั้น ไม่ใช่ข้อมูลการขายจริงของร้านใด **

Schema เหมือนไฟล์ cleaned_bakery_sales_50k.csv เดิมทุกคอลัมน์ แต่ฝัง pattern
ที่ร้านเบเกอรี่จริงมักมี เพื่อให้โมเดลมีอะไรให้เรียนรู้:

  1. ช่วงเวลา   : เช้า 07-09 กาแฟ+ครัวซองต์, บ่าย 13-15 เค้ก+มัทฉะ,
                  เย็น 16-18 ขนมปังโฮลวีต, 18-20 กลุ่มล่าส่วนลด
  2. วันในสัปดาห์: เสาร์-อาทิตย์ลูกค้าเยอะขึ้น ~40%, ศุกร์เพิ่มเล็กน้อย
  3. อากาศ      : ฝนตก -20% ลูกค้า, แดดจัด +10% และเครื่องดื่มเย็นขายดีขึ้น
  4. ตะกร้า      : 1 transaction_id = 1 บิลจริง (ลูกค้าคนเดียว เวลาเดียว) และมี
                  คู่สินค้าที่ซื้อด้วยกัน เช่น อเมริกาโน่ + ครัวซองต์เนย
  5. ของเสีย     : เสี่ยงสูงกับเบเกอรี่/เค้กช่วงเย็น วันฝนตก วันธรรมดา
                  และลดลงเมื่อมีส่วนลด
"""

import numpy as np
import pandas as pd

SEED = 2026
OUT_PATH = "synthetic_bakery_sales.csv"
rng = np.random.default_rng(SEED)

# ------------------------------------------------------------------
# สินค้า (ราคา/หมวด ตรงกับข้อมูลเดิม)
# ------------------------------------------------------------------
PRODUCTS = {
    "Almond Croissant":    (85,  "Bakery"),
    "Butter Croissant":    (65,  "Bakery"),
    "Classic Cheesecake":  (130, "Cake"),
    "Fruit Tart":          (110, "Cake"),
    "Ham Cheese Sandwich": (75,  "Bakery"),
    "Iced Americano":      (60,  "Beverage"),
    "Iced Latte":          (70,  "Beverage"),
    "Iced Matcha Latte":   (80,  "Beverage"),
    "Matcha Lava Cake":    (140, "Cake"),
    "Pineapple Pie":       (45,  "Bakery"),
    "Whole Wheat Bread":   (90,  "Bakery"),
}
NAMES = list(PRODUCTS)
ICED = {"Iced Americano", "Iced Latte", "Iced Matcha Latte"}

SEGMENTS = ["Morning Commuter", "Cafe Hopper", "Health & Family", "Evening Hunter", "Non-Member"]

# สัดส่วนผู้มาซื้อแต่ละกลุ่ม: วันธรรมดา / สุดสัปดาห์
SEG_WEIGHTS_WEEKDAY = [0.30, 0.13, 0.18, 0.19, 0.20]
SEG_WEIGHTS_WEEKEND = [0.12, 0.34, 0.22, 0.12, 0.20]

# น้ำหนักชั่วโมงที่ซื้อ ของแต่ละกลุ่ม (ชั่วโมง 7-19)
HOURS = list(range(7, 20))
def hour_profile(d):
    w = np.array([d.get(h, 0.0) for h in HOURS], dtype=float) + 0.004
    return w / w.sum()

HOUR_PROFILE = {
    "Morning Commuter": hour_profile({7: .30, 8: .38, 9: .20, 10: .06, 11: .03}),
    "Cafe Hopper":      hour_profile({11: .08, 12: .12, 13: .20, 14: .25, 15: .22, 16: .10, 17: .03}),
    "Health & Family":  hour_profile({12: .05, 15: .05, 16: .30, 17: .40, 18: .20}),
    "Evening Hunter":   hour_profile({17: .08, 18: .40, 19: .52}),
    "Non-Member":       hour_profile({8: .10, 9: .08, 10: .08, 11: .10, 12: .14, 13: .12,
                                      14: .10, 15: .08, 16: .07, 17: .06, 18: .04, 19: .03}),
}

# สินค้าหลักที่แต่ละกลุ่มเลือกซื้อ
PRODUCT_PREF = {
    "Morning Commuter": {"Iced Americano": .35, "Iced Latte": .20, "Butter Croissant": .18,
                         "Almond Croissant": .10, "Ham Cheese Sandwich": .07, "Pineapple Pie": .04,
                         "Whole Wheat Bread": .03, "Iced Matcha Latte": .03},
    "Cafe Hopper":      {"Iced Matcha Latte": .25, "Fruit Tart": .20, "Classic Cheesecake": .18,
                         "Matcha Lava Cake": .15, "Iced Latte": .10, "Iced Americano": .04,
                         "Almond Croissant": .04, "Butter Croissant": .04},
    "Health & Family":  {"Whole Wheat Bread": .35, "Ham Cheese Sandwich": .20, "Iced Latte": .10,
                         "Pineapple Pie": .10, "Almond Croissant": .08, "Butter Croissant": .07,
                         "Fruit Tart": .05, "Iced Americano": .05},
    "Evening Hunter":   {"Butter Croissant": .20, "Pineapple Pie": .20, "Almond Croissant": .15,
                         "Whole Wheat Bread": .12, "Ham Cheese Sandwich": .12, "Fruit Tart": .08,
                         "Classic Cheesecake": .07, "Iced Latte": .06},
    "Non-Member":       {n: 1 / len(NAMES) for n in NAMES},
}

# คู่สินค้าที่ซื้อด้วยกัน: (สินค้าหลัก -> สินค้าที่พ่วง, ความน่าจะเป็น)
PAIRS = [
    ("Iced Americano",      "Butter Croissant",    0.55),
    ("Iced Latte",          "Almond Croissant",    0.40),
    ("Iced Matcha Latte",   "Fruit Tart",          0.45),
    ("Iced Matcha Latte",   "Matcha Lava Cake",    0.25),
    ("Classic Cheesecake",  "Iced Americano",      0.35),
    ("Ham Cheese Sandwich", "Iced Americano",      0.40),
    ("Whole Wheat Bread",   "Iced Latte",          0.30),
    ("Pineapple Pie",       "Iced Latte",          0.20),
]
PAIR_MAP = {}
for a, b, p in PAIRS:
    PAIR_MAP.setdefault(a, []).append((b, p))

DOW_FACTOR = np.array([0.85, 0.85, 0.90, 0.95, 1.15, 1.45, 1.35])   # จันทร์..อาทิตย์
WEATHER_TRAFFIC = {"Sunny": 1.10, "Cloudy": 1.00, "Overcast": 0.95, "Rainy": 0.80}

# ------------------------------------------------------------------
# ลูกค้าสมาชิก 4,000 คน (กลุ่มของลูกค้าแต่ละคนคงที่)
# ------------------------------------------------------------------
member_segments = rng.choice(SEGMENTS[:4], size=4000, p=[0.30, 0.25, 0.22, 0.23])
customers = {s: [] for s in SEGMENTS[:4]}
for i, s in enumerate(member_segments, start=1):
    customers[s].append(f"CUST-{i:04d}")

# ------------------------------------------------------------------
# อากาศรายวัน (ต่อเนื่องกันได้ และฝนเยอะช่วง มิ.ย.-ส.ค.)
# ------------------------------------------------------------------
dates = pd.date_range("2026-01-01", "2026-08-29", freq="D")
weather = {}
prev = "Sunny"
for d in dates:
    rain_p = 0.45 if d.month in (6, 7, 8) else (0.18 if d.month in (5, 9) else 0.08)
    probs = {"Rainy": rain_p, "Sunny": 0.35, "Cloudy": 0.2, "Overcast": 0.15}
    probs[prev] += 0.15  # วันนี้มีแนวโน้มคล้ายเมื่อวาน
    names = list(probs)
    p = np.array([probs[n] for n in names]); p /= p.sum()
    prev = rng.choice(names, p=p)
    weather[d] = prev

# ------------------------------------------------------------------
# สร้างบิล
# ------------------------------------------------------------------
rows = []
txn_no = 0
BASE_TXN_PER_DAY = 145

for d in dates:
    dow = d.dayofweek
    wx = weather[d]
    n_txn = rng.poisson(BASE_TXN_PER_DAY * DOW_FACTOR[dow] * WEATHER_TRAFFIC[wx])
    seg_w = SEG_WEIGHTS_WEEKEND if dow >= 5 else SEG_WEIGHTS_WEEKDAY
    segs = rng.choice(SEGMENTS, size=n_txn, p=seg_w)

    for seg in segs:
        txn_no += 1
        txn_id = f"TXN-{2026000000 + txn_no}"
        hour = int(rng.choice(HOURS, p=HOUR_PROFILE[seg]))
        minute, second = int(rng.integers(0, 60)), 0
        ts = d + pd.Timedelta(hours=hour, minutes=minute, seconds=second)
        cust = "GUEST" if seg == "Non-Member" else str(rng.choice(customers[seg]))

        # เลือกสินค้าหลัก (อากาศมีผลกับเครื่องดื่มเย็น)
        pref = PRODUCT_PREF[seg]
        w = np.array([pref.get(n, 0.0) * (
            (1.5 if wx == "Sunny" else 0.6 if wx == "Rainy" else 1.0) if n in ICED else 1.0
        ) for n in NAMES])
        w /= w.sum()
        main = str(rng.choice(NAMES, p=w))
        basket = [main]

        # พ่วงสินค้าตามกฎคู่ซื้อ
        for partner, prob in PAIR_MAP.get(main, []):
            if partner not in basket and rng.random() < prob:
                basket.append(partner)
        # บางบิลหยิบอย่างอื่นเพิ่มแบบสุ่ม
        if rng.random() < 0.08:
            extra = str(rng.choice(NAMES))
            if extra not in basket:
                basket.append(extra)

        # ส่วนลด: กลุ่มล่าส่วนลดช่วงเย็นได้ลดเยอะ นอกนั้นมีโปรโมชันบ้าง
        late = hour * 60 + minute >= 18 * 60 + 30
        if seg == "Evening Hunter" and late and rng.random() < 0.75:
            disc = 30.0 if hour >= 19 else 20.0
        elif rng.random() < 0.06:
            disc = float(rng.choice([10, 15]))
        else:
            disc = 0.0

        for prod in basket:
            price, cat = PRODUCTS[prod]
            qty = 1 + int(rng.random() < (0.35 if (seg == "Health & Family" and dow >= 4) else 0.15))
            if rng.random() < 0.05:
                qty += 1

            # ความเสี่ยงของเสีย (logit)
            z = -2.6
            z += {"Bakery": 0.5, "Cake": 0.7, "Beverage": -2.5}[cat]
            z += 0.22 * (hour - 12)                 # ยิ่งเย็นยิ่งเหลือ
            z += 0.6 if wx == "Rainy" else (-0.2 if wx == "Sunny" else 0.0)
            z += -0.5 if dow >= 5 else 0.25          # วันหยุดขายหมดไว
            z -= 0.04 * disc                         # ลดราคาช่วยเคลียร์
            z += 0.15 * (qty - 1)
            waste = int(rng.random() < 1 / (1 + np.exp(-z)))

            rows.append((
                txn_id, ts.strftime("%Y-%m-%d %H:%M:%S"), cust, seg, prod, cat,
                qty, price, disc, round(qty * price * (1 - disc / 100), 2), wx, waste,
            ))

df = pd.DataFrame(rows, columns=[
    "transaction_id", "timestamp", "customer_id", "customer_segment", "product_name",
    "category", "quantity", "unit_price_thb", "discount_percent", "total_sales_thb",
    "weather_condition", "waste_flag",
])
df = df.sample(frac=1, random_state=SEED).reset_index(drop=True)  # สลับลำดับแถวให้เหมือนข้อมูลจริง
df.to_csv(OUT_PATH, index=False)

print(f"สร้างข้อมูลจำลอง {len(df):,} แถว / {df.transaction_id.nunique():,} บิล -> {OUT_PATH}")
print(f"อัตราของเสียรวม: {df.waste_flag.mean()*100:.1f}%")
print(f"บิลที่มี >1 รายการ: {(df.groupby('transaction_id').size() > 1).mean()*100:.1f}%")
