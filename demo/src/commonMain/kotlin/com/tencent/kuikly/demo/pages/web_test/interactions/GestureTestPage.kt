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
 * Gesture interaction test page
 *
 * Tests covered:
 * 1. Horizontal scroll pager — Scroller horizontal scroll + page indicator
 * 2. Tap counter — click increments counter
 * 3. Long press — toggles active state
 * 4. Multi-zone tap — different zones respond independently
 * 5. Gesture status panel
 */
@Page("GestureTestPage")
internal class GestureTestPage : Pager() {

    companion object {
        private val PAGE_COLORS = listOf(
            0xFFE53935L, 0xFF1E88E5L, 0xFF43A047L, 0xFFFB8C00L, 0xFF8E24AAL
        )
    }

    private var currentPage by observable(0)
    private var tapCount by observable(0)
    private var longPressActive by observable(false)
    private var gestureLog by observable("idle")
    private var tapZone by observable("none")
    private var doubleClickCount by observable(0)
    private var panState by observable("pan-idle")

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

                // === Section 1: Horizontal Scroll Pager ===
                Text {
                    attr {
                        text("1. Horizontal Scroll Pager")
                        fontSize(16f)
                        fontWeightBold()
                        marginTop(16f)
                        marginLeft(16f)
                        color(Color.BLACK)
                    }
                }
                Text {
                    attr {
                        text("swipe left or right")
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
                                        text("Page ${i + 1} of 5")
                                        fontSize(24f)
                                        fontWeightBold()
                                        color(Color.WHITE)
                                    }
                                }
                            }
                        }
                        View {
                            attr {
                                size(16f, 1f)
                            }
                        }
                    }
                }

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

                // === Section 2: Tap Counter ===
                Text {
                    attr {
                        text("2. Tap Counter")
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
                            if (ctx.tapCount % 2 == 0) Color(0xFF2196F3) else Color(0xFFFF9800)
                        )
                        borderRadius(12f)
                        allCenter()
                    }
                    event {
                        click {
                            ctx.tapCount = ctx.tapCount + 1
                            ctx.gestureLog = "tap #${ctx.tapCount}"
                        }
                    }
                    Text {
                        attr {
                            text("tap-count: ${ctx.tapCount}")
                            fontSize(20f)
                            fontWeightBold()
                            color(Color.WHITE)
                        }
                    }
                    Text {
                        attr {
                            text("tap here")
                            fontSize(12f)
                            color(Color(0xCCFFFFFF))
                            marginTop(4f)
                        }
                    }
                }

                // === Section 3: Long Press ===
                Text {
                    attr {
                        text("3. Long Press")
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
                            ctx.gestureLog = if (ctx.longPressActive) "long-press-activated" else "long-press-cancelled"
                        }
                    }
                    Text {
                        attr {
                            text(
                                if (ctx.longPressActive) "long-pressed" else "long-press-area"
                            )
                            fontSize(18f)
                            fontWeightBold()
                            color(Color.WHITE)
                        }
                    }
                    Text {
                        attr {
                            text(
                                if (ctx.longPressActive) "long-press again to deactivate" else "hold ~500ms"
                            )
                            fontSize(12f)
                            color(Color(0xCCFFFFFF))
                            marginTop(4f)
                        }
                    }
                }

                // === Section 4: Multi-Zone Tap ===
                Text {
                    attr {
                        text("4. Multi-Zone Tap")
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

                    View {
                        attr {
                            flex(1f)
                            backgroundColor(
                                if (ctx.tapZone == "a") Color(0xFF4CAF50) else Color(0xFFA5D6A7)
                            )
                            borderRadius(8f)
                            allCenter()
                            marginRight(8f)
                        }
                        event {
                            click {
                                ctx.tapZone = "a"
                                ctx.gestureLog = "tapped zone-a"
                            }
                        }
                        Text {
                            attr {
                                text("zone-a")
                                fontSize(16f)
                                fontWeightBold()
                                color(Color.WHITE)
                            }
                        }
                    }

                    View {
                        attr {
                            flex(1f)
                            backgroundColor(
                                if (ctx.tapZone == "b") Color(0xFF2196F3) else Color(0xFF90CAF9)
                            )
                            borderRadius(8f)
                            allCenter()
                            marginRight(8f)
                        }
                        event {
                            click {
                                ctx.tapZone = "b"
                                ctx.gestureLog = "tapped zone-b"
                            }
                        }
                        Text {
                            attr {
                                text("zone-b")
                                fontSize(16f)
                                fontWeightBold()
                                color(Color.WHITE)
                            }
                        }
                    }

                    View {
                        attr {
                            flex(1f)
                            backgroundColor(
                                if (ctx.tapZone == "c") Color(0xFFFF9800) else Color(0xFFFFCC80)
                            )
                            borderRadius(8f)
                            allCenter()
                        }
                        event {
                            click {
                                ctx.tapZone = "c"
                                ctx.gestureLog = "tapped zone-c"
                            }
                        }
                        Text {
                            attr {
                                text("zone-c")
                                fontSize(16f)
                                fontWeightBold()
                                color(Color.WHITE)
                            }
                        }
                    }
                }

                // === Section 5: Status Panel ===
                Text {
                    attr {
                        text("5. Status Panel")
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
                            text("tap-count: ${ctx.tapCount}")
                            fontSize(14f)
                            color(Color.BLACK)
                        }
                    }
                    Text {
                        attr {
                            text("long-press-status: ${if (ctx.longPressActive) "active" else "inactive"}")
                            fontSize(14f)
                            color(Color.BLACK)
                            marginTop(8f)
                        }
                    }
                    Text {
                        attr {
                            text("current-zone: ${ctx.tapZone}")
                            fontSize(14f)
                            color(Color.BLACK)
                            marginTop(8f)
                        }
                    }
                    Text {
                        attr {
                            text("gesture-log: ${ctx.gestureLog}")
                            fontSize(14f)
                            color(0xFF666666)
                            marginTop(8f)
                        }
                    }
                }

                View {
                    attr {
                        height(50f)
                    }
                }

                // === Section 6: Double Click ===
                Text {
                    attr {
                        text("6. Double Click")
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
                            if (ctx.doubleClickCount % 2 == 0) Color(0xFF1976D2) else Color(0xFFE53935)
                        )
                        borderRadius(12f)
                        allCenter()
                    }
                    event {
                        doubleClick {
                            ctx.doubleClickCount += 1
                            ctx.gestureLog = "double-click #${ctx.doubleClickCount}"
                        }
                    }
                    Text {
                        attr {
                            text(if (ctx.doubleClickCount == 0) "double-click-area" else "double-clicked: ${ctx.doubleClickCount}")
                            fontSize(16f)
                            fontWeightBold()
                            color(Color.WHITE)
                        }
                    }
                }

                // === Section 7: Pan ===
                Text {
                    attr {
                        text("7. Pan Gesture")
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
                        backgroundColor(Color(0xFF00897B))
                        borderRadius(12f)
                        allCenter()
                    }
                    event {
                        pan { params ->
                            ctx.panState = "pan-${params.state}"
                            ctx.gestureLog = "pan:${params.state}"
                        }
                    }
                    Text {
                        attr {
                            text(ctx.panState)
                            fontSize(16f)
                            fontWeightBold()
                            color(Color.WHITE)
                        }
                    }
                }

                View {
                    attr {
                        height(50f)
                    }
                }
            }
        }
    }
}
