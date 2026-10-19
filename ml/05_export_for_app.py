"""
ส่งออกผลโมเดล (01, 02, 04) เป็น JSON ให้แอป TypeScript/Node อ่านได้
================================================================
แอปรันบน Node ล้วน อ่านไฟล์ .pkl ไม่ได้ จึงคำนวณผลล่วงหน้า (batch) แล้วเก็บเป็น
src/data/modelOutputs.json  -- รันสคริปต์นี้ใหม่ทุกครั้งที่เทรนโมเดลใหม่

ลำดับการรัน (จากโฟลเดอร์ ml/):
  python 00_generate_synthetic_data.py
  python 01_waste_reduction_model.py
  python 02_basket_analysis_model.py
  python 04_baking_demand_model.py
  python 05_export_for_app.py
"""

import json
from collections import Counter
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.metrics import (mean_absolute_error, precision_score, r2_score,
                             recall_score, roc_auc_score)
from sklearn.model_selection import train_test_split

DATA_PATH = "synthetic_bakery_sales.csv"
WASTE_PKL = "artifacts/bakery_waste_model.pkl"
BASKET_CSV = "artifacts/bakery_basket_rules.csv"
DEMAND_PKL = "artifacts/bakery_baking_demand_model_v2_no_discount.pkl"
JSON_OUT = Path("../src/data/modelOutputs.json")
RANDOM_STATE = 42

TH_NAME = {
    "almond croissant": "ครัวซองต์อัลมอนด์ (Almond Croissant)",
    "butter croissant": "ครัวซองต์เนยฝรั่งเศส (Butter Croissant)",
    "classic cheesecake": "ชีสเค้กคลาสสิก (Classic Cheesecake)",
    "fruit tart": "ทาร์ตผลไม้สด (Fruit Tart)",
    "ham cheese sandwich": "แซนด์วิชแฮมชีส (Ham & Cheese Sandwich)",
    "iced americano": "อเมริกาโน่เย็น (Iced Americano)",
    "iced latte": "ลาเต้เย็น (Iced Latte)",
    "iced matcha latte": "มัทฉะลาเต้เย็น (Iced Matcha Latte)",
    "matcha lava cake": "มัทฉะลาวาเค้ก (Matcha Lava Cake)",
    "pineapple pie": "พายสับปะรด (Pineapple Pie)",
    "whole wheat bread": "ขนมปังโฮลวีต (Whole Wheat Bread)",
}
TH_SHORT = {k: v.split(" (")[0] for k, v in TH_NAME.items()}
PERSONA_MAP = {
    "Morning Commuter": "Morning Commuter",
    "Cafe Hopper": "Cafe Hopper",
    "Health & Family": "Health & Family",
    "Evening Hunter": "Evening Discount Hunter",
}
DOW_TH = ["จันทร์", "อังคาร", "พุธ", "พฤหัสบดี", "ศุกร์", "เสาร์", "อาทิตย์"]
SLOTS = {"Morning": range(7, 11), "Midday": range(11, 15), "Afternoon": range(15, 18), "Evening": range(18, 20)}
BAKE_SLOTS = {"morning": range(7, 11), "midday": range(11, 15), "afternoon": range(15, 20)}


def slot_of(h):
    for name, rng in SLOTS.items():
        if h in rng:
            return name
    return "Evening"


# ------------------------------------------------------------------
# โหลดข้อมูล
# ------------------------------------------------------------------
df = pd.read_csv(DATA_PATH)
df["timestamp"] = pd.to_datetime(df["timestamp"])
df["hour"] = df["timestamp"].dt.hour
df["dayofweek"] = df["timestamp"].dt.dayofweek
df["is_weekend"] = df["dayofweek"].isin([5, 6]).astype(int)
df["month"] = df["timestamp"].dt.month
df["product_name"] = df["product_name"].astype(str).str.strip().str.lower()
df["category"] = df["category"].astype(str).str.strip()
df["weather_condition"] = df["weather_condition"].astype(str).str.strip()
df["date"] = df["timestamp"].dt.date

