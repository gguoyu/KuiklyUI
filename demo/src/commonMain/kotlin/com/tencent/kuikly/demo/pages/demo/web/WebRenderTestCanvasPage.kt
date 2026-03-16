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
import com.tencent.kuikly.core.base.Color
import com.tencent.kuikly.core.base.ViewBuilder
import com.tencent.kuikly.core.views.Canvas
import com.tencent.kuikly.core.views.CanvasContext
import com.tencent.kuikly.core.views.List
import com.tencent.kuikly.core.views.Text
import com.tencent.kuikly.core.views.View
import com.tencent.kuikly.demo.pages.base.BasePager
import kotlin.math.PI

/**
 * WebRenderTestCanvasPage - KRCanvasView 全方法覆盖测试页面
 *
 * 覆盖 call 方法：
 * - beginPath: 开始一个新路径
 * - moveTo: 移动到指定坐标点
 * - lineTo: 从当前点画线到指定坐标点
 * - arc: 绘制弧形路径
 * - closePath: 关闭当前路径
 * - stroke: 描边当前路径
 * - strokeStyle: 设置描边样式
 * - strokeText: 描边文本
 * - fill: 填充当前路径
 * - fillStyle: 设置填充样式
 * - fillText: 填充文本
 * - lineWidth: 设置线宽
 * - lineCap: 设置线帽样式
 * - lineDash: 设置虚线样式
 * - quadraticCurveTo: 绘制二次贝塞尔曲线
 * - bezierCurveTo: 绘制三次贝塞尔曲线
 * - reset: 重置/清空画布
 * - clip: 裁剪路径
 */
@Page("WebRenderTestCanvas")
internal class WebRenderTestCanvasPage : BasePager() {

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

                // ========== Section 1: 基本线条绑定 (beginPath/moveTo/lineTo/stroke) ==========
                View {
                    attr {
                        padding(all = 16f)
                    }
                    Text {
                        attr {
                            fontSize(18f)
                            fontWeightBold()
                            color(Color.BLACK)
                            text("1. 基本线条 (beginPath/moveTo/lineTo/stroke)")
                        }
                    }
                }

                View {
                    attr {
                        marginLeft(16f)
                        marginRight(16f)
                        height(120f)
                        borderRadius(8f)
                        borderWidth(1f)
                        borderColor(Color(0xFFCCCCCC))
                        backgroundColor(Color(0xFFF5F5F5))
                    }
                    Canvas({ attr { absolutePosition(0f, 0f, 0f, 0f) } }) { context, width, height ->
                        // 绘制多条线段
                        context.beginPath()
                        context.strokeStyle(Color(0xFF2196F3))
                        context.lineWidth(2f)
                        context.moveTo(20f, 20f)
                        context.lineTo(100f, 80f)
                        context.lineTo(180f, 40f)
                        context.lineTo(260f, 100f)
                        context.stroke()

                        // 绘制另一条线
                        context.beginPath()
                        context.strokeStyle(Color(0xFFE91E63))
                        context.lineWidth(3f)
                        context.moveTo(20f, 100f)
                        context.lineTo(320f, 100f)
                        context.stroke()
                    }
                }

                // ========== Section 2: strokeStyle 和 lineWidth ==========
                View {
                    attr {
                        padding(all = 16f)
                        marginTop(16f)
                    }
                    Text {
                        attr {
                            fontSize(18f)
                            fontWeightBold()
                            color(Color.BLACK)
                            text("2. strokeStyle + lineWidth 变化")
                        }
                    }
                }

                View {
                    attr {
                        marginLeft(16f)
                        marginRight(16f)
                        height(150f)
                        borderRadius(8f)
                        borderWidth(1f)
                        borderColor(Color(0xFFCCCCCC))
                        backgroundColor(Color(0xFFF5F5F5))
                    }
                    Canvas({ attr { absolutePosition(0f, 0f, 0f, 0f) } }) { context, _, _ ->
                        val colors = listOf(
                            Color(0xFFF44336), // Red
                            Color(0xFFFF9800), // Orange
                            Color(0xFFFFEB3B), // Yellow
                            Color(0xFF4CAF50), // Green
                            Color(0xFF2196F3), // Blue
                            Color(0xFF9C27B0)  // Purple
                        )

                        for (i in colors.indices) {
                            context.beginPath()
                            context.strokeStyle(colors[i])
                            context.lineWidth((i + 1).toFloat() * 2)
                            context.moveTo(20f, (20 + i * 20).toFloat())
                            context.lineTo(320f, (20 + i * 20).toFloat())
                            context.stroke()
                        }
                    }
                }

