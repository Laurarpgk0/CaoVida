# CaoVida 🐾

Aplicativo mobile desenvolvido para auxiliar no gerenciamento de informações de cães permitindo organizar dados do pet como consultas e vacinas.

## Versao Web
https://cao-vida.vercel.app/

## 📱 Download do aplicativo

**[Baixar CaoVida para Android (APK)](https://github.com/Laurarpgk0/CaoVida/releases/latest/download/CaoVida.apk)**



## 📸 Telas do aplicativo

### Aplicativo mobile

<p align="center">
  <img width="30%" src="https://github.com/user-attachments/assets/297187e0-2b08-4057-869e-e9d096f863b9" alt="Tela do CaoVida 1" />
  <img width="30%" src="https://github.com/user-attachments/assets/08faed47-7c7f-441a-9acf-490406a6ee31" alt="Tela do CaoVida 2" />
  <img width="30%" src="https://github.com/user-attachments/assets/014ccdb9-f152-4adc-8435-24a79d5102dd" alt="Tela do CaoVida 3" />
</p>

<p align="center">
  <img width="30%" src="https://github.com/user-attachments/assets/f6ee1876-1952-4a38-9982-191f064b138d" alt="Tela do CaoVida 4" />
  <img width="30%" src="https://github.com/user-attachments/assets/25df3e27-77e6-4565-9eba-9f5dfaeb6c1d" alt="Tela do CaoVida 5" />
  <img width="30%" src="https://github.com/user-attachments/assets/85fafc5b-46e8-4ff3-921d-3638d244df2f" alt="Tela do CaoVida 6" />
</p>

### Outras telas e funcionalidades

<p align="center">
  <img width="85%" src="https://github.com/user-attachments/assets/7cb160a1-f278-4672-96d4-acc61a3cd2d4" alt="Visualização do CaoVida 1" />
</p>

<p align="center">
  <img width="85%" src="https://github.com/user-attachments/assets/2b7f7f11-e937-4f44-b63a-2ffe5198d948" alt="Visualização do CaoVida 2" />
</p>

<p align="center">
  <img width="85%" src="https://github.com/user-attachments/assets/1bbbfee3-9928-483a-8de2-7cc0fc74d6cd" alt="Visualização do CaoVida 3" />
</p>

<p align="center">
  <img width="85%" src="https://github.com/user-attachments/assets/2e28b364-f4da-4cf0-a964-90b0cf7db5a3" alt="Visualização do CaoVida 4" />
</p>

<p align="center">
  <img width="85%" src="https://github.com/user-attachments/assets/12a88cc1-9a26-4e05-ba51-b27557c1bd54" alt="Visualização do CaoVida 5" />
</p>

### Versão executada no Android

<p align="center">
  <img width="30%" src="https://github.com/user-attachments/assets/01258b9d-f3ec-46b1-b04f-77b8f2085033" alt="CaoVida executado no Android 1" />
  <img width="30%" src="https://github.com/user-attachments/assets/2ba0a4f1-64b1-4423-9340-23521eb8fb7c" alt="CaoVida executado no Android 2" />
</p>

## ✨ Funcionalidades

- Cadastro e gerenciamento de usuários.
- Cadastro e gerenciamento de pets.
- Registro de consultas e vacinas.
- Consulta às informações dos animais.
- Notificações e lembretes.
- Autenticação de usuários.
- Autenticação biométrica.
- Recursos de acessibilidade.
- Armazenamento e sincronização de dados com o backend.
- Funcionamento offline com sincronização posterior.

## 🛠️ Tecnologias utilizadas

- React Native
- Expo SDK 54
- JavaScript
- Expo Router
- Supabase
- Node.js
- Express
- MongoDB
- AsyncStorage

## 🔗 Links do projeto

- **Aplicativo:** https://github.com/Laurarpgk0/CaoVida
- **Backend:** https://github.com/Laurarpgk0/caoVida-backend
- **Versão web:** https://cao-vida.vercel.app/
- **API:** https://caovida-backend.onrender.com

## ⚙️ Como executar o projeto

### Requisitos

- Node.js instalado.
- npm instalado.
- Expo CLI utilizado por meio do `npx`.
- Aplicativo Expo Go ou emulador Android para desenvolvimento.

### Instalação

Clone o repositório:

```bash
git clone https://github.com/Laurarpgk0/CaoVida.git
```

Entre na pasta:

```bash
cd CaoVida
```

Instale as dependências:

```bash
npm install
```

Configure as variáveis de ambiente em um arquivo `.env` na raiz do projeto:

```env
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
EXPO_PUBLIC_API_URL=
```

Preencha as variáveis com as configurações correspondentes dos serviços utilizados. 

Inicie o projeto:

```bash
npx expo start
```

## 📦 Geração do APK Android

Para gerar uma versão de instalação Android em ambiente Windows:

```powershell
cd android
.\gradlew :app:assembleRelease
```

O arquivo APK será gerado em:

```text
android/app/build/outputs/apk/release/app-release.apk
```

**CaoVida — Cuidado e organização para a vida dos pets.**
