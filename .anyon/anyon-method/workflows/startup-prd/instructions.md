# Startup PRD Workflow Instructions

<critical>The workflow execution engine is governed by: {project-root}/.anyon/core/tasks/workflow.xml</critical>
<critical>You MUST have already loaded and processed: {project-root}/.anyon/anyon-method/workflows/startup-prd/workflow.yaml</critical>
<critical>Communicate in {communication_language} throughout the workflow process</critical>
<critical>⚠️ ABSOLUTELY NO TIME ESTIMATES - NEVER mention hours, days, weeks, months, or ANY time-based predictions.</critical>
<critical>Target audience: NON-TECHNICAL FOUNDERS - Use clear, accessible language with storytelling and real-world examples</critical>
<critical>Final document: AI-READABLE - Technical and detailed for AI development agents</critical>

<workflow>

<step n="0" goal="Welcome and Introduction">
<action>Welcome user to Startup PRD workflow in {communication_language}:

"안녕하세요! Startup PRD 워크플로우에 오신 것을 환영합니다! 🎉

지금부터 여러분의 아이디어를 구체적인 제품으로 만들기 위한
제품 요구사항 문서(PRD)를 함께 만들어볼게요.

**PRD에서 정의할 내용:**
📋 어떤 문제를 해결하나요?
👥 누가 사용하나요?
⭐ 핵심 기능은 무엇인가요?
💰 어떻게 수익을 낼 건가요?
🔧 웹인가요, 앱인가요?
📱 어떤 플랫폼에서 사용하나요?

천천히 대화하면서 만들어갈 거니까 편하게 생각나는 대로 말씀해주세요!"
</action>

<action>Create output folder if not exists:
mkdir -p {output_folder}
</action>

<ask>먼저, 만들고 싶은 서비스/제품의 이름을 알려주세요:

(예: 배달의민족, 토스, 인스타그램처럼 실제 서비스명이나
아직 정하지 않았다면 가칭도 괜찮아요!)</ask>

<action>Store user's answer as {{project_name}}</action>

<action>Confirm and welcome with project name:
"좋아요! {{project_name}}의 PRD를 만들어볼게요.
이 문서는 나중에 UX 디자인, 기술 선택, 시스템 설계의 기반이 됩니다.

자, 시작해볼까요? 🚀"
</action>
</step>

<step n="1" goal="Define Problem and Vision">
<action>Guide user to articulate the problem they're solving</action>

<action>프로젝트 맥락 분석:
- 프로젝트 이름 {{project_name}}에서 힌트 추출
- 프로젝트 유형 추정 (커머스, SNS, 도구, 교육, 헬스케어, 금융, 게임 등)
- 가능한 도메인 파악
</action>

<action>맥락 기반 동적 선택지 생성 (5-7개):

프로젝트 이름과 유형을 분석해서 관련성 높은 문제 유형을 생성하세요.

생성 가이드라인:
- 프로젝트 이름/유형에 맞는 구체적인 문제
- 실제 사용자가 겪을 법한 현실적인 시나리오
- 각 선택지는 명확하고 서로 구별되어야 함
- 비개발자가 이해하기 쉬운 일상 언어 사용
- 항상 마지막에 "기타 (직접 설명해주세요)" 포함

예시 패턴:
- 커머스: "원하는 상품을 찾기 어렵다", "가격 비교가 번거롭다", "배송 추적이 불편하다"
- 협업 도구: "팀 커뮤니케이션이 분산되어 있다", "작업 진행상황 파악이 어렵다", "파일 찾기가 힘들다"
- 교육: "학습 자료가 체계적이지 않다", "학습 진도 관리가 어렵다", "강사와 소통이 어렵다"
- 건강: "운동 습관을 유지하기 어렵다", "건강 데이터가 분산되어 있다", "전문가 상담이 비싸다"
</action>

<ask>{{project_name}}은(는) 어떤 문제를 해결하고 싶으세요?

[동적으로 생성된 선택지 1]
[동적으로 생성된 선택지 2]
[동적으로 생성된 선택지 3]
[동적으로 생성된 선택지 4]
[동적으로 생성된 선택지 5]
[선택지 6-7 - 필요시]
기타 (직접 설명해주세요)

번호를 선택하거나 직접 설명해주세요:</ask>