# ==================================================================
# โมเดล 01: ความเสี่ยงของเสีย (สินค้า x ช่วงเวลา) บนชุดทดสอบ
# ==================================================================
wb = joblib.load(WASTE_PKL)
num_w, cat_w = wb["numeric_cols"], wb["categorical_cols"]
Xw = pd.get_dummies(df[num_w + cat_w], columns=cat_w)
yw = df["waste_flag"]
_, Xw_te, _, yw_te = train_test_split(Xw, yw, test_size=0.2, random_state=RANDOM_STATE, stratify=yw)
Xw_te = Xw_te.reindex(columns=wb["feature_columns"], fill_value=0)
proba_w = wb["model"].predict_proba(Xw_te)[:, 1]
pred_w = (proba_w >= 0.5).astype(int)

waste_metrics = {
    "rocAuc": round(float(roc_auc_score(yw_te, proba_w)), 3),
    "recall": round(float(recall_score(yw_te, pred_w)), 3),
    "precision": round(float(precision_score(yw_te, pred_w)), 3),
    "baseRatePct": round(float(yw.mean() * 100), 1),
}

te = df.loc[Xw_te.index].copy()
te["risk"] = proba_w
te["slot"] = te["hour"].map(slot_of)
te = te[te["category"] != "Beverage"]          # เครื่องดื่มไม่มี "ของเสียจากการอบ"
cells = (te.groupby(["product_name", "slot"])
           .agg(risk=("risk", "mean"), actual=("waste_flag", "mean"), n=("risk", "size"))
           .reset_index())
t_lo, t_hi = cells["risk"].quantile([1 / 3, 2 / 3])
waste_risk = []
for prod, g in cells.groupby("product_name"):
    entry = {"product": TH_NAME[prod], "slots": {}}
    for _, r in g.iterrows():
        level = "high" if r["risk"] > t_hi else ("mid" if r["risk"] > t_lo else "low")
        entry["slots"][r["slot"]] = {
            "risk": round(float(r["risk"]), 2),
            "actualWastePct": round(float(r["actual"] * 100), 1),
            "level": level,
            "n": int(r["n"]),
        }
    waste_risk.append(entry)
waste_risk.sort(key=lambda e: -np.mean([s["risk"] for s in e["slots"].values()]))

# ==================================================================
# โมเดล 02: กฎ Market Basket -> รูปแบบเดียวกับ MarketBasketRule ของแอป
# ==================================================================
rules = pd.read_csv(BASKET_CSV)
strong = rules[rules["lift"] > 1.0]
single = strong[~strong["antecedents"].str.contains(",") & ~strong["consequents"].str.contains(",")].copy()
directional = single.copy()   # คงทิศทาง A->B ไว้ใช้กับแผงแนะนำของแคชเชียร์
single["pair"] = single.apply(lambda r: tuple(sorted([r["antecedents"], r["consequents"]])), axis=1)
single = single.sort_values("confidence", ascending=False).drop_duplicates("pair").sort_values("lift", ascending=False)

price_of = df.groupby("product_name")["unit_price_thb"].first().to_dict()
multi_ids = df.groupby("transaction_id").size()
multi_ids = multi_ids[multi_ids > 1].index
multi = df[df["transaction_id"].isin(multi_ids)]
baskets = multi.groupby("transaction_id")["product_name"].apply(set)
seg_of = multi.groupby("transaction_id")["customer_segment"].first()

