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

package com.tencent.kuikly.demo.pages.web_test.components

import com.tencent.kuikly.core.annotations.Page
import com.tencent.kuikly.core.base.Color
import com.tencent.kuikly.core.base.ViewBuilder
import com.tencent.kuikly.core.pager.Pager
import com.tencent.kuikly.core.views.Canvas
import com.tencent.kuikly.core.views.List
import com.tencent.kuikly.core.views.Text
import com.tencent.kuikly.core.views.View
import kotlin.math.PI

/**
 * KRCanvasView 绘制验证测试页面
 *
 * 测试覆盖：
 * 1. 线段绘制（直线、折线、虚线）
 * 2. 矩形绘制（描边、填充）
 * 3. 圆形与弧线绘制
 * 4. 贝塞尔曲线（二次、三次）
 * 5. 渐变填充（线性渐变）
 * 6. 文本绘制（fillText、strokeText）
 */
@Page("KRCanvasViewTestPage")
internal class KRCanvasViewTestPage : Pager() {
    override fun body(): ViewBuilder {
        return {
            attr {
                backgroundColor(Color.WHITE)
            }

            List {
                attr {
                    flex(1f)
                }

                // === Section 1: 线段绘制 ===
                Text {
                    attr {
                        text("1. 线段绘制")
                        fontSize(16f)
                        fontWeightBold()
                        marginTop(16f)
                        marginLeft(16f)
                        color(Color.BLACK)
                    }
                }
                View {
                    attr {
                        margin(left = 16f, top = 8f, right = 16f)
                        height(120f)
                    }
                    Canvas({
                        attr {
                            absolutePosition(0f, 0f, 0f, 0f)
                            backgroundColor(0xFFF5F5F5)
                        }
                    }) { context, width, height ->
                        // 红色直线
                        context.beginPath()
                        context.lineWidth(2f)
                        context.strokeStyle(Color.RED)
                        context.moveTo(10f, 20f)
                        context.lineTo(width - 10f, 20f)
                        context.stroke()

                        // 蓝色折线
                        context.beginPath()
                        context.lineWidth(2f)
                        context.strokeStyle(Color.BLUE)
                        context.moveTo(10f, 50f)
                        context.lineTo(80f, 80f)
                        context.lineTo(160f, 40f)
                        context.lineTo(240f, 70f)
                        context.lineTo(width - 10f, 50f)
                        context.stroke()

                        // 绿色虚线
                        context.beginPath()
                        context.lineWidth(2f)
                        context.strokeStyle(Color(0xFF4CAF50))
                        context.setLineDash(listOf(8f, 4f))
                        context.moveTo(10f, 100f)
                        context.lineTo(width - 10f, 100f)
                        context.stroke()
                        context.setLineDash(listOf()) // 重置虚线
                    }
                }

                // === Section 2: 矩形绘制 ===
                Text {
                    attr {
                        text("2. 矩形绘制")
                        fontSize(16f)
                        fontWeightBold()
                        marginTop(12f)
                        marginLeft(16f)
                        color(Color.BLACK)
                    }
                }
                View {
                    attr {
                        margin(left = 16f, top = 8f, right = 16f)
                        height(120f)
                    }
                    Canvas({
                        attr {
                            absolutePosition(0f, 0f, 0f, 0f)
                            backgroundColor(0xFFF5F5F5)
                        }
                    }) { context, _, _ ->
                        // 描边矩形
                        context.beginPath()
                        context.lineWidth(2f)
                        context.strokeStyle(Color.RED)
                        context.moveTo(10f, 10f)
                        context.lineTo(90f, 10f)
                        context.lineTo(90f, 60f)
                        context.lineTo(10f, 60f)
                        context.closePath()
                        context.stroke()

                        // 填充矩形
                        context.beginPath()
                        context.fillStyle(Color.BLUE)
                        context.moveTo(110f, 10f)
                        context.lineTo(190f, 10f)
                        context.lineTo(190f, 60f)
                        context.lineTo(110f, 60f)
                        context.closePath()
                        context.fill()

                        // 描边+填充矩形
                        context.beginPath()
                        context.lineWidth(3f)
                        context.strokeStyle(Color(0xFF9C27B0))
                        context.fillStyle(Color(0x404CAF50))
                        context.moveTo(210f, 10f)
                        context.lineTo(310f, 10f)
                        context.lineTo(310f, 60f)
                        context.lineTo(210f, 60f)
                        context.closePath()
                        context.fill()
                        context.stroke()

                        // 圆角矩形（使用弧线近似）
                        context.beginPath()
                        context.fillStyle(Color(0xFFFF9800))
                        val x = 10f; val y = 75f; val w = 100f; val h = 40f; val r = 8f
                        context.moveTo(x + r, y)
                        context.lineTo(x + w - r, y)
                        context.arc(x + w - r, y + r, r, -PI.toFloat() / 2, 0f, false)
                        context.lineTo(x + w, y + h - r)
                        context.arc(x + w - r, y + h - r, r, 0f, PI.toFloat() / 2, false)
                        context.lineTo(x + r, y + h)
                        context.arc(x + r, y + h - r, r, PI.toFloat() / 2, PI.toFloat(), false)
                        context.lineTo(x, y + r)
                        context.arc(x + r, y + r, r, PI.toFloat(), 3 * PI.toFloat() / 2, false)
                        context.closePath()
                        context.fill()
                    }
                }

                // === Section 3: 圆形与弧线 ===
                Text {
                    attr {
                        text("3. 圆形与弧线")
                        fontSize(16f)
                        fontWeightBold()
                        marginTop(12f)
                        marginLeft(16f)
                        color(Color.BLACK)
                    }
                }
                View {
                    attr {
                        margin(left = 16f, top = 8f, right = 16f)
                        height(130f)
                    }
                    Canvas({
                        attr {
                            absolutePosition(0f, 0f, 0f, 0f)
                            backgroundColor(0xFFF5F5F5)
                        }
                    }) { context, _, _ ->
                        // 填充圆形
                        context.beginPath()
                        context.fillStyle(Color(0xFFE91E63))
                        context.arc(50f, 55f, 40f, 0f, 2 * PI.toFloat(), false)
                        context.fill()

                        // 描边圆形
                        context.beginPath()
                        context.lineWidth(3f)
                        context.strokeStyle(Color(0xFF2196F3))
                        context.arc(150f, 55f, 40f, 0f, 2 * PI.toFloat(), false)
                        context.stroke()

                        // 半圆弧
                        context.beginPath()
                        context.lineWidth(3f)
                        context.strokeStyle(Color(0xFF4CAF50))
                        context.arc(240f, 55f, 35f, 0f, PI.toFloat(), false)
                        context.stroke()

                        // 扇形（填充弧）
                        context.beginPath()
                        context.fillStyle(Color(0xFFFF5722))
                        context.moveTo(320f, 55f)
                        context.arc(320f, 55f, 35f, -PI.toFloat() / 4, PI.toFloat() / 4, false)
                        context.closePath()
                        context.fill()
                    }
                }

                // === Section 4: 贝塞尔曲线 ===
                Text {
                    attr {
                        text("4. 贝塞尔曲线")
                        fontSize(16f)
                        fontWeightBold()
                        marginTop(12f)
                        marginLeft(16f)
                        color(Color.BLACK)
                    }
                }
                View {
                    attr {
                        margin(left = 16f, top = 8f, right = 16f)
                        height(120f)
                    }
                    Canvas({
                        attr {
                            absolutePosition(0f, 0f, 0f, 0f)
                            backgroundColor(0xFFF5F5F5)
                        }
                    }) { context, _, _ ->
                        // 二次贝塞尔曲线
                        context.beginPath()
                        context.lineWidth(3f)
                        context.strokeStyle(Color(0xFF9C27B0))
                        context.moveTo(20f, 100f)
                        context.quadraticCurveTo(90f, 10f, 160f, 100f)
                        context.stroke()

                        // 控制点标记
                        context.beginPath()
                        context.fillStyle(Color.RED)
                        context.arc(90f, 10f, 4f, 0f, 2 * PI.toFloat(), false)
                        context.fill()

                        // 三次贝塞尔曲线
                        context.beginPath()
                        context.lineWidth(3f)
                        context.strokeStyle(Color(0xFF00BCD4))
                        context.moveTo(190f, 100f)
                        context.bezierCurveTo(210f, 10f, 300f, 10f, 340f, 100f)
                        context.stroke()

                        // 控制点标记
                        context.beginPath()
                        context.fillStyle(Color.RED)
                        context.arc(210f, 10f, 4f, 0f, 2 * PI.toFloat(), false)
                        context.fill()
                        context.beginPath()
                        context.arc(300f, 10f, 4f, 0f, 2 * PI.toFloat(), false)
                        context.fill()
                    }
                }

                // === Section 5: 渐变填充 ===
                Text {
                    attr {
                        text("5. 渐变填充")
                        fontSize(16f)
                        fontWeightBold()
                        marginTop(12f)
                        marginLeft(16f)
                        color(Color.BLACK)
                    }
                }
                View {
                    attr {
                        margin(left = 16f, top = 8f, right = 16f)
                        height(120f)
                    }
                    Canvas({
                        attr {
                            absolutePosition(0f, 0f, 0f, 0f)
                            backgroundColor(0xFFF5F5F5)
                        }
                    }) { context, _, _ ->
                        // 水平线性渐变矩形
                        val gradient1 = context.createLinearGradient(10f, 10f, 160f, 10f)
                        gradient1.addColorStop(0f, Color(0xFFFF6B6B))
                        gradient1.addColorStop(1f, Color(0xFF4ECDC4))
                        context.beginPath()
                        context.fillStyle(gradient1)
                        context.moveTo(10f, 10f)
                        context.lineTo(160f, 10f)
                        context.lineTo(160f, 50f)
                        context.lineTo(10f, 50f)
                        context.closePath()
                        context.fill()

                        // 垂直线性渐变矩形
                        val gradient2 = context.createLinearGradient(180f, 10f, 180f, 50f)
                        gradient2.addColorStop(0f, Color(0xFF667EEA))
                        gradient2.addColorStop(0.5f, Color(0xFFFF6B6B))
                        gradient2.addColorStop(1f, Color(0xFF764BA2))
                        context.beginPath()
                        context.fillStyle(gradient2)
                        context.moveTo(180f, 10f)
                        context.lineTo(330f, 10f)
                        context.lineTo(330f, 50f)
                        context.lineTo(180f, 50f)
                        context.closePath()
                        context.fill()

                        // 渐变描边圆形
                        val gradient3 = context.createLinearGradient(30f, 60f, 130f, 110f)
                        gradient3.addColorStop(0f, Color(0xFFE91E63))
                        gradient3.addColorStop(1f, Color(0xFF2196F3))
                        context.beginPath()
                        context.lineWidth(4f)
                        context.strokeStyle(gradient3)
                        context.arc(80f, 85f, 25f, 0f, 2 * PI.toFloat(), false)
                        context.stroke()
                    }
                }

                // === Section 6: 文本绘制 ===
                Text {
                    attr {
                        text("6. 文本绘制")
                        fontSize(16f)
                        fontWeightBold()
                        marginTop(12f)
                        marginLeft(16f)
                        color(Color.BLACK)
                    }
                }
                View {
                    attr {
                        margin(left = 16f, top = 8f, right = 16f)
                        height(120f)
                    }
                    Canvas({
                        attr {
                            absolutePosition(0f, 0f, 0f, 0f)
                            backgroundColor(0xFFF5F5F5)
                        }
                    }) { context, _, _ ->
                        // 填充文本
                        context.font(20f)
                        context.fillStyle(Color(0xFF333333))
                        context.fillText("Hello Canvas!", 20f, 30f)

                        // 描边文本
                        context.font(24f)
                        context.lineWidth(1f)
                        context.strokeStyle(Color(0xFFE91E63))
                        context.strokeText("Kuikly Web", 20f, 65f)

                        // 不同对齐方式
                        context.font(14f)
                        context.fillStyle(Color(0xFF2196F3))
                        context.textAlign(com.tencent.kuikly.core.views.TextAlign.LEFT)
                        context.fillText("左对齐", 20f, 95f)

                        context.textAlign(com.tencent.kuikly.core.views.TextAlign.CENTER)
                        context.fillText("居中", 180f, 95f)

                        context.textAlign(com.tencent.kuikly.core.views.TextAlign.RIGHT)
                        context.fillText("右对齐", 340f, 95f)
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
