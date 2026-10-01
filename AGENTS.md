# LOP (Land of Power) 작업 규칙

## 빌드 및 실행파일 배치

지시사항 수행 완료 후 반드시 아래 순서로 실행한다.

### 빌드 명령어

```bash
# 1. 프론트엔드 빌드 (루트 또는 src 폴더)
cd C:/Development/3_LOP && npm run build

# 2. Electron 패키징
cd C:/Development/3_LOP/electron && npm run dist
```

### 실행파일 배치
- 빌드 출력: `C:/Development/3_LOP/release/LOP_v{버전}_portable.exe`
- 루트에도 동일하게 배치: `C:/Development/3_LOP/LOP_v{버전}_portable.exe`
- 이전 버전 루트 파일은 삭제

### 버전 관리
- `C:/Development/3_LOP/electron/package.json`의 `version` 및 `portable.artifactName` 수동 업데이트

## 기획서 최신화

기능 추가/변경 후 반드시 업데이트:
- `docs/LOP_기획서.md`
- `docs/LOP_기획서.html`
