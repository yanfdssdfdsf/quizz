# 🎮 Quiz Master

Application de quiz interactif avec mode solo et multijoueur.

## 🚀 Déploiement sur Vercel

### Structure du projet
```
quiz-master/
├── index.html
├── package.json
├── vite.config.js
├── .gitignore
└── src/
    ├── main.jsx
    └── App.jsx
```

### Étapes de déploiement

1. **Push sur GitHub**
   ```bash
   git add .
   git commit -m "Setup Vite structure for Vercel"
   git push origin main
   ```

2. **Configuration Vercel**
   - Framework Preset: **Vite**
   - Build Command: `vite build`
   - Output Directory: `dist`
   - Install Command: `npm install`

3. **Variables d'environnement** (optionnel)
   - `VITE_GEMINI_API_KEY` (si tu veux sécuriser la clé API)

## 🛠️ Développement local

```bash
npm install
npm run dev
```

## ✨ Fonctionnalités

- 🎯 Mode Solo et Multijoueur
- 🔐 Système de comptes utilisateur
- 📊 Historique des parties
- 🎨 Interface moderne avec Tailwind CSS
- 🤖 Questions générées par Gemini AI
- 👥 Lobbies multijoueurs avec code
- 📱 Responsive design

## 🔑 API

Utilise Google Gemini 1.5 Flash pour la génération de questions.
