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
import com.tencent.kuikly.core.base.Color
import com.tencent.kuikly.core.base.Rotate
import com.tencent.kuikly.core.base.Translate
import com.tencent.kuikly.core.base.ViewBuilder
import com.tencent.kuikly.core.base.ViewRef
import com.tencent.kuikly.core.pager.Pager
import com.tencent.kuikly.core.reactive.handler.observable
import com.tencent.kuikly.core.views.DivView
import com.tencent.kuikly.core.views.List
import com.tencent.kuikly.core.views.Text
import com.tencent.kuikly.core.views.View

/**
 * KR 属性动画验证测试页面
 *
 * 测试覆盖：
 * 1. Linear 平移动画 — 点击触发水平平移，animateToAttr + Animation.linear
 * 2. Spring 弹性动画 — 点击触发弹性位移效果
 * 3. 颜色属性动画 — 点击触发背景色渐变
 * 4. 组合属性动画 — 平移 + 旋转同时执行
 */
@Page("PropertyAnimTestPage")
internal class PropertyAnimTestPage : Pager() {

    // === ViewRef：命令式动画需要持有视图引用 ===
    private var translateRef: ViewRef<DivView>? = null
    private var springRef: ViewRef<DivView>? = null
    private var colorRef: ViewRef<DivView>? = null
    private var comboRef: ViewRef<DivView>? = null

    // === 按钮状态 ===
    private var translatePlayed by observable(false)
    private var springPlayed by observable(false)
    private var colorPlayed by observable(false)
    private var comboPlayed by observable(false)

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

                // === Section 1: Linear 平移动画 ===
                Text {
                    attr {
                        text("1. Linear 平移动画")
                        fontSize(16f)
                        fontWeightBold()
                        marginTop(16f)
                        marginLeft(16f)
                        color(Color.BLACK)
                    }
                }

                View {
                    attr {
                        margin(left = 16f, right = 16f, top = 12f)
                        height(80f)
                        backgroundColor(0xFFF5F5F5)
                        borderRadius(8f)
                    }
                    View {
                        ref { ctx.translateRef = it }
                        attr {
                            size(60f, 60f)
                            backgroundColor(Color(0xFF2196F3))
                            borderRadius(30f)
                            absolutePosition(top = 10f, left = 10f)
                            allCenter()
                        }
                        Text {
                            attr {
                                text("▶")
                                fontSize(20f)
                                color(Color.WHITE)
                            }
                        }
                    }
                }

                View {
                    attr {
                        margin(left = 16f, right = 16f, top = 8f)
                        height(40f)
                        backgroundColor(if (ctx.translatePlayed) Color(0xFF4CAF50) else Color(0xFF2196F3))
                        borderRadius(8f)
                        allCenter()
                    }
                    event {
                        click {
                            val played = ctx.translatePlayed
                            ctx.translateRef?.view?.animateToAttr(
                                Animation.linear(durationS = 1.0f),
                                attrBlock = {
                                    if (!played) {
                                        transform(Translate(0f, offsetX = 220f))
                                    } else {
                                        transform(Translate(0f, offsetX = 0f))
                                    }
                                },
                                completion = {
                                    ctx.translatePlayed = !played
                                }
                            )
                        }
                    }
                    Text {
                        attr {
                            text(if (ctx.translatePlayed) "还原位置" else "播放平移")
                            fontSize(14f)
                            color(Color.WHITE)
                            fontWeightBold()
                        }
                    }
                }

                // === Section 2: Spring 弹性动画 ===
                Text {
                    attr {
                        text("2. Spring 弹性动画")
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
                        backgroundColor(0xFFF5F5F5)
                        borderRadius(8f)
                    }
                    View {
                        ref { ctx.springRef = it }
                        attr {
                            size(60f, 60f)
                            backgroundColor(Color(0xFFFF5722))
                            borderRadius(30f)
                            absolutePosition(top = 10f, left = 10f)
                            allCenter()
                        }
                        Text {
                            attr {
                                text("⚡")
                                fontSize(20f)
                                color(Color.WHITE)
                            }
                        }
                    }
                }

