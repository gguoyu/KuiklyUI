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

package com.tencent.kuikly.demo.pages.web_test.animations

import com.tencent.kuikly.core.annotations.Page
import com.tencent.kuikly.core.base.Animation
import com.tencent.kuikly.core.base.Border
import com.tencent.kuikly.core.base.BorderStyle
import com.tencent.kuikly.core.base.Color
import com.tencent.kuikly.core.base.ColorStop
import com.tencent.kuikly.core.base.Direction
import com.tencent.kuikly.core.base.ViewBuilder
import com.tencent.kuikly.core.pager.Pager
import com.tencent.kuikly.core.reactive.handler.observable
import com.tencent.kuikly.core.views.Image
import com.tencent.kuikly.core.views.List
import com.tencent.kuikly.core.views.Text
import com.tencent.kuikly.core.views.View

/**
 * CSS Transition 动画验证测试页面
 *
 * 测试覆盖：
 * 1. 点击触发尺寸变化动画 — 方块尺寸 100x100 → 200x200
 * 2. 点击触发颜色变化动画 — 蓝色 → 绿色
 * 3. 点击触发宽度动画 — 宽度 150 → 300
 * 4. 组合动画 — 多属性同时变化
 */
@Page("CSSTransitionTestPage")
internal class CSSTransitionTestPage : Pager() {

    // === 响应式状态 ===
    private var isExpanded by observable(false)
    private var isColorChanged by observable(false)
    private var isWidthExpanded by observable(false)
    private var isComboAnimated by observable(false)
    private var isRepeatAnim by observable(false)
    private var animEndCount by observable(0)
    private var animToggled by observable(false)
    private var springToggled by observable(false)

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

                // === Section 1: 尺寸变化动画 ===
                Text {
                    attr {
                        text("1. 尺寸变化动画")
                        fontSize(16f)
                        fontWeightBold()
                        marginTop(16f)
                        marginLeft(16f)
                        color(Color.BLACK)
                    }
                }

                View {
                    attr {
                        margin(left = 16f, top = 12f)
                        size(
                            if (ctx.isExpanded) 200f else 100f,
                            if (ctx.isExpanded) 200f else 100f
                        )
                        backgroundColor(Color(0xFF2196F3))
                        borderRadius(8f)
                        allCenter()
                    }
                    event {
                        click {
                            ctx.isExpanded = !ctx.isExpanded
                        }
                    }
                    Text {
                        attr {
                            text("Click Me")
                            fontSize(14f)
                            color(Color.WHITE)
                            fontWeightBold()
                        }
                    }
                }

                Text {
                    attr {
                        text("状态: ${if (ctx.isExpanded) "已展开 (200x200)" else "未展开 (100x100)"}")
                        fontSize(13f)
                        marginTop(8f)
                        marginLeft(16f)
                        color(0xFF666666)
                    }
                }

                // === Section 2: 颜色变化动画 ===
                Text {
                    attr {
                        text("2. 颜色变化动画")
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
                        height(80f)
                        backgroundColor(
                            if (ctx.isColorChanged) Color(0xFF4CAF50) else Color(0xFF2196F3)
                        )
                        borderRadius(8f)
                        allCenter()
                    }
                    event {
                        click {
                            ctx.isColorChanged = !ctx.isColorChanged
                        }
                    }
                    Text {
                        attr {
                            text("Click to Change Color")
                            fontSize(14f)
                            color(Color.WHITE)
                            fontWeightBold()
                        }
                    }
                }

                // === Section 3: 宽度动画 ===
                Text {
                    attr {
                        text("3. 宽度动画")
                        fontSize(16f)
                        fontWeightBold()
                        marginTop(24f)
                        marginLeft(16f)
                        color(Color.BLACK)
                    }
                }

                View {
                    attr {
                        margin(left = 16f, top = 12f)
                        width(if (ctx.isWidthExpanded) 300f else 150f)
                        height(60f)
                        backgroundColor(Color(0xFFFF5722))
                        borderRadius(8f)
                        allCenter()
                    }
                    event {
                        click {
                            ctx.isWidthExpanded = !ctx.isWidthExpanded
                        }
                    }
                    Text {
                        attr {
                            text("Toggle Width")
                            fontSize(14f)
                            color(Color.WHITE)
                            fontWeightBold()
                        }
                    }
                }

                Text {
                    attr {
                        text("宽度: ${if (ctx.isWidthExpanded) "300px" else "150px"}")
                        fontSize(13f)
                        marginTop(8f)
                        marginLeft(16f)
                        color(0xFF666666)
                    }
                }

                // === Section 4: 组合动画 ===
                Text {
                    attr {
                        text("4. 组合动画 (尺寸 + 颜色 + 圆角)")
                        fontSize(16f)
                        fontWeightBold()
                        marginTop(24f)
                        marginLeft(16f)
                        color(Color.BLACK)
                    }
                }

