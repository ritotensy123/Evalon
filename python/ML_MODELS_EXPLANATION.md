# ML Models Implementation Explanation

This document explains how each Machine Learning model is implemented in the Evalon AI Proctoring System.

## Overview

The system uses an **Ensemble Learning** approach, combining 4 individual ML models plus an ensemble model that votes on the final prediction. All models classify student behavior into 3 categories:
- **normal** (class 0): Normal exam-taking behavior
- **suspicious** (class 1): Moderate suspicious activity
- **very_suspicious** (class 2): Highly suspicious activity requiring attention

---

## 1. K-Nearest Neighbors (KNN)

### Implementation Location
```python
from sklearn.neighbors import KNeighborsClassifier

ml_models['knn'] = KNeighborsClassifier(
    n_neighbors=5, 
    weights='distance'
)
```

### How It Works
1. **Algorithm**: Instance-based learning (lazy learning)
2. **Training**: Stores all training samples in memory (no model building)
3. **Prediction Process**:
   - When classifying a new sample, finds the **5 nearest neighbors** (K=5) in the training data
   - Uses **distance-weighted voting**: Closer neighbors have more influence
   - Calculates distance using Euclidean distance in the feature space
   - Assigns class based on majority vote (weighted by distance)

### Why K=5?
- Small enough to capture local patterns
- Large enough to be robust to noise
- Common default value for classification

### Distance-Weighted Voting Formula:
```
weight = 1 / (distance^2)
class_probability = sum(weights of neighbors in that class) / total_weights
```

### Pros
- Simple and intuitive
- No assumptions about data distribution
- Works well with non-linear boundaries
- Adapts to local patterns

### Cons
- Slow for large datasets (must compute distance to all samples)
- Sensitive to irrelevant features
- Requires careful feature scaling

### Feature Scaling
All features are standardized using `StandardScaler` before prediction:
```python
features_scaled = scaler.transform([avg_features])
prediction = knn_model.predict_proba(features_scaled)
```

---

## 2. Naive Bayes

### Implementation Location
```python
from sklearn.naive_bayes import GaussianNB

ml_models['naive_bayes'] = GaussianNB()
```

### How It Works
1. **Algorithm**: Probabilistic classifier based on Bayes' theorem
2. **Assumption**: Features are **conditionally independent** (naive assumption)
3. **Training Process**:
   - Calculates prior probability for each class: P(class)
   - For each feature, calculates mean (μ) and variance (σ²) assuming Gaussian distribution
   - Stores: P(feature | class) for each feature-class combination

4. **Prediction Process**:
   - Uses Bayes' theorem: `P(class | features) = P(features | class) * P(class) / P(features)`
   - Assumes features are independent: `P(features | class) = P(f1|class) * P(f2|class) * ...`
   - For each class, calculates likelihood using Gaussian probability density:
     ```
     P(feature | class) = (1/√(2πσ²)) * exp(-(x-μ)²/(2σ²))
     ```
   - Selects class with highest posterior probability

### Bayes' Theorem Applied:
```
P(normal | face_count=1, phone_prob=0.2, ...) = 
    P(face_count=1 | normal) * P(phone_prob=0.2 | normal) * ... * P(normal)
    / P(features)
```

### Why "Naive"?
- Assumes features are independent, which is often not true
- Example: `multiple_faces` and `face_count` are correlated
- Still works well in practice despite this assumption

### Pros
- Fast training and prediction
- Works well with small datasets
- Handles multiple classes naturally
- Probabilistic outputs (confidence scores)

### Cons
- Independence assumption is often violated
- Less effective when features are highly correlated
- Requires continuous features for GaussianNB (uses Normal distribution)

### Feature Requirements
- Uses `GaussianNB` which assumes features follow a Normal (Gaussian) distribution
- Features are standardized to help meet this assumption

---

## 3. Decision Tree

### Implementation Location
```python
from sklearn.tree import DecisionTreeClassifier

ml_models['decision_tree'] = DecisionTreeClassifier(
    max_depth=10, 
    random_state=42
)
```

