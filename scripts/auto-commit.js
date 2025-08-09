#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');

// 자동 commit 및 push 스크립트 (Node.js 버전)
// 사용법: node scripts/auto-commit.js [커밋 메시지]

function runCommand(command) {
    try {
        return execSync(command, { encoding: 'utf8', stdio: 'inherit' });
    } catch (error) {
        console.error(`❌ 명령어 실행 실패: ${command}`);
        console.error(error.message);
        process.exit(1);
    }
}

function checkForChanges() {
    try {
        const status = execSync('git status --porcelain', { encoding: 'utf8' });
        return status.trim().length > 0;
    } catch (error) {
        return false;
    }
}

function main() {
    // 프로젝트 루트로 이동
    const scriptDir = path.dirname(process.argv[1]);
    const projectRoot = path.resolve(scriptDir, '..');
    process.chdir(projectRoot);

    // 변경사항 확인
    if (!checkForChanges()) {
        console.log('📝 변경사항이 없습니다.');
        return;
    }

    // 커밋 메시지 설정
    const commitMessage = process.argv[2] || `feat: 자동 저장 - ${new Date().toLocaleString('ko-KR')}`;

    console.log('🚀 자동 저장 시작...');

    // 변경사항 추가
    console.log('📁 변경사항을 추가하는 중...');
    runCommand('git add .');

    // 커밋
    console.log(`💾 커밋하는 중: ${commitMessage}`);
    runCommand(`git commit -m "${commitMessage}"`);

    // 푸시
    console.log('🌐 GitHub에 푸시하는 중...');
    runCommand('git push origin main');

    console.log('✅ 자동 저장 완료!');
    console.log(`📝 커밋 메시지: ${commitMessage}`);
}

main();