<action>사용자 응답 처리:
- 번호 선택 시: 해당 선택지 내용을 기반으로 추가 질문
  "좋아요! [선택한 문제]에 대해 조금 더 구체적으로 들려주세요. 실제로 어떤 상황에서 이 문제를 겪나요?"
- "기타" 또는 직접 입력 시: 사용자 설명 듣고 명확화
  "이해했어요. 그럼 이 문제가 왜 중요한가요? 사람들이 지금 이걸 어떻게 해결하고 있나요?"
</action>

<action>Follow-up questions to deepen understanding:
- "이 문제로 인해 사람들이 구체적으로 어떤 불편을 겪나요?"
- "지금은 이 문제를 어떻게 해결하고 있나요? (기존 해결책이 있다면)"
- "이 문제를 해결하면 사용자에게 어떤 변화가 생기나요?"
</action>

<action>Refine and store as {{problem_statement}}</action>

<template-output>problem_statement</template-output>
</step>

<step n="2" goal="Define Target Users">
<action>Identify and deeply understand target users</action>

<action>문제 정의({{problem_statement}})를 바탕으로 타겟 사용자 선택지 생성 (5-8개):

생성 가이드라인:
- 해결하려는 문제와 직접 관련된 사용자 그룹
- 구체적인 페르소나 (직업, 역할, 상황, 나이대 포함)
- 다양한 사용자 세그먼트 커버
- 실제 존재하는 사람처럼 구체적으로
- 항상 마지막에 "기타 (직접 설명해주세요)" 포함

예시 패턴:
- 문제가 "업무 효율"이면 → "스타트업 팀 리더 (20-30대)", "프리랜서 디자이너", "중소기업 영업팀"
- 문제가 "학습"이면 → "취업 준비하는 대학생", "직무 전환 준비 중인 직장인", "온라인 강의 듣는 학부모"
- 문제가 "건강"이면 → "운동 시작하려는 직장인", "다이어트 중인 30대 여성", "재활 운동 필요한 중장년층"
</action>

<ask>주요 타겟 사용자는 누구인가요?

[동적으로 생성된 선택지 1]
[동적으로 생성된 선택지 2]
[동적으로 생성된 선택지 3]
[동적으로 생성된 선택지 4]
[동적으로 생성된 선택지 5]
[선택지 6-8 - 필요시]
기타 (직접 설명해주세요)

번호를 선택하거나 직접 설명해주세요:</ask>

<action>사용자 응답 처리 및 심화:
선택한 사용자에 대해 더 깊이 파악:

"좋아요! [선택한 사용자]에 대해 조금 더 알려주세요:
- 이 사람들의 하루는 어떤가요? (일상 이야기)
- {{problem_statement}} 문제를 언제, 어떻게 겪나요?
- 이 사람들이 가장 중요하게 생각하는 가치는 뭔가요? (시간? 돈? 편리함? 품질?)
- 기술에 얼마나 익숙한가요? (앱 사용 능숙도)"
</action>

<action>Create detailed user persona and store as {{target_users}}</action>
<action>Create summary for YAML frontmatter as {{target_users_summary}}</action>

<template-output>target_users</template-output>
</step>

<step n="3" goal="Define Unique Value Proposition">
<action>Identify what makes this solution different and better</action>

<action>프로젝트 특성과 문제 영역을 분석해서 차별화 전략 선택지 생성 (6-8개):

생성 가이드라인:
- 프로젝트 유형에 맞는 실현 가능한 차별화 방식
- 구체적이고 측정 가능한 차별점
- 기술적/비즈니스적 다양한 접근
- 스토리텔링으로 이해하기 쉽게
- 항상 마지막에 "기타 (직접 설명해주세요)" 포함

예시 패턴 (스토리텔링 포함):
- "더 저렴해요 - 예: 기존 월 5만원 → 우리는 월 1만원"
- "더 쉽고 간단해요 - 예: 배우는데 3일 → 우리는 10분이면 시작 가능"
- "더 빨라요 - 예: 결과까지 1시간 → 우리는 즉시"
- "AI를 활용해요 - 예: 사람이 직접 → AI가 자동으로"
- "커뮤니티 중심이에요 - 예: 혼자 → 같은 고민 하는 사람들과 함께"
- "개인화돼요 - 예: 모두에게 같은 서비스 → 나에게 맞춤"
</action>

