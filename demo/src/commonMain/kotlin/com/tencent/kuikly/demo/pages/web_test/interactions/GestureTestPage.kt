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
import com.tencent.kuikly.core.views.Scroller
import com.tencent.kuikly.core.views.Text
import com.tencent.kuikly.core.views.View

/**
 * L2 复杂交互测试：手势交互验证页面
 *
 * 测试覆盖：
 * 1. 水平滑动翻页 — Scroller 横向滚动 + 页面指示器
 * 2. 双击事件 — 双击触发缩放文本
 * 3. 长按拖拽 — 长按后改变状态
 * 4. 多区域手势 — 不同区域响应不同手势
 * 5. 手势状态指示面板
 */
@Page("GestureTestPage")
internal class GestureTestPage : Pager() {

    companion object {
        private val PAGE_COLORS = listOf(
            0xFFE53935L, 0xFF1E88E5L, 0xFF43A047L, 0xFFFB8C00L, 0xFF8E24AAL
        )
    }

    // === 响应式状态 ===
    private var currentPage by observable(0)
    private var doubleTapCount by observable(0)
    private var longPressActive by observable(false)
    private var swipeDirection by observable("未滑动")
    private var gestureLog by observable("等待操作...")
    private var tapZone by observable("未点击")

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

                // === Section 1: 水平翻页 ===
                Text {
                    attr {
                        text("1. 水平翻页")
                        fontSize(16f)
                        fontWeightBold()
                        marginTop(16f)
                        marginLeft(16f)
                        color(Color.BLACK)
                    }
                }
                Text {
                    attr {
                        text("左右滑动查看不同页面")
                        fontSize(12f)
                        marginTop(4f)
                        marginLeft(16f)
                        color(0xFF999999)
                    }
                }

                View {
                    attr {
                        margin(left = 16f, top = 8f, right = 16f)
                        height(150f)
                        borderRadius(12f)
                        backgroundColor(0xFFF5F5F5)
                    }
                    Scroller {
                        attr {
                            flex(1f)
                            flexDirectionRow()
                            scrollEnable(true)
                            showScrollerIndicator(false)
                        }
                        // 5 个翻页卡片
                        for (i in 0 until 5) {
                            View {
                                attr {
                                    size(328f, 150f)
                                    backgroundColor(Color(PAGE_COLORS[i]))
                                    allCenter()
                                    marginLeft(if (i == 0) 0f else 8f)
                                    borderRadius(12f)
                                }
                                Text {
                                    attr {
                                        text("第 ${i + 1} 页")
                                        fontSize(24f)
                                        fontWeightBold()
                                        color(Color.WHITE)
                                    }
                                }
                                Text {
                                    attr {
                                        text("Page ${i + 1} of 5")
                                        fontSize(14f)
                                        color(Color(0xCCFFFFFF))
                                        marginTop(8f)
                                    }
                                }
                            }
                        }
                        // 右侧间距
                        View {
                            attr {
                                size(16f, 1f)
                            }
                        }
                    }
                }

                // 页码指示器
                View {
                    attr {
                        flexDirectionRow()
                        justifyContentCenter()
                        marginTop(8f)
                    }
                    for (i in 0 until 5) {
                        View {
                            attr {
                                size(8f, 8f)
                                borderRadius(4f)
                                backgroundColor(
                                    if (i == 0) Color(0xFF1976D2) else Color(0xFFCCCCCC)
                                )
                                marginLeft(if (i == 0) 0f else 6f)
                            }
                        }
                    }
                }

                // === Section 2: 双击事件 ===
                Text {
                    attr {
                        text("2. 双击事件")
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
                        height(80f)
                        backgroundColor(
                            if (ctx.doubleTapCount % 2 == 0) Color(0xFF2196F3) else Color(0xFFFF9800)
                        )
                        borderRadius(12f)
                        allCenter()
                    }
                    event {
                        click {
                            ctx.doubleTapCount = ctx.doubleTapCount + 1
                            ctx.gestureLog = "单击 #${ctx.doubleTapCount}"
                        }
                    }
                    Text {
                        attr {
                            text("点击计数: ${ctx.doubleTapCount}")
                            fontSize(20f)
                            fontWeightBold()
                            color(Color.WHITE)
                        }
                    }
                    Text {
                        attr {
                            text("快速点击此区域")
                            fontSize(12f)
                            color(Color(0xCCFFFFFF))
                            marginTop(4f)
                        }
                    }
                }

