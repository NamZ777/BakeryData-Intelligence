"""
โมเดลที่ 4: Baking Demand Forecast (แก้ไขจากโมเดลเดิมที่ scale ผิด)
=====================================================================
คำถาม: "ช่วงเวลานั้นๆ ควรอบขนมกี่ชิ้น?"

วิธีการ:
  1. รวมยอดขาย (quantity) ระดับ วันที่ + ชั่วโมง + ชนิดสินค้า เข้าด้วยกัน
     (จากเดิมที่ข้อมูลเป็นระดับ "1 แถว = 1 รายการในบิล" ซึ่งเล็กเกินไป
     และไม่ตรงกับคำถามที่ต้องการ "รวมทั้งช่วงเวลา")
  2. เทรน Regression model ทำนาย "จำนวนชิ้นที่จะขายได้" ต่อ (วัน, ชั่วโมง, สินค้า)
  3. แบ่ง train/test ตาม "วันที่" (ไม่ใช่สุ่มแถว) เพื่อจำลองสถานการณ์จริง
     ที่ต้องพยากรณ์วันข้างหน้าจากข้อมูลวันที่ผ่านมาแล้ว

หมายเหตุ (v2): ตัดตัวแปร discount_percent ออกจาก features แล้ว เพราะตอน
พยากรณ์ล่วงหน้าจริง เรายังไม่รู้ว่าจะมีส่วนลดเท่าไหร่ (เป็น business decision
ที่เกิดทีหลัง การใส่เป็น input จะทำให้โมเดล "โกง" ดูคำตอบล่วงหน้า / data leakage)
เวอร์ชันนี้จึงพยากรณ์จาก เวลา + สินค้า + อากาศ + ราคา ล้วนๆ เพื่อดูความสามารถ
พยากรณ์ที่แท้จริงของโมเดล

Output: bakery_baking_demand_model_v2_no_discount.pkl
        ใช้ recommend_baking_quantity() ท้ายไฟล์นี้ เพื่อดูคำแนะนำอบขนม
"""

import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
import joblib

RANDOM_STATE = 42
DATA_PATH = "synthetic_bakery_sales.csv"
MODEL_OUT = "artifacts/bakery_baking_demand_model_v2_no_discount.pkl"

# ------------------------------------------------------------------
# 1. โหลดข้อมูล + เตรียม time features
# ------------------------------------------------------------------
df = pd.read_csv(DATA_PATH)
df["timestamp"] = pd.to_datetime(df["timestamp"])
df["date"] = df["timestamp"].dt.date
df["hour"] = df["timestamp"].dt.hour
df["dayofweek"] = df["timestamp"].dt.dayofweek
df["is_weekend"] = df["dayofweek"].isin([5, 6]).astype(int)
df["month"] = df["timestamp"].dt.month
df["product_name"] = df["product_name"].astype(str).str.strip().str.lower()
df["category"] = df["category"].astype(str).str.strip()
df["weather_condition"] = df["weather_condition"].astype(str).str.strip()

# ------------------------------------------------------------------
# 2. รวมยอดขายระดับ (วันที่, ชั่วโมง, สินค้า)
#    -> นี่คือ "หน่วย" ที่ตรงกับคำถาม: ช่วงเวลานั้นๆ (วัน+ชั่วโมง) ขายสินค้า X ไปกี่ชิ้น
# ------------------------------------------------------------------
agg = (
    df.groupby(["date", "hour", "dayofweek", "is_weekend", "month",
                "product_name", "category", "weather_condition"])
    .agg(
        quantity_sold=("quantity", "sum"),
        avg_unit_price=("unit_price_thb", "mean"),
    )
    .reset_index()
)

print(f"จำนวนแถวหลังรวม (date x hour x product): {len(agg):,}")
print("สถิติ quantity_sold ต่อ (วัน, ชั่วโมง, สินค้า):")
print(agg["quantity_sold"].describe().round(2))
print()

# ------------------------------------------------------------------
# 3. แบ่ง Train/Test ตามวันที่ (time-based split)
#    ใช้ข้อมูล 80% แรกตามลำดับเวลาเทรน ที่เหลือ 20% ท้ายสุดทดสอบ
#    (สมจริงกว่าสุ่มแบ่ง เพราะการพยากรณ์ demand ต้องทายอนาคตจากอดีต)
# ------------------------------------------------------------------
agg = agg.sort_values("date")
unique_dates = agg["date"].unique()
split_idx = int(len(unique_dates) * 0.8)
train_dates = unique_dates[:split_idx]
test_dates = unique_dates[split_idx:]

train_df = agg[agg["date"].isin(train_dates)]
test_df = agg[agg["date"].isin(test_dates)]

feature_cols_numeric = [
    "hour", "dayofweek", "is_weekend", "month", "avg_unit_price"
]  # ตัด avg_discount ออก: ตอนพยากรณ์ล่วงหน้าจริง เรายังไม่รู้ว่าจะลดราคาเท่าไหร่
   # (เป็น business decision ที่เกิดทีหลัง ใส่เป็น input จะเป็น data leakage)
feature_cols_categorical = ["product_name", "category", "weather_condition"]

