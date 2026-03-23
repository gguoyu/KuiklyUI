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

package com.tencent.kuikly.demo.pages.web_test.interactions

import com.tencent.kuikly.core.annotations.Page
import com.tencent.kuikly.core.base.Color
import com.tencent.kuikly.core.base.ViewBuilder
import com.tencent.kuikly.core.pager.Pager
import com.tencent.kuikly.core.reactive.handler.observable
import com.tencent.kuikly.core.views.List
import com.tencent.kuikly.core.views.Text
import com.tencent.kuikly.core.views.View

/**
 * L2 复杂交互测试：页面导航验证页面
 *
 * 测试覆盖：
 * 1. 模拟多页面切换（内部 Tab 路由）
 * 2. 页面栈管理（前进/后退）
 * 3. 导航栏交互
 * 4. 面包屑路径追踪
 * 5. 导航历史记录
 */
@Page("NavigationTestPage")
internal class NavigationTestPage : Pager() {

    companion object {
        private val PAGES = listOf("首页", "发现", "消息", "个人中心")
        private val PAGE_COLORS = listOf(
            0xFF1976D2L, 0xFF388E3CL, 0xFFE64A19L, 0xFF7B1FA2L
        )
        private val PAGE_ICONS = listOf("🏠", "🔍", "💬", "👤")
    }

    // === 响应式状态 ===
    private var currentPageIndex by observable(0)
    private var navigationHistory by observable("首页")
    private var historyCount by observable(1)
    private var subPageActive by observable(false)
    private var subPageTitle by observable("")