<ask>비슷한 서비스와 비교해서 {{project_name}}의 차별점은 뭔가요?

[동적으로 생성된 선택지 1 - 스토리 포함]
[동적으로 생성된 선택지 2 - 스토리 포함]
[동적으로 생성된 선택지 3 - 스토리 포함]
[동적으로 생성된 선택지 4 - 스토리 포함]
[동적으로 생성된 선택지 5 - 스토리 포함]
[선택지 6-8 - 필요시]
기타 (직접 설명해주세요)

번호를 선택하거나 직접 설명해주세요:</ask>

<action>사용자 응답 처리 및 구체화:
"좋습니다! [선택한 차별점]이 핵심이네요.

그럼 이걸 사용자에게 어떻게 증명할 수 있을까요?
- 구체적인 예시나 시나리오를 들어주세요
- 경쟁 서비스 대비 '정확히 얼마나' 더 나은가요?
- 사용자가 이 차별점을 바로 느낄 수 있나요?"
</action>

<action>Store as {{unique_value}}</action>

<ask>왜 지금이 이 서비스를 만들기에 좋은 타이밍인가요?
(예: 시장 변화, 새로운 기술, 사회적 트렌드 등)</ask>

<action>Store as {{why_now}}</action>

<template-output>unique_value</template-output>
</step>

<step n="4" goal="CRITICAL - Define Service Type and Platform">
<critical>This step defines fundamental technical constraints for ALL subsequent workflows.
서비스 유형과 플랫폼은 UX 설계, 기술 스택, 아키텍처에 직접적인 영향을 미칩니다.
신중하게 결정하고, 충분히 설명해야 합니다.</critical>

<action>Explain the importance:
"이제 아주 중요한 결정을 할 거예요. 서비스 유형과 플랫폼을 정하는 건데요,
이게 나중에 디자인, 기술, 개발 방식 모든 걸 결정하는 기준이 돼요.

천천히 설명드릴 테니 잘 생각해서 선택해주세요!"
</action>

<substep n="4a" title="Service Type Selection">
<action>Explain service types with real-world examples and storytelling:

"서비스 유형은 크게 4가지가 있어요:

📱 **1. 웹 서비스 (Web)**
- 설명: 크롬, 사파리 같은 브라우저에서 사용
- 장점: 설치 필요 없음, 모든 기기에서 접속 가능, 업데이트 쉬움
- 단점: 인터넷 없으면 사용 불가 (대부분), 네이티브 앱보다 느릴 수 있음
- 예시: 노션, 구글 독스, 넷플릭스 웹
- 이런 분께 추천: 다양한 기기에서 쓰고, PC 사용이 많은 서비스

📲 **2. 모바일 앱 (Native App)**
- 설명: 앱스토어/플레이스토어에서 다운로드해서 사용
- 장점: 빠르고 부드러움, 카메라/GPS 등 활용 가능, 푸시 알림
- 단점: 개발 비용 높음 (iOS/Android 따로), 앱스토어 심사 필요
- 예시: 인스타그램, 배달의민족, 카카오톡
- 이런 분께 추천: 모바일 중심, 카메라나 위치 정보 필수인 서비스

💻 **3. 설치형 프로그램 (Desktop App)**
- 설명: 컴퓨터에 설치해서 사용하는 프로그램
- 장점: 인터넷 없이도 작동, 빠른 성능, 파일 시스템 접근
- 단점: 설치 과정 필요, 업데이트 번거로움, 개발 복잡
- 예시: Figma Desktop, Notion Desktop, VS Code
- 이런 분께 추천: 오프라인 작업 필수, 고성능 필요한 서비스

🔄 **4. 하이브리드 (웹 + 앱)**
- 설명: 웹으로 만들어서 앱처럼 포장 (예: React Native, PWA)
- 장점: 한 번 개발로 웹/앱 모두, 비용 절감
- 단점: 완전한 네이티브보다는 성능 떨어질 수 있음
- 예시: 인스타그램 (웹도 있고 앱도 있음), 트위터
- 이런 분께 추천: 웹/앱 모두 제공하고 싶은데 예산이 한정적인 경우"
</action>

<ask>{{project_name}}은(는) 어떤 서비스 유형이 좋을까요?

