# Next.js - Tomcat Exception 조회 시스템 (Frontend)

이 프로젝트는 **Next.js**와 **Tailwind CSS**를 사용해 NestJS 백엔드와 연동되는 UI를 제공합니다.  
사용자는 인스턴스 선택 → 로그 추출 → 날짜별 예외 목록/상세 확인(모달) 흐름으로 이용할 수 있습니다.

---

## 주요 기능

- **인스턴스 목록**: 백엔드에서 가져온 인스턴스 리스트를 표시
- **오늘 로그 추출**: 버튼을 통해 선택된 인스턴스의 오늘 로그를 백엔드에 요청
- **날짜별 예외 조회**: 추출된 날짜 목록에서 특정 날짜를 선택 → 예외 목록 표시
- **예외 상세 모달**: 예외 클릭 시 상세 정보를 모달로 표시 (상단 날짜/라인, 중간 내용 스크롤, 하단 복사/닫기 버튼)
- **모달 복사 기능**: 모달 내부 HTML만 클립보드에 복사하여, JIRA 등에 그대로 붙여넣기 가능
- **반응형 디자인**: Tailwind CSS로 큰 해상도(WQHD)에서도 좌우 여백 최소화, 최대 폭 고정 등으로 가독성 유지

---

## 설치 및 실행

1. **저장소 클론**

```bash
git clone https://github.com/errorlist.git
cd errorlist
```

2. **의존성 설치**

```bash
npm install
```

3. **Tailwind CSS 설정**  
   이미 `tailwind.config.js`, `postcss.config.js`, `globals.css` 등이 설정되어 있다고 가정합니다.

4. **개발 서버 실행**

```bash
npm run dev
```

- 기본적으로 [http://localhost:3000](http://localhost:3000)에서 실행

---

## 디렉터리 구조

- `app/` 또는 `pages/`: 메인 페이지(`page.tsx` 또는 `index.tsx`)
- `public/`: 정적 파일 (예: `headache.svg` 아이콘)
- `styles/`: Tailwind 글로벌 CSS 등
- `components/`: (선택) 분리된 컴포넌트 폴더

---

## 사용 방법

1. **홈 화면**: 상단 헤더에 아이콘+타이틀이 표시되며, 클릭 시 홈("/")으로 이동
2. **인스턴스 선택**: 백엔드 API(`/logs/instances`)로부터 받은 인스턴스 중 하나를 고름
3. **오늘 로그 추출**: 오늘 날짜 로그가 없을 때만 버튼이 활성화, 클릭 시 백엔드에 `POST /logs/extract` 요청
4. **날짜 목록**: `GET /logs/extracted-dates/:instanceId`로 받아온 날짜 목록 표시
5. **예외 목록**: 날짜 클릭 → `GET /logs/exceptions-date?instanceId=xxx&date=yyyymmdd`로 예외 리스트 조회
6. **예외 상세 모달**:
   - 상단: 날짜/라인 번호
   - 중간: 예외 내용 (preLines, exceptionMessage, stackTrace) 스크롤 가능
   - 하단: 복사 버튼(모달 내용 HTML 클립보드 복사), 닫기 버튼
   - 모달 외부 클릭 또는 ESC 키로 닫힘

---

## 아이콘 출처

- 상단 헤더에 사용된 아이콘(`headache.svg`)은 [svgrepo.com](https://www.svgrepo.com/)에서 가져왔습니다.

---

## API 연동

백엔드(NestJS)에서 다음 엔드포인트를 제공:

- `GET /logs/instances`
- `POST /logs/extract`
- `GET /logs/extracted-dates/:instanceId`
- `GET /logs/exceptions-date?instanceId=xxx&date=yyyymmdd`
- `GET /logs/detail?instanceId=xxx&date=yyyymmdd`
- 기타 로그/예외 조회 API

프런트엔드에서 Axios를 통해 위 API를 호출하여 데이터를 표시합니다.

---

## 라이선스

MIT License