                // ========== Section 3: lineCap 线帽样式 ==========
                View {
                    attr {
                        padding(all = 16f)
                        marginTop(16f)
                    }
                    Text {
                        attr {
                            fontSize(18f)
                            fontWeightBold()
                            color(Color.BLACK)
                            text("3. lineCap 线帽样式 (butt/round/square)")
                        }
                    }
                }

                View {
                    attr {
                        marginLeft(16f)
                        marginRight(16f)
                        height(120f)
                        borderRadius(8f)
                        borderWidth(1f)
                        borderColor(Color(0xFFCCCCCC))
                        backgroundColor(Color(0xFFF5F5F5))
                    }
                    Canvas({ attr { absolutePosition(0f, 0f, 0f, 0f) } }) { context, _, _ ->
                        context.lineWidth(15f)
                        context.strokeStyle(Color(0xFF607D8B))

                        // butt (默认)
                        context.beginPath()
                        context.lineCapButt()
                        context.moveTo(50f, 30f)
                        context.lineTo(250f, 30f)
                        context.stroke()

                        // round
                        context.beginPath()
                        context.lineCapRound()
                        context.moveTo(50f, 60f)
                        context.lineTo(250f, 60f)
                        context.stroke()

                        // square
                        context.beginPath()
                        context.lineCapSquare()
                        context.moveTo(50f, 90f)
                        context.lineTo(250f, 90f)
                        context.stroke()
                    }
                    // 标签
                    Text {
                        attr {
                            absolutePosition(top = 25f, right = 16f)
                            fontSize(12f)
                            color(Color(0xFF666666))
                            text("butt")
                        }
                    }
                    Text {
                        attr {
                            absolutePosition(top = 55f, right = 16f)
                            fontSize(12f)
                            color(Color(0xFF666666))
                            text("round")
                        }
                    }
                    Text {
                        attr {
                            absolutePosition(top = 85f, right = 16f)
                            fontSize(12f)
                            color(Color(0xFF666666))
                            text("square")
                        }
                    }
                }

                // ========== Section 4: lineDash 虚线 ==========
                View {
                    attr {
                        padding(all = 16f)
                        marginTop(16f)
                    }
                    Text {
                        attr {
                            fontSize(18f)
                            fontWeightBold()
                            color(Color.BLACK)
                            text("4. lineDash 虚线样式")
                        }
                    }
                }

                View {
                    attr {
                        marginLeft(16f)
                        marginRight(16f)
                        height(120f)
                        borderRadius(8f)
                        borderWidth(1f)
                        borderColor(Color(0xFFCCCCCC))
                        backgroundColor(Color(0xFFF5F5F5))
                    }
                    Canvas({ attr { absolutePosition(0f, 0f, 0f, 0f) } }) { context, _, _ ->
                        context.lineWidth(3f)
                        context.strokeStyle(Color(0xFF3F51B5))

                        // 短虚线
                        context.beginPath()
                        context.lineDash(5f, 5f)
                        context.moveTo(20f, 30f)
                        context.lineTo(320f, 30f)
                        context.stroke()

                        // 长虚线
                        context.beginPath()
                        context.lineDash(15f, 10f)
                        context.moveTo(20f, 60f)
                        context.lineTo(320f, 60f)
                        context.stroke()

                        // 点划线
                        context.beginPath()
                        context.lineDash(20f, 5f)
                        context.moveTo(20f, 90f)
                        context.lineTo(320f, 90f)
                        context.stroke()
                    }
                }

                // ========== Section 5: arc 圆弧 ==========
                View {
                    attr {
                        padding(all = 16f)
                        marginTop(16f)
                    }
                    Text {
                        attr {
                            fontSize(18f)
                            fontWeightBold()
                            color(Color.BLACK)
                            text("5. arc 圆弧绑定")
                        }
                    }
                }

