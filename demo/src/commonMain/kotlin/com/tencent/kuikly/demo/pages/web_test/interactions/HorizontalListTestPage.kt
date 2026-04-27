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
 * Horizontal List scroll test page
 *
 * Tests covered:
 * 1. Horizontal KRListView (flexDirectionRow) — covers H5ListPCScrollHelper
 *    calculateHorizontalDelta / applyHorizontalScroll paths
 * 2. Click interaction on horizontal list items
 * 3. Scroll event callbacks on horizontal list
 */
@Page("HorizontalListTestPage")
internal class HorizontalListTestPage : Pager() {

    companion object {
        private val ITEM_COLORS = listOf(
            0xFFE53935L, 0xFF1E88E5L, 0xFF43A047L, 0xFFFB8C00L,
            0xFF8E24AAL, 0xFF00ACC1L, 0xFFD81B60L, 0xFF3949ABL,
            0xFF00897BL, 0xFFE65100L, 0xFF6D4C41L, 0xFF546E7AL,
            0xFFC0CA33L, 0xFF7CB342L, 0xFF5E35B1L, 0xFFFF6F00L,
            0xFF1565C0L, 0xFF2E7D32L, 0xFFAD1457L, 0xFFEF6C00L
        )
    }

    private var selectedItem by observable("未选择")
    private var scrollEventCount by observable(0)

    override fun body(): ViewBuilder {
        val ctx = this
        return {
            attr {
                backgroundColor(Color.WHITE)
            }

            // Status bar
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
                        text("水平列表滚动测试")
                        fontSize(16f)
                        fontWeightBold()
                        color(Color.WHITE)
                        flex(1f)
                    }
                }
                Text {
                    attr {
                        text("选中: ${ctx.selectedItem}")
                        fontSize(12f)
                        color(Color(0xCCFFFFFF))
                    }
                }
            }

            // Scroll event count indicator
            View {
                attr {
                    height(30f)
                    backgroundColor(0xFFF5F5F5)
                    allCenter()
                }
                Text {
                    attr {
                        text("h-scroll-events: ${ctx.scrollEventCount}")
                        fontSize(12f)
                        color(0xFF666666)
                    }
                }
            }

            // === Horizontal List (flexDirectionRow) ===
            // This exercises H5ListPCScrollHelper.calculateHorizontalDelta and applyHorizontalScroll
            List {
                attr {
                    height(120f)
                    flexDirectionRow()
                    showScrollerIndicator(true)
                    borderRadius(8f)
                }
                event {
                    scroll {
                        ctx.scrollEventCount = ctx.scrollEventCount + 1
                    }
                }

                // 20 wide items — total width well exceeds viewport
                for (i in 0 until 20) {
                    View {
                        attr {
                            size(100f, 100f)
                            margin(left = 8f, top = 10f)
                            backgroundColor(Color(ITEM_COLORS[i % ITEM_COLORS.size]))
                            borderRadius(8f)
                            allCenter()
                        }
                        event {
                            click {
                                ctx.selectedItem = "H-Item-${i + 1}"
                            }
                        }
                        Text {
                            attr {
                                text("H${i + 1}")
                                fontSize(16f)
                                fontWeightBold()
                                color(Color.WHITE)
                            }
                        }
                    }
                }
                // Right trailing spacer
                View { attr { size(8f, 1f) } }
            }

            // Spacer
            View { attr { height(20f) } }

            // === Vertical list below to exercise mixed layout ===
            Text {
                attr {
                    text("垂直列表")
                    fontSize(14f)
                    fontWeightBold()
                    color(Color.BLACK)
                    marginLeft(16f)
                    marginTop(8f)
                }
            }

            List {
                attr {
                    flex(1f)
                    bouncesEnable(false)
                }

                for (i in 0 until 15) {
                    View {
                        attr {
                            flexDirectionRow()
                            alignItemsCenter()
                            height(50f)
                            padding(left = 16f, right = 16f)
                            backgroundColor(if (i % 2 == 0) Color.WHITE else Color(0xFFFAFAFA))
                        }
                        event {
                            click {
                                ctx.selectedItem = "V-Item-${i + 1}"
                            }
                        }
                        View {
                            attr {
                                size(28f, 28f)
                                borderRadius(14f)
                                backgroundColor(Color(ITEM_COLORS[i % ITEM_COLORS.size]))
                                allCenter()
                            }
                            Text {
                                attr {
                                    text("${i + 1}")
                                    fontSize(12f)
                                    color(Color.WHITE)
                                }
                            }
                        }
                        Text {
                            attr {
                                text("vertical-item-${i + 1}")
                                fontSize(14f)
                                color(Color.BLACK)
                                marginLeft(12f)
                            }
                        }
                    }
                }
            }
        }
    }
}
