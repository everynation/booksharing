# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/0f4a227d-da40-49e6-b08f-ccafc2bd5e48

## 🚀 자동 저장 기능

이 프로젝트는 GitHub에 자동으로 commit하고 push하는 기능을 제공합니다.

### 사용 가능한 자동화 스크립트

1. **기본 자동 저장**
   ```bash
   npm run auto-save
   ```

2. **빠른 저장 (Bash 스크립트)**
   ```bash
   npm run quick-save
   # 또는
   ./scripts/auto-commit.sh "커스텀 메시지"
   ```

3. **Node.js 기반 저장**
   ```bash
   npm run node-save
   # 또는
   node scripts/auto-commit.js "커스텀 메시지"
   ```

4. **파일 변경 감지 자동 저장** (nodemon 필요)
   ```bash
   npm run watch-save
   ```

5. **수동 단계별 저장**
   ```bash
   npm run commit  # 커밋만
   npm run push    # 푸시만
   npm run save    # 커밋 + 푸시
   ```

### 자동화 스크립트 특징

- ✅ 변경사항이 없으면 자동으로 건너뜀
- ✅ 타임스탬프가 포함된 기본 커밋 메시지
- ✅ 커스텀 커밋 메시지 지원
- ✅ 에러 처리 및 로깅
- ✅ 한국어 시간 형식 지원

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/0f4a227d-da40-49e6-b08f-ccafc2bd5e48) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/0f4a227d-da40-49e6-b08f-ccafc2bd5e48) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)