                View {
                    attr {
                        marginLeft(16f)
                        marginRight(16f)
                        height(180f)
                        borderRadius(8f)
                        borderWidth(1f)
                        borderColor(Color(0xFFCCCCCC))
                        backgroundColor(Color(0xFFF5F5F5))
                    }
                    Canvas({ attr { absolutePosition(0f, 0f, 0f, 0f) } }) { context, _, _ ->
                        // 完整圆
                        context.beginPath()
                        context.strokeStyle(Color(0xFF4CAF50))
                        context.lineWidth(3f)
                        context.arc(60f, 60f, 40f, 0f, 2 * PI.toFloat(), false)
                        context.stroke()

                        // 半圆
                        context.beginPath()
                        context.strokeStyle(Color(0xFFFF5722))
                        context.arc(160f, 60f, 40f, 0f, PI.toFloat(), false)
                        context.stroke()

                        // 四分之一圆
                        context.beginPath()
                        context.strokeStyle(Color(0xFF9C27B0))
                        context.arc(260f, 60f, 40f, 0f, PI.toFloat() / 2, false)
                        context.stroke()

                        // 逆时针弧
                        context.beginPath()
                        context.strokeStyle(Color(0xFF00BCD4))
                        context.lineWidth(4f)
                        context.arc(100f, 140f, 30f, 0f, PI.toFloat() * 1.5f, true)
                        context.stroke()

                        // 填充扇形
                        context.beginPath()
                        context.fillStyle(Color(0xFFFFEB3B))
                        context.moveTo(220f, 140f)
                        context.arc(220f, 140f, 30f, 0f, PI.toFloat() * 0.75f, false)
                        context.closePath()
                        context.fill()
                    }
                }

                // ========== Section 6: fill 和 fillStyle ==========
                View {
                    attr {
                        padding(all = 16f)
                        marginTop(16f)
                    }
                    Text {
                        attr {
                            fontSize(18f)
                            fontWeightBold()
                            color(Color.BLACK)
                            text("6. fill + fillStyle 填充")
                        }
                    }
                }

                View {
                    attr {
                        marginLeft(16f)
                        marginRight(16f)
                        height(150f)
                        borderRadius(8f)
                        borderWidth(1f)
                        borderColor(Color(0xFFCCCCCC))
                        backgroundColor(Color(0xFFF5F5F5))
                    }
                    Canvas({ attr { absolutePosition(0f, 0f, 0f, 0f) } }) { context, _, _ ->
                        // 矩形填充
                        context.beginPath()
                        context.fillStyle(Color(0xFF2196F3))
                        context.moveTo(20f, 20f)
                        context.lineTo(100f, 20f)
                        context.lineTo(100f, 80f)
                        context.lineTo(20f, 80f)
                        context.closePath()
                        context.fill()

                        // 三角形填充
                        context.beginPath()
                        context.fillStyle(Color(0xFFE91E63))
                        context.moveTo(130f, 80f)
                        context.lineTo(180f, 20f)
                        context.lineTo(230f, 80f)
                        context.closePath()
                        context.fill()

                        // 五边形填充
                        context.beginPath()
                        context.fillStyle(Color(0xFF4CAF50))
                        val cx = 290f
                        val cy = 55f
                        val r = 35f
                        for (i in 0 until 5) {
                            val angle = (i * 72 - 90) * PI.toFloat() / 180
                            val x = cx + r * kotlin.math.cos(angle)
                            val y = cy + r * kotlin.math.sin(angle)
                            if (i == 0) context.moveTo(x, y)
                            else context.lineTo(x, y)
                        }
                        context.closePath()
                        context.fill()

                        // 带边框的填充
                        context.beginPath()
                        context.fillStyle(Color(0xFFFFEB3B))
                        context.strokeStyle(Color(0xFFFF9800))
                        context.lineWidth(3f)
                        context.moveTo(20f, 100f)
                        context.lineTo(100f, 100f)
                        context.lineTo(100f, 140f)
                        context.lineTo(20f, 140f)
                        context.closePath()
                        context.fill()
                        context.stroke()
                    }
                }

