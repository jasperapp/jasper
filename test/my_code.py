import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression

train = pd.read_csv('../input/train.csv')
test = pd.read_csv('../input/test.csv')

v = TfidfVectorizer()

X_train = v.fit_transform(train['comment_text'])
X_test = v.transform(test['comment_text'])

for label in ['toxic', 'severe_toxic', 'obscene', 'threat', 'insult', 'identity_hate']:
    y = train[label]
    model = LogisticRegression()
    model.fit(X_train, y)
    test[label] = model.predict_proba(X_test)[:, 1]
    
test.drop('comment_text', axis=1, inplace=True)
test.to_csv('simplest.csv', index=False)