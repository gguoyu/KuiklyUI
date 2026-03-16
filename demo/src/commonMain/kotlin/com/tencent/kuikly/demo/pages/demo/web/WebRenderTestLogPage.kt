/*
 * Tencent is pleased to support the open source community by making KuiklyUI
 * available.
 * Copyright (C) 2025 Tencent. All rights reserved.
 * Licensed under the License of KuiklyUI;
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://github.com/Tencent-TDS/KuiklyUI/blob/main/LICENSE
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package com.tencent.kuikly.demo.pages.demo.web

import com.tencent.kuikly.core.annotations.Page
import com.tencent.kuikly.core.base.Color
import com.tencent.kuikly.core.base.ViewBuilder
import com.tencent.kuikly.core.log.KLog
import com.tencent.kuikly.core.reactive.handler.observable
import com.tencent.kuikly.core.views.List
import com.tencent.kuikly.core.views.Text
import com.tencent.kuikly.core.views.View
import com.tencent.kuikly.demo.pages.base.BasePager

/**
 * LogModule 全方法测试页面
 * 覆盖：logInfo、logDebug、logError (通过 KLog 封装)
 * 由于日志输出到控制台，UI 展示调用状态
 */
@Page("WebRenderTestLog")
internal class WebRenderTestLogPage : BasePager() {

    private val logTag = "WebRenderTestLog"

    // 测试结果状态
    private var logInfoResult by observable("未执行")
    private var logDebugResult by observable("未执行")
    private var logErrorResult by observable("未执行")
    private var logWithDataResult by observable("未执行")
    private var logMultipleResult by observable("未执行")

    override fun body(): ViewBuilder {
        val ctx = this

        return {
            attr {
                backgroundColor(Color.WHITE)
            }

            List {
                attr {
                    flex(1f)
                }

                // 标题
                View {
                    attr {
                        padding(16f)
                        backgroundColor(Color(0xFF9C27B0))
                    }
                    Text {
                        attr {
                            text("LogModule 测试")
                            fontSize(20f)
                            fontWeightBold()
                            color(Color.WHITE)
                        }
                    }
                }

                // 说明
                View {
                    attr {
                        margin(12f)
                        padding(12f)
                        backgroundColor(Color(0xFFFFF3E0))
                        borderRadius(8f)
                    }
                    Text {
                        attr {
                            text("📝 说明: 日志输出到控制台，UI 展示调用状态。\n请在浏览器开发者工具 Console 中查看日志输出。")
                            fontSize(13f)
                            color(Color(0xFFE65100))
                            lineHeight(20f)
                        }
                    }
                }

                // 测试1: logInfo
                SectionView("1. KLog.i (Info级别)", ctx.logInfoResult, Color(0xFF2196F3))

                // 测试2: logDebug
                SectionView("2. KLog.d (Debug级别)", ctx.logDebugResult, Color(0xFF4CAF50))

                // 测试3: logError
                SectionView("3. KLog.e (Error级别)", ctx.logErrorResult, Color(0xFFF44336))

                // 测试4: 带数据的日志
                SectionView("4. 带数据的日志", ctx.logWithDataResult, Color(0xFFFF9800))

                // 测试5: 多条日志
                SectionView("5. 多条连续日志", ctx.logMultipleResult, Color(0xFF607D8B))

                // 底部留白
                View {
                    attr {
                        height(50f)
                    }
                }
            }
        }
    }

    override fun created() {
        super.created()
        runLogTests()
    }

    private fun runLogTests() {
        // 测试1: logInfo
        try {
            KLog.i(logTag, "这是一条 Info 级别的日志")
            logInfoResult = "✅ 已调用\nTag: $logTag\n内容: 这是一条 Info 级别的日志"
        } catch (e: Exception) {
            logInfoResult = "❌ 调用失败: ${e.message}"
        }

        // 测试2: logDebug
        try {
            KLog.d(logTag, "这是一条 Debug 级别的日志")
            logDebugResult = "✅ 已调用\nTag: $logTag\n内容: 这是一条 Debug 级别的日志"
        } catch (e: Exception) {
            logDebugResult = "❌ 调用失败: ${e.message}"
        }

        // 测试3: logError
        try {
            KLog.e(logTag, "这是一条 Error 级别的日志")
            logErrorResult = "✅ 已调用\nTag: $logTag\n内容: 这是一条 Error 级别的日志"
        } catch (e: Exception) {
            logErrorResult = "❌ 调用失败: ${e.message}"
        }

        // 测试4: 带数据的日志
        try {
            val testData = mapOf(
                "userId" to "12345",
                "action" to "click",
                "timestamp" to "1700000000"
            )
            KLog.i(logTag, "用户操作日志: $testData")
            logWithDataResult = "✅ 已调用\nTag: $logTag\n数据: $testData"
        } catch (e: Exception) {
            logWithDataResult = "❌ 调用失败: ${e.message}"
        }

        // 测试5: 多条连续日志
        try {
            KLog.i(logTag, "日志1: 页面加载开始")
            KLog.d(logTag, "日志2: 正在获取数据")
            KLog.i(logTag, "日志3: 数据加载完成")
            KLog.d(logTag, "日志4: 渲染UI")
            KLog.i(logTag, "日志5: 页面加载完成")
            logMultipleResult = "✅ 已调用 5 条日志\n1: 页面加载开始\n2: 正在获取数据\n3: 数据加载完成\n4: 渲染UI\n5: 页面加载完成"
        } catch (e: Exception) {
            logMultipleResult = "❌ 调用失败: ${e.message}"
        }
    }

    private fun ViewBuilder.SectionView(title: String, content: String, accentColor: Color) {
        View {
            attr {
                margin(12f)
                padding(12f)
                backgroundColor(Color(0xFFF5F5F5))
                borderRadius(8f)
                borderWidth(2f)
                borderColor(accentColor)
            }
            Text {
                attr {
                    text(title)
                    fontSize(14f)
                    fontWeightBold()
                    color(accentColor)
                    marginBottom(8f)
                }
            }
            View {
                attr {
                    padding(8f)
                    backgroundColor(Color.WHITE)
                    borderRadius(4f)
                }
                Text {
                    attr {
                        text(content)
                        fontSize(13f)
                        color(Color(0xFF666666))
                        lineHeight(20f)
                    }
                }
            }
        }
    }
}
