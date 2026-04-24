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
 * KRView 触摸事件验证测试页面
 *
 * 测试覆盖:
 * 1. touchDown — 触摸开始回调
 * 2. touchMove — 触摸移动回调
 * 3. touchUp — 触摸结束回调
 * 4. pan — 平移手势回调 (start / move / end 状态)
 * 5. longPress — 长按手势回调
 * 6. doubleClick — 双击手势回调
 */
@Page("KRViewTouchTestPage")
internal class KRViewTouchTestPage : Pager() {

    private var touchDownCount by observable(0)
    private var touchMoveCount by observable(0)
    private var touchUpCount by observable(0)
    private var panState by observable("pan-idle")
    private var longPressCount by observable(0)
    private var doubleClickCount by observable(0)

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

                // === Section 1: Touch Down / Move / Up ===
                Text {
                    attr {
                        text("1. Touch Events")
                        fontSize(16f)
                        fontWeightBold()
                        marginTop(16f)
                        marginLeft(16f)
                        color(Color.BLACK)
                    }
                }

                View {
                    attr {
                        margin(left = 16f, right = 16f, top = 8f)
                        height(100f)
                        backgroundColor(Color(0xFF1976D2))
                        borderRadius(8f)
                        allCenter()
                    }
                    event {
                        touchDown {
                            ctx.touchDownCount = ctx.touchDownCount + 1
                        }
                        touchMove {
                            ctx.touchMoveCount = ctx.touchMoveCount + 1
                        }
                        touchUp {
                            ctx.touchUpCount = ctx.touchUpCount + 1
                        }
                    }
                    Text {
                        attr {
                            text("touch-area")
                            fontSize(16f)
                            fontWeightBold()
                            color(Color.WHITE)
                        }
                    }
                }

                // Status display
                View {
                    attr {
                        margin(left = 16f, right = 16f, top = 8f)
                        padding(all = 12f)
                        backgroundColor(0xFFF5F5F5)
                        borderRadius(8f)
                    }
                    Text {
                        attr {
                            text("touch-down: ${ctx.touchDownCount}")
                            fontSize(14f)
                            color(Color.BLACK)
                        }
                    }
                    Text {
                        attr {
                            text("touch-move: ${ctx.touchMoveCount}")
                            fontSize(14f)
                            color(Color.BLACK)
                            marginTop(6f)
                        }
                    }
                    Text {
                        attr {
                            text("touch-up: ${ctx.touchUpCount}")
                            fontSize(14f)
                            color(Color.BLACK)
                            marginTop(6f)
                        }
                    }
                }

                // === Section 2: Pan Gesture ===
                Text {
                    attr {
                        text("2. Pan Gesture")
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
                        borderRadius(8f)
                        allCenter()
                    }
                    event {
                        pan { params ->
                            ctx.panState = "pan-${params.state}"
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
                        backgroundColor(Color(0xFF8E24AA))
                        borderRadius(8f)
                        allCenter()
                    }
                    event {
                        longPress {
                            ctx.longPressCount = ctx.longPressCount + 1
                        }
                    }
                    Text {
                        attr {
                            text("lp-count: ${ctx.longPressCount}")
                            fontSize(16f)
                            fontWeightBold()
                            color(Color.WHITE)
                        }
                    }
                }

                // === Section 4: Double Click ===
                Text {
                    attr {
                        text("4. Double Click")
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
                        backgroundColor(Color(0xFFE53935))
                        borderRadius(8f)
                        allCenter()
                    }
                    event {
                        doubleClick {
                            ctx.doubleClickCount = ctx.doubleClickCount + 1
                        }
                    }
                    Text {
                        attr {
                            text(if (ctx.doubleClickCount == 0) "dblclick-idle" else "dblclick-count: ${ctx.doubleClickCount}")
                            fontSize(16f)
                            fontWeightBold()
                            color(Color.WHITE)
                        }
                    }
                }

                View {
                    attr { height(50f) }
                }
            }
        }
    }
}
