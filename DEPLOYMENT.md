# מדריך העלאה ל-GitHub Pages 🚀

## דרישות מוקדמות
- חשבון GitHub (חינמי)
- Git מותקן במחשב ([הורדה](https://git-scm.com/downloads))

## שלב 1: צור Repository חדש ב-GitHub

1. היכנס ל-[GitHub](https://github.com)
2. לחץ על **+** בפינה הימנית העליונה
3. בחר **New repository**
4. מלא את הפרטים:
   - **Repository name**: `water-calculator` (או כל שם אחר)
   - **Description**: מחשבון חיוב מים לישראל 2026
   - **Public** (חשוב!)
   - **אל תסמן** את "Add a README file"
5. לחץ **Create repository**

## שלב 2: העלה את הקבצים מהמחשב

פתח את הטרמינל/CMD בתיקיית הפרויקט והרץ:

```bash
# אתחול Git בתיקייה
git init

# הוסף את כל הקבצים
git add .

# צור commit ראשון
git commit -m "Initial commit - Water Calculator Israel 2026"

# קשר ל-repository שיצרת (החלף את USERNAME בשם המשתמש שלך)
git remote add origin https://github.com/USERNAME/water-calculator.git

# שנה את שם הענף לראשי
git branch -M main

# העלה את הקבצים
git push -u origin main
```

💡 **טיפ**: אם זו הפעם הראשונה שלך עם Git, תצטרך להגדיר:
```bash
git config --global user.name "השם שלך"
git config --global user.email "your-email@example.com"
```

## שלב 3: הפעל GitHub Pages

1. ב-repository שלך ב-GitHub, לחץ על **Settings** (למעלה)
2. בתפריט הצד, לחץ על **Pages**
3. תחת **Source**, בחר:
   - **Branch**: `main`
   - **Folder**: `/ (root)`
4. לחץ **Save**
5. המתן 1-2 דקות

## שלב 4: האתר חי! 🎉

האתר שלך זמין בכתובת:
```
https://USERNAME.github.io/water-calculator/
```

(החלף `USERNAME` בשם המשתמש שלך)

---

## עדכון האתר בעתיד

כשתרצה לעדכן משהו:

```bash
# ערוך את הקבצים
# אחר כך:

git add .
git commit -m "תיאור השינוי"
git push
```

התשתית תתעדכן אוטומטית תוך דקה!

---

## הוספת דומיין מותאם (אופציונלי)

אם יש לך דומיין משלך (כמו `water-calc.co.il`):

1. צור קובץ בשם `CNAME` בתיקיית הפרויקט
2. בתוכו כתוב את הדומיין שלך: `water-calc.co.il`
3. בספק הדומיין, הוסף רשומת CNAME:
   - Name: `www` או `@`
   - Value: `USERNAME.github.io`

---

## פתרון בעיות נפוצות

### 1. "remote origin already exists"
```bash
git remote remove origin
git remote add origin https://github.com/USERNAME/water-calculator.git
```

### 2. "Permission denied"
- וודא שאתה מחובר ל-GitHub
- אולי תצטרך להגדיר SSH key או להשתמש ב-Personal Access Token

### 3. האתר לא מופיע
- המתן 5 דקות
- וודא ש-repository הוא Public
- וודא ש-GitHub Pages מופעל ב-Settings

### 4. הדף מציג README במקום המחשבון
- וודא שיש לך `index.html` בשורש התיקייה
- רענן את הדף (Ctrl+F5)

---

## בדיקה לפני העלאה

✅ כל הקבצים בתיקייה:
- index.html
- styles.css
- calculator.js
- README.md

✅ הקבצים עובדים מקומית (נבדק ✓)

✅ חשבון GitHub קיים

---

## תמיכה נוספת

- [תיעוד GitHub Pages](https://docs.github.com/en/pages)
- [מדריך Git בעברית](https://git-scm.com/book/he/v2)

**בהצלחה! 💙💧**