                View {
                    attr {
                        margin(left = 16f, right = 16f, top = 8f)
                        height(40f)
                        backgroundColor(if (ctx.springPlayed) Color(0xFF4CAF50) else Color(0xFFFF5722))
                        borderRadius(8f)
                        allCenter()
                    }
                    event {
                        click {
                            val played = ctx.springPlayed
                            ctx.springRef?.view?.animateToAttr(
                                Animation.springEaseInOut(durationS = 1.0f, damping = 2.5f, velocity = 0.5f),
                                attrBlock = {
                                    if (!played) {
                                        transform(Translate(0f, offsetX = 220f))
                                    } else {
                                        transform(Translate(0f, offsetX = 0f))
                                    }
                                },
                                completion = {
                                    ctx.springPlayed = !played
                                }
                            )
                        }
                    }
                    Text {
                        attr {
                            text(if (ctx.springPlayed) "还原位置" else "弹性运动")
                            fontSize(14f)
                            color(Color.WHITE)
                            fontWeightBold()
                        }
                    }
                }

                // === Section 3: 颜色属性动画 ===
                Text {
                    attr {
                        text("3. 背景色属性动画")
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
                        backgroundColor(0xFFF5F5F5)
                        borderRadius(8f)
                    }
                    View {
                        ref { ctx.colorRef = it }
                        attr {
                            size(260f, 44f)
                            backgroundColor(Color(0xFF9C27B0))
                            borderRadius(8f)
                            absolutePosition(top = 8f, left = 8f)
                            allCenter()
                        }
                        Text {
                            attr {
                                text("颜色渐变")
                                fontSize(14f)
                                color(Color.WHITE)
                            }
                        }
                    }
                }

                View {
                    attr {
                        margin(left = 16f, right = 16f, top = 8f)
                        height(40f)
                        backgroundColor(if (ctx.colorPlayed) Color(0xFF4CAF50) else Color(0xFF9C27B0))
                        borderRadius(8f)
                        allCenter()
                    }
                    event {
                        click {
                            val played = ctx.colorPlayed
                            ctx.colorRef?.view?.animateToAttr(
                                Animation.linear(durationS = 1.5f),
                                attrBlock = {
                                    backgroundColor(if (!played) Color(0xFFFF9800) else Color(0xFF9C27B0))
                                },
                                completion = {
                                    ctx.colorPlayed = !played
                                }
                            )
                        }
                    }
                    Text {
                        attr {
                            text(if (ctx.colorPlayed) "还原颜色" else "变换颜色")
                            fontSize(14f)
                            color(Color.WHITE)
                            fontWeightBold()
                        }
                    }
                }

                // === Section 4: 组合属性动画（平移 + 旋转） ===
                Text {
                    attr {
                        text("4. 组合动画（平移 + 旋转）")
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
                        backgroundColor(0xFFF5F5F5)
                        borderRadius(8f)
                    }
                    View {
                        ref { ctx.comboRef = it }
                        attr {
                            size(60f, 60f)
                            backgroundColor(Color(0xFF4CAF50))
                            borderRadius(8f)
                            absolutePosition(top = 10f, left = 10f)
                            allCenter()
                        }
                        Text {
                            attr {
                                text("⭐")
                                fontSize(24f)
                                color(Color.WHITE)
                            }
                        }
                    }
                }

                View {
                    attr {
                        margin(left = 16f, right = 16f, top = 8f)
                        height(40f)
                        backgroundColor(if (ctx.comboPlayed) Color(0xFF4CAF50) else Color(0xFF607D8B))
                        borderRadius(8f)
                        allCenter()
                    }
                    event {
                        click {
                            val played = ctx.comboPlayed
                            ctx.comboRef?.view?.animateToAttr(
                                Animation.linear(durationS = 1.0f),
                                attrBlock = {
                                    if (!played) {
                                        transform(
                                            rotate = Rotate(180f),
                                            translate = Translate(0f, offsetX = 200f)
                                        )
                                    } else {
                                        transform(
                                            rotate = Rotate(0f),
                                            translate = Translate(0f, offsetX = 0f)
                                        )
                                    }
                                },
                                completion = {
                                    ctx.comboPlayed = !played
                                }
                            )
                        }
                    }
                    Text {
                        attr {
                            text(if (ctx.comboPlayed) "还原" else "平移+旋转")
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
            }
        }
    }
}