### How It Works
1. **Algorithm**: Tree-based classifier that splits data recursively
2. **Training Process** (Greedy algorithm):
   - Starts with all training data at root node
   - **For each node**:
     - Finds best feature and threshold to split on
     - Uses **Gini impurity** or **information gain** to measure split quality
     - Splits data into left/right child nodes
     - Recursively repeats for each child
   - **Stopping conditions**:
     - Reached `max_depth=10`
     - Node has too few samples
     - No improvement from splitting
   - Leaf nodes store class probabilities based on samples in that node

3. **Split Selection**:
   - Tests all features and thresholds
   - Chooses split that maximizes information gain:
     ```
     Information Gain = Entropy(parent) - [Weighted average of child entropies]
     ```
   - Gini impurity (alternative metric):
     ```
     Gini = 1 - Σ(p(class)²)
     ```

4. **Prediction Process**:
   - Start at root node
   - Follow path down tree based on feature values
   - At leaf node, return class probabilities

### Example Tree Structure (Simplified):
```
Root: face_count <= 1.5?
├─ Yes: phone_prob <= 0.4?
│  ├─ Yes: → Normal (95% confidence)
│  └─ No: → Suspicious (70% confidence)
└─ No: multiple_faces == 1?
   ├─ Yes: → Very Suspicious (90% confidence)
   └─ No: → Suspicious (60% confidence)
```

### Why max_depth=10?
- Prevents overfitting (too deep = memorizes training data)
- Balances complexity and generalization
- 10 levels allows capturing complex patterns while staying generalizable

### Pros
- Easy to interpret (can visualize the tree)
- Handles non-linear relationships
- Feature importance scores available
- No assumptions about data distribution

### Cons
- Prone to overfitting without depth limits
- Can be unstable (small data changes can change tree structure)
- Tends to create biased trees (favors features with more levels)

---

## 4. Support Vector Machine (SVM)

### Implementation Location
```python
from sklearn.svm import SVC

ml_models['svm'] = SVC(
    kernel='rbf', 
    probability=True, 
    random_state=42
)
```

### How It Works
1. **Algorithm**: Finds optimal decision boundary (hyperplane) that maximizes margin
2. **Kernel**: RBF (Radial Basis Function) - non-linear kernel
3. **Training Process**:
   - Maps data to higher-dimensional space using RBF kernel
   - Finds optimal hyperplane that maximizes margin between classes
   - Uses **support vectors** (data points closest to decision boundary)
   - Solves optimization problem (minimize hinge loss + regularization)

4. **RBF Kernel Function**:
   ```
   K(x1, x2) = exp(-γ * ||x1 - x2||²)
   ```
   - Maps data to infinite-dimensional feature space
   - γ (gamma) is automatically tuned by sklearn
   - Creates non-linear decision boundaries in original space

5. **Prediction Process**:
   - Computes kernel similarity to support vectors
   - Weighted sum of support vector contributions
   - Classifies based on which side of hyperplane the point falls

### Margin Maximization:
```
SVM finds hyperplane that maximizes the "margin" (distance to nearest points)
Goal: w·x + b = 0 such that margin is maximized
```

### Why RBF Kernel?
- Can capture complex non-linear patterns
- More flexible than linear kernel
- Works well when relationships are not linear
- Default choice for many classification problems

### Pros
- Effective with high-dimensional data
- Memory efficient (only stores support vectors)
- Versatile (different kernels for different problems)
- Regularization prevents overfitting

### Cons
- Slow training on large datasets
- Requires feature scaling
- Not very interpretable
- Sensitive to hyperparameters (though defaults often work)

### Probability=True
- Enables `predict_proba()` to return probability estimates
- Uses Platt scaling (logistic regression on SVM scores)
- Provides confidence scores, not just hard predictions

---

## 5. Ensemble (Voting Classifier)

### Implementation Location
```python
from sklearn.ensemble import VotingClassifier

ml_models['ensemble'] = VotingClassifier(
    estimators=[
        ('knn', ml_models['knn']),
        ('nb', ml_models['naive_bayes']),
        ('dt', ml_models['decision_tree']),
        ('svm', ml_models['svm']),
    ],
    voting='soft'  # Use probability voting
)
```

