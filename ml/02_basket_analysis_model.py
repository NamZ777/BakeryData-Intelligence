"""
โมเดลที่ 2: Market Basket Analysis (Cross-sell / Ticket Size)
==============================================================
เป้าหมาย: เพิ่ม Ticket Size 15%
วิธีการ: Apriori algorithm หากฎความสัมพันธ์ (association rules) ว่าสินค้าใด
         มักถูกซื้อคู่กันในบิลเดียวกัน (transaction_id เดียวกัน)

Output: bakery_basket_rules.pkl  (ตัวโมเดล/กฎ สำหรับ query ใน app.py)
        bakery_basket_rules.csv  (อ่านง่าย เปิดดูใน Excel ได้)
"""

import pandas as pd
from mlxtend.frequent_patterns import apriori, association_rules
from mlxtend.preprocessing import TransactionEncoder
import joblib

DATA_PATH = "synthetic_bakery_sales.csv"
PKL_OUT = "artifacts/bakery_basket_rules.pkl"
CSV_OUT = "artifacts/bakery_basket_rules.csv"

MIN_SUPPORT = 0.001      # บิลต้องมีคู่นี้อย่างน้อย 0.1% ของบิลทั้งหมด
MIN_CONFIDENCE = 0.05    # ความมั่นใจขั้นต่ำของกฎ
# หมายเหตุ: ไม่กรอง lift >= 1 ตั้งแต่ต้น เพราะถ้าข้อมูลไม่มีคู่สินค้าที่
# ซื้อร่วมกันมากกว่าสุ่มเลย การกรองทิ้งจะทำให้ได้ตาราง rules ว่างเปล่า
# ไม่มีประโยชน์ในการวิเคราะห์ จึงแสดงทุกกฎที่ผ่าน min_confidence แล้ว
# ให้ผู้ใช้ดู lift เพื่อตัดสินใจเองว่ากฎไหน "น่าเชื่อถือ" (lift > 1)

# ------------------------------------------------------------------
# 1. โหลดข้อมูล และทำความสะอาดชื่อสินค้า
# ------------------------------------------------------------------
df = pd.read_csv(DATA_PATH)
df["product_name"] = df["product_name"].astype(str).str.strip().str.lower()

# ------------------------------------------------------------------
# 2. กรองเฉพาะบิลที่มีมากกว่า 1 รายการ (บิลเดี่ยวไม่มีคู่ให้วิเคราะห์)
# ------------------------------------------------------------------
items_per_txn = df.groupby("transaction_id")["product_name"].apply(list)
multi_item_txn = items_per_txn[items_per_txn.apply(len) > 1]

print(f"จำนวนบิลทั้งหมด: {len(items_per_txn):,}")
print(f"บิลที่มีมากกว่า 1 รายการ (ใช้วิเคราะห์ได้): {len(multi_item_txn):,}")
print()

if len(multi_item_txn) < 50:
    raise SystemExit(
        "บิลที่มีหลายรายการน้อยเกินไป ไม่พอสำหรับทำ basket analysis "
        "ให้น่าเชื่อถือ ควรเก็บข้อมูลเพิ่ม หรือทบทวนว่า transaction_id "
        "ถูกบันทึกถูกต้องหรือไม่"
    )

# ------------------------------------------------------------------
# 3. แปลงเป็น one-hot transaction matrix แล้วรัน Apriori
# ------------------------------------------------------------------
te = TransactionEncoder()
te_array = te.fit(multi_item_txn.tolist()).transform(multi_item_txn.tolist())
basket_df = pd.DataFrame(te_array, columns=te.columns_)

frequent_itemsets = apriori(basket_df, min_support=MIN_SUPPORT, use_colnames=True)

if frequent_itemsets.empty:
    raise SystemExit(
        "ไม่พบ itemset ที่ผ่านเกณฑ์ min_support ลองลดค่า MIN_SUPPORT ลง"
    )

rules = association_rules(
    frequent_itemsets, metric="confidence", min_threshold=MIN_CONFIDENCE
)
rules = rules.sort_values("lift", ascending=False)

# แปลง frozenset ให้อ่านง่าย
rules["antecedents"] = rules["antecedents"].apply(lambda x: ", ".join(sorted(x)))
rules["consequents"] = rules["consequents"].apply(lambda x: ", ".join(sorted(x)))

rules_out = rules[
    ["antecedents", "consequents", "support", "confidence", "lift"]
].round(4)

n_strong = (rules_out["lift"] > 1.0).sum()
print(f"=== พบกฎความสัมพันธ์ทั้งหมด {len(rules_out)} กฎ ===")
print(f"จำนวนกฎที่ lift > 1.0 (ซื้อคู่กันมากกว่าสุ่ม, น่าเชื่อถือสำหรับ cross-sell): {n_strong}")
print()
print("=== Top 10 คู่สินค้า เรียงตาม lift สูงสุด ===")
print(rules_out.head(10).to_string(index=False))
print()

if n_strong == 0:
    print(
        "*** หมายเหตุสำคัญ: ไม่มีคู่สินค้าใดมี lift > 1.0 เลย ***\n"
        "แปลว่าในข้อมูลชุดนี้ ไม่มี pattern การซื้อร่วมกันที่มากกว่าสุ่มจริงๆ\n"
        "(สินค้าทุกคู่ถูกซื้อร่วมกัน 'น้อยกว่า' ที่คาดจากความสุ่ม)\n"
        "เป็นไปได้ว่าข้อมูล transaction ถูกสร้างแบบสุ่ม (synthetic) โดยไม่ได้จำลอง\n"
        "พฤติกรรมการซื้อของจริง จึงยังใช้ผลลัพธ์นี้ไปแนะนำ cross-sell ไม่ได้\n"
        "แนะนำให้ตรวจสอบที่มาของข้อมูล หรือเก็บข้อมูลการขายจริงเพิ่มก่อนใช้งานจริง\n"
    )


# ------------------------------------------------------------------
# 4. บันทึกผลลัพธ์
# ------------------------------------------------------------------
rules_out.to_csv(CSV_OUT, index=False, encoding="utf-8-sig")
joblib.dump({"rules": rules_out, "frequent_itemsets": frequent_itemsets}, PKL_OUT)

print(f"บันทึก '{PKL_OUT}' และ '{CSV_OUT}' สำเร็จ")
print("\nวิธีใช้งานใน app.py: เมื่อลูกค้าหยิบสินค้า X ลงตะกร้า")
print("ให้ query rules ที่ antecedents มี X อยู่ แล้วแนะนำ consequents ที่ lift สูงสุด")