1. 📱 웹 서비스 - 브라우저에서 사용 (설치 불필요)
2. 📲 모바일 앱 - 앱스토어에서 다운로드 (iOS/Android)
3. 💻 설치형 프로그램 - PC에 설치해서 사용
4. 🔄 하이브리드 - 웹과 앱 모두 제공

어떤 게 가장 적합할까요? 이유도 함께 말씀해주세요:</ask>

<action>사용자 선택 처리:
- 선택한 유형에 대해 더 구체적으로 질문
- 왜 그 유형을 선택했는지 이유 확인
- 장단점 다시 한번 설명하고 확신 확인
- "이 선택이 맞는지 확인하기 위해, {{target_users}}가 주로 어떤 상황에서 이 서비스를 쓸까요?"
</action>

<action>Store selection as {{service_type}}</action>
<action>Generate detailed description as {{service_type_description}}</action>
</substep>

<substep n="4b" title="Platform Selection">
<action>Based on service type, determine platform options:

웹 서비스 선택 시:
"웹 서비스는 기본적으로 모든 기기에서 작동하지만, 주요 타겟 플랫폼을 정해야 해요:
- PC 중심 (큰 화면, 키보드/마우스 최적화)
- 모바일 웹 중심 (작은 화면, 터치 최적화)
- 반응형 (모든 화면 크기에 대응)
- 태블릿 중심"

모바일 앱 선택 시:
"모바일 앱은 어떤 플랫폼을 지원할까요?
- iOS만 (아이폰/아이패드)
- Android만 (갤럭시 등)
- 둘 다 (iOS + Android)
- 태블릿도 지원 (iPad/Galaxy Tab)"

설치형 선택 시:
"어떤 운영체제를 지원할까요?
- Windows만
- macOS만
- 둘 다
- Linux도 포함"

하이브리드 선택 시:
"웹과 앱 중 어디에 더 집중할까요?
- 웹 먼저, 나중에 앱
- 앱 먼저, 나중에 웹
- 동시에 같은 수준으로"
</action>

<ask>{{service_type}}로 만들기로 했는데, 구체적으로 어떤 플랫폼을 지원할까요?

[service_type에 맞는 동적 선택지]

선택해주세요:</ask>

<action>Store as {{platform}}</action>
<action>Generate description as {{platform_description}}</action>

<ask>왜 이 플랫폼을 선택하셨나요?
(예: 타겟 사용자가 주로 사용, 개발 비용, MVP라서 등)</ask>

<action>Store as {{platform_rationale}}</action>
</substep>

<template-output>service_type</template-output>
<template-output>platform</template-output>
</step>

<step n="5" goal="Define Core Features">
<action>Identify 3-7 core features for MVP through dynamic multiple choice</action>

<action>Explain:
"이제 핵심 기능을 정의할 거예요. 여기서 중요한 건 '처음 출시할 때 꼭 필요한 기능'만 생각하는 거예요.

**MVP (Minimum Viable Product)란?**
쉽게 말하면 '최소한으로 작동하는 제품'이에요.
예를 들어 인스타그램의 MVP는:
- 사진 올리기
- 필터 적용
- 좋아요/댓글
이 3가지였어요. 스토리, 릴스, 쇼핑 이런 건 나중에 추가된 거죠.

{{project_name}}도 처음엔 핵심만 만들고, 사용자 반응 보면서 추가하는 게 좋아요."
</action>

<action>프로젝트 맥락 기반 기능 카테고리 선택지 생성 (10-15개):

분석 기반:
- 프로젝트 이름: {{project_name}}
- 서비스 유형: {{service_type}}
- 플랫폼: {{platform}}
- 해결 문제: {{problem_statement}}
- 타겟 사용자: {{target_users}}

생성 가이드라인:
- 프로젝트 유형과 플랫폼에 맞는 일반적인 기능 패턴
- 사용자 문제 해결에 직접 관련된 기능
- 각 기능에 구체적인 설명과 예시 포함
- 플랫폼 특성 반영 (웹: 대시보드, 앱: 푸시알림 등)
- 다중 선택 가능하도록
- 항상 마지막에 "기타 (직접 추가)" 포함

