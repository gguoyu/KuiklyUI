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
import com.tencent.kuikly.core.module.RouterModule
import com.tencent.kuikly.core.reactive.handler.observable
import com.tencent.kuikly.core.views.List
import com.tencent.kuikly.core.views.Text
import com.tencent.kuikly.core.views.View
import com.tencent.kuikly.demo.pages.base.BasePager
import org.aspect.foundation.json.JSONObject

/**
 * RouterModule 全方法测试页面
 * 覆盖：openPage、closePage 方法
 * 注意：不实际跳转，仅展示方法调用参数
 */
@Page("WebRenderTestRouter")
internal class WebRenderTestRouterPage : BasePager() {

    // 测试结果状态
    private var openPageBasicResult by observable("未执行")
    private var openPageWithDataResult by observable("未执行")
    private var closePageResult by observable("未执行")
    private var routerModuleInfoResult by observable("未执行")
    private var navigationHistoryResult by observable("未执行")

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
                        backgroundColor(Color(0xFFE91E63))
                    }
                    Text {
                        attr {
                            text("RouterModule 测试")
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
                        backgroundColor(Color(0xFFFCE4EC))
                        borderRadius(8f)
                    }
                    Text {
                        attr {
                            text("📝 说明: RouterModule 用于页面导航。\n为避免测试中断，本页面仅展示方法调用方式，\n不实际执行跳转操作。")
                            fontSize(13f)
                            color(Color(0xFFC2185B))
                            lineHeight(20f)
                        }
                    }
                }

                // 测试1: openPage 基本用法
                SectionView("1. openPage - 基本用法", ctx.openPageBasicResult)

                // 测试2: openPage 带参数
                SectionView("2. openPage - 带参数跳转", ctx.openPageWithDataResult)

                // 测试3: closePage
                SectionView("3. closePage - 关闭页面", ctx.closePageResult)

                // 测试4: 模块信息
                SectionView("4. RouterModule 信息", ctx.routerModuleInfoResult)

                // 测试5: 导航示例
                SectionView("5. 导航示例代码", ctx.navigationHistoryResult)

                // 当前页面信息
                View {
                    attr {
                        margin(12f)
                        padding(16f)
                        backgroundColor(Color(0xFF9C27B0))
                        borderRadius(8f)
                    }
                    Text {
                        attr {
                            text("当前页面")
                            fontSize(14f)
                            color(Color(0xFFE1BEE7))
                            marginBottom(4f)
                        }
                    }
                    Text {
                        attr {
                            text("WebRenderTestRouter")
                            fontSize(18f)
                            fontWeightBold()
                            color(Color.WHITE)
                        }
                    }
                }

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
        runRouterTests()
    }

    private fun runRouterTests() {
        val routerModule = acquireModule<RouterModule>(RouterModule.MODULE_NAME)

        // 测试1: openPage 基本用法 - 不实际执行
        openPageBasicResult = """
            |✅ openPage 用法示例
            |
            |调用方式:
            |routerModule.openPage("HelloWorldPage")
            |
            |功能: 导航到指定页面名的页面
            |参数: 页面名（@Page注解中定义的名称）
        """.trimMargin()

        // 测试2: openPage 带参数
        val pageData = JSONObject()
        pageData.put("userId", "12345")
        pageData.put("from", "WebRenderTestRouter")
        pageData.put("timestamp", 1700000000L)

        openPageWithDataResult = """
            |✅ openPage 带参数用法
            |
            |调用方式:
            |val data = JSONObject()
            |data.put("userId", "12345")
            |data.put("from", "source_page")
            |routerModule.openPage("TargetPage", data)
            |
            |示例参数:
            |$pageData
        """.trimMargin()

        // 测试3: closePage
        closePageResult = """
            |✅ closePage 用法示例
            |
            |调用方式:
            |routerModule.closePage()
            |
            |功能: 关闭当前页面，返回上一页
            |注意: 如果是根页面则无效果
        """.trimMargin()

        // 测试4: 模块信息
        routerModuleInfoResult = """
            |✅ RouterModule 信息
            |
            |模块名称: ${RouterModule.MODULE_NAME}
            |模块类型: 路由导航模块
            |
            |支持方法:
            |• openPage(pageName) - 打开页面
            |• openPage(pageName, pageData) - 带参数打开
            |• closePage() - 关闭当前页面
        """.trimMargin()

        // 测试5: 导航示例
        navigationHistoryResult = """
            |✅ 导航使用示例
            |
            |// 获取模块
            |val router = acquireModule<RouterModule>(
            |    RouterModule.MODULE_NAME
            |)
            |
            |// 简单跳转
            |router.openPage("DetailPage")
            |
            |// 带参数跳转
            |val params = JSONObject()
            |params.put("id", "123")
            |router.openPage("DetailPage", params)
            |
            |// 返回上一页
            |router.closePage()
        """.trimMargin()
    }

    private fun ViewBuilder.SectionView(title: String, content: String) {
        View {
            attr {
                margin(12f)
                padding(12f)
                backgroundColor(Color(0xFFF5F5F5))
                borderRadius(8f)
            }
            Text {
                attr {
                    text(title)
                    fontSize(14f)
                    fontWeightBold()
                    color(Color(0xFF333333))
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
                        fontSize(12f)
                        color(Color(0xFF666666))
                        lineHeight(18f)
                    }
                }
            }
        }
    }
}