                // ========== Section 7: fillText 和 strokeText ==========
                View {
                    attr {
                        padding(all = 16f)
                        marginTop(16f)
                    }
                    Text {
                        attr {
                            fontSize(18f)
                            fontWeightBold()
                            color(Color.BLACK)
                            text("7. fillText + strokeText 文本绘制")
                        }
                    }
                }

                View {
                    attr {
                        marginLeft(16f)
                        marginRight(16f)
                        height(150f)
                        borderRadius(8f)
                        borderWidth(1f)
                        borderColor(Color(0xFFCCCCCC))
                        backgroundColor(Color(0xFFF5F5F5))
                    }
                    Canvas({ attr { absolutePosition(0f, 0f, 0f, 0f) } }) { context, _, _ ->
                        // 填充文本
                        context.fillStyle(Color(0xFF2196F3))
                        context.fillText("Hello Kuikly!", 20f, 40f, 20f)

                        // 描边文本
                        context.strokeStyle(Color(0xFFE91E63))
                        context.lineWidth(1f)
                        context.strokeText("Stroke Text", 20f, 80f, 24f)

                        // 不同大小的文本
                        context.fillStyle(Color(0xFF4CAF50))
                        context.fillText("小字体", 20f, 110f, 12f)
                        context.fillText("中字体", 80f, 110f, 16f)
                        context.fillText("大字体", 160f, 110f, 24f)

                        // 带背景的文本区域
                        context.beginPath()
                        context.fillStyle(Color(0x33000000))
                        context.moveTo(20f, 120f)
                        context.lineTo(320f, 120f)
                        context.lineTo(320f, 145f)
                        context.lineTo(20f, 145f)
                        context.closePath()
                        context.fill()
                        context.fillStyle(Color.WHITE)
                        context.fillText("Canvas 文本绘制测试", 100f, 138f, 14f)
                    }
                }

                // ========== Section 8: quadraticCurveTo 二次贝塞尔曲线 ==========
                View {
                    attr {
                        padding(all = 16f)
                        marginTop(16f)
                    }
                    Text {
                        attr {
                            fontSize(18f)
                            fontWeightBold()
                            color(Color.BLACK)
                            text("8. quadraticCurveTo 二次贝塞尔曲线")
                        }
                    }
                }

                View {
                    attr {
                        marginLeft(16f)
                        marginRight(16f)
                        height(150f)
                        borderRadius(8f)
                        borderWidth(1f)
                        borderColor(Color(0xFFCCCCCC))
                        backgroundColor(Color(0xFFF5F5F5))
                    }
                    Canvas({ attr { absolutePosition(0f, 0f, 0f, 0f) } }) { context, _, _ ->
                        // 波浪线
                        context.beginPath()
                        context.strokeStyle(Color(0xFF673AB7))
                        context.lineWidth(3f)
                        context.moveTo(20f, 75f)
                        context.quadraticCurveTo(80f, 20f, 140f, 75f)
                        context.quadraticCurveTo(200f, 130f, 260f, 75f)
                        context.quadraticCurveTo(290f, 45f, 320f, 75f)
                        context.stroke()

                        // 标记控制点
                        val controlPoints = listOf(
                            Pair(80f, 20f),
                            Pair(200f, 130f),
                            Pair(290f, 45f)
                        )
                        context.fillStyle(Color(0xFFFF5722))
                        for (point in controlPoints) {
                            context.beginPath()
                            context.arc(point.first, point.second, 5f, 0f, 2 * PI.toFloat(), false)
                            context.fill()
                        }
                    }
                }

                // ========== Section 9: bezierCurveTo 三次贝塞尔曲线 ==========
                View {
                    attr {
                        padding(all = 16f)
                        marginTop(16f)
                    }
                    Text {
                        attr {
                            fontSize(18f)
                            fontWeightBold()
                            color(Color.BLACK)
                            text("9. bezierCurveTo 三次贝塞尔曲线")
                        }
                    }
                }

