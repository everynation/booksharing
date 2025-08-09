#!/bin/bash

# 자동 commit 및 push 스크립트
# 사용법: ./scripts/auto-commit.sh [커밋 메시지]

# 스크립트 디렉토리로 이동
cd "$(dirname "$0")/.."

# 변경사항이 있는지 확인
if [[ -z $(git status --porcelain) ]]; then
    echo "변경사항이 없습니다."
    exit 0
fi

# 커밋 메시지 설정
if [ $# -eq 0 ]; then
    # 기본 커밋 메시지 (현재 시간 포함)
    COMMIT_MSG="feat: 자동 저장 - $(date +'%Y-%m-%d %H:%M:%S')"
else
    # 사용자가 제공한 커밋 메시지
    COMMIT_MSG="$1"
fi

# 변경사항 추가
echo "변경사항을 추가하는 중..."
git add .

# 커밋
echo "커밋하는 중: $COMMIT_MSG"
git commit -m "$COMMIT_MSG"

# 푸시
echo "GitHub에 푸시하는 중..."
git push origin main

echo "✅ 자동 저장 완료!"
echo "커밋 메시지: $COMMIT_MSG"
