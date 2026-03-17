@echo off
REM Phase 1 快速验证脚本 (Windows)
REM 自动检查 Phase 1 所有关键成果

echo.
echo ========================================
echo   Kuikly Web E2E - Phase 1 验证
echo ========================================
echo.

set PROJECT_ROOT=%~dp0..
set PASSED=0
set FAILED=0

echo [1/7] 检查文件结构...
echo.

REM 核心文件检查
call :check_file "web-e2e\package.json"
call :check_file "web-e2e\playwright.config.ts"
call :check_file "web-e2e\fixtures\kuikly-page.ts"
call :check_file "web-e2e\tests\L0-static\smoke.spec.ts"
call :check_file "web-e2e\scripts\serve.mjs"
call :check_file "web-e2e\QUICKSTART.md"

echo.
echo [2/7] 检查渲染层改动...
echo.

findstr /C:"setAttribute(\"data-kuikly-component\"" "%PROJECT_ROOT%\core-render-web\base\src\jsMain\kotlin\com\tencent\kuikly\core\render\web\layer\KuiklyRenderLayerHandler.kt" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [92m✓[0m 渲染层已注入 data-kuikly-component 属性
    set /a PASSED+=1
) else (
    echo [91m✗[0m 渲染层未找到 data-kuikly-component 注入
    set /a FAILED+=1
)

echo.
echo [3/7] 检查 h5App 构建产物...
echo.

if exist "%PROJECT_ROOT%\h5App\build\processedResources\js\main\index.html" (
    echo [92m✓[0m h5App 已构建 (index.html 存在)
    set /a PASSED+=1
) else (
    echo [93m⚠[0m h5App 未构建,需要运行: gradlew :h5App:jsBrowserProductionWebpack
    set /a FAILED+=1
)

echo.
echo [4/7] 检查 node_modules...
echo.

if exist "%PROJECT_ROOT%\web-e2e\node_modules" (
    echo [92m✓[0m node_modules 已安装
    set /a PASSED+=1
) else (
    echo [93m⚠[0m node_modules 未安装,需要运行: cd web-e2e ^&^& npm install
    set /a FAILED+=1
)

echo.
echo [5/7] 检查 KuiklyPage 核心方法...
echo.

findstr /C:"async goto" "%PROJECT_ROOT%\web-e2e\fixtures\kuikly-page.ts" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [92m✓[0m goto() 方法已实现
    set /a PASSED+=1
) else (
    set /a FAILED+=1
)

findstr /C:"async waitForRenderComplete" "%PROJECT_ROOT%\web-e2e\fixtures\kuikly-page.ts" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [92m✓[0m waitForRenderComplete() 方法已实现
    set /a PASSED+=1
) else (
    set /a FAILED+=1
)

findstr /C:"component(type: string)" "%PROJECT_ROOT%\web-e2e\fixtures\kuikly-page.ts" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [92m✓[0m component() 方法已实现
    set /a PASSED+=1
) else (
    set /a FAILED+=1
)

echo.
echo [6/7] 检查测试用例数量...
echo.

findstr /C:"test(" "%PROJECT_ROOT%\web-e2e\tests\L0-static\smoke.spec.ts" | find /C /V "" > temp_count.txt
set /p TEST_COUNT=<temp_count.txt
del temp_count.txt

if %TEST_COUNT% GEQ 5 (
    echo [92m✓[0m L0 冒烟测试包含 %TEST_COUNT% 个用例 (期望 5 个)
    set /a PASSED+=1
) else (
    echo [91m✗[0m L0 冒烟测试只有 %TEST_COUNT% 个用例 (期望 5 个)
    set /a FAILED+=1
)

echo.
echo [7/7] 检查文档完整性...
echo.

call :check_file "web-e2e\README.md"
call :check_file "web-e2e\QUICKSTART.md"
call :check_file "web-e2e\VERIFICATION-CHECKLIST.md"
call :check_file "web-e2e\PHASE1-SUMMARY.md"

echo.
echo ========================================
echo   验证总结
echo ========================================
echo.
echo 总检查项: 约 15 项
echo [92m✓ 通过: %PASSED%[0m
echo [91m✗ 失败/警告: %FAILED%[0m
echo.

if %FAILED% EQU 0 (
    echo [92m========================================[0m
    echo [92m  🎉 Phase 1 验证全部通过！[0m
    echo [92m========================================[0m
    echo.
    echo [96m下一步操作：[0m
    echo.
    echo   1. 安装依赖:
    echo      cd web-e2e
    echo      npm install
    echo      npm run install:browsers
    echo.
    echo   2. 启动服务器 (终端1):
    echo      cd web-e2e
    echo      npm run serve
    echo.
    echo   3. 运行测试 (终端2):
    echo      cd web-e2e
    echo      npm run test:smoke
    echo.
    echo   详细指南: web-e2e\QUICKSTART.md
    echo.
) else (
    echo [93m========================================[0m
    echo [93m  ⚠ 有些检查项未通过[0m
    echo [93m========================================[0m
    echo.
    echo 请查看上面的警告信息,完成必要的构建和安装步骤。
    echo.
    echo 详细指南: web-e2e\QUICKSTART.md
    echo.
)

echo 详细验证报告: web-e2e\PHASE1-VERIFICATION-REPORT.md
echo.
pause
exit /b

REM ========================================
REM 辅助函数
REM ========================================

:check_file
if exist "%PROJECT_ROOT%\%~1" (
    echo [92m✓[0m %~1
    set /a PASSED+=1
) else (
    echo [91m✗[0m %~1 [不存在]
    set /a FAILED+=1
)
exit /b
