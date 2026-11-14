# 🎅 Amigo Secreto de Natal — Firebase (plano gratuito)

Site com tema de Natal para sorteio de amigo secreto. Roda **100% no plano gratuito (Spark)** do Firebase: Hosting + Authentication + Firestore. Não usa Cloud Functions nem envia e-mails.

## Como funciona
1. O **anfitrião** entra (Google ou e-mail e senha) e cria um grupo (ex.: **SOZ**), com data e valor.
2. O site gera o **link de convite** (dá para mandar direto no WhatsApp).
3. Cada pessoa abre o link, **cria uma conta** (Google ou e-mail e senha) e confirma o nome. O anfitrião também se inscreve pelo mesmo formulário.
4. O anfitrião acompanha os inscritos, remove quem entrou por engano e dá o **OK**.
5. O sorteio é gravado e **cada pessoa vê o próprio amigo secreto entrando no site com a conta dela**, no link do grupo ou em 🏠 Início → "Meus amigos secretos".
6. O anfitrião vê quem já abriu o presente (✓) e, na festa, pode abrir o **Dia da Revelação** (revelação em corrente).

Regras do sorteio: ninguém tira o próprio nome, e no máximo 2 correntes a cada 15 pessoas (não aparece no site).

### Sigilo
- Pelas regras do Firestore, cada resultado só pode ser lido **pelo próprio dono da conta**.
- A lista completa de pares só abre para o anfitrião quando ele inicia o Dia da Revelação, e isso não pode ser desfeito.
- Limitação honesta: o sorteio é feito no navegador do anfitrião, no momento do OK. Ele não vê o resultado pelo site, mas alguém com conhecimento técnico poderia espiar pelas ferramentas de desenvolvedor do navegador nesse momento. Para um amigo secreto entre amigos, isso basta.

---

## Estrutura
```
public/index.html          → o site (gerado a partir de src/ pelo build.py)
public/firebase-config.js  → COLE AQUI a configuração do seu projeto
firestore.rules            → regras de segurança do banco
src/                       → fontes do site (edite aqui e rode: python3 build.py)
```
Sem configuração, o site roda em **modo demonstração** (dados só no navegador; cada aba pode ser uma conta diferente).

---

## Passo a passo (plano gratuito)

### 1. Criar o projeto
console.firebase.google.com → **Adicionar projeto** (ex.: `amigo-secreto-soz`). Fique no plano **Spark**, sem cartão de crédito.

### 2. Ativar o login
**Authentication → Método de login** → ative **Google** e **E-mail/senha**.
(Opcional) Em **Templates**, mude o idioma do e-mail de redefinição de senha para português.

### 3. Criar o banco
**Firestore Database → Criar banco** → modo **produção** → região `southamerica-east1` (São Paulo).

### 4. Configuração do site
**Configurações do projeto → Seus apps → Web (</>)** → registre o app → copie o `firebaseConfig` para `public/firebase-config.js`.

### 5. Publicar (no computador, precisa do Node.js)
```bash
npm install -g firebase-tools
firebase login
git clone https://github.com/SUA-CONTA/SEU-REPO.git
cd SEU-REPO
firebase use --add      # escolha o projeto
firebase deploy         # publica o site e as regras do banco
```
No fim aparece a URL, algo como `https://amigo-secreto-soz.web.app`.

### 6. Domínio autorizado
Authentication → Configurações → **Domínios autorizados**: `*.web.app` e `*.firebaseapp.com` já vêm liberados. Se usar outro domínio, adicione-o.

---

## Testar localmente (modo demonstração)
```bash
cd public && python3 -m http.server 8080
# abra http://localhost:8080 — use uma aba como anfitrião e outras abas como convidados
```

## Limites do plano gratuito
Firestore: 50 mil leituras e 20 mil gravações por dia. Um amigo secreto usa poucas centenas.