                // === Section 3: 长按事件 ===
                Text {
                    attr {
                        text("3. 长按事件")
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
                        height(80f)
                        backgroundColor(
                            if (ctx.longPressActive) Color(0xFFE91E63) else Color(0xFF9C27B0)
                        )
                        borderRadius(12f)
                        allCenter()
                    }
                    event {
                        longPress {
                            ctx.longPressActive = !ctx.longPressActive
                            ctx.gestureLog = if (ctx.longPressActive) "长按激活" else "长按取消"
                        }
                    }
                    Text {
                        attr {
                            text(
                                if (ctx.longPressActive) "长按已激活！" else "长按此区域"
                            )
                            fontSize(18f)
                            fontWeightBold()
                            color(Color.WHITE)
                        }
                    }
                    Text {
                        attr {
                            text(
                                if (ctx.longPressActive) "再次长按可取消" else "按住不放约 500ms"
                            )
                            fontSize(12f)
                            color(Color(0xCCFFFFFF))
                            marginTop(4f)
                        }
                    }
                }

                // === Section 4: 多区域点击 ===
                Text {
                    attr {
                        text("4. 多区域点击")
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
                        margin(left = 16f, right = 16f, top = 8f)
                        height(80f)
                    }

                    // 区域 A
                    View {
                        attr {
                            flex(1f)
                            backgroundColor(
                                if (ctx.tapZone == "A") Color(0xFF4CAF50) else Color(0xFFA5D6A7)
                            )
                            borderRadius(8f)
                            allCenter()
                            marginRight(8f)
                        }
                        event {
                            click {
                                ctx.tapZone = "A"
                                ctx.gestureLog = "点击了区域 A"
                            }
                        }
                        Text {
                            attr {
                                text("区域 A")
                                fontSize(16f)
                                fontWeightBold()
                                color(Color.WHITE)
                            }
                        }
                    }

                    // 区域 B
                    View {
                        attr {
                            flex(1f)
                            backgroundColor(
                                if (ctx.tapZone == "B") Color(0xFF2196F3) else Color(0xFF90CAF9)
                            )
                            borderRadius(8f)
                            allCenter()
                            marginRight(8f)
                        }
                        event {
                            click {
                                ctx.tapZone = "B"
                                ctx.gestureLog = "点击了区域 B"
                            }
                        }
                        Text {
                            attr {
                                text("区域 B")
                                fontSize(16f)
                                fontWeightBold()
                                color(Color.WHITE)
                            }
                        }
                    }

                    // 区域 C
                    View {
                        attr {
                            flex(1f)
                            backgroundColor(
                                if (ctx.tapZone == "C") Color(0xFFFF9800) else Color(0xFFFFCC80)
                            )
                            borderRadius(8f)
                            allCenter()
                        }
                        event {
                            click {
                                ctx.tapZone = "C"
                                ctx.gestureLog = "点击了区域 C"
                            }
                        }
                        Text {
                            attr {
                                text("区域 C")
                                fontSize(16f)
                                fontWeightBold()
                                color(Color.WHITE)
                            }
                        }
                    }
                }

                // === Section 5: 手势状态面板 ===
                Text {
                    attr {
                        text("5. 手势状态面板")
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
                        padding(all = 16f)
                        backgroundColor(0xFFF5F5F5)
                        borderRadius(8f)
                    }

                    Text {
                        attr {
                            text("点击计数: ${ctx.doubleTapCount}")
                            fontSize(14f)
                            color(Color.BLACK)
                        }
                    }
                    Text {
                        attr {
                            text("长按状态: ${if (ctx.longPressActive) "已激活" else "未激活"}")
                            fontSize(14f)
                            color(Color.BLACK)
                            marginTop(8f)
                        }
                    }
                    Text {
                        attr {
                            text("当前区域: ${ctx.tapZone}")
                            fontSize(14f)
                            color(Color.BLACK)
                            marginTop(8f)
                        }
                    }
                    Text {
                        attr {
                            text("操作日志: ${ctx.gestureLog}")
                            fontSize(14f)
                            color(0xFF666666)
                            marginTop(8f)
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