                View {
                    attr {
                        marginLeft(16f)
                        marginRight(16f)
                        height(180f)
                        borderRadius(8f)
                        borderWidth(1f)
                        borderColor(Color(0xFFCCCCCC))
                        backgroundColor(Color(0xFFF5F5F5))
                    }
                    Canvas({ attr { absolutePosition(0f, 0f, 0f, 0f) } }) { context, _, _ ->
                        // S曲线
                        context.beginPath()
                        context.strokeStyle(Color(0xFF009688))
                        context.lineWidth(4f)
                        context.moveTo(30f, 100f)
                        context.bezierCurveTo(70f, 20f, 130f, 180f, 170f, 100f)
                        context.stroke()

                        // 心形的一半 (用两条贝塞尔曲线)
                        context.beginPath()
                        context.fillStyle(Color(0xFFE91E63))
                        context.moveTo(260f, 60f)
                        context.bezierCurveTo(260f, 30f, 220f, 30f, 220f, 60f)
                        context.bezierCurveTo(220f, 90f, 260f, 110f, 260f, 140f)
                        context.bezierCurveTo(260f, 110f, 300f, 90f, 300f, 60f)
                        context.bezierCurveTo(300f, 30f, 260f, 30f, 260f, 60f)
                        context.fill()

                        // 显示控制点连线
                        context.beginPath()
                        context.strokeStyle(Color(0x66009688))
                        context.lineWidth(1f)
                        context.lineDash(3f, 3f)
                        context.moveTo(30f, 100f)
                        context.lineTo(70f, 20f)
                        context.lineTo(130f, 180f)
                        context.lineTo(170f, 100f)
                        context.stroke()
                    }
                }

                // ========== Section 10: clip 裁剪 ==========
                View {
                    attr {
                        padding(all = 16f)
                        marginTop(16f)
                    }
                    Text {
                        attr {
                            fontSize(18f)
                            fontWeightBold()
                            color(Color.BLACK)
                            text("10. clip 裁剪路径")
                        }
                    }
                }

                View {
                    attr {
                        marginLeft(16f)
                        marginRight(16f)
                        height(180f)
                        borderRadius(8f)
                        borderWidth(1f)
                        borderColor(Color(0xFFCCCCCC))
                        backgroundColor(Color(0xFFF5F5F5))
                    }
                    Canvas({ attr { absolutePosition(0f, 0f, 0f, 0f) } }) { context, _, _ ->
                        // 创建圆形裁剪区域
                        context.beginPath()
                        context.arc(100f, 90f, 60f, 0f, 2 * PI.toFloat(), false)
                        context.clip()

                        // 在裁剪区域内绘制条纹
                        val colors = listOf(
                            Color(0xFFE91E63),
                            Color(0xFFFF9800),
                            Color(0xFFFFEB3B),
                            Color(0xFF4CAF50),
                            Color(0xFF2196F3),
                            Color(0xFF9C27B0)
                        )
                        for (i in 0 until 12) {
                            context.beginPath()
                            context.fillStyle(colors[i % colors.size])
                            context.moveTo(20f + i * 15f, 0f)
                            context.lineTo(35f + i * 15f, 0f)
                            context.lineTo(35f + i * 15f, 180f)
                            context.lineTo(20f + i * 15f, 180f)
                            context.closePath()
                            context.fill()
                        }
                    }

                    // 右侧说明
                    View {
                        attr {
                            absolutePosition(top = 30f, left = 200f)
                        }
                        Text {
                            attr {
                                fontSize(14f)
                                color(Color(0xFF666666))
                                text("← 圆形裁剪区域")
                            }
                        }
                        Text {
                            attr {
                                marginTop(8f)
                                fontSize(12f)
                                color(Color(0xFF999999))
                                text("彩色条纹被裁剪\n只在圆内显示")
                            }
                        }
                    }
                }

                // ========== Section 11: closePath ==========
                View {
                    attr {
                        padding(all = 16f)
                        marginTop(16f)
                    }
                    Text {
                        attr {
                            fontSize(18f)
                            fontWeightBold()
                            color(Color.BLACK)
                            text("11. closePath 闭合路径对比")
                        }
                    }
                }