X_train_raw = train_df[feature_cols_numeric + feature_cols_categorical]
X_test_raw = test_df[feature_cols_numeric + feature_cols_categorical]

X_train = pd.get_dummies(X_train_raw, columns=feature_cols_categorical)
X_test = pd.get_dummies(X_test_raw, columns=feature_cols_categorical)
X_test = X_test.reindex(columns=X_train.columns, fill_value=0)  # กันคอลัมน์ไม่ตรงกัน

y_train = train_df["quantity_sold"]
y_test = test_df["quantity_sold"]

print(f"Train: {len(X_train):,} แถว ({train_dates.min()} ถึง {train_dates.max()})")
print(f"Test : {len(X_test):,} แถว ({test_dates.min()} ถึง {test_dates.max()})")
print()

# ------------------------------------------------------------------
# 4. เทรนโมเดล
# ------------------------------------------------------------------
model = RandomForestRegressor(
    n_estimators=300, max_depth=10, min_samples_leaf=5,
    random_state=RANDOM_STATE, n_jobs=-1,
)
model.fit(X_train, y_train)

# ------------------------------------------------------------------
# 5. ประเมินผล
# ------------------------------------------------------------------
y_pred = model.predict(X_test)
mae = mean_absolute_error(y_test, y_pred)
rmse = np.sqrt(mean_squared_error(y_test, y_pred))
r2 = r2_score(y_test, y_pred)

print("=== ผลการประเมินโมเดล Baking Demand Forecast ===")
print(f"MAE  : {mae:.2f} ชิ้น   (พยากรณ์คลาดเคลื่อนเฉลี่ย +/- เท่านี้)")
print(f"RMSE : {rmse:.2f} ชิ้น")
print(f"R²   : {r2:.4f}")
print(f"เทียบกับ quantity_sold เฉลี่ยจริง {y_test.mean():.2f} ชิ้น -> MAE คิดเป็น {mae/y_test.mean()*100:.1f}% ของค่าเฉลี่ย")
print()

importances = pd.Series(model.feature_importances_, index=X_train.columns)
print("=== Top 10 ปัจจัยที่มีผลต่อยอดขายต่อชั่วโมง ===")
print(importances.sort_values(ascending=False).head(10).round(4))
print()

# ------------------------------------------------------------------
# 6. บันทึกโมเดล
# ------------------------------------------------------------------
joblib.dump(
    {
        "model": model,
        "feature_columns": list(X_train.columns),
        "numeric_cols": feature_cols_numeric,
        "categorical_cols": feature_cols_categorical,
    },
    MODEL_OUT,
)
print(f"บันทึกโมเดลที่ '{MODEL_OUT}' สำเร็จ")


# ------------------------------------------------------------------
# 7. ฟังก์ชันตัวอย่าง: แนะนำจำนวนที่ควรอบ ต่อสินค้า ในช่วงเวลาที่กำหนด
# ------------------------------------------------------------------
def recommend_baking_quantity(model_bundle, hour, dayofweek, month,
                                weather_condition, product_list_df,
                                safety_margin=1.15):
    """
    คืนค่าตาราง: สินค้าแต่ละชนิด ควรอบกี่ชิ้น สำหรับชั่วโมง/วัน/เดือน/อากาศที่กำหนด
    safety_margin: กันชนของเสีย/ขาดสต็อก (1.15 = อบเผื่อ 15% จากค่าพยากรณ์)
    """
    mdl = model_bundle["model"]
    feat_cols = model_bundle["feature_columns"]
    num_cols = model_bundle["numeric_cols"]
    cat_cols = model_bundle["categorical_cols"]

    rows = product_list_df.copy()
    rows["hour"] = hour
    rows["dayofweek"] = dayofweek
    rows["is_weekend"] = int(dayofweek in [5, 6])
    rows["month"] = month
    rows["weather_condition"] = weather_condition

    X = rows[num_cols + cat_cols]
    X_enc = pd.get_dummies(X, columns=cat_cols)
    X_enc = X_enc.reindex(columns=feat_cols, fill_value=0)

    pred = mdl.predict(X_enc)
    rows["predicted_quantity"] = np.round(pred, 1)
    rows["recommended_bake_qty"] = np.ceil(pred * safety_margin).astype(int)
    return rows[["product_name", "predicted_quantity", "recommended_bake_qty"]]


if __name__ == "__main__":
    # ตัวอย่างการใช้งาน: พยากรณ์สำหรับ "วันเสาร์ เวลา 8 โมงเช้า เดือนมิถุนายน อากาศแดดจัด"
    product_ref = df[["product_name", "category", "unit_price_thb"]].drop_duplicates(
        "product_name"
    ).rename(columns={"unit_price_thb": "avg_unit_price"})

    bundle = joblib.load(MODEL_OUT)
    example = recommend_baking_quantity(
        bundle,
        hour=8, dayofweek=5, month=6, weather_condition="Sunny",
        product_list_df=product_ref,
    )
    print("\n=== ตัวอย่าง: คำแนะนำอบขนม วันเสาร์ 08:00 น. เดือน มิ.ย. อากาศแดดจัด ===")
    print(example.sort_values("recommended_bake_qty", ascending=False).to_string(index=False))