예시 패턴:
- 커머스 (웹): "상품 검색/필터 (키워드, 카테고리, 가격대로 찾기)", "장바구니 (나중에 살 것 모아두기)", "결제 (카드/계좌이체)", "주문 내역", "리뷰/평점"
- 커머스 (앱): 위 + "푸시 알림 (배송 알림)", "바코드 스캔", "위치 기반 매장 찾기"
- SNS (앱): "게시물 작성 (사진/동영상)", "피드 (타임라인)", "팔로우/팔로잉", "댓글/좋아요", "DM (다이렉트 메시지)", "프로필", "알림"
- 협업 도구 (웹): "프로젝트 생성", "작업(Task) 생성/할당", "댓글/멘션", "파일 첨부", "진행상황 보드", "팀 초대"
- 교육 (하이브리드): "강의 동영상 시청", "진도율 트래킹", "퀴즈/시험", "질문 게시판", "수료증", "학습 통계"
</action>

<ask>{{project_name}}에 어떤 기능들이 필요한가요?
**MVP에 꼭 필요한 것만** 선택해주세요 (3-7개 권장):

☐ [동적 생성 기능 1 - 설명 및 예시 포함]
☐ [동적 생성 기능 2 - 설명 및 예시 포함]
☐ [동적 생성 기능 3 - 설명 및 예시 포함]
☐ [동적 생성 기능 4 - 설명 및 예시 포함]
☐ [동적 생성 기능 5 - 설명 및 예시 포함]
☐ [동적 생성 기능 6-15 - 필요시]
☐ 기타 (직접 추가해주세요)

번호를 여러 개 선택하거나, 직접 기능을 추가해주세요:</ask>

<action>선택된 기능들 처리:

For each selected feature:
1. 사용자가 선택한 기능 확인
2. 구체화 필요시 추가 질문:

   "[기능명]에 대해 조금 더 구체적으로 말씀해주세요:
   - 사용자가 이 기능으로 '정확히 무엇'을 할 수 있나요?
   - 이 기능이 왜 MVP에 꼭 필요한가요?
   - 실제 사용 시나리오를 예로 들어주세요"

3. 스토리텔링으로 명확화:
   "예를 들어, {{target_users}} 중 한 명인 '철수'가 {{problem_statement}} 문제를 겪고 있어요.
   철수가 이 기능을 어떻게 사용해서 문제를 해결할까요?"

4. 각 기능을 아래 형식으로 정리:
   **기능명**: [이름]
   **설명**: [무엇을 하는 기능인지]
   **왜 필요한가**: [해결하는 문제]
   **사용 예시**: [구체적인 시나리오]
   **우선순위**: [필수/중요/권장]
</action>

<action>3-7개 기능으로 정리되었는지 확인:
- 너무 많으면 (8개 이상): "MVP엔 조금 많아 보여요. 가장 중요한 5-7개만 추리면 어떨까요?"
- 너무 적으면 (2개 이하): "조금 더 있으면 좋을 것 같아요. 사용자가 서비스를 제대로 쓰려면 최소 3-4개는 필요해요"
</action>

<action>Store as {{core_features}}</action>
<action>Generate simple list for YAML as {{core_features_list}}</action>

<ask>선택하지 않았지만 나중에 추가하고 싶은 기능이 있나요?
(향후 개발 계획으로 기록해둘게요)</ask>

<action>Store as {{future_features}}</action>

<template-output>core_features</template-output>
</step>

<step n="6" goal="Define Business Model">
<action>Determine how the service will generate revenue</action>

<action>Explain with storytelling:
"이제 돈을 어떻게 벌 건지 정해야 해요.
아무리 좋은 서비스도 수익이 없으면 계속 운영할 수 없으니까요.

**대표적인 수익 모델들을 스토리로 설명할게요:**

💳 **1. 유료 판매 (Premium/Paid)**
- 설명: 사용자가 돈 내고 구매
- 예시: Netflix (월 구독료), Notion (유료 플랜), 유료 앱
- 스토리: 넷플릭스는 월 9,500원 내면 영화/드라마 무제한 시청

🎁 **2. 프리미엄 (Freemium)**
- 설명: 기본은 무료, 고급 기능은 유료
- 예시: Spotify (무료: 광고 있음, 유료: 광고 없음), Canva
- 스토리: 카카오톡은 무료인데, 이모티콘은 유료로 팔죠

