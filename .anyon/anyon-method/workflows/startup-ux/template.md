<!--
  UX Design HTML Mockup Template

  This is a reference template showing the expected structure.
  The actual output will be a fully interactive HTML file.

  YAML Metadata (for documentation):
  - project_name: {{project_name}}
  - created_date: {{date}}
  - service_type: {{service_type}}
  - platform: {{platform}}
  - total_screens: {{total_screens}}
  - total_flows: {{total_flows}}
-->

<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{project_name}} - UX Mockup</title>
    <style>
        /* Reset & Base */
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background-color: #f5f5f5;
            min-height: 100vh;
        }

        /* Screen Container */
        .screen {
            display: none;
            max-width: 390px;
            margin: 0 auto;
            min-height: 100vh;
            background-color: #ffffff;
            position: relative;
            box-shadow: 0 0 20px rgba(0,0,0,0.1);
        }

        .screen.active {
            display: block;
        }

        /* Header */
        .header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 12px 16px;
            background-color: #ffffff;
            border-bottom: 1px solid #e0e0e0;
            position: sticky;
            top: 0;
            z-index: 100;
        }

        .header-title {
            font-size: 18px;
            font-weight: 600;
        }

        .back-button {
            background: none;
            border: none;
            font-size: 24px;
            cursor: pointer;
            padding: 4px;
        }

        /* Content Area */
        .content {
            padding: 16px;
            padding-bottom: 80px; /* Space for tab bar */
        }

        /* Tab Bar */
        .tab-bar {
            display: flex;
            justify-content: space-around;
            align-items: center;
            padding: 8px 0;
            background-color: #ffffff;
            border-top: 1px solid #e0e0e0;
            position: fixed;
            bottom: 0;
            left: 50%;
            transform: translateX(-50%);
            width: 100%;
            max-width: 390px;
        }

        .tab-item {
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 4px 12px;
            background: none;
            border: none;
            cursor: pointer;
            color: #666;
        }

        .tab-item.active {
            color: #007AFF;
        }

        .tab-icon {
            font-size: 24px;
            margin-bottom: 2px;
        }

        .tab-label {
            font-size: 10px;
        }

        /* Buttons */
        .btn {
            display: inline-block;
            padding: 12px 24px;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 500;
            cursor: pointer;
            border: none;
            transition: all 0.2s;
        }

        .btn-primary {
            background-color: #007AFF;
            color: white;
            width: 100%;
        }

        .btn-primary:hover {
            background-color: #0056b3;
        }

        .btn-secondary {
            background-color: #f0f0f0;
            color: #333;
        }

        .btn-text {
            background: none;
            color: #007AFF;
        }

        /* Input Fields */
        .input-group {
            margin-bottom: 16px;
        }

        .input-label {
            display: block;
            font-size: 14px;
            font-weight: 500;
            margin-bottom: 6px;
            color: #333;
        }

        .input-field {
            width: 100%;
            padding: 12px;
            border: 1px solid #e0e0e0;
            border-radius: 8px;
            font-size: 16px;
        }

        .input-field:focus {
            outline: none;
            border-color: #007AFF;
        }

        /* Cards */
        .card {
            background-color: #ffffff;
            border-radius: 12px;
            padding: 16px;
            margin-bottom: 12px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.08);
            cursor: pointer;
        }

        .card:hover {
            box-shadow: 0 4px 12px rgba(0,0,0,0.12);
        }

        /* List Items */
        .list-item {
            display: flex;
            align-items: center;
            padding: 12px 0;
            border-bottom: 1px solid #f0f0f0;
            cursor: pointer;
        }

        .list-item:last-child {
            border-bottom: none;
        }

        /* Empty State */
        .empty-state {
            text-align: center;
            padding: 48px 24px;
            color: #666;
        }

        .empty-state-icon {
            font-size: 64px;
            margin-bottom: 16px;
            opacity: 0.5;
        }

        .empty-state-title {
            font-size: 18px;
            font-weight: 600;
            margin-bottom: 8px;
        }

        .empty-state-desc {
            font-size: 14px;
            margin-bottom: 24px;
        }

        /* Modal/Overlay */
        .modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: rgba(0,0,0,0.5);
            display: none;
            justify-content: center;
            align-items: center;
            z-index: 1000;
        }

        .modal-overlay.active {
            display: flex;
        }

        .modal-content {
            background-color: white;
            border-radius: 12px;
            padding: 24px;
            max-width: 320px;
            width: 90%;
        }

        /* Toast */
        .toast {
            position: fixed;
            bottom: 100px;
            left: 50%;
            transform: translateX(-50%);
            background-color: #333;
            color: white;
            padding: 12px 24px;
            border-radius: 8px;
            display: none;
        }

        .toast.active {
            display: block;
        }

        /* Loading */
        .loading {
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 24px;
        }

        .spinner {
            width: 32px;
            height: 32px;
            border: 3px solid #f0f0f0;
            border-top-color: #007AFF;
            border-radius: 50%;
            animation: spin 1s linear infinite;
        }

        @keyframes spin {
            to { transform: rotate(360deg); }
        }

        /* Error State */
        .error-message {
            color: #dc3545;
            font-size: 14px;
            margin-top: 4px;
        }

        /* Utility */
        .mt-16 { margin-top: 16px; }
        .mb-16 { margin-bottom: 16px; }
        .text-center { text-align: center; }
        .text-muted { color: #666; }
    </style>
</head>
<body>

    <!-- ========== SCREENS START ========== -->

    <!-- Screen: Splash -->
    <section id="screen_splash" class="screen active">
        <div style="display: flex; flex-direction: column; justify-content: center; align-items: center; min-height: 100vh;">
            <div style="font-size: 48px; margin-bottom: 16px;">🚀</div>
            <h1 style="font-size: 24px; font-weight: 700;">{{project_name}}</h1>
            <p class="text-muted mt-16">Loading...</p>
        </div>
    </section>

    <!-- Screen: Login -->
    <section id="screen_login" class="screen">
        <div class="content" style="display: flex; flex-direction: column; justify-content: center; min-height: 100vh;">
            <h1 style="font-size: 28px; font-weight: 700; margin-bottom: 32px; text-align: center;">{{project_name}}</h1>

            <div class="input-group">
                <label class="input-label">이메일</label>
                <input type="email" class="input-field" placeholder="email@example.com">
            </div>

            <div class="input-group">
                <label class="input-label">비밀번호</label>
                <input type="password" class="input-field" placeholder="••••••••">
            </div>

            <button class="btn btn-primary mt-16" onclick="showScreen('screen_home')">로그인</button>

            <button class="btn btn-text mt-16" onclick="showScreen('screen_signup')">회원가입</button>

            <button class="btn btn-text" onclick="showScreen('screen_forgot_password')">비밀번호를 잊으셨나요?</button>
        </div>
    </section>

    <!-- Screen: Signup -->
    <section id="screen_signup" class="screen">
        <div class="header">
            <button class="back-button" onclick="showScreen('screen_login')">←</button>
            <span class="header-title">회원가입</span>
            <div style="width: 32px;"></div>
        </div>
        <div class="content">
            <div class="input-group">
                <label class="input-label">이메일</label>
                <input type="email" class="input-field" placeholder="email@example.com">
            </div>

            <div class="input-group">
                <label class="input-label">비밀번호</label>
                <input type="password" class="input-field" placeholder="8자 이상">
            </div>

            <div class="input-group">
                <label class="input-label">비밀번호 확인</label>
                <input type="password" class="input-field" placeholder="비밀번호 재입력">
            </div>

            <button class="btn btn-primary mt-16" onclick="showScreen('screen_home')">회원가입</button>
        </div>
    </section>

    <!-- Screen: Home -->
    <section id="screen_home" class="screen">
        <div class="header">
            <span class="header-title">{{project_name}}</span>
            <button onclick="showScreen('screen_profile')">👤</button>
        </div>
        <div class="content">
            <!-- 여기에 메인 콘텐츠 추가 -->
            <p class="text-muted text-center" style="padding: 48px 0;">
                메인 화면 콘텐츠가 여기에 표시됩니다.
            </p>
        </div>
        <nav class="tab-bar">
            <button class="tab-item active" onclick="showScreen('screen_home')">
                <span class="tab-icon">🏠</span>
                <span class="tab-label">홈</span>
            </button>
            <button class="tab-item" onclick="showScreen('screen_search')">
                <span class="tab-icon">🔍</span>
                <span class="tab-label">검색</span>
            </button>
            <button class="tab-item" onclick="showScreen('screen_create')">
                <span class="tab-icon">➕</span>
                <span class="tab-label">만들기</span>
            </button>
            <button class="tab-item" onclick="showScreen('screen_settings')">
                <span class="tab-icon">⚙️</span>
                <span class="tab-label">설정</span>
            </button>
        </nav>
    </section>

    <!-- Screen: Profile -->
    <section id="screen_profile" class="screen">
        <div class="header">
            <button class="back-button" onclick="showScreen('screen_home')">←</button>
            <span class="header-title">프로필</span>
            <div style="width: 32px;"></div>
        </div>
        <div class="content">
            <div style="text-align: center; padding: 24px 0;">
                <div style="width: 80px; height: 80px; border-radius: 50%; background-color: #e0e0e0; margin: 0 auto 16px;"></div>
                <h2 style="font-size: 20px; font-weight: 600;">사용자 이름</h2>
                <p class="text-muted">user@email.com</p>
            </div>
            <button class="btn btn-secondary" style="width: 100%;" onclick="showScreen('screen_edit_profile')">프로필 수정</button>
        </div>
    </section>

    <!-- Screen: Settings -->
    <section id="screen_settings" class="screen">
        <div class="header">
            <span class="header-title">설정</span>
            <div style="width: 32px;"></div>
        </div>
        <div class="content">
            <div class="list-item" onclick="showScreen('screen_profile')">
                <span>👤</span>
                <span style="margin-left: 12px;">프로필</span>
            </div>
            <div class="list-item" onclick="alert('알림 설정')">
                <span>🔔</span>
                <span style="margin-left: 12px;">알림</span>
            </div>
            <div class="list-item" onclick="alert('테마 설정')">
                <span>🎨</span>
                <span style="margin-left: 12px;">테마</span>
            </div>
            <div class="list-item" onclick="showScreen('screen_login')">
                <span>🚪</span>
                <span style="margin-left: 12px; color: #dc3545;">로그아웃</span>
            </div>
        </div>
        <nav class="tab-bar">
            <button class="tab-item" onclick="showScreen('screen_home')">
                <span class="tab-icon">🏠</span>
                <span class="tab-label">홈</span>
            </button>
            <button class="tab-item" onclick="showScreen('screen_search')">
                <span class="tab-icon">🔍</span>
                <span class="tab-label">검색</span>
            </button>
            <button class="tab-item" onclick="showScreen('screen_create')">
                <span class="tab-icon">➕</span>
                <span class="tab-label">만들기</span>
            </button>
            <button class="tab-item active" onclick="showScreen('screen_settings')">
                <span class="tab-icon">⚙️</span>
                <span class="tab-label">설정</span>
            </button>
        </nav>
    </section>

    <!-- 추가 화면들은 PRD 기능에 따라 생성됩니다 -->

    <!-- ========== SCREENS END ========== -->

    <script>
        // Screen Navigation
        function showScreen(screenId) {
            // Hide all screens
            document.querySelectorAll('.screen').forEach(screen => {
                screen.classList.remove('active');
            });
            // Show target screen
            const target = document.getElementById(screenId);
            if (target) {
                target.classList.add('active');
            }
        }

        // Toast notification
        function showToast(message) {
            const toast = document.createElement('div');
            toast.className = 'toast active';
            toast.textContent = message;
            document.body.appendChild(toast);
            setTimeout(() => {
                toast.remove();
            }, 3000);
        }

        // Modal
        function showModal(title, message) {
            alert(title + '\n\n' + message);
        }

        // Auto-navigate from splash after delay
        setTimeout(() => {
            if (document.getElementById('screen_splash').classList.contains('active')) {
                showScreen('screen_login');
            }
        }, 2000);
    </script>

</body>
</html>
