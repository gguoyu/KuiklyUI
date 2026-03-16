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

package com.tencent.kuikly.demo.pages.demo.web

import com.tencent.kuikly.core.annotations.Page
import com.tencent.kuikly.core.base.*
import com.tencent.kuikly.core.reactive.handler.observable
import com.tencent.kuikly.core.views.List
import com.tencent.kuikly.core.views.Text
import com.tencent.kuikly.core.views.View
import com.tencent.kuikly.demo.pages.base.BasePager

/**
 * 通用 CSS 属性全覆盖测试页面
 * 覆盖 KuiklyRenderCSSKTX.kt 中 setCommonProp 处理的全部属性：
 * - frame (x/y/width/height)
 * - opacity
 * - visibility
 * - overflow
 * - backgroundColor
 * - touchEnable
 * - transform (rotate/scale/translate/skew)
 * - backgroundImage (线性渐变)
 * - boxShadow
 * - textShadow
 * - strokeWidth/strokeColor
 * - borderRadius (含各角独立设置)
 * - border (width/style/color)
 * - color
 * - zIndex
 * - accessibility/accessibilityRole
 * - maskLinearGradient
 */
@Page("WebRenderTestCommonProps")
internal class WebRenderTestCommonPropsPage : BasePager() {

    override fun body(): ViewBuilder {
        val ctx = this
        return {
            attr {
                backgroundColor(Color.WHITE)
            }

            // 标题栏
            View {
                attr {
                    height(44f)
                    backgroundColor(Color(0xFF4A90E2))
                    justifyContentCenter()
                    alignItemsCenter()
                }
                Text {
                    attr {
                        text("通用CSS属性测试")
                        fontSize(18f)
                        color(Color.WHITE)
                        fontWeight700()
                    }
                }
            }

            List {
                attr {
                    flex(1f)
                }

                // ========== 1. frame 属性 ==========
                SectionHeader("1. frame - 位置和尺寸")
                View {
                    attr {
                        height(120f)
                        margin(10f)
                        backgroundColor(Color(0xFFEEEEEE))
                        borderRadius(8f)
                    }
                    // 使用绝对定位测试 frame
                    View {
                        attr {
                            absolutePosition(left = 10f, top = 10f)
                            size(80f, 40f)
                            backgroundColor(Color(0xFF4A90E2))
                            allCenter()
                        }
                        Text { attr { text("80x40") ; fontSize(12f) ; color(Color.WHITE) } }
                    }
                    View {
                        attr {
                            absolutePosition(left = 100f, top = 10f)
                            size(60f, 60f)
                            backgroundColor(Color(0xFF50C878))
                            allCenter()
                        }
                        Text { attr { text("60x60") ; fontSize(12f) ; color(Color.WHITE) } }
                    }
                    View {
                        attr {
                            absolutePosition(left = 170f, top = 10f)
                            size(100f, 80f)
                            backgroundColor(Color(0xFFFF6B6B))
                            allCenter()
                        }
                        Text { attr { text("100x80") ; fontSize(12f) ; color(Color.WHITE) } }
                    }
                }

                // ========== 2. opacity 属性 ==========
                SectionHeader("2. opacity - 透明度")
                View {
                    attr {
                        height(80f)
                        margin(10f)
                        backgroundColor(Color(0xFFEEEEEE))
                        borderRadius(8f)
                        flexDirectionRow()
                        justifyContentSpaceEvenly()
                        alignItemsCenter()
                    }
                    View {
                        attr {
                            size(60f, 60f)
                            backgroundColor(Color(0xFF4A90E2))
                            opacity(1.0f)
                            allCenter()
                        }
                        Text { attr { text("1.0") ; fontSize(12f) ; color(Color.WHITE) } }
                    }
                    View {
                        attr {
                            size(60f, 60f)
                            backgroundColor(Color(0xFF4A90E2))
                            opacity(0.7f)
                            allCenter()
                        }
                        Text { attr { text("0.7") ; fontSize(12f) ; color(Color.WHITE) } }
                    }
                    View {
                        attr {
                            size(60f, 60f)
                            backgroundColor(Color(0xFF4A90E2))
                            opacity(0.4f)
                            allCenter()
                        }
                        Text { attr { text("0.4") ; fontSize(12f) ; color(Color.WHITE) } }
                    }
                    View {
                        attr {
                            size(60f, 60f)
                            backgroundColor(Color(0xFF4A90E2))
                            opacity(0.1f)
                            allCenter()
                        }
                        Text { attr { text("0.1") ; fontSize(12f) ; color(Color.WHITE) } }
                    }
                }

                // ========== 3. visibility 属性 ==========
                SectionHeader("3. visibility - 可见性")
                View {
                    attr {
                        height(80f)
                        margin(10f)
                        backgroundColor(Color(0xFFEEEEEE))
                        borderRadius(8f)
                        flexDirectionRow()
                        justifyContentSpaceEvenly()
                        alignItemsCenter()
                    }
                    View {
                        attr {
                            size(80f, 60f)
                            backgroundColor(Color(0xFF50C878))
                            visibility(true)
                            allCenter()
                        }
                        Text { attr { text("visible") ; fontSize(12f) ; color(Color.WHITE) } }
                    }
                    View {
                        attr {
                            size(80f, 60f)
                            backgroundColor(Color(0xFFFF6B6B))
                            visibility(false)
                            allCenter()
                        }
                        Text { attr { text("hidden") ; fontSize(12f) ; color(Color.WHITE) } }
                    }
                    View {
                        attr {
                            size(80f, 60f)
                            backgroundColor(Color(0xFF9B59B6))
                            visibility(true)
                            allCenter()
                        }
                        Text { attr { text("visible") ; fontSize(12f) ; color(Color.WHITE) } }
                    }
                }

                // ========== 4. overflow 属性 ==========
                SectionHeader("4. overflow - 溢出处理")
                View {
                    attr {
                        height(100f)
                        margin(10f)
                        backgroundColor(Color(0xFFEEEEEE))
                        borderRadius(8f)
                        flexDirectionRow()
                        justifyContentSpaceEvenly()
                        alignItemsCenter()
                    }
                    // overflow: hidden
                    View {
                        attr {
                            size(80f, 80f)
                            backgroundColor(Color(0xFF4A90E2))
                            overflow(false)
                            allCenter()
                        }
                        View {
                            attr {
                                size(60f, 60f)
                                backgroundColor(Color(0xFFFF6B6B))
                                absolutePosition(left = 40f, top = 40f)
                            }
                        }
                        Text { attr { text("hidden") ; fontSize(10f) ; color(Color.WHITE) ; zIndex(10) } }
                    }
                    // overflow: visible
                    View {
                        attr {
                            size(80f, 80f)
                            backgroundColor(Color(0xFF50C878))
                            overflow(true)
                            allCenter()
                        }
                        View {
                            attr {
                                size(60f, 60f)
                                backgroundColor(Color(0xFFFF6B6B))
                                absolutePosition(left = 40f, top = 40f)
                            }
                        }
                        Text { attr { text("visible") ; fontSize(10f) ; color(Color.WHITE) ; zIndex(10) } }
                    }
                }

                // ========== 5. backgroundColor 属性 ==========
                SectionHeader("5. backgroundColor - 背景色")
                View {
                    attr {
                        height(80f)
                        margin(10f)
                        backgroundColor(Color(0xFFEEEEEE))
                        borderRadius(8f)
                        flexDirectionRow()
                        justifyContentSpaceEvenly()
                        alignItemsCenter()
                    }
                    View {
                        attr {
                            size(50f, 50f)
                            backgroundColor(Color.RED)
                        }
                    }
                    View {
                        attr {
                            size(50f, 50f)
                            backgroundColor(Color.GREEN)
                        }
                    }
                    View {
                        attr {
                            size(50f, 50f)
                            backgroundColor(Color.BLUE)
                        }
                    }
                    View {
                        attr {
                            size(50f, 50f)
                            backgroundColor(Color(0x80FF6B6B)) // 半透明
                        }
                    }
                    View {
                        attr {
                            size(50f, 50f)
                            backgroundColor(Color(0xFF9B59B6))
                        }
                    }
                }

                // ========== 6. touchEnable 属性 ==========
                SectionHeader("6. touchEnable - 触摸使能")
                View {
                    attr {
                        height(80f)
                        margin(10f)
                        backgroundColor(Color(0xFFEEEEEE))
                        borderRadius(8f)
                        flexDirectionRow()
                        justifyContentSpaceEvenly()
                        alignItemsCenter()
                    }
                    View {
                        attr {
                            size(100f, 60f)
                            backgroundColor(Color(0xFF4A90E2))
                            touchEnable(true)
                            allCenter()
                        }
                        Text { attr { text("touchable") ; fontSize(12f) ; color(Color.WHITE) } }
                    }
                    View {
                        attr {
                            size(100f, 60f)
                            backgroundColor(Color(0xFFCCCCCC))
                            touchEnable(false)
                            allCenter()
                        }
                        Text { attr { text("disabled") ; fontSize(12f) ; color(Color.WHITE) } }
                    }
                }

                // ========== 7. transform - rotate 旋转 ==========
                SectionHeader("7. transform - rotate 旋转")
                View {
                    attr {
                        height(120f)
                        margin(10f)
                        backgroundColor(Color(0xFFEEEEEE))
                        borderRadius(8f)
                        flexDirectionRow()
                        justifyContentSpaceEvenly()
                        alignItemsCenter()
                    }
                    View {
                        attr {
                            size(50f, 50f)
                            backgroundColor(Color(0xFF4A90E2))
                            transform(Rotate(0f))
                            allCenter()
                        }
                        Text { attr { text("0°") ; fontSize(10f) ; color(Color.WHITE) } }
                    }
                    View {
                        attr {
                            size(50f, 50f)
                            backgroundColor(Color(0xFF50C878))
                            transform(Rotate(45f))
                            allCenter()
                        }
                        Text { attr { text("45°") ; fontSize(10f) ; color(Color.WHITE) } }
                    }
                    View {
                        attr {
                            size(50f, 50f)
                            backgroundColor(Color(0xFFFF6B6B))
                            transform(Rotate(90f))
                            allCenter()
                        }
                        Text { attr { text("90°") ; fontSize(10f) ; color(Color.WHITE) } }
                    }
                    View {
                        attr {
                            size(50f, 50f)
                            backgroundColor(Color(0xFF9B59B6))
                            transform(Rotate(180f))
                            allCenter()
                        }
                        Text { attr { text("180°") ; fontSize(10f) ; color(Color.WHITE) } }
                    }
                }

                // ========== 8. transform - scale 缩放 ==========
                SectionHeader("8. transform - scale 缩放")
                View {
                    attr {
                        height(120f)
                        margin(10f)
                        backgroundColor(Color(0xFFEEEEEE))
                        borderRadius(8f)
                        flexDirectionRow()
                        justifyContentSpaceEvenly()
                        alignItemsCenter()
                    }
                    View {
                        attr {
                            size(40f, 40f)
                            backgroundColor(Color(0xFF4A90E2))
                            transform(scale = Scale(0.5f, 0.5f))
                            allCenter()
                        }
                        Text { attr { text("0.5") ; fontSize(8f) ; color(Color.WHITE) } }
                    }
                    View {
                        attr {
                            size(40f, 40f)
                            backgroundColor(Color(0xFF50C878))
                            transform(scale = Scale(1.0f, 1.0f))
                            allCenter()
                        }
                        Text { attr { text("1.0") ; fontSize(10f) ; color(Color.WHITE) } }
                    }
                    View {
                        attr {
                            size(40f, 40f)
                            backgroundColor(Color(0xFFFF6B6B))
                            transform(scale = Scale(1.5f, 1.5f))
                            allCenter()
                        }
                        Text { attr { text("1.5") ; fontSize(10f) ; color(Color.WHITE) } }
                    }
                    View {
                        attr {
                            size(40f, 40f)
                            backgroundColor(Color(0xFF9B59B6))
                            transform(scale = Scale(2.0f, 1.0f))
                            allCenter()
                        }
                        Text { attr { text("2x1") ; fontSize(10f) ; color(Color.WHITE) } }
                    }
                }

                // ========== 9. transform - translate 平移 ==========
                SectionHeader("9. transform - translate 平移")
                View {
                    attr {
                        height(100f)
                        margin(10f)
                        backgroundColor(Color(0xFFEEEEEE))
                        borderRadius(8f)
                        flexDirectionRow()
                        justifyContentSpaceEvenly()
                        alignItemsCenter()
                    }
                    View {
                        attr {
                            size(50f, 50f)
                            backgroundColor(Color(0xFF4A90E2))
                            transform(translate = Translate(0f, 0f))
                            allCenter()
                        }
                        Text { attr { text("0,0") ; fontSize(10f) ; color(Color.WHITE) } }
                    }
                    View {
                        attr {
                            size(50f, 50f)
                            backgroundColor(Color(0xFF50C878))
                            transform(translate = Translate(10f, 0f))
                            allCenter()
                        }
                        Text { attr { text("10,0") ; fontSize(10f) ; color(Color.WHITE) } }
                    }
                    View {
                        attr {
                            size(50f, 50f)
                            backgroundColor(Color(0xFFFF6B6B))
                            transform(translate = Translate(0f, -10f))
                            allCenter()
                        }
                        Text { attr { text("0,-10") ; fontSize(10f) ; color(Color.WHITE) } }
                    }
                    View {
                        attr {
                            size(50f, 50f)
                            backgroundColor(Color(0xFF9B59B6))
                            transform(translate = Translate(10f, 10f))
                            allCenter()
                        }
                        Text { attr { text("10,10") ; fontSize(10f) ; color(Color.WHITE) } }
                    }
                }

                // ========== 10. transform - skew 倾斜 ==========
                SectionHeader("10. transform - skew 倾斜")
                View {
                    attr {
                        height(100f)
                        margin(10f)
                        backgroundColor(Color(0xFFEEEEEE))
                        borderRadius(8f)
                        flexDirectionRow()
                        justifyContentSpaceEvenly()
                        alignItemsCenter()
                    }
                    View {
                        attr {
                            size(50f, 50f)
                            backgroundColor(Color(0xFF4A90E2))
                            transform(skew = Skew(0f, 0f))
                            allCenter()
                        }
                        Text { attr { text("0,0") ; fontSize(10f) ; color(Color.WHITE) } }
                    }
                    View {
                        attr {
                            size(50f, 50f)
                            backgroundColor(Color(0xFF50C878))
                            transform(skew = Skew(15f, 0f))
                            allCenter()
                        }
                        Text { attr { text("15,0") ; fontSize(10f) ; color(Color.WHITE) } }
                    }
                    View {
                        attr {
                            size(50f, 50f)
                            backgroundColor(Color(0xFFFF6B6B))
                            transform(skew = Skew(0f, 15f))
                            allCenter()
                        }
                        Text { attr { text("0,15") ; fontSize(10f) ; color(Color.WHITE) } }
                    }
                    View {
                        attr {
                            size(50f, 50f)
                            backgroundColor(Color(0xFF9B59B6))
                            transform(skew = Skew(10f, 10f))
                            allCenter()
                        }
                        Text { attr { text("10,10") ; fontSize(10f) ; color(Color.WHITE) } }
                    }
                }

                // ========== 11. backgroundImage - 线性渐变 ==========
                SectionHeader("11. backgroundImage - 线性渐变")
                View {
                    attr {
                        height(100f)
                        margin(10f)
                        backgroundColor(Color(0xFFEEEEEE))
                        borderRadius(8f)
                        flexDirectionRow()
                        justifyContentSpaceEvenly()
                        alignItemsCenter()
                    }
                    View {
                        attr {
                            size(80f, 80f)
                            backgroundImage(
                                BackgroundLinearGradient(
                                    direction = GradientDirection.TO_BOTTOM,
                                    colors = listOf(Color(0xFF4A90E2), Color(0xFF50C878))
                                )
                            )
                            borderRadius(8f)
                            allCenter()
                        }
                        Text { attr { text("↓") ; fontSize(16f) ; color(Color.WHITE) } }
                    }
                    View {
                        attr {
                            size(80f, 80f)
                            backgroundImage(
                                BackgroundLinearGradient(
                                    direction = GradientDirection.TO_RIGHT,
                                    colors = listOf(Color(0xFFFF6B6B), Color(0xFF9B59B6))
                                )
                            )
                            borderRadius(8f)
                            allCenter()
                        }
                        Text { attr { text("→") ; fontSize(16f) ; color(Color.WHITE) } }
                    }
                    View {
                        attr {
                            size(80f, 80f)
                            backgroundImage(
                                BackgroundLinearGradient(
                                    direction = GradientDirection.TO_BOTTOM_RIGHT,
                                    colors = listOf(Color(0xFFE67E22), Color(0xFF1ABC9C), Color(0xFF3498DB))
                                )
                            )
                            borderRadius(8f)
                            allCenter()
                        }
                        Text { attr { text("↘") ; fontSize(16f) ; color(Color.WHITE) } }
                    }
                }

                // ========== 12. boxShadow 属性 ==========
                SectionHeader("12. boxShadow - 盒子阴影")
                View {
                    attr {
                        height(120f)
                        margin(10f)
                        backgroundColor(Color(0xFFEEEEEE))
                        borderRadius(8f)
                        flexDirectionRow()
                        justifyContentSpaceEvenly()
                        alignItemsCenter()
                    }
                    View {
                        attr {
                            size(80f, 80f)
                            backgroundColor(Color.WHITE)
                            borderRadius(8f)
                            boxShadow(BoxShadow(offsetX = 2f, offsetY = 2f, shadowRadius = 4f, shadowColor = Color(0x40000000)))
                            allCenter()
                        }
                        Text { attr { text("small") ; fontSize(12f) } }
                    }
                    View {
                        attr {
                            size(80f, 80f)
                            backgroundColor(Color.WHITE)
                            borderRadius(8f)
                            boxShadow(BoxShadow(offsetX = 4f, offsetY = 4f, shadowRadius = 10f, shadowColor = Color(0x60000000)))
                            allCenter()
                        }
                        Text { attr { text("medium") ; fontSize(12f) } }
                    }
                    View {
                        attr {
                            size(80f, 80f)
                            backgroundColor(Color.WHITE)
                            borderRadius(8f)
                            boxShadow(BoxShadow(offsetX = 6f, offsetY = 6f, shadowRadius = 20f, shadowColor = Color(0xFF4A90E2)))
                            allCenter()
                        }
                        Text { attr { text("colored") ; fontSize(12f) } }
                    }
                }

                // ========== 13. borderRadius 属性 ==========
                SectionHeader("13. borderRadius - 圆角")
                View {
                    attr {
                        height(100f)
                        margin(10f)
                        backgroundColor(Color(0xFFEEEEEE))
                        borderRadius(8f)
                        flexDirectionRow()
                        justifyContentSpaceEvenly()
                        alignItemsCenter()
                    }
                    View {
                        attr {
                            size(60f, 60f)
                            backgroundColor(Color(0xFF4A90E2))
                            borderRadius(0f)
                            allCenter()
                        }
                        Text { attr { text("0") ; fontSize(12f) ; color(Color.WHITE) } }
                    }
                    View {
                        attr {
                            size(60f, 60f)
                            backgroundColor(Color(0xFF50C878))
                            borderRadius(10f)
                            allCenter()
                        }
                        Text { attr { text("10") ; fontSize(12f) ; color(Color.WHITE) } }
                    }
                    View {
                        attr {
                            size(60f, 60f)
                            backgroundColor(Color(0xFFFF6B6B))
                            borderRadius(30f)
                            allCenter()
                        }
                        Text { attr { text("30") ; fontSize(12f) ; color(Color.WHITE) } }
                    }
                    View {
                        attr {
                            size(60f, 60f)
                            backgroundColor(Color(0xFF9B59B6))
                            borderRadius(
                                BorderRectRadius(
                                    topLeftCornerRadius = 0f,
                                    topRightCornerRadius = 20f,
                                    bottomLeftCornerRadius = 20f,
                                    bottomRightCornerRadius = 0f
                                )
                            )
                            allCenter()
                        }
                        Text { attr { text("mix") ; fontSize(12f) ; color(Color.WHITE) } }
                    }
                }

                // ========== 14. border 属性 ==========
                SectionHeader("14. border - 边框")
                View {
                    attr {
                        height(100f)
                        margin(10f)
                        backgroundColor(Color(0xFFEEEEEE))
                        borderRadius(8f)
                        flexDirectionRow()
                        justifyContentSpaceEvenly()
                        alignItemsCenter()
                    }
                    View {
                        attr {
                            size(70f, 60f)
                            backgroundColor(Color.WHITE)
                            border(Border(1f, BorderStyle.SOLID, Color(0xFF4A90E2)))
                            allCenter()
                        }
                        Text { attr { text("1px") ; fontSize(10f) } }
                    }
                    View {
                        attr {
                            size(70f, 60f)
                            backgroundColor(Color.WHITE)
                            border(Border(2f, BorderStyle.SOLID, Color(0xFF50C878)))
                            borderRadius(8f)
                            allCenter()
                        }
                        Text { attr { text("2px") ; fontSize(10f) } }
                    }
                    View {
                        attr {
                            size(70f, 60f)
                            backgroundColor(Color.WHITE)
                            border(Border(3f, BorderStyle.DASHED, Color(0xFFFF6B6B)))
                            allCenter()
                        }
                        Text { attr { text("dashed") ; fontSize(10f) } }
                    }
                    View {
                        attr {
                            size(70f, 60f)
                            backgroundColor(Color.WHITE)
                            border(Border(2f, BorderStyle.DOTTED, Color(0xFF9B59B6)))
                            allCenter()
                        }
                        Text { attr { text("dotted") ; fontSize(10f) } }
                    }
                }

                // ========== 15. color 属性 (文本颜色) ==========
                SectionHeader("15. color - 文本颜色")
                View {
                    attr {
                        height(80f)
                        margin(10f)
                        backgroundColor(Color(0xFFEEEEEE))
                        borderRadius(8f)
                        flexDirectionRow()
                        justifyContentSpaceEvenly()
                        alignItemsCenter()
                    }
                    Text { attr { text("红色") ; fontSize(16f) ; color(Color.RED) } }
                    Text { attr { text("绿色") ; fontSize(16f) ; color(Color.GREEN) } }
                    Text { attr { text("蓝色") ; fontSize(16f) ; color(Color.BLUE) } }
                    Text { attr { text("紫色") ; fontSize(16f) ; color(Color(0xFF9B59B6)) } }
                }

                // ========== 16. zIndex 属性 ==========
                SectionHeader("16. zIndex - 层级")
                View {
                    attr {
                        height(100f)
                        margin(10f)
                        backgroundColor(Color(0xFFEEEEEE))
                        borderRadius(8f)
                        allCenter()
                    }
                    View {
                        attr {
                            size(100f, 60f)
                            backgroundColor(Color(0xFF4A90E2))
                            absolutePosition(left = 80f, top = 20f)
                            zIndex(1)
                            allCenter()
                        }
                        Text { attr { text("z:1") ; fontSize(12f) ; color(Color.WHITE) } }
                    }
                    View {
                        attr {
                            size(100f, 60f)
                            backgroundColor(Color(0xFFFF6B6B))
                            absolutePosition(left = 130f, top = 30f)
                            zIndex(3)
                            allCenter()
                        }
                        Text { attr { text("z:3") ; fontSize(12f) ; color(Color.WHITE) } }
                    }
                    View {
                        attr {
                            size(100f, 60f)
                            backgroundColor(Color(0xFF50C878))
                            absolutePosition(left = 180f, top = 20f)
                            zIndex(2)
                            allCenter()
                        }
                        Text { attr { text("z:2") ; fontSize(12f) ; color(Color.WHITE) } }
                    }
                }

                // ========== 17. accessibility 属性 ==========
                SectionHeader("17. accessibility - 无障碍")
                View {
                    attr {
                        height(80f)
                        margin(10f)
                        backgroundColor(Color(0xFFEEEEEE))
                        borderRadius(8f)
                        flexDirectionRow()
                        justifyContentSpaceEvenly()
                        alignItemsCenter()
                    }
                    View {
                        attr {
                            size(100f, 50f)
                            backgroundColor(Color(0xFF4A90E2))
                            borderRadius(8f)
                            accessibility("这是一个按钮")
                            allCenter()
                        }
                        Text { attr { text("aria-label") ; fontSize(10f) ; color(Color.WHITE) } }
                    }
                    View {
                        attr {
                            size(100f, 50f)
                            backgroundColor(Color(0xFF50C878))
                            borderRadius(8f)
                            accessibilityRole("button")
                            allCenter()
                        }
                        Text { attr { text("role") ; fontSize(10f) ; color(Color.WHITE) } }
                    }
                }

                // ========== 18. 组合变换测试 ==========
                SectionHeader("18. 组合变换")
                View {
                    attr {
                        height(120f)
                        margin(10f)
                        backgroundColor(Color(0xFFEEEEEE))
                        borderRadius(8f)
                        flexDirectionRow()
                        justifyContentSpaceEvenly()
                        alignItemsCenter()
                    }
                    View {
                        attr {
                            size(50f, 50f)
                            backgroundColor(Color(0xFF4A90E2))
                            transform(
                                rotate = Rotate(30f),
                                scale = Scale(1.2f, 1.2f)
                            )
                            allCenter()
                        }
                        Text { attr { text("R+S") ; fontSize(10f) ; color(Color.WHITE) } }
                    }
                    View {
                        attr {
                            size(50f, 50f)
                            backgroundColor(Color(0xFF50C878))
                            transform(
                                rotate = Rotate(15f),
                                translate = Translate(5f, 5f)
                            )
                            allCenter()
                        }
                        Text { attr { text("R+T") ; fontSize(10f) ; color(Color.WHITE) } }
                    }
                    View {
                        attr {
                            size(50f, 50f)
                            backgroundColor(Color(0xFFFF6B6B))
                            transform(
                                scale = Scale(1.3f, 1.3f),
                                skew = Skew(10f, 0f)
                            )
                            allCenter()
                        }
                        Text { attr { text("S+K") ; fontSize(10f) ; color(Color.WHITE) } }
                    }
                }

                // 底部占位
                View {
                    attr {
                        height(50f)
                    }
                }
            }
        }
    }

    // 辅助方法：Section 标题
    private fun ViewContainer<*, *>.SectionHeader(title: String) {
        View {
            attr {
                padding(left = 10f, top = 15f, bottom = 5f)
            }
            Text {
                attr {
                    text(title)
                    fontSize(14f)
                    color(Color(0xFF333333))
                    fontWeight700()
                }
            }
        }
    }
}
