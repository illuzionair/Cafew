# Cafew - Bot Discord v14

Bot Discord complet en **discord.js v14** avec systeme de niveaux canvas, messages bienvenue/depart en canvas, et 5 grades configurables.

## Fonctionnalites

- Canvas : Welcome / Leave / Level-up cards en image
- Systeme XP : Gain d'XP par message (avec cooldown 60s anti-spam)
- 5 Grades configurables : Nom, niveau min, couleur, role Discord
- Leaderboard : Classement XP du serveur (top 10)
- Config live : /setgrade modifie config.json en temps reel

## Installation

```bash
npm install
```

Copie `.env.example` en `.env` :
```
TOKEN=ton_token_ici
APPLICATION_ID=ton_application_id
```

Deplois les slash commands :
```bash
node deploy-commands.js
```

Lance le bot :
```bash
node index.js
```

## Commandes

| Commande | Description | Permission |
|---|---|---|
| `/rank [membre]` | Carte de rang canvas | Tout le monde |
| `/leaderboard` | Top 10 XP serveur | Tout le monde |
| `/grades` | Voir les 5 grades | Tout le monde |
| `/setgrade` | Configurer un grade | Manage Server |
| `/setlevelchannel` | Canal level up | Manage Server |
| `/setwelcomechannel` | Canal bienvenue | Manage Server |
| `/setleavechannel` | Canal depart | Manage Server |
| `/autorole` | Role auto a l'arrivee | Manage Server |

## Grades par defaut

| Grade | Niveau min | Couleur |
|---|---|---|
| Novice | 1 | #95a5a6 |
| Bronze | 5 | #cd7f32 |
| Argent | 15 | #bdc3c7 |
| Or | 30 | #f1c40f |
| Diamant | 50 | #1abc9c |

Modifie avec `/setgrade` ou directement dans `config.json`.