    override fun body(): ViewBuilder {
        val ctx = this
        return {
            attr {
                backgroundColor(Color.WHITE)
            }

            // === 顶部导航栏 ===
            View {
                attr {
                    height(50f)
                    flexDirectionRow()
                    alignItemsCenter()
                    backgroundColor(Color(PAGE_COLORS[ctx.currentPageIndex]))
                    padding(left = 16f, right = 16f)
                }

                // 返回按钮（仅在子页面显示）
                if (ctx.subPageActive) {
                    View {
                        attr {
                            size(32f, 32f)
                            allCenter()
                            marginRight(8f)
                        }
                        event {
                            click {
                                ctx.subPageActive = false
                                ctx.navigationHistory = ctx.navigationHistory + " → 返回"
                                ctx.historyCount = ctx.historyCount + 1
                            }
                        }
                        Text {
                            attr {
                                text("←")
                                fontSize(20f)
                                color(Color.WHITE)
                                fontWeightBold()
                            }
                        }
                    }
                }

                // 标题
                Text {
                    attr {
                        text(
                            if (ctx.subPageActive) ctx.subPageTitle
                            else PAGES[ctx.currentPageIndex]
                        )
                        fontSize(18f)
                        fontWeightBold()
                        color(Color.WHITE)
                        flex(1f)
                    }
                }

                // 导航计数
                Text {
                    attr {
                        text("步骤: ${ctx.historyCount}")
                        fontSize(12f)
                        color(Color(0xCCFFFFFF))
                    }
                }
            }

            // === 面包屑路径 ===
            View {
                attr {
                    padding(left = 16f, right = 16f, top = 8f, bottom = 8f)
                    backgroundColor(0xFFF5F5F5)
                }
                Text {
                    attr {
                        text("路径: ${ctx.navigationHistory}")
                        fontSize(12f)
                        color(0xFF666666)
                    }
                }
            }

            // === 页面内容区 ===
            if (ctx.subPageActive) {
                // 子页面内容
                View {
                    attr {
                        flex(1f)
                        allCenter()
                        backgroundColor(0xFFFAFAFA)
                    }
                    Text {
                        attr {
                            text(ctx.subPageTitle)
                            fontSize(24f)
                            fontWeightBold()
                            color(Color.BLACK)
                        }
                    }
                    Text {
                        attr {
                            text("这是子页面的内容区域")
                            fontSize(14f)
                            color(0xFF666666)
                            marginTop(8f)
                        }
                    }

                    // 返回主页按钮
                    View {
                        attr {
                            marginTop(24f)
                            width(160f)
                            height(44f)
                            backgroundColor(0xFF2196F3)
                            borderRadius(22f)
                            allCenter()
                        }
                        event {
                            click {
                                ctx.subPageActive = false
                                ctx.navigationHistory = ctx.navigationHistory + " → 返回"
                                ctx.historyCount = ctx.historyCount + 1
                            }
                        }
                        Text {
                            attr {
                                text("返回上一页")
                                fontSize(15f)
                                color(Color.WHITE)
                                fontWeightBold()
                            }
                        }
                    }
                }
            } else {
                // 主页面内容 — 根据 currentPageIndex 显示不同内容
                List {
                    attr {
                        flex(1f)
                    }

                    // 当前页面信息卡
                    View {
                        attr {
                            margin(left = 16f, right = 16f, top = 16f)
                            height(120f)
                            backgroundColor(Color(PAGE_COLORS[ctx.currentPageIndex]))
                            borderRadius(12f)
                            allCenter()
                        }
                        Text {
                            attr {
                                text(PAGE_ICONS[ctx.currentPageIndex])
                                fontSize(36f)
                            }
                        }
                        Text {
                            attr {
                                text("当前页面: ${PAGES[ctx.currentPageIndex]}")
                                fontSize(18f)
                                fontWeightBold()
                                color(Color.WHITE)
                                marginTop(8f)
                            }
                        }
                    }

                    // 子页面入口列表
                    Text {
                        attr {
                            text("子页面入口")
                            fontSize(16f)
                            fontWeightBold()
                            marginTop(24f)
                            marginLeft(16f)
                            color(Color.BLACK)
                        }
                    }

                    val subPages = listOf("设置页面", "详情页面", "编辑页面")
                    subPages.forEachIndexed { index, title ->
                        View {
                            attr {
                                flexDirectionRow()
                                alignItemsCenter()
                                height(56f)
                                margin(left = 16f, right = 16f, top = 8f)
                                padding(left = 16f, right = 16f)
                                backgroundColor(0xFFF5F5F5)
                                borderRadius(8f)
                            }
                            event {
                                click {
                                    ctx.subPageActive = true
                                    ctx.subPageTitle = title
                                    ctx.navigationHistory = ctx.navigationHistory + " → $title"
                                    ctx.historyCount = ctx.historyCount + 1
                                }
                            }

                            Text {
                                attr {
                                    text(title)
                                    fontSize(15f)
                                    color(Color.BLACK)
                                    flex(1f)
                                }
                            }
                            Text {
                                attr {
                                    text("→")
                                    fontSize(18f)
                                    color(0xFF999999)
                                }
                            }
                        }
                    }

                    // 导航历史
                    Text {
                        attr {
                            text("导航历史")
                            fontSize(16f)
                            fontWeightBold()
                            marginTop(24f)
                            marginLeft(16f)
                            color(Color.BLACK)
                        }
                    }

                    View {
                        attr {
                            margin(left = 16f, right = 16f, top = 8f)
                            padding(all = 12f)
                            backgroundColor(0xFFF5F5F5)
                            borderRadius(8f)
                        }
                        Text {
                            attr {
                                text(ctx.navigationHistory)
                                fontSize(13f)
                                color(0xFF666666)
                            }
                        }
                    }

                    // 重置按钮
                    View {
                        attr {
                            margin(left = 16f, right = 16f, top = 16f)
                            height(44f)
                            backgroundColor(0xFFFF5722)
                            borderRadius(8f)
                            allCenter()
                        }
                        event {
                            click {
                                ctx.currentPageIndex = 0
                                ctx.navigationHistory = "首页"
                                ctx.historyCount = 1
                                ctx.subPageActive = false
                                ctx.subPageTitle = ""
                            }
                        }
                        Text {
                            attr {
                                text("重置导航历史")
                                fontSize(15f)
                                color(Color.WHITE)
                                fontWeightBold()
                            }
                        }
                    }

                    // 底部间距
                    View {
                        attr {
                            height(80f)
                        }
                    }
                }
            }

            // === 底部 Tab 栏 ===
            View {
                attr {
                    height(56f)
                    flexDirectionRow()
                    backgroundColor(Color.WHITE)
                }

                PAGES.forEachIndexed { index, title ->
                    View {
                        attr {
                            flex(1f)
                            allCenter()
                            backgroundColor(
                                if (ctx.currentPageIndex == index && !ctx.subPageActive)
                                    Color(0xFFE3F2FD) else Color.WHITE
                            )
                        }
                        event {
                            click {
                                if (ctx.currentPageIndex != index || ctx.subPageActive) {
                                    ctx.currentPageIndex = index
                                    ctx.subPageActive = false
                                    ctx.navigationHistory = ctx.navigationHistory + " → $title"
                                    ctx.historyCount = ctx.historyCount + 1
                                }
                            }
                        }
                        Text {
                            attr {
                                text(PAGE_ICONS[index])
                                fontSize(20f)
                            }
                        }
                        Text {
                            attr {
                                text(title)
                                fontSize(11f)
                                color(
                                    if (ctx.currentPageIndex == index && !ctx.subPageActive)
                                        Color(0xFF1976D2) else Color(0xFF999999)
                                )
                                marginTop(2f)
                            }
                        }
                    }
                }
            }
        }
    }
}