basket_rules = []
for i, (_, r) in enumerate(single.head(6).iterrows(), start=1):
    a, b = r["antecedents"], r["consequents"]
    both = baskets[baskets.apply(lambda s: a in s and b in s)].index
    segs = Counter(seg_of.loc[both]) if len(both) else Counter()
    segs.pop("Non-Member", None)
    top_seg = segs.most_common(1)[0][0] if segs else "Cafe Hopper"
    regular = int(price_of[a] + price_of[b])
    bundle = int(round(regular * 0.9 / 5) * 5)
    basket_rules.append({
        "id": f"RUL-{i:02d}",
        "antecedent": [TH_NAME[a]],
        "consequent": [TH_NAME[b]],
        "support": round(float(r["support"]), 2),
        "confidence": round(float(r["confidence"]), 2),
        "lift": round(float(r["lift"]), 2),
        "bundleName": f"{TH_SHORT[a]} + {TH_SHORT[b]} Combo",
        "bundlePrice": bundle,
        "regularPrice": regular,
        "targetPersona": PERSONA_MAP.get(top_seg, "Cafe Hopper"),
    })

def persona_for(a, b):
    """กลุ่มลูกค้า (ไม่รวม Non-Member) ที่ซื้อคู่ a+b บ่อยที่สุดในบิลหลายรายการ"""
    both = baskets[baskets.apply(lambda s: a in s and b in s)].index
    segs = Counter(seg_of.loc[both]) if len(both) else Counter()
    segs.pop("Non-Member", None)
    top = segs.most_common(1)[0][0] if segs else "Cafe Hopper"
    return PERSONA_MAP.get(top, "Cafe Hopper")


upsell = []
for trig, g in directional.groupby("antecedents"):
    sugg = []
    for _, r in g.sort_values("lift", ascending=False).head(2).iterrows():
        b = r["consequents"]
        regular = int(price_of[trig] + price_of[b])
        bundle = int(round(regular * 0.9 / 5) * 5)
        sugg.append({
            "suggest": TH_NAME[b], "lift": round(float(r["lift"]), 2),
            "confidence": round(float(r["confidence"]), 2),
            "suggestPrice": int(price_of[b]), "regularPrice": regular, "bundlePrice": bundle,
            "persona": persona_for(trig, b),
        })
    upsell.append({"trigger": TH_NAME[trig], "triggerPrice": int(price_of[trig]), "suggestions": sugg})
upsell.sort(key=lambda u: -u["suggestions"][0]["lift"])

basket_metrics = {
    "totalRules": int(len(rules)),
    "rulesLiftAbove1": int((rules["lift"] > 1).sum()),
    "maxLift": round(float(rules["lift"].max()), 2),
    "multiItemBaskets": int(len(multi_ids)),
}

# ==================================================================
# โมเดล 04: พยากรณ์ความต้องการ (ชุดทดสอบแบ่งตามวันที่ เหมือนสคริปต์เดิม)
# ------------------------------------------------------------------
# ข้อควรระวัง: โมเดล 04 เทรนจากช่อง (วัน, ชั่วโมง, สินค้า) ที่ "มียอดขายอย่างน้อย 1 ชิ้น"
# เท่านั้น จึงตอบได้ว่า "ถ้ามีคนซื้อ จะซื้อกี่ชิ้น" แต่ไม่รู้ว่า "จะมีคนซื้อไหม"
# ถ้าเอาไปทายทุกช่องตรงๆ จะทายเกินจริงมาก (แผนอบสูงกว่ายอดขายจริง ~78%)
# ที่นี่จึงคูณด้วย P(มียอดขายในช่องนั้น) ที่นับจากข้อมูลช่วง train
#     ปริมาณคาดการณ์ = P(ช่องมียอดขาย) x ปริมาณที่โมเดลทาย
# ==================================================================
db = joblib.load(DEMAND_PKL)
agg = (df.groupby(["date", "hour", "dayofweek", "is_weekend", "month",
                   "product_name", "category", "weather_condition"])
         .agg(quantity_sold=("quantity", "sum"), avg_unit_price=("unit_price_thb", "mean"))
         .reset_index().sort_values("date"))
dates = list(agg["date"].unique())
split = int(len(dates) * 0.8)
train_dates, test_dates = dates[:split], dates[split:]
is_we = lambda d: int(pd.Timestamp(d).dayofweek >= 5)

