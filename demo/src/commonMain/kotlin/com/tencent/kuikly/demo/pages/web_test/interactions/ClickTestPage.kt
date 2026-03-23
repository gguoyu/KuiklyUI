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
 * 点击事件交互验证测试页面
 *
 * 测试覆盖：
 * 1. 按钮点击 — 点击后改变文本内容
 * 2. 计数器 — 点击+1/-1，显示数值
 * 3. Tab 切换 — 点击 Tab 切换选中状态
 * 4. 开关切换 — 点击切换 on/off 状态
 * 5. 长按事件 — 长按触发状态变化
 */
@Page("ClickTestPage")
internal class ClickTestPage : Pager() {

    // === 响应式状态 ===
    private var buttonClicked by observable(false)
    private var counter by observable(0)
    private var selectedTab by observable(0)
    private var switchOn by observable(false)
    private var longPressed by observable(false)

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

                // === Section 1: 按钮点击 ===
                Text {
                    attr {
                        text("1. 按钮点击")
                        fontSize(16f)
                        fontWeightBold()
                        marginTop(16f)
                        marginLeft(16f)
                        color(Color.BLACK)
                    }
                }

                // 点击按钮
                View {
                    attr {
                        margin(left = 16f, right = 16f, top = 12f)
                        height(44f)
                        backgroundColor(if (ctx.buttonClicked) Color(0xFF4CAF50) else Color(0xFF2196F3))
                        borderRadius(8f)
                        allCenter()
                    }
                    event {
                        click {
                            ctx.buttonClicked = !ctx.buttonClicked
                        }
                    }
                    Text {
                        attr {
                            text(if (ctx.buttonClicked) "已点击" else "点击我")
                            fontSize(16f)
                            color(Color.WHITE)
                            fontWeightBold()
                        }
                    }
                }

                // 状态指示文本
                Text {
                    attr {
                        text(if (ctx.buttonClicked) "状态: 已激活" else "状态: 未激活")
                        fontSize(14f)
                        marginTop(8f)
                        marginLeft(16f)
                        color(if (ctx.buttonClicked) Color(0xFF4CAF50) else Color(0xFF999999))
                    }
                }

                // === Section 2: 计数器 ===
                Text {
                    attr {
                        text("2. 计数器")
                        fontSize(16f)
                        fontWeightBold()
                        marginTop(24f)
                        marginLeft(16f)
                        color(Color.BLACK)
                    }
                }

                View {
                    attr {
                        flexDirectionRow()
                        alignItemsCenter()
                        justifyContentCenter()
                        marginTop(12f)
                        padding(left = 16f, right = 16f)
                    }

                    // 减号按钮
                    View {
                        attr {
                            size(44f, 44f)
                            backgroundColor(0xFFFF5722)
                            borderRadius(22f)
                            allCenter()
                        }
                        event {
                            click {
                                ctx.counter = ctx.counter - 1
                            }
                        }
                        Text {
                            attr {
                                text("-")
                                fontSize(24f)
                                color(Color.WHITE)
                                fontWeightBold()
                            }
                        }
                    }

                    // 计数显示
                    Text {
                        attr {
                            text("${ctx.counter}")
                            fontSize(32f)
                            fontWeightBold()
                            marginLeft(24f)
                            marginRight(24f)
                            color(Color.BLACK)
                            width(80f)
                            textAlignCenter()
                        }
                    }

                    // 加号按钮
                    View {
                        attr {
                            size(44f, 44f)
                            backgroundColor(0xFF4CAF50)
                            borderRadius(22f)
                            allCenter()
                        }
                        event {
                            click {
                                ctx.counter = ctx.counter + 1
                            }
                        }
                        Text {
                            attr {
                                text("+")
                                fontSize(24f)
                                color(Color.WHITE)
                                fontWeightBold()
                            }
                        }
                    }
                }

                // === Section 3: Tab 切换 ===
                Text {
                    attr {
                        text("3. Tab 切换")
                        fontSize(16f)
                        fontWeightBold()
                        marginTop(24f)
                        marginLeft(16f)
                        color(Color.BLACK)
                    }
                }