### How It Works
1. **Algorithm**: Combines predictions from multiple base models
2. **Voting Type**: **Soft Voting** (uses probability scores)
3. **Prediction Process**:
   - Each model makes prediction and returns class probabilities
   - Averaging probabilities across all models:
     ```
     P(class | ensemble) = (P_knn + P_nb + P_dt + P_svm) / 4
     ```
   - Final prediction: Class with highest average probability

### Example:
```
Input features → All 4 models predict:

KNN:        Normal=0.7,  Suspicious=0.2,  Very_Suspicious=0.1
Naive Bayes: Normal=0.6,  Suspicious=0.3,  Very_Suspicious=0.1
Decision Tree: Normal=0.5,  Suspicious=0.4,  Very_Suspicious=0.1
SVM:        Normal=0.8,  Suspicious=0.15, Very_Suspicious=0.05

Ensemble Average:
Normal:        (0.7+0.6+0.5+0.8)/4 = 0.65
Suspicious:    (0.2+0.3+0.4+0.15)/4 = 0.26
Very_Suspicious: (0.1+0.1+0.1+0.05)/4 = 0.09

→ Final Prediction: Normal (0.65)
```

### Soft Voting vs Hard Voting
- **Soft Voting** (used here): Averages probability scores
  - More nuanced, considers model confidence
  - Better when models output probabilities
  
- **Hard Voting** (alternative): Majority vote on class labels
  - Simpler but loses confidence information
  - Good when models only output class labels

### Why Ensemble?
- **Reduces Overfitting**: One model's error compensated by others
- **Improves Accuracy**: Combines strengths of different algorithms
- **More Robust**: Less sensitive to specific training data
- **Diversity**: Different models make different types of errors

### Model Diversity Benefits:
- **KNN**: Captures local patterns
- **Naive Bayes**: Probabilistic reasoning
- **Decision Tree**: Interpretable rules
- **SVM**: Complex boundary detection

Together, they complement each other's weaknesses.

---

## Feature Extraction

Before any model makes predictions, features are extracted from the frame:

### Feature Vector (17 features total):
```python
[
    face_count,              # 1: Number of faces (0, 1, 2+)
    faces_detected,          # 2: Boolean (0 or 1)
    multiple_faces,          # 3: Boolean (0 or 1)
    pose_center,            # 4: One-hot encoded head pose (7 features)
    pose_left,
    pose_right,
    pose_up,
    pose_down,
    pose_away,
    pose_unknown,
    phone_prob,              # 11: Phone detection probability (0-1)
    is_idle,                 # 12: Boolean (0 or 1)
    audio_level,             # 13: Normalized audio (0-1)
    no_face_duration,        # 14: Seconds without face (normalized)
    face_area,               # 15: Face size relative to frame (0-1)
    face_x_position,         # 16: Normalized X position (0-1)
    face_y_position          # 17: Normalized Y position (0-1)
]
```

### Feature Scaling
All features are standardized using `StandardScaler`:
```python
# During training
scaler.fit(X)  # Learns mean and std of each feature

# During prediction
features_scaled = scaler.transform([features])
# Formula: (x - mean) / std
```

**Why Scale?**
- KNN: Distance-based, needs features on same scale
- SVM: Sensitive to feature magnitudes
- Decision Tree: Not required, but helps convergence
- Naive Bayes: Better with standardized features

---

## Multi-Frame Averaging

The system uses a **frame buffer** to smooth predictions:

### Implementation:
```python
FRAME_BUFFER_SIZE = 5  # Keep last 5 frames
frame_buffer = []  # Stores feature vectors

# When enough frames collected (≥3 frames):
weights = [0.5, 0.75, 1.0]  # Recent frames weighted more
avg_features = weighted_average(frame_buffer[-3:], weights)
```

### Why Multi-Frame Averaging?
- **Reduces Noise**: Single frame might have temporary errors
- **Smooth Transitions**: Prevents rapid classification changes
- **More Stable**: Consistent behavior over time
- **Better for Normal Detection**: Normal behavior should be consistent