# P(ช่องมียอดขาย) ต่อ (สินค้า, ชั่วโมง, วันธรรมดา/สุดสัปดาห์) จากช่วง train เท่านั้น
n_days = Counter(is_we(d) for d in train_dates)
tr_cells = agg[agg["date"].isin(train_dates)]
p_exist = (tr_cells.groupby(["product_name", "hour", "is_weekend"]).size()
           .rename("n").reset_index())
p_exist["p"] = (p_exist["n"] / p_exist["is_weekend"].map(n_days)).clip(upper=1.0)
P = {(r.product_name, r.hour, r.is_weekend): r.p for r in p_exist.itertuples()}

price_all = (df[["product_name", "category", "unit_price_thb"]].drop_duplicates("product_name")
             .rename(columns={"unit_price_thb": "avg_unit_price"}))


def predict_grid(dow, month, weather, products):
    """คาดการณ์ปริมาณขายทุก (ชั่วโมง x สินค้า) ของวันหนึ่งๆ"""
    parts = []
    for h in range(7, 20):
        r = products.copy()
        r["hour"], r["dayofweek"], r["is_weekend"] = h, dow, int(dow >= 5)
        r["month"], r["weather_condition"] = month, weather
        parts.append(r)
    g = pd.concat(parts, ignore_index=True)
    X = pd.get_dummies(g[db["numeric_cols"] + db["categorical_cols"]], columns=db["categorical_cols"])
    X = X.reindex(columns=db["feature_columns"], fill_value=0)
    g["pred_if_sold"] = db["model"].predict(X)
    g["p_exist"] = [P.get((p, h, w), 0.0) for p, h, w in zip(g["product_name"], g["hour"], g["is_weekend"])]
    g["expected_qty"] = g["pred_if_sold"] * g["p_exist"]
    return g


# --- เมตริกระดับช่อง (ตามสคริปต์เดิม: เฉพาะช่องที่มียอดขาย) ---
tst = agg[agg["date"].isin(test_dates)].copy()
Xd = pd.get_dummies(tst[db["numeric_cols"] + db["categorical_cols"]], columns=db["categorical_cols"])
Xd = Xd.reindex(columns=db["feature_columns"], fill_value=0)
tst["pred"] = db["model"].predict(Xd)
demand_metrics = {
    "mae": round(float(mean_absolute_error(tst["quantity_sold"], tst["pred"])), 2),
    "r2": round(float(r2_score(tst["quantity_sold"], tst["pred"])), 3),
    "testDays": int(len(test_dates)),
}

# --- พยากรณ์ยอดขายรายวัน (ตารางเต็ม ไม่ต้องรู้ล่วงหน้าว่าช่องไหนมียอดขาย) ---
tst["actual_rev"] = tst["quantity_sold"] * tst["avg_unit_price"]
actual_by_day = tst.groupby("date")["actual_rev"].sum()
wx_by_day = df.groupby("date")["weather_condition"].first()
rows = []
for d in test_dates:
    ts = pd.Timestamp(d)
    g = predict_grid(ts.dayofweek, ts.month, wx_by_day[d], price_all)
    rows.append({"date": d, "dow": ts.dayofweek, "actual": actual_by_day.get(d, 0.0),
                 "forecast": float((g["expected_qty"] * g["avg_unit_price"]).sum())})
daily = pd.DataFrame(rows).set_index("date")
daily["ape"] = (daily["forecast"] - daily["actual"]).abs() / daily["actual"] * 100
demand_metrics["dailyMapePct"] = round(float(daily["ape"].mean()), 1)

daily_forecast = []
for dow in range(7):
    g = daily[daily["dow"] == dow]
    label = DOW_TH[dow] + (" (Weekend Peak)" if dow >= 5 else (" (Family Stock)" if dow == 4 else ""))
    daily_forecast.append({
        "day": label,
        "actual": int(round(g["actual"].mean(), -1)),
        "forecast": int(round(g["forecast"].mean(), -1)),
        "accuracy": round(float(100 - g["ape"].mean()), 1),
    })