                View {
                    attr {
                        flexDirectionRow()
                        margin(left = 16f, right = 16f, top = 12f)
                        height(44f)
                        backgroundColor(0xFFF5F5F5)
                        borderRadius(8f)
                    }

                    // Tab 项目
                    val tabTitles = listOf("全部", "推荐", "热门")
                    tabTitles.forEachIndexed { index, title ->
                        View {
                            attr {
                                flex(1f)
                                allCenter()
                                backgroundColor(
                                    if (ctx.selectedTab == index) Color(0xFF2196F3)
                                    else Color.TRANSPARENT
                                )
                                if (index == 0) {
                                    borderRadius(8f)
                                }
                                if (index == tabTitles.size - 1) {
                                    borderRadius(8f)
                                }
                            }
                            event {
                                click {
                                    ctx.selectedTab = index
                                }
                            }
                            Text {
                                attr {
                                    text(title)
                                    fontSize(14f)
                                    color(
                                        if (ctx.selectedTab == index) Color.WHITE
                                        else Color(0xFF666666)
                                    )
                                    fontWeightBold()
                                }
                            }
                        }
                    }
                }

                // Tab 内容
                Text {
                    attr {
                        val contentTexts = listOf("当前显示: 全部内容", "当前显示: 推荐内容", "当前显示: 热门内容")
                        text(contentTexts[ctx.selectedTab])
                        fontSize(14f)
                        marginTop(12f)
                        marginLeft(16f)
                        color(0xFF666666)
                    }
                }

                // === Section 4: 开关切换 ===
                Text {
                    attr {
                        text("4. 开关切换")
                        fontSize(16f)
                        fontWeightBold()
                        marginTop(24f)
                        marginLeft(16f)
                        color(Color.BLACK)
                    }
                }

                View {
                    attr {
                        flexDirectionRow()
                        alignItemsCenter()
                        margin(left = 16f, right = 16f, top = 12f)
                        padding(all = 12f)
                        backgroundColor(0xFFF5F5F5)
                        borderRadius(8f)
                    }

                    Text {
                        attr {
                            text("通知开关")
                            fontSize(14f)
                            flex(1f)
                            color(Color.BLACK)
                        }
                    }

                    // 模拟开关
                    View {
                        attr {
                            size(52f, 28f)
                            backgroundColor(
                                if (ctx.switchOn) Color(0xFF4CAF50) else Color(0xFFCCCCCC)
                            )
                            borderRadius(14f)
                        }
                        event {
                            click {
                                ctx.switchOn = !ctx.switchOn
                            }
                        }

                        // 滑块
                        View {
                            attr {
                                size(24f, 24f)
                                backgroundColor(Color.WHITE)
                                borderRadius(12f)
                                marginTop(2f)
                                if (ctx.switchOn) {
                                    marginLeft(26f)
                                } else {
                                    marginLeft(2f)
                                }
                            }
                        }
                    }
                }

                // 开关状态文本
                Text {
                    attr {
                        text(if (ctx.switchOn) "通知已开启" else "通知已关闭")
                        fontSize(14f)
                        marginTop(8f)
                        marginLeft(16f)
                        color(if (ctx.switchOn) Color(0xFF4CAF50) else Color(0xFF999999))
                    }
                }

                // === Section 5: 长按事件 ===
                Text {
                    attr {
                        text("5. 长按事件")
                        fontSize(16f)
                        fontWeightBold()
                        marginTop(24f)
                        marginLeft(16f)
                        color(Color.BLACK)
                    }
                }

                View {
                    attr {
                        margin(left = 16f, right = 16f, top = 12f)
                        height(60f)
                        backgroundColor(if (ctx.longPressed) Color(0xFFFF9800) else Color(0xFF9C27B0))
                        borderRadius(8f)
                        allCenter()
                    }
                    event {
                        longPress {
                            ctx.longPressed = !ctx.longPressed
                        }
                    }
                    Text {
                        attr {
                            text(if (ctx.longPressed) "长按成功！" else "长按我试试")
                            fontSize(16f)
                            color(Color.WHITE)
                            fontWeightBold()
                        }
                    }
                }

                // 底部间距
                View {
                    attr {
                        height(50f)
                    }
                }
            }
        }
    }
}