📢 **3. 광고 (Ad-based)**
- 설명: 서비스는 무료, 광고로 수익
- 예시: YouTube, Instagram, 네이버
- 스토리: 유튜브 영상 보기 전에 광고 나오죠? 그걸로 버는 거예요

🛒 **4. 거래 수수료 (Commission)**
- 설명: 거래될 때마다 일부를 수수료로
- 예시: 배달의민족 (주문액의 %), 에어비앤비 (예약액의 %)
- 스토리: 배민에서 3만원 주문하면 배민이 10% (3천원) 가져가는 식

🤝 **5. B2B 구독 (Business Subscription)**
- 설명: 기업이 직원들을 위해 구독
- 예시: Slack (직원 수 × 월 요금), Notion (팀 플랜)
- 스토리: 회사에서 슬랙 쓰면 직원 10명 × 월 1만원 = 월 10만원

💡 **6. 혼합 모델 (Hybrid)**
- 설명: 여러 방식 조합
- 예시: LinkedIn (유료 구독 + 광고 + 기업 채용 서비스)
- 스토리: 링크드인은 개인 유료, 광고, 기업 채용 서비스로 3가지 수익"
</action>

<action>프로젝트 특성 기반 적합한 비즈니스 모델 추천 (3-4개):

분석 기반:
- 서비스 유형: {{service_type}}
- 타겟 사용자: {{target_users}}
- 핵심 기능: {{core_features}}
- 문제 해결 가치

추천 로직:
- B2C 서비스 → Freemium, Subscription, Ad-based
- B2B 서비스 → Business Subscription, Per-seat pricing
- 커머스/마켓플레이스 → Commission, Listing fee
- 콘텐츠 플랫폼 → Ad-based, Premium content
- 도구/생산성 → Freemium, Subscription
</action>

<ask>{{project_name}}은(는) 어떻게 수익을 낼 계획인가요?

[프로젝트에 적합한 추천 모델 3-4개 - 스토리텔링 포함]
기타 (다른 방식이 있다면 설명해주세요)

선택해주세요:</ask>

<action>선택한 비즈니스 모델에 대해 구체화:

"[선택한 모델]로 하시는군요! 조금 더 구체적으로 정해볼게요:

만약 유료 판매/구독이면:
- 가격은 얼마로 생각하세요? (월 얼마? 연 얼마?)
- 타겟 사용자가 이 가격을 낼 만한 가치가 있나요?
- 비슷한 서비스는 얼마를 받나요?

만약 Freemium이면:
- 무료 버전에서는 무엇을 제공하나요?
- 유료 버전에서만 제공하는 건 뭔가요?
- 사용자들이 유료로 전환할 이유가 충분한가요?

만약 광고라면:
- 어디에 광고를 넣을 건가요?
- 광고가 사용자 경험을 해치지 않을까요?
- 얼마나 많은 사용자가 있어야 수익이 날까요?

만약 수수료라면:
- 수수료율은 몇 %로 생각하세요?
- 판매자/제공자가 이 수수료를 받아들일까요?
- 경쟁 서비스의 수수료는 얼마인가요?"
</action>

<action>Store as {{business_model}}</action>
<action>Generate detailed description as {{business_model_description}}</action>
<action>Store monetization strategy as {{monetization_strategy}}</action>

<template-output>business_model</template-output>
</step>

<step n="7" goal="Define Success Metrics">
<action>Establish measurable success criteria</action>

<action>Explain with examples:
"이제 '성공'을 어떻게 측정할지 정해야 해요.
구체적인 숫자 목표가 있어야 나중에 잘 되고 있는지 알 수 있거든요.

**대표적인 성공 지표들:**

👥 **사용자 수**
- MAU (Monthly Active Users): 한 달에 한 번이라도 쓴 사용자
- DAU (Daily Active Users): 매일 쓰는 사용자
- 예: '3개월 안에 MAU 1,000명'

📊 **참여도 (Engagement)**
- 사용 빈도: 주 몇 번 접속하는지
- 사용 시간: 평균 몇 분 사용하는지
- 예: '사용자 평균 주 3회 접속, 회당 15분 사용'

💰 **수익**
- MRR (Monthly Recurring Revenue): 월 반복 수익
- 유료 전환율: 무료에서 유료로 전환하는 비율
- 예: '6개월 내 월 매출 500만원', '유료 전환율 5%'