# --- แผนอบแนะนำต่อรอบ (เฉพาะสินค้าที่อบ ไม่รวมเครื่องดื่ม) x safety margin ---
SAFETY = 1.15
baked_products = price_all[price_all["category"] != "Beverage"]
last_month = int(df["month"].max())


def plan_for(dow, weather="Cloudy"):
    g = predict_grid(dow, last_month, weather, baked_products)
    out = []
    for prod, gp in g.groupby("product_name"):
        item = {"product": TH_NAME[prod]}
        for slot, hrs in BAKE_SLOTS.items():
            item[slot] = int(np.ceil(gp[gp["hour"].isin(list(hrs))]["expected_qty"].sum() * SAFETY))
        item["total"] = item["morning"] + item["midday"] + item["afternoon"]
        out.append(item)
    return sorted(out, key=lambda x: -x["total"])


baking_plan = {"weekday": plan_for(2), "weekend": plan_for(5)}

# ตรวจความสมเหตุสมผล: แผนอบรวมต่อวัน เทียบยอดขายจริงเฉลี่ยต่อวัน (ชิ้น)
act = df[df["category"] != "Beverage"].groupby(["date", "dayofweek"])["quantity"].sum().reset_index()
act_weekday = act[act["dayofweek"] < 5]["quantity"].mean()
act_weekend = act[act["dayofweek"] >= 5]["quantity"].mean()
plan_weekday = sum(i["total"] for i in baking_plan["weekday"])
plan_weekend = sum(i["total"] for i in baking_plan["weekend"])
print(f"[ตรวจสอบ] แผนอบรวม/วัน (ธรรมดา) {plan_weekday} ชิ้น (รวมกันชน {int((SAFETY-1)*100)}%) เทียบยอดขายจริงเฉลี่ย {act_weekday:.0f} ชิ้น")
print(f"[ตรวจสอบ] แผนอบรวม/วัน (สุดสัปดาห์) {plan_weekend} ชิ้น (รวมกันชน {int((SAFETY-1)*100)}%) เทียบยอดขายจริงเฉลี่ย {act_weekend:.0f} ชิ้น")

# ------------------------------------------------------------------
# เขียนไฟล์
# ------------------------------------------------------------------
out = {
    "meta": {
        "dataSource": "synthetic",
        "disclaimer": "ข้อมูลที่ใช้เทรนโมเดลเป็นข้อมูลจำลอง (Synthetic) ที่สร้างขึ้นเพื่อสาธิตระบบ ไม่ใช่ข้อมูลการขายจริง",
        "rows": int(len(df)),
        "transactions": int(df["transaction_id"].nunique()),
        "dateFrom": str(df["timestamp"].min().date()),
        "dateTo": str(df["timestamp"].max().date()),
    },
    "metrics": {"waste": waste_metrics, "basket": basket_metrics, "demand": demand_metrics},
    "dailyForecast": daily_forecast,
    "basketRules": basket_rules,
    "upsell": upsell,
    "wasteRisk": waste_risk,
    "bakingPlan": baking_plan,
    "bakingPlanCheck": {
        "plannedPerDayWeekday": int(plan_weekday), "actualAvgPerDayWeekday": int(round(act_weekday)),
        "plannedPerDayWeekend": int(plan_weekend), "actualAvgPerDayWeekend": int(round(act_weekend)),
    },
}
JSON_OUT.parent.mkdir(parents=True, exist_ok=True)
JSON_OUT.write_text(json.dumps(out, ensure_ascii=False, indent=2), encoding="utf-8")
print(f"เขียน {JSON_OUT} สำเร็จ")
print(json.dumps({"metrics": out["metrics"], "dailyForecast": daily_forecast}, ensure_ascii=False, indent=1))
