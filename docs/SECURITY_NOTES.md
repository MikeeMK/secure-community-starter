# Notes sécurité (checklist)

## Anti-abus (MVP)
- [ ] Rate limiting global (déjà en place)
- [ ] Rate limiting par route sensible (register, post, message)
- [ ] Trust score: limiter nouveaux comptes (cap messages/jour, cap topics/jour)
- [ ] Blocage liens externes pour comptes 'new'
- [ ] Heuristiques: comptes multiples, spam répétitif

## Modération
- [ ] Report -> queue (déjà: modèle + endpoints)
- [ ] Admin UI (à faire): liste reports, actions, notes
- [ ] Audit log (à ajouter): every mod/admin action
- [ ] Soft-delete + gel compte

## Uploads
- [ ] Utiliser storage privé + URLs expirantes
- [ ] Scanner uploads (nudité/violence, etc.)
- [ ] Empreintes (perceptual hash) pour reuploads

## Auth
- [ ] Email verification
- [ ] 2FA (optionnel)
- [ ] Password hashing argon2id (remplacer PBKDF2 stub)

## Légalité / conformité
- [ ] TOS + politique contenu
- [ ] Procédure de retrait
- [ ] Traçabilité minimum (logs)
