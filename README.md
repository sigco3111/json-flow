
# JSON 순서도 시각화 도구 (JSON Flowchart Visualizer)

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![D3.js](https://img.shields.io/badge/D3.js-v7-F9A03C?logo=d3.js&logoColor=white)](https://d3js.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

**JSON 순서도 시각화 도구**는 복잡한 JSON 데이터를 이해하기 쉬운 대화형 순서도로 변환해주는 강력한 웹 애플리케이션입니다. 데이터 구조를 시각적으로 탐색하고, 특정 정보를 빠르게 찾아내며, 결과를 이미지 파일로 저장하여 보고서나 프레젠테이션에 활용할 수 있습니다.

실행 주소 : https://dev-canvas-pi.vercel.app/

## ✨ 주요 기능

이 애플리케이션은 데이터 분석 및 디버깅을 돕기 위해 다음과 같은 풍부한 기능을 제공합니다.

*   **대화형 시각화**: JSON 데이터를 자동으로 파싱하여 동적인 트리 구조의 순서도를 생성합니다.
*   **이동 및 확대/축소 (Pan & Zoom)**: D3.js를 기반으로 한 부드러운 인터페이스를 통해 복잡하고 큰 데이터 구조도 손쉽게 탐색할 수 있습니다.
*   **노드 확장 및 축소**: 특정 노드를 클릭하여 하위 트리를 동적으로 열거나 닫을 수 있어, 원하는 부분에 집중하여 데이터를 분석할 수 있습니다.
*   **검색 및 하이라이트**: 특정 키(key)나 값(value)을 검색하면, 순서도 내의 해당 노드와 그 상위 경로가 즉시 시각적으로 강조(highlight)됩니다. 이를 통해 원하는 정보를 신속하게 찾을 수 있습니다.
*   **다양한 레이아웃 옵션**: **수평(Horizontal)**, **수직(Vertical)**, **방사형(Radial)** 세 가지 레이아웃 모드를 지원하여, 다양한 관점에서 데이터의 구조를 분석할 수 있습니다.
*   **파일 불러오기**: 로컬 컴퓨터에서 `.json` 파일을 직접 불러와 시각화할 수 있습니다.
*   **SVG 및 PNG로 내보내기**: 생성된 순서도 전체를 화면에 보이지 않는 부분까지 포함하여 고해상도 **SVG** 또는 **PNG** 이미지 파일로 저장할 수 있습니다. 보고서, 프레젠테이션, 문서화 자료로 활용하기에 매우 유용합니다.
*   **실시간 JSON 유효성 검사**: 사용자가 JSON을 입력하거나 수정할 때 실시간으로 구문을 검사하고, 오류가 있을 경우 즉시 알려주어 디버깅을 돕습니다.
*   **반응형 디자인**: 데스크톱, 태블릿 등 다양한 화면 크기에 최적화된 UI를 제공합니다.

## 🚀 기술 스택

이 프로젝트는 현대적인 웹 기술들을 활용하여 효율적이고 안정적으로 구축되었습니다.

*   **프레임워크**: [React](https://react.dev/) (v19) - 컴포넌트 기반 UI 개발
*   **시각화 라이브러리**: [D3.js](https://d3js.org/) (v7) - 데이터 기반 문서 조작 및 시각화
*   **언어**: [TypeScript](https://www.typescriptlang.org/) - 정적 타입을 통한 코드 안정성 및 가독성 향상
*   **스타일링**: [Tailwind CSS](https://tailwindcss.com/) - 유틸리티 우선 CSS 프레임워크를 통한 신속한 UI 개발
*   **모듈 로딩**: [esm.sh](https://esm.sh/) - 별도의 빌드 과정 없이 최신 ES 모듈을 직접 사용하는 CDN

## ⚙️ 작동 원리

1.  **JSON 입력 및 변환**: 사용자가 텍스트 영역에 JSON을 입력하거나 파일을 불러오면, `utils/jsonTransformer.ts`의 `transformJsonToHierarchy` 함수가 이를 D3.js가 이해할 수 있는 계층적 노드 구조(`HierarchyNode`)로 재귀적으로 변환합니다.
2.  **상태 관리**: 최상위 `App.tsx` 컴포넌트가 애플리케이션의 전반적인 상태(입력된 JSON, 검색어, 레이아웃 설정, 오류 메시지 등)를 관리합니다.
3.  **시각화 렌더링**: `components/Flowchart.tsx` 컴포넌트가 변환된 데이터를 받아 D3.js의 레이아웃 알고리즘 (`d3.tree`)을 사용하여 각 노드의 위치와 링크 경로를 계산합니다.
4.  **동적 SVG 렌더링**: 계산된 좌표를 기반으로 React를 사용하여 SVG 요소(`<path>`, `<g>`, `<circle>`, `<text>`)를 렌더링합니다. D3의 이벤트 핸들러를 연결하여 확대/축소, 이동, 노드 클릭과 같은 사용자 상호작용을 처리합니다.
5.  **기능 구현**:
    *   **레이아웃**: `layout` prop 값에 따라 `d3.linkHorizontal`, `d3.linkVertical`, `d3.linkRadial` 등을 동적으로 사용하여 링크를 그립니다.
    *   **검색**: `searchQuery` prop을 기반으로 전체 노드를 순회하며 일치하는 노드와 상위 경로에 하이라이트 스타일을 적용합니다.
    *   **내보내기**: 현재 SVG DOM의 전체 경계(`getBBox`)를 계산하고, 모든 CSS 스타일을 내장(`embed`)한 후, 이를 `Blob` 객체로 변환하여 다운로드하거나 `Canvas`에 그려 PNG로 변환합니다.

## 📂 파일 구조

프로젝트의 주요 파일 구조는 다음과 같습니다.

```
.
├── public/
│   └── vite.svg
├── src/
│   ├── components/
│   │   └── Flowchart.tsx     # D3.js 시각화 로직을 담고 있는 핵심 컴포넌트
│   ├── utils/
│   │   └── jsonTransformer.ts # JSON을 계층 구조로 변환하는 유틸리티 함수
│   ├── App.tsx               # 메인 애플리케이션 컴포넌트 및 UI 레이아웃
│   ├── index.tsx             # React 애플리케이션 진입점
│   └── types.ts              # TypeScript 타입 정의
├── index.html                # 애플리케이션의 기본 HTML 템플릿
├── metadata.json             # 애플리케이션 메타데이터
└── README.md                 # 프로젝트 설명서
```

## 🔮 향후 개선 계획

*   **테마 전환**: 라이트 모드(Light Mode)와 다크 모드(Dark Mode) 전환 기능 추가
*   **URL 공유**: 현재 시각화된 JSON 데이터를 URL에 인코딩하여 다른 사람과 쉽게 공유하는 기능
*   **성능 최적화**: 매우 큰 JSON 데이터(수천 개 노드)를 효율적으로 처리하기 위한 가상화(virtualization) 렌더링 도입
*   **대화형 노드 편집**: 순서도 내에서 직접 노드의 키나 값을 수정하고 JSON 데이터에 반영하는 기능
*   **다양한 데이터 포맷 지원**: YAML, XML 등 다른 데이터 포맷 지원 확장

## 📄 라이선스

이 프로젝트는 [MIT 라이선스](https://opensource.org/licenses/MIT)를 따릅니다.