❤️ **만족도**
- NPS (Net Promoter Score): 추천 의향 점수
- 평점: 앱스토어/플레이스토어 평점
- 예: 'NPS 50점 이상', '평점 4.5/5.0'

🔄 **리텐션 (Retention)**
- 재방문율: 다시 돌아오는 비율
- 이탈률: 떠나는 사용자 비율
- 예: '7일 리텐션 40%' (가입 후 7일 뒤에도 40%가 사용)"
</action>

<action>프로젝트 특성 기반 성공 지표 선택지 생성 (6-8개):

분석 기반:
- 프로젝트 유형
- 비즈니스 모델: {{business_model}}
- 핵심 기능들: {{core_features}}

생성 가이드라인:
- 프로젝트에 적합한 측정 가능한 지표
- 단기(3개월)/중기(1년) 목표 구분
- 구체적인 숫자 예시 포함
- 달성 가능하면서도 의미 있는 수준
- 항상 마지막에 "기타 (직접 설명)" 포함

예시 패턴:
- B2C 앱: "MAU 1,000명 (3개월)", "DAU 100명", "7일 리텐션 30%"
- B2B SaaS: "유료 고객 10개 회사 (6개월)", "MRR 500만원", "이탈률 5% 이하"
- 커머스: "월 거래액 1,000만원", "재구매율 20%", "평균 주문액 5만원"
- 콘텐츠: "게시물 일 50개", "댓글/공유율 10%", "콘텐츠 소비 시간 15분/세션"
</action>

<ask>{{project_name}}의 성공을 어떻게 측정할까요?
주요 성공 지표를 선택해주세요 (여러 개 선택 가능):

[동적 생성 지표 1 - 구체적 숫자 포함]
[동적 생성 지표 2 - 구체적 숫자 포함]
[동적 생성 지표 3 - 구체적 숫자 포함]
[동적 생성 지표 4 - 구체적 숫자 포함]
[동적 생성 지표 5 - 구체적 숫자 포함]
[선택지 6-8 - 필요시]
기타 (직접 설명해주세요)

여러 개 선택하거나 직접 설명해주세요:</ask>

<action>선택된 지표들을 구체적인 목표로 상세화:

For each selected metric:
"[지표명]에 대해 구체적인 목표를 정해볼게요:

- **3개월 목표**: 처음 출시하고 3개월 후 얼마를 달성하고 싶으세요?
- **1년 목표**: 1년 후에는요?
- **왜 이 숫자인가요**: 이 목표가 의미 있는 이유는?

예를 들어 비슷한 서비스는 어느 정도인지 아시나요?
현실적으로 달성 가능한 목표를 정하는 게 중요해요."

Validate target is realistic and meaningful
</action>

<action>Store comprehensive success metrics as {{success_metrics}}</action>
<action>Generate simple list for YAML as {{success_metrics_list}}</action>

<template-output>success_metrics</template-output>
</step>

<step n="8" goal="Define Additional Requirements">
<action>Capture UX/UI direction, security, accessibility, and other requirements</action>

<substep n="8a" title="UX/UI Direction">
<ask>디자인은 어떤 느낌을 원하시나요?
(예: 미니멀하고 깔끔한, 화려하고 역동적인, 친근하고 편안한 등)

참고하고 싶은 서비스가 있다면 알려주세요:</ask>

<action>Store as {{ux_ui_direction}}</action>
</substep>

<substep n="8b" title="Security Requirements">
<action>Determine security needs based on features:

Based on {{core_features}} and {{service_type}}, identify critical security requirements:
- 로그인/회원가입 있으면 → 비밀번호 암호화, 이메일 인증
- 결제 있으면 → PG사 연동, 카드 정보 비저장
- 개인정보 다루면 → 개인정보 처리방침, 암호화 저장
- {{platform}}이 모바일이면 → 생체 인증 고려
</action>

<ask>보안/개인정보 관련해서 특별히 고려해야 할 사항이 있나요?
(예: 의료/금융 데이터, 민감한 개인정보 등)

없으면 '없음' 또는 '기본 수준'이라고 답해주세요:</ask>

<action>Store as {{security_requirements}}</action>
</substep>

<substep n="8c" title="Accessibility">
<ask>장애인 접근성이나 다양한 사용자 지원이 필요한가요?
(예: 스크린 리더 지원, 색맹 모드, 고령자 고려 등)

