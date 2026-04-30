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
import com.tencent.kuikly.core.base.ViewRef
import com.tencent.kuikly.core.pager.Pager
import com.tencent.kuikly.core.reactive.handler.observable
import com.tencent.kuikly.core.views.List
import com.tencent.kuikly.core.views.ListView
import com.tencent.kuikly.core.views.Text
import com.tencent.kuikly.core.views.View

/**
 * L2 复杂交互测试：列表滚动验证页面
 *
 * 测试覆盖：
 * 1. 50 项固定列表，可滚动验证
 * 2. 分组标题（模拟 sticky header 效果）
 * 3. 列表项点击 — 选中高亮
 * 4. 滚动到底部后显示 "已到底部" 标记
 * 5. 回到顶部按钮
 */
@Page("ListScrollTestPage")
internal class ListScrollTestPage : Pager() {

    companion object {
        private val GROUP_COLORS = listOf(
            0xFF1976D2L, 0xFF388E3CL, 0xFFE64A19L, 0xFF7B1FA2L, 0xFF00796BL
        )
        private val ITEM_COLORS = listOf(
            0xFF4CAF50L, 0xFF2196F3L, 0xFFFF9800L, 0xFFE91E63L, 0xFF9C27B0L,
            0xFF00BCD4L, 0xFF795548L, 0xFF607D8BL, 0xFFFF5722L, 0xFF3F51B5L
        )
    }

    // === 响应式状态 ===
    private var selectedIndex by observable(-1)
    private var clickedItemText by observable("未选择")
    private var listGestureText by observable("未触发")
    private var scrollReachedBottom by observable(false)
    private var scrollEventCount by observable(0)
    private var dragBeginCount by observable(0)
    private var dragEndCount by observable(0)
    private var scrollEndCount by observable(0)
    private var scrollToCount by observable(0)
    private var scrollToAnimatedCount by observable(0)
    private var indicatorVisible by observable(true)
    private var bounceEnabledState by observable(true)
    private var listRef: ViewRef<ListView<*, *>>? = null

