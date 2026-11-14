# 🎅 Amigo Secreto de Natal

Sorteio de amigo secreto com tema de Natal. Usa o **plano gratuito** do Firebase (login + banco), e o site é publicado pelo **GitHub Pages**. Não precisa instalar nada.

- **Site:** GitHub Pages a partir da branch `main` (raiz).
- **Arquivos:** `index.html` (o site), `firebase-config.js` (identifica o projeto Firebase), `firestore.rules` (regras de segurança).
- **Regras de segurança:** não são publicadas pelo GitHub. Copie o conteúdo de `firestore.rules` e cole no console do Firebase, em **Firestore Database → Regras → Publicar**.
- **`src/` e `build.py`:** fontes do site, para quem quiser editar o visual (`python3 build.py` gera o `index.html`). Não são necessários para o site funcionar.

A configuração em `firebase-config.js` não é senha: só identifica o projeto. Quem protege os dados são as regras do Firestore.

## Como funciona
1. O anfitrião entra e cria o grupo (ex.: **SOZ**) → recebe o link de convite.
2. Cada pessoa abre o link, cria a conta (Google ou e-mail e senha) e confirma o nome.
3. O anfitrião dá o OK → cada um vê o próprio amigo secreto entrando no site com a conta da inscrição.
4. Na festa, o anfitrião pode abrir o Dia da Revelação.

Cada resultado só pode ser lido pelo dono da conta. O sorteio roda no navegador do anfitrião na hora do OK.

## Configuração (uma vez)
1. **Firebase:** criar projeto → Authentication (ativar Google e E-mail/senha) → Firestore Database (criar, região São Paulo) → colar `firestore.rules` em Regras → Publicar.
2. **Firebase → Configurações do projeto → Seus apps → Web:** copiar os valores para `firebase-config.js`.
3. **GitHub → Settings → Pages:** branch `main`, pasta `/ (root)`.
4. **Firebase → Authentication → Configurações → Domínios autorizados:** adicionar `SEU-USUARIO.github.io`.
