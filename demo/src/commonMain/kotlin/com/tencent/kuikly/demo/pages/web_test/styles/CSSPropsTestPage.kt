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

package com.tencent.kuikly.demo.pages.web_test.styles

import com.tencent.kuikly.core.annotations.Page
import com.tencent.kuikly.core.base.Color
import com.tencent.kuikly.core.base.ViewBuilder
import com.tencent.kuikly.core.pager.Pager
import com.tencent.kuikly.core.reactive.handler.observable
import com.tencent.kuikly.core.views.List
import com.tencent.kuikly.core.views.Text
import com.tencent.kuikly.core.views.View

/**
 * CSS properties test page — covers KuiklyRenderCSSKTX prop handlers
 * not exercised by other style pages.
 *
 * Tests covered:
 * 1. Text shadow — textShadow prop handler
 * 2. Stroke width and color — strokeWidth / strokeColor prop handlers
 * 3. Touch enable / disable — touchEnable prop handler
 * 4. Asymmetric border radius — borderRadius(tl, tr, bl, br) branching
 * 5. Touch enable toggle — state-driven, testable via click count
 */
@Page("CSSPropsTestPage")
internal class CSSPropsTestPage : Pager() {

    private var touchEnabled by observable(true)
    private var clickCount by observable(0)

    override fun body(): ViewBuilder {
        val ctx = this
        return {
            attr { backgroundColor(Color.WHITE) }

            List {
                attr { flex(1f) }

                // === Section 1: Text Shadow ===
                Text {
                    attr {
                        text("1. Text Shadow")
                        fontSize(16f)
                        fontWeightBold()
                        marginTop(16f)
                        marginLeft(16f)
                        color(Color.BLACK)
                    }
                }

                Text {
                    attr {
                        text("shadow-text")
                        fontSize(20f)
                        fontWeightBold()
                        color(Color(0xFF1565C0))
                        textShadow(2f, 2f, 4f, Color(0x661565C0))
                        marginTop(8f)
                        marginLeft(16f)
                    }
                }

                Text {
                    attr {
                        text("multi-shadow-text")
                        fontSize(18f)
                        fontWeightBold()
                        color(Color(0xFF4CAF50))
                        textShadow(1f, 1f, 2f, Color(0x99000000))
                        marginTop(4f)
                        marginLeft(16f)
                    }
                }

                // === Section 2: Stroke Width and Color ===
                Text {
                    attr {
                        text("2. Stroke Width and Color")
                        fontSize(16f)
                        fontWeightBold()
                        marginTop(24f)
                        marginLeft(16f)
                        color(Color.BLACK)
                    }
                }

                Text {
                    attr {
                        text("stroke-text-thin")
                        fontSize(24f)
                        fontWeightBold()
                        color(Color.WHITE)
                        textStroke(Color(0xFF1565C0), 1f)
                        marginTop(8f)
                        marginLeft(16f)
                    }
                }

                Text {
                    attr {
                        text("stroke-text-thick")
                        fontSize(24f)
                        fontWeightBold()
                        color(Color.WHITE)
                        textStroke(Color(0xFFE53935), 3f)
                        marginTop(8f)
                        marginLeft(16f)
                    }
                }

                // === Section 3: Touch Enable / Disable ===
                Text {
                    attr {
                        text("3. Touch Enable Toggle")
                        fontSize(16f)
                        fontWeightBold()
                        marginTop(24f)
                        marginLeft(16f)
                        color(Color.BLACK)
                    }
                }

                // Toggle button for touchEnable state
                View {
                    attr {
                        margin(left = 16f, right = 16f, top = 8f)
                        height(44f)
                        backgroundColor(Color(0xFF2196F3))
                        borderRadius(8f)
                        allCenter()
                    }
                    event {
                        click {
                            ctx.touchEnabled = !ctx.touchEnabled
                        }
                    }
                    Text {
                        attr {
                            text(if (ctx.touchEnabled) "touch-enabled" else "touch-disabled")
                            fontSize(14f)
                            color(Color.WHITE)
                            fontWeightBold()
                        }
                    }
                }

                // Target view with touchEnable controlled by state
                View {
                    attr {
                        margin(left = 16f, right = 16f, top = 8f)
                        height(60f)
                        backgroundColor(Color(0xFFF5F5F5))
                        borderRadius(8f)
                        allCenter()
                        touchEnable(ctx.touchEnabled)
                    }
                    event {
                        click {
                            ctx.clickCount += 1
                        }
                    }
                    Text {
                        attr {
                            text("touch-target-clicks: ${ctx.clickCount}")
                            fontSize(14f)
                            color(Color.BLACK)
                        }
                    }
                }

                // === Section 4: Asymmetric Border Radius ===
                Text {
                    attr {
                        text("4. Asymmetric Border Radius")
                        fontSize(16f)
                        fontWeightBold()
                        marginTop(24f)
                        marginLeft(16f)
                        color(Color.BLACK)
                    }
                }

                // Per-corner different radius (triggers the branch in KuiklyRenderCSSKTX)
                View {
                    attr {
                        margin(left = 16f, right = 16f, top = 8f)
                        height(80f)
                        backgroundColor(Color(0xFF1976D2))
                        // topLeft=4, topRight=16, bottomLeft=16, bottomRight=4
                        // These are all different → triggers the else branch in BORDER_RADIUS handler
                        borderRadius(
                            topLeft = 4f,
                            topRight = 24f,
                            bottomLeft = 24f,
                            bottomRight = 4f
                        )
                        allCenter()
                    }
                    Text {
                        attr {
                            text("asymmetric-radius")
                            fontSize(14f)
                            color(Color.WHITE)
                            fontWeightBold()
                        }
                    }
                }

                View {
                    attr {
                        margin(left = 16f, right = 16f, top = 8f)
                        height(60f)
                        backgroundColor(Color(0xFF43A047))
                        // All same radius → triggers the if branch
                        borderRadius(12f)
                        allCenter()
                    }
                    Text {
                        attr {
                            text("uniform-radius")
                            fontSize(14f)
                            color(Color.WHITE)
                        }
                    }
                }

                // === Section 5: Overflow Hidden / Visible ===
                Text {
                    attr {
                        text("5. Overflow Hidden vs Visible")
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
                        size(343f, 50f)
                        backgroundColor(Color(0xFFE3F2FD))
                        overflow(true) // hidden
                        borderRadius(8f)
                        allCenter()
                    }
                    Text {
                        attr {
                            text("overflow-hidden")
                            fontSize(14f)
                            color(Color(0xFF1565C0))
                        }
                    }
                }

                View {
                    attr {
                        margin(left = 16f, right = 16f, top = 8f)
                        size(343f, 50f)
                        backgroundColor(Color(0xFFFFF9C4))
                        overflow(false) // visible
                        borderRadius(8f)
                        allCenter()
                    }
                    Text {
                        attr {
                            text("overflow-visible")
                            fontSize(14f)
                            color(Color(0xFFF57F17))
                        }
                    }
                }

                View { attr { height(50f) } }

                // === Section 6: Z-Index ===
                Text {
                    attr {
                        text("6. Z-Index")
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
                        height(60f)
                        backgroundColor(Color(0xFF1976D2))
                        borderRadius(8f)
                        allCenter()
                        zIndex(10)
                    }
                    Text {
                        attr {
                            text("zindex-10")
                            fontSize(14f)
                            color(Color.WHITE)
                            fontWeightBold()
                        }
                    }
                }

                View {
                    attr {
                        margin(left = 16f, right = 16f, top = 8f)
                        height(60f)
                        backgroundColor(Color(0xFF43A047))
                        borderRadius(8f)
                        allCenter()
                        zIndex(1)
                    }
                    Text {
                        attr {
                            text("zindex-1")
                            fontSize(14f)
                            color(Color.WHITE)
                        }
                    }
                }

                // === Section 7: Accessibility ===
                Text {
                    attr {
                        text("7. Accessibility")
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
                        height(60f)
                        backgroundColor(Color(0xFF8E24AA))
                        borderRadius(8f)
                        allCenter()
                        accessibility("accessibility-label-button")
                    }
                    Text {
                        attr {
                            text("accessibility-label-button")
                            fontSize(14f)
                            color(Color.WHITE)
                            fontWeightBold()
                        }
                    }
                }

                View { attr { height(50f) } }

                // === Section 8: Visibility Toggle ===
                Text {
                    attr {
                        text("8. Visibility Toggle")
                        fontSize(16f)
                        fontWeightBold()
                        marginTop(24f)
                        marginLeft(16f)
                        color(Color.BLACK)
                    }
                }

                // Toggle visibility button
                View {
                    attr {
                        margin(left = 16f, right = 16f, top = 8f)
                        height(44f)
                        backgroundColor(Color(0xFF1976D2))
                        borderRadius(8f)
                        allCenter()
                    }
                    event {
                        click {
                            ctx.touchEnabled = !ctx.touchEnabled // reuse touchEnabled for visibility toggle
                        }
                    }
                    Text {
                        attr {
                            text(if (ctx.touchEnabled) "visibility-visible" else "visibility-hidden")
                            fontSize(14f)
                            color(Color.WHITE)
                            fontWeightBold()
                        }
                    }
                }

                // Target view whose visibility is toggled
                View {
                    attr {
                        margin(left = 16f, right = 16f, top = 8f)
                        height(50f)
                        backgroundColor(Color(0xFFFF9800))
                        borderRadius(8f)
                        allCenter()
                        visibility(ctx.touchEnabled)
                    }
                    Text {
                        attr {
                            text("visibility-target")
                            fontSize(14f)
                            color(Color.WHITE)
                        }
                    }
                }

                View { attr { height(50f) } }
            }
        }
    }
}