---

## Final Prediction Logic

### Step-by-Step Process:

1. **Extract Features**: From current frame (17 features)
2. **Add to Buffer**: Store in frame_buffer (max 5 frames)
3. **Average Features**: Weighted average of last 3 frames (if available)
4. **Scale Features**: Standardize using pre-fitted scaler
5. **Individual Predictions**: Each model (KNN, NB, DT, SVM) predicts probabilities
6. **Ensemble Prediction**: VotingClassifier combines predictions
7. **Final Combination**: 
   ```python
   final_probs = 0.6 * ensemble_probs + 0.4 * individual_avg
   ```
8. **Normal Boost**: If 3/3 recent frames suggest normal, boost normal probability by 20%
9. **Output**: Classification + confidence + probabilities + individual predictions

### Weighting:
- **Ensemble**: 60% weight (combined wisdom)
- **Individual Average**: 40% weight (direct average)
- Recent frames weighted more heavily in averaging

---

## Training Data

### Synthetic Data Generation:
Models are trained on 100 synthetic samples:
- **50 Normal** examples: 1 face, center pose, low phone, low audio
- **25 Suspicious** examples: Gaze away, medium phone, sometimes idle
- **25 Very Suspicious** examples: Multiple faces OR high phone OR no face

### Why Synthetic?
- Quick startup without real data
- Establishes baseline behavior
- Can be improved with real exam data later

---

## Model Performance Comparison

### Characteristics Summary:

| Model | Speed | Interpretability | Non-linear | Pros | Cons |
|-------|-------|------------------|------------|------|------|
| **KNN** | Slow | Medium | Yes | Simple, local patterns | Memory intensive |
| **Naive Bayes** | Fast | Medium | No | Fast, probabilistic | Independence assumption |
| **Decision Tree** | Medium | High | Yes | Interpretable, rules | Overfitting risk |
| **SVM** | Slow | Low | Yes | Complex boundaries | Hyperparameter sensitive |
| **Ensemble** | Slowest | Low | Yes | Robust, accurate | Requires all models |

---

## Code Flow Example

```python
# 1. Extract features from frame
features = extract_features(frame, face_result, head_pose, phone_prob, ...)
# Returns: [1.0, 1.0, 0.0, 1.0, 0.0, ..., 0.1, 0.4, 0.0]

# 2. Add to buffer and average
frame_buffer.append(features)
avg_features = weighted_average(frame_buffer[-3:])

# 3. Scale features
features_scaled = scaler.transform([avg_features])  # Standardize

# 4. Individual predictions
knn_probs = knn_model.predict_proba(features_scaled)      # [0.7, 0.2, 0.1]
nb_probs = naive_bayes_model.predict_proba(features_scaled)  # [0.6, 0.3, 0.1]
dt_probs = decision_tree_model.predict_proba(features_scaled) # [0.5, 0.4, 0.1]
svm_probs = svm_model.predict_proba(features_scaled)      # [0.8, 0.15, 0.05]

# 5. Ensemble prediction
ensemble_probs = ensemble_model.predict_proba(features_scaled) # [0.65, 0.26, 0.09]

# 6. Final combination
individual_avg = mean([knn_probs, nb_probs, dt_probs, svm_probs])
final_probs = 0.6 * ensemble_probs + 0.4 * individual_avg

# 7. Boost normal if consistent
if last_3_frames_all_normal:
    final_probs[0] *= 1.20  # Boost normal
    final_probs = normalize(final_probs)

# 8. Output
predicted_class = argmax(final_probs)  # Returns 0, 1, or 2
confidence = final_probs[predicted_class]
```

---

## Summary

The system uses **ensemble learning** to combine multiple ML algorithms, each with different strengths:

1. **KNN**: Finds similar past behaviors
2. **Naive Bayes**: Probabilistic classification
3. **Decision Tree**: Rule-based reasoning
4. **SVM**: Complex boundary detection
5. **Ensemble**: Combines all predictions for robust classification

All models work together to classify student behavior, with the ensemble providing the final robust prediction based on weighted voting of all individual models.