없으면 '기본 수준'이라고 답해주세요:</ask>

<action>Store as {{accessibility_requirements}}</action>
</substep>

<substep n="8d" title="Localization">
<ask>다국어 지원이 필요한가요? 어떤 언어를 지원할 계획인가요?

없으면 '한국어만'이라고 답해주세요:</ask>

<action>Store as {{localization_requirements}}</action>
</substep>

<substep n="8e" title="Other Requirements">
<ask>그 외에 꼭 고려해야 할 요구사항이 있나요?
(예: 오프라인 모드, 알림, 특정 기기 지원 등)

없으면 '없음'이라고 답해주세요:</ask>

<action>Store as {{additional_requirements}}</action>
</substep>

<template-output>additional_requirements</template-output>
</step>

<step n="9" goal="MVP Scope Definition">
<action>Clearly separate MVP features from future features</action>

<action>Based on all previous inputs, create clear MVP scope:

"자, 이제 지금까지 얘기한 내용을 정리해서 MVP 범위를 명확히 할게요.

**MVP란 다시 한번 말씀드리면:**
최소한으로 작동하는 제품이에요. {{problem_statement}} 문제를 해결할 수 있는
가장 핵심 기능만 넣고, 나머지는 나중에 추가하는 거죠.

**왜 MVP부터 만들까요?**
1. 빨리 출시해서 사용자 반응을 볼 수 있어요
2. 개발 비용과 시간을 아낄 수 있어요
3. 실제 사용자 피드백을 받고 방향을 조정할 수 있어요

예를 들어 에어비앤비는 처음에:
- MVP: 사진 올리고 예약하는 것만
- 나중 추가: 리뷰, 슈퍼호스트, 체험 등"
</action>

<action>Review {{core_features}} and categorize:

**MVP에 포함 (필수):**
[List features marked as 필수 or critical]

**MVP 이후 추가 (Phase 2):**
[List features from {{future_features}} and non-critical features]

Present to user for confirmation
</action>

<ask>이 MVP 범위가 적절한가요?
- 너무 많아 보이면 더 줄일 수 있어요
- 너무 적어 보이면 추가할 수도 있어요

어떻게 생각하세요?</ask>

<action>Adjust based on user feedback and finalize</action>

<action>Store final MVP scope as {{mvp_features}}</action>

<template-output>mvp_features</template-output>
</step>

<step n="10" goal="Generate PRD Document">
<action>Compile all collected information into the PRD template</action>

<action>Load template from {template}</action>

<action>Fill template with all variables:
- {{project_name}}
- {{date}}
- {{user_name}}
- {{service_type}}, {{service_type_description}}
- {{platform}}, {{platform_description}}, {{platform_rationale}}
- {{problem_statement}}
- {{target_users}}, {{target_users_summary}}
- {{unique_value}}
- {{why_now}}
- {{core_features}}, {{core_features_list}}
- {{business_model}}, {{business_model_description}}, {{monetization_strategy}}
- {{success_metrics}}, {{success_metrics_list}}
- {{mvp_features}}
- {{future_features}}
- {{ux_ui_direction}}
- {{security_requirements}}
- {{accessibility_requirements}}
- {{localization_requirements}}
- {{additional_requirements}}
</action>

<action>Generate detailed, AI-readable content:
- Clear specifications for each feature
- User stories where applicable
- Acceptance criteria for features
- Technical considerations based on service type and platform
</action>

<action>Save document to {default_output_file}</action>

<action>Show summary to user in {communication_language}:
"
🎉 PRD 문서 작성이 완료되었습니다!

📄 **저장 위치**: {default_output_file}

📋 **작성된 내용:**
- 프로젝트: {{project_name}}
- 서비스 유형: {{service_type}}
- 플랫폼: {{platform}}
- 핵심 기능: {{core_features_list}}
- 비즈니스 모델: {{business_model}}
- 타겟 사용자: {{target_users_summary}}

이 문서는 나중에 UX 설계, 기술 스택 선정, 시스템 아키텍처의 기반이 됩니다.

다음 단계는 **UX Design 워크플로우**입니다.
준비가 되면 기획문서 패널에서 'UX Design 작성하기' 버튼을 눌러주세요!"
</action>

<template-output>prd_complete</template-output>
</step>

</workflow>
