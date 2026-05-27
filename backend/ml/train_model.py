import numpy as np
from xgboost import XGBClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import precision_score, recall_score, f1_score, classification_report
from imblearn.over_sampling import SMOTE
import joblib
import random

def generate_training_data(n_samples=2000):
    data = []
    labels = []
    for _ in range(int(n_samples * 0.8)):
        amount = random.uniform(100, 9000)
        data.append([amount, 0, 0, random.randint(1, 5), random.randint(8, 20)])
        labels.append(0)
    for _ in range(int(n_samples * 0.2)):
        pattern = random.choice(["large", "suspicious", "round", "rapid"])
        if pattern == "large":
            data.append([random.uniform(50001, 500000), 0, 1, random.randint(1, 3), random.randint(0, 6)])
        elif pattern == "suspicious":
            data.append([random.uniform(5000, 50000), 0, 1, random.randint(3, 10), random.randint(0, 6)])
        elif pattern == "round":
            data.append([random.choice([10000, 20000, 50000, 100000]), 1, 1, random.randint(2, 8), random.randint(1, 5)])
        else:
            data.append([random.uniform(3000, 9000), 0, 1, random.randint(8, 20), random.randint(2, 4)])
        labels.append(1)
    return np.array(data), np.array(labels)

def train_xgboost_model():
    print("Generating training data...")
    X, y = generate_training_data(2000)
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    print("Applying SMOTE...")
    smote = SMOTE(random_state=42)
    X_train_sm, y_train_sm = smote.fit_resample(X_train, y_train)
    print("Training XGBoost...")
    model = XGBClassifier(n_estimators=100, max_depth=6, learning_rate=0.1, random_state=42, eval_metric='logloss')
    model.fit(X_train_sm, y_train_sm)
    y_pred = model.predict(X_test)
    print(f"\nPrecision: {precision_score(y_test, y_pred):.2f}")
    print(f"Recall:    {recall_score(y_test, y_pred):.2f}")
    print(f"F1 Score:  {f1_score(y_test, y_pred):.2f}")
    print(classification_report(y_test, y_pred))
    joblib.dump(model, 'ml/xgboost_model.pkl')
    print("Model saved!")
    return model

def train_from_csv(csv_path: str):
    import pandas as pd
    print("Loading CSV data...")
    df = pd.read_csv(csv_path)
    suspicious_names = ["Unknown", "Anonymous", "Offshore_Account"]
    df['is_suspicious'] = df['receiver'].apply(lambda x: 1 if x in suspicious_names else 0)
    df['is_round'] = df['amount'].apply(lambda x: 1 if x % 10000 == 0 and x >= 10000 else 0)
    df['hour'] = 12
    df['tx_count'] = 1
    X = df[['amount', 'is_round', 'is_suspicious', 'tx_count', 'hour']].values
    y = df['is_fraud'].values
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    smote = SMOTE(random_state=42)
    X_train_sm, y_train_sm = smote.fit_resample(X_train, y_train)
    model = XGBClassifier(n_estimators=100, max_depth=6, learning_rate=0.1, random_state=42, eval_metric='logloss')
    model.fit(X_train_sm, y_train_sm)
    y_pred = model.predict(X_test)
    print(f"Precision: {precision_score(y_test, y_pred):.2f}")
    print(f"Recall:    {recall_score(y_test, y_pred):.2f}")
    print(f"F1 Score:  {f1_score(y_test, y_pred):.2f}")
    joblib.dump(model, 'ml/xgboost_model.pkl')
    print("Model saved!")

if __name__ == "__main__":
    import sys
    if len(sys.argv) > 1:
        train_from_csv(sys.argv[1])
    else:
        train_xgboost_model()