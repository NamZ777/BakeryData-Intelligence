"""
โมเดลที่ 1: Waste Reduction Model
==================================
เป้าหมาย: ลดของเสีย 20%
วิธีการ: Classification model ทำนายความน่าจะเป็นที่สินค้าแต่ละรายการขาย
         จะกลายเป็นของเสีย (waste_flag) จาก pattern เวลา/สินค้า/สภาพอากาศ/ส่วนลด

Output: bakery_waste_model.pkl
        ใช้ predict_proba() เพื่อได้ "ความเสี่ยงของเสีย" (0-1) รายสินค้า/ช่วงเวลา
        แล้วนำไปปรับปริมาณสั่งผลิต/สั่งซื้อล่วงหน้า
"""

import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    classification_report, roc_auc_score, confusion_matrix, f1_score
)
import joblib

RANDOM_STATE = 42
DATA_PATH = "synthetic_bakery_sales.csv"
MODEL_OUT = "artifacts/bakery_waste_model.pkl"

# ------------------------------------------------------------------
# 1. โหลดและเตรียมข้อมูล
# ------------------------------------------------------------------
df = pd.read_csv(DATA_PATH)
df["timestamp"] = pd.to_datetime(df["timestamp"])

df["hour"] = df["timestamp"].dt.hour
df["dayofweek"] = df["timestamp"].dt.dayofweek
df["is_weekend"] = df["dayofweek"].isin([5, 6]).astype(int)
df["month"] = df["timestamp"].dt.month

# ทำความสะอาดชื่อสินค้า (เผื่อมีรูปแบบไม่สม่ำเสมอหลงเหลือ)
df["product_name"] = df["product_name"].astype(str).str.strip().str.lower()
df["category"] = df["category"].astype(str).str.strip()
df["weather_condition"] = df["weather_condition"].astype(str).str.strip()

feature_cols_numeric = [
    "hour", "dayofweek", "is_weekend", "month",
    "unit_price_thb", "discount_percent", "quantity",
]
feature_cols_categorical = ["product_name", "category", "weather_condition"]

X = df[feature_cols_numeric + feature_cols_categorical].copy()
X_encoded = pd.get_dummies(X, columns=feature_cols_categorical)
y = df["waste_flag"]

print("=== สัดส่วนคลาส waste_flag ===")
print(y.value_counts(normalize=True).rename("proportion"))
print()

# ------------------------------------------------------------------
# 2. แบ่ง Train / Test (stratify เพราะ waste_flag ไม่สมดุล ~8%)
# ------------------------------------------------------------------
X_train, X_test, y_train, y_test = train_test_split(
    X_encoded, y, test_size=0.2, random_state=RANDOM_STATE, stratify=y
)

# ------------------------------------------------------------------
# 3. เทรนโมเดล
#    class_weight="balanced" เพราะของเสียเป็นกลุ่มส่วนน้อย (~8%)
#    ไม่ทำแบบนี้โมเดลจะทายว่า "ไม่เสีย" ตลอดแล้วแม่นยำดูสูงหลอกๆ
# ------------------------------------------------------------------
model = RandomForestClassifier(
    n_estimators=300,
    max_depth=12,
    min_samples_leaf=5,
    class_weight="balanced",
    random_state=RANDOM_STATE,
    n_jobs=-1,
)
model.fit(X_train, y_train)

# ------------------------------------------------------------------
# 4. ประเมินผล
# ------------------------------------------------------------------
y_pred = model.predict(X_test)
y_proba = model.predict_proba(X_test)[:, 1]

print("=== ผลการประเมินโมเดล Waste Reduction ===")
print(classification_report(y_test, y_pred, target_names=["ไม่เสีย", "เสีย"]))
print(f"ROC-AUC : {roc_auc_score(y_test, y_proba):.4f}")
print(f"F1-score (waste=1): {f1_score(y_test, y_pred):.4f}")
print("Confusion Matrix:\n", confusion_matrix(y_test, y_pred))
print()

# Feature importance top 10
importances = pd.Series(model.feature_importances_, index=X_encoded.columns)
print("=== Top 10 ปัจจัยที่ทำให้เกิดของเสีย ===")
print(importances.sort_values(ascending=False).head(10).round(4))
print()

# ------------------------------------------------------------------
# 5. บันทึกโมเดล + รายชื่อ feature columns (จำเป็นสำหรับตอน deploy)
# ------------------------------------------------------------------
joblib.dump(
    {
        "model": model,
        "feature_columns": list(X_encoded.columns),
        "numeric_cols": feature_cols_numeric,
        "categorical_cols": feature_cols_categorical,
    },
    MODEL_OUT,
)
print(f"บันทึกโมเดลที่ '{MODEL_OUT}' สำเร็จ")
print("\nวิธีใช้งาน: model.predict_proba(X_new)[:, 1] จะได้ 'ความเสี่ยงของเสีย' (0-1)")
print("ตั้ง threshold (เช่น > 0.3) เพื่อแจ้งเตือนให้ลดปริมาณสั่งผลิตล่วงหน้า")