    override fun body(): ViewBuilder {
        val ctx = this
        return {
            attr {
                backgroundColor(Color.WHITE)
            }

            // === 顶部固定标题栏 ===
            View {
                attr {
                    height(50f)
                    backgroundColor(0xFF1565C0)
                    allCenter()
                    flexDirectionRow()
                    padding(left = 16f, right = 16f)
                }
                Text {
                    attr {
                        text("列表滚动测试")
                        fontSize(18f)
                        fontWeightBold()
                        color(Color.WHITE)
                        flex(1f)
                    }
                }
                View {
                    attr {
                        alignItemsFlexEnd()
                    }
                    // 当前选中指示
                    Text {
                        attr {
                            text("选中: ${ctx.clickedItemText}")
                            fontSize(12f)
                            color(Color(0xCCFFFFFF))
                        }
                    }
                    Text {
                        attr {
                            text("列表手势: ${ctx.listGestureText}")
                            fontSize(11f)
                            color(Color(0xAAFFFFFF))
                            marginTop(2f)
                        }
                    }
                    Text {
                        attr {
                            text("scroll-events: ${ctx.scrollEventCount}")
                            fontSize(10f)
                            color(Color(0xAAFFFFFF))
                            marginTop(2f)
                        }
                    }
                    Text {
                        attr {
                            text("drag-begin: ${ctx.dragBeginCount}")
                            fontSize(10f)
                            color(Color(0xAAFFFFFF))
                            marginTop(1f)
                        }
                    }
                    Text {
                        attr {
                            text("drag-end: ${ctx.dragEndCount}")
                            fontSize(10f)
                            color(Color(0xAAFFFFFF))
                            marginTop(1f)
                        }
                    }
                    // Programmatic scroll button — exercises H5ListView.setContentOffset
                    View {
                        attr {
                            height(22f)
                            backgroundColor(Color(0x44FFFFFF))
                            borderRadius(4f)
                            allCenter()
                            marginTop(2f)
                        }
                        event {
                            click {
                                ctx.scrollToCount += 1
                                ctx.listRef?.view?.setContentOffset(0f, 0f, animated = false)
                            }
                        }
                        Text {
                            attr {
                                text(if (ctx.scrollToCount == 0) "scroll-to-top-idle" else "scroll-to-top: ${ctx.scrollToCount}")
                                fontSize(9f)
                                color(Color.WHITE)
                            }
                        }
                    }
                    // Animated setContentOffset button — exercises H5ListView.setContentOffset animated path
                    View {
                        attr {
                            height(22f)
                            backgroundColor(Color(0x44FFFFFF))
                            borderRadius(4f)
                            allCenter()
                            marginTop(2f)
                            marginLeft(4f)
                        }
                        event {
                            click {
                                ctx.scrollToAnimatedCount += 1
                                ctx.listRef?.view?.setContentOffset(0f, 500f, animated = true)
                            }
                        }
                        Text {
                            attr {
                                text(if (ctx.scrollToAnimatedCount == 0) "scroll-anim-idle" else "scroll-anim: ${ctx.scrollToAnimatedCount}")
                                fontSize(9f)
                                color(Color.WHITE)
                            }
                        }
                    }
                    View {
                        attr {
                            height(22f)
                            backgroundColor(Color(0x44FFFFFF))
                            borderRadius(4f)
                            allCenter()
                            marginTop(2f)
                        }
                        event {
                            click {
                                ctx.indicatorVisible = !ctx.indicatorVisible
                                ctx.listRef?.view?.getViewAttr()?.showScrollerIndicator(ctx.indicatorVisible)
                            }
                        }
                        Text {
                            attr {
                                text(if (ctx.indicatorVisible) "indicator:shown" else "indicator:hidden")
                                fontSize(9f)
                                color(Color.WHITE)
                            }
                        }
                    }
                    View {
                        attr {
                            height(22f)
                            backgroundColor(Color(0x44FFFFFF))
                            borderRadius(4f)
                            allCenter()
                            marginTop(2f)
                        }
                        event {
                            click {
                                ctx.bounceEnabledState = !ctx.bounceEnabledState
                                ctx.listRef?.view?.getViewAttr()?.bouncesEnable(ctx.bounceEnabledState)
                            }
                        }
                        Text {
                            attr {
                                text(if (ctx.bounceEnabledState) "bounce:on" else "bounce:off")
                                fontSize(9f)
                                color(Color.WHITE)
                            }
                        }
                    }
                }
            }

            // === 滚动列表 ===
            List {
                ref {
                    ctx.listRef = it
                }
                attr {
                    flex(1f)
                    showScrollerIndicator(true)
                    bouncesEnable(true)
                }
                event {
                    click {
                        ctx.listGestureText = "单击"
                    }
                    doubleClick {
                        ctx.listGestureText = "双击"
                    }
                    scroll {
                        ctx.scrollEventCount = ctx.scrollEventCount + 1
                    }
                    dragBegin {
                        ctx.dragBeginCount = ctx.dragBeginCount + 1
                    }
                    dragEnd {
                        ctx.dragEndCount = ctx.dragEndCount + 1
                    }
                    scrollEnd {
                        ctx.scrollEndCount = ctx.scrollEndCount + 1
                    }
                }

                // 生成 5 组 × 10 项 = 50 项
                for (group in 0 until 5) {
                    // 分组标题
                    View {
                        attr {
                            height(40f)
                            backgroundColor(Color(GROUP_COLORS[group]))
                            padding(left = 16f)
                            justifyContentCenter()
                        }
                        Text {
                            attr {
                                text("分组 ${group + 1}")
                                fontSize(15f)
                                fontWeightBold()
                                color(Color.WHITE)
                            }
                        }
                    }

                    // 每组 10 个列表项
                    for (item in 0 until 10) {
                        val index = group * 10 + item
                        val itemLabel = "列表项 ${index + 1}"
                        View {
                            attr {
                                flexDirectionRow()
                                alignItemsCenter()
                                height(56f)
                                padding(left = 16f, right = 16f)
                                backgroundColor(
                                    if (ctx.selectedIndex == index) Color(0xFFE3F2FD)
                                    else if (index % 2 == 0) Color.WHITE
                                    else Color(0xFFFAFAFA)
                                )
                            }
                            event {
                                click {
                                    ctx.selectedIndex = index
                                    ctx.clickedItemText = itemLabel
                                }
                            }

                            // 序号圆标
                            View {
                                attr {
                                    size(32f, 32f)
                                    borderRadius(16f)
                                    backgroundColor(Color(ITEM_COLORS[index % ITEM_COLORS.size]))
                                    allCenter()
                                }
                                Text {
                                    attr {
                                        text("${index + 1}")
                                        fontSize(12f)
                                        color(Color.WHITE)
                                        fontWeightBold()
                                    }
                                }
                            }

                            // 标题 + 副标题
                            View {
                                attr {
                                    marginLeft(12f)
                                    flex(1f)
                                }
                                Text {
                                    attr {
                                        text(itemLabel)
                                        fontSize(15f)
                                        color(
                                            if (ctx.selectedIndex == index) Color(0xFF1976D2)
                                            else Color.BLACK
                                        )
                                        fontWeightBold()
                                    }
                                }
                                Text {
                                    attr {
                                        text("分组${group + 1} 第${item + 1}项 · 副标题描述")
                                        fontSize(12f)
                                        color(0xFF999999)
                                        marginTop(2f)
                                    }
                                }
                            }

                            // 选中标记
                            if (ctx.selectedIndex == index) {
                                Text {
                                    attr {
                                        text("✓")
                                        fontSize(18f)
                                        color(0xFF1976D2)
                                        fontWeightBold()
                                    }
                                }
                            }
                        }
                    }
                }

                // === 底部标记 ===
                View {
                    attr {
                        height(60f)
                        allCenter()
                        backgroundColor(0xFFF5F5F5)
                    }
                    Text {
                        attr {
                            text("— 已到底部 —")
                            fontSize(14f)
                            color(0xFF999999)
                        }
                    }
                }
            }
        }
    }
}