                View {
                    attr {
                        margin(left = 16f, top = 12f)
                        size(
                            if (ctx.isComboAnimated) 250f else 120f,
                            if (ctx.isComboAnimated) 120f else 80f
                        )
                        backgroundColor(
                            if (ctx.isComboAnimated) Color(0xFF9C27B0) else Color(0xFFFF9800)
                        )
                        borderRadius(if (ctx.isComboAnimated) 60f else 12f)
                        allCenter()
                    }
                    event {
                        click {
                            ctx.isComboAnimated = !ctx.isComboAnimated
                        }
                    }
                    Text {
                        attr {
                            text("Combo Animation")
                            fontSize(14f)
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

                // === Section 5: Repeat Forever Animation (triggers repeatStyleAnimation) ===
                Text {
                    attr {
                        text("5. Repeat Animation")
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
                        height(44f)
                        backgroundColor(Color(0xFF1976D2))
                        borderRadius(8f)
                        allCenter()
                    }
                    event {
                        click {
                            ctx.isRepeatAnim = !ctx.isRepeatAnim
                        }
                    }
                    Text {
                        attr {
                            text(if (ctx.isRepeatAnim) "repeat-running" else "repeat-idle")
                            fontSize(14f)
                            color(Color.WHITE)
                            fontWeightBold()
                        }
                    }
                }

                // Animated view with repeatForever — triggers repeatStyleAnimation in KuiklyRenderCSSKTX
                View {
                    attr {
                        margin(left = 16f, top = 8f)
                        size(60f, 60f)
                        backgroundColor(Color(0xFFE53935))
                        borderRadius(8f)
                        animation(
                            Animation.linear(durationS = 1f).repeatForever(true),
                            ctx.isRepeatAnim
                        )
                        opacity(if (ctx.isRepeatAnim) 0.2f else 1.0f)
                    }
                }

                // === Section 6: Animation Completion Callback (exercises animationCompletionBlock) ===
                Text {
                    attr {
                        text("6. Animation End Callback")
                        fontSize(16f)
                        fontWeightBold()
                        marginTop(24f)
                        marginLeft(16f)
                        color(Color.BLACK)
                    }
                }

                View {
                    attr {
                        margin(left = 16f, top = 8f)
                        size(80f, 80f)
                        backgroundColor(Color(0xFF00897B))
                        borderRadius(8f)
                        animation(Animation.linear(durationS = 0.3f), ctx.animToggled)
                        allCenter()
                    }
                    event {
                        click {
                            ctx.animToggled = !ctx.animToggled
                        }
                        animationCompletion {
                            ctx.animEndCount = ctx.animEndCount + 1
                        }
                    }
                    Text {
                        attr {
                            text("anim-end: ${ctx.animEndCount}")
                            fontSize(12f)
                            color(Color.WHITE)
                            fontWeightBold()
                        }
                    }
                }

                // === Section 7: Spring Animation (exercises getCssTimeFuncType spring branch) ===
                Text {
                    attr {
                        text("7. Spring Animation")
                        fontSize(16f)
                        fontWeightBold()
                        marginTop(24f)
                        marginLeft(16f)
                        color(Color.BLACK)
                    }
                }

                View {
                    attr {
                        margin(left = 16f, top = 8f)
                        size(if (ctx.springToggled) 120f else 60f, 60f)
                        backgroundColor(Color(0xFF6A1B9A))
                        borderRadius(8f)
                        animation(Animation.springEaseInOut(0.3f, 0.9f, 1f), ctx.springToggled)
                        allCenter()
                    }
                    event {
                        click {
                            ctx.springToggled = !ctx.springToggled
                        }
                    }
                    Text {
                        attr {
                            text("Spring")
                            fontSize(14f)
                            color(Color.WHITE)
                            fontWeightBold()
                        }
                    }
                }

                // === Section 8: Border with Child (exercises checkAndUpdatePositionForH5) ===
                Text {
                    attr {
                        text("8. Border with Child")
                        fontSize(16f)
                        fontWeightBold()
                        marginTop(24f)
                        marginLeft(16f)
                        color(Color.BLACK)
                    }
                }

                View {
                    attr {
                        margin(left = 16f, top = 8f)
                        padding(all = 12f)
                        border(Border(2f, BorderStyle.SOLID, Color(0xFF2196F3)))
                        borderRadius(8f)
                    }
                    Text {
                        attr {
                            text("child-inside-border")
                            fontSize(14f)
                            color(Color.BLACK)
                        }
                    }
                }

                // === Section 9: Mask Gradient (exercises convertGradientStringToCssMask) ===
                Text {
                    attr {
                        text("9. Mask Gradient")
                        fontSize(16f)
                        fontWeightBold()
                        marginTop(24f)
                        marginLeft(16f)
                        color(Color.BLACK)
                    }
                }

                Image {
                    attr {
                        margin(left = 16f, top = 8f)
                        width(200f)
                        height(60f)
                        src("https://vfiles.gtimg.cn/wuji_dashboard/xy/componenthub/Dfnp7Q9F.png")
                        resizeCover()
                        maskLinearGradient(Direction.TO_RIGHT, ColorStop(Color.BLACK, 1f), ColorStop(Color.BLACK, 0f))
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