                View {
                    attr {
                        marginLeft(16f)
                        marginRight(16f)
                        height(150f)
                        borderRadius(8f)
                        borderWidth(1f)
                        borderColor(Color(0xFFCCCCCC))
                        backgroundColor(Color(0xFFF5F5F5))
                    }
                    Canvas({ attr { absolutePosition(0f, 0f, 0f, 0f) } }) { context, _, _ ->
                        // 不闭合的三角形
                        context.beginPath()
                        context.strokeStyle(Color(0xFF2196F3))
                        context.lineWidth(3f)
                        context.moveTo(40f, 120f)
                        context.lineTo(90f, 30f)
                        context.lineTo(140f, 120f)
                        // 不调用 closePath
                        context.stroke()

                        // 闭合的三角形
                        context.beginPath()
                        context.strokeStyle(Color(0xFFE91E63))
                        context.lineWidth(3f)
                        context.moveTo(200f, 120f)
                        context.lineTo(250f, 30f)
                        context.lineTo(300f, 120f)
                        context.closePath() // 调用 closePath
                        context.stroke()
                    }
                    // 标签
                    Text {
                        attr {
                            absolutePosition(top = 125f, left = 50f)
                            fontSize(12f)
                            color(Color(0xFF2196F3))
                            text("无closePath")
                        }
                    }
                    Text {
                        attr {
                            absolutePosition(top = 125f, left = 210f)
                            fontSize(12f)
                            color(Color(0xFFE91E63))
                            text("有closePath")
                        }
                    }
                }

                // ========== Section 12: 综合示例 ==========
                View {
                    attr {
                        padding(all = 16f)
                        marginTop(16f)
                    }
                    Text {
                        attr {
                            fontSize(18f)
                            fontWeightBold()
                            color(Color.BLACK)
                            text("12. 综合示例 - 图表绘制")
                        }
                    }
                }

                View {
                    attr {
                        marginLeft(16f)
                        marginRight(16f)
                        marginBottom(32f)
                        height(200f)
                        borderRadius(8f)
                        borderWidth(1f)
                        borderColor(Color(0xFFCCCCCC))
                        backgroundColor(Color(0xFFF5F5F5))
                    }
                    Canvas({ attr { absolutePosition(0f, 0f, 0f, 0f) } }) { context, width, height ->
                        val chartWidth = width - 60f
                        val chartHeight = height - 60f
                        val startX = 40f
                        val startY = 30f

                        // 绘制坐标轴
                        context.beginPath()
                        context.strokeStyle(Color(0xFF333333))
                        context.lineWidth(2f)
                        // Y轴
                        context.moveTo(startX, startY)
                        context.lineTo(startX, startY + chartHeight)
                        // X轴
                        context.lineTo(startX + chartWidth, startY + chartHeight)
                        context.stroke()

                        // 绘制网格线
                        context.beginPath()
                        context.strokeStyle(Color(0x33000000))
                        context.lineWidth(1f)
                        context.lineDash(3f, 3f)
                        for (i in 1..4) {
                            val y = startY + chartHeight * i / 5
                            context.moveTo(startX, y)
                            context.lineTo(startX + chartWidth, y)
                        }
                        context.stroke()

                        // 绘制数据点和折线
                        val data = listOf(60f, 80f, 40f, 90f, 70f, 85f)
                        context.beginPath()
                        context.strokeStyle(Color(0xFF2196F3))
                        context.lineWidth(2f)
                        context.lineDash(0f, 0f) // 重置为实线

                        for (i in data.indices) {
                            val x = startX + (chartWidth / (data.size - 1)) * i
                            val y = startY + chartHeight - (chartHeight * data[i] / 100)
                            if (i == 0) context.moveTo(x, y)
                            else context.lineTo(x, y)
                        }
                        context.stroke()

                        // 绘制数据点
                        context.fillStyle(Color(0xFF2196F3))
                        for (i in data.indices) {
                            val x = startX + (chartWidth / (data.size - 1)) * i
                            val y = startY + chartHeight - (chartHeight * data[i] / 100)
                            context.beginPath()
                            context.arc(x, y, 5f, 0f, 2 * PI.toFloat(), false)
                            context.fill()
                        }

                        // 绘制图例
                        context.fillStyle(Color(0xFF333333))
                        context.fillText("数据趋势图", startX + chartWidth / 2 - 40f, startY + chartHeight + 25f, 14f)
                    }
                }
            }
        }
    }
}